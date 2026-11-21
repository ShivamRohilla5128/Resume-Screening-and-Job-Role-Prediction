"""Stateless text preprocessing shared by training and the API.

Because nothing here is *fitted* on data, applying it before the train/test split does not leak information.
Steps: lowercase -> strip e-mails/URLs/phones (privacy + noise) -> tokenise (keeps c++, c#, node.js, ci/cd)
-> stop-word removal -> light rule-based lemmatisation.
"""
import re
from .skills_vocab import PROTECTED_TOKENS

STOP_WORDS = frozenset("""a about above after again all also am an and any are as at be because been before being below between
both but by can could did do does doing down during each few for from further had has have having he her here hers him his how i if in
into is it its just me more most my no nor not now of off on once only or other our out over own same she should so some such than that
the their them then there these they this those through to too under until up very was we were what when where which while who whom why
will with would you your""".split())

_EMAIL = re.compile(r"\S+@\S+\.\S+")
_URL = re.compile(r"(?:https?://|www\.)\S+")
_PHONE = re.compile(r"\+?\d[\d\s().-]{8,}\d")
_TOKEN = re.compile(r"[a-z][a-z0-9+#./-]*")


def lemmatize(tok):
    if tok in PROTECTED_TOKENS or len(tok) <= 3:
        return tok
    if tok.endswith("ies") and len(tok) > 4:
        return tok[:-3] + "y"
    if tok.endswith("sses"):
        return tok[:-2]
    if tok.endswith("s") and not tok.endswith(("ss", "us", "is", "os", "as")):
        return tok[:-1]
    return tok


def tokenize(text):
    text = _PHONE.sub(" ", _URL.sub(" ", _EMAIL.sub(" ", (text or "").lower())))
    out = []
    for tok in _TOKEN.findall(text):
        tok = tok.strip("./-")
        if len(tok) < 2 and tok not in ("c", "r"):
            continue
        if tok in STOP_WORDS:
            continue
        out.append(lemmatize(tok))
    return out


def clean_text(text):
    return " ".join(tokenize(text))
