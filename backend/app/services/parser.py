"""Safe resume parsing: validate type/size/magic bytes, extract text from memory (nothing is written to disk)."""
import io, os, re, zipfile

ALLOWED_EXT = {".pdf", ".docx"}
MAX_PAGES = 20
MAX_CHARS = 60_000


class ParseError(ValueError):
    pass


def safe_filename(name):
    base = os.path.basename(name or "resume").strip()
    return re.sub(r"[^A-Za-z0-9._ -]", "_", base)[:100] or "resume"


def _pdf_text(data):
    try:
        import fitz  # PyMuPDF
    except ImportError as e:
        raise ParseError("PyMuPDF is not installed on the server") from e
    try:
        with fitz.open(stream=data, filetype="pdf") as doc:
            if doc.needs_pass:
                raise ParseError("Password-protected PDFs are not supported")
            return "\n".join(page.get_text("text") for i, page in enumerate(doc) if i < MAX_PAGES)
    except ParseError:
        raise
    except Exception as e:
        raise ParseError("Could not read this PDF (file may be corrupt)") from e


def _docx_text(data):
    try:
        import docx
    except ImportError as e:
        raise ParseError("python-docx is not installed on the server") from e
    try:
        d = docx.Document(io.BytesIO(data))
        parts = [p.text for p in d.paragraphs]
        for t in d.tables:
            for row in t.rows:
                parts.append(" | ".join(c.text.strip() for c in row.cells))
        return "\n".join(parts)
    except Exception as e:
        raise ParseError("Could not read this DOCX (file may be corrupt)") from e


def extract_text(filename, data, max_bytes):
    ext = os.path.splitext(filename or "")[1].lower()
    if ext not in ALLOWED_EXT:
        raise ParseError("Only PDF and DOCX files are supported")
    if not data:
        raise ParseError("File is empty")
    if len(data) > max_bytes:
        raise ParseError(f"File is larger than {max_bytes // (1024 * 1024)} MB")
    if ext == ".pdf":
        if not data.startswith(b"%PDF"):
            raise ParseError("File content is not a valid PDF")
        text = _pdf_text(data)
    else:
        if not zipfile.is_zipfile(io.BytesIO(data)) or "word/document.xml" not in zipfile.ZipFile(io.BytesIO(data)).namelist():
            raise ParseError("File content is not a valid DOCX")
        text = _docx_text(data)
    text = text.replace("\x00", " ").replace("\r", "\n")
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text).strip()[:MAX_CHARS]
    if len(text) < 50:
        raise ParseError("No extractable text found (scanned/image-only resumes need OCR, which is not included)")
    return text
