import { useRef, useState } from "react";
import { UploadCloud, FileText, X } from "lucide-react";
import { useToast } from "../hooks/useToast";
import { fmtSize } from "../utils/format";

const MAX = 5 * 1024 * 1024;

export default function Dropzone({ files, setFiles, multiple = true, disabled = false }) {
  const [drag, setDrag] = useState(false);
  const input = useRef(null);
  const toast = useToast();

  const add = (list) => {
    const ok = [];
    for (const f of Array.from(list)) {
      const ext = f.name.slice(f.name.lastIndexOf(".")).toLowerCase();
      if (![".pdf", ".docx"].includes(ext)) { toast.error(`${f.name}: only PDF or DOCX files are supported`); continue; }
      if (f.size === 0) { toast.error(`${f.name} is empty`); continue; }
      if (f.size > MAX) { toast.error(`${f.name} is larger than 5 MB`); continue; }
      ok.push(f);
    }
    if (!ok.length) return;
    if (!multiple) return setFiles(ok.slice(0, 1));
    const seen = new Set(files.map((f) => f.name + f.size));
    setFiles([...files, ...ok.filter((f) => !seen.has(f.name + f.size))].slice(0, 25));
  };

  return (
    <div>
      <div role="button" tabIndex={0} aria-label="Upload resumes" onClick={() => !disabled && input.current?.click()}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && !disabled && input.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); if (!disabled) add(e.dataTransfer.files); }}
        className={`group flex cursor-pointer flex-col items-center gap-2 rounded-2xl border-2 border-dashed p-8 text-center transition duration-200 ${drag ? "scale-[1.01] border-brand bg-blue-50 shadow-inner" : "border-blue-200/80 bg-gradient-to-br from-blue-50/70 via-white to-violet-50/50 hover:-translate-y-0.5 hover:border-brand/60 hover:shadow-card"} ${disabled ? "pointer-events-none opacity-60" : ""}`}>
        <span className={`grid h-14 w-14 place-items-center rounded-2xl transition duration-200 ${drag ? "bg-brand text-white shadow-md" : "bg-white text-brand shadow-sm ring-1 ring-blue-100 group-hover:rotate-[-4deg] group-hover:scale-105"}`}><UploadCloud className="h-7 w-7" /></span>
        <p className="mt-1 text-sm font-semibold text-navy">Drag &amp; drop {multiple ? "resumes" : "a resume"} here, or <span className="text-brand">browse</span></p>
        <p className="text-xs text-slate-500">PDF or DOCX · max 5 MB each{multiple ? " · up to 25 files" : ""}</p>
        <input ref={input} type="file" hidden accept=".pdf,.docx" multiple={multiple} onChange={(e) => { add(e.target.files); e.target.value = ""; }} />
      </div>
      {files.length > 0 && (
        <ul className="mt-3 space-y-2">
          {files.map((f, i) => (
            <li key={f.name + f.size} className="card flex items-center gap-3 px-3.5 py-2.5 text-sm">
              <FileText className="h-4 w-4 text-brand" /><span className="min-w-0 flex-1 truncate">{f.name}</span>
              <span className="text-xs text-slate-500">{fmtSize(f.size)}</span>
              <button type="button" aria-label={`Remove ${f.name}`} disabled={disabled} onClick={() => setFiles(files.filter((_, j) => j !== i))} className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-red-600"><X className="h-4 w-4" /></button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
