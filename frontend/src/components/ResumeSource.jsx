import { useEffect, useState } from "react";
import { Upload, History as HistoryIcon, FileText } from "lucide-react";
import Dropzone from "./Dropzone";
import FloatingDoc from "./FloatingDoc";
import { Spinner } from "./ui";
import { history, resume } from "../services/api";
import { useToast } from "../hooks/useToast";
import { errMsg } from "../utils/format";
import { useCurrentResume } from "../hooks/useCurrentResume";

/* Lets a page obtain a resume_id either by uploading a new file or by picking a previously analysed one. */
export default function ResumeSource({ value, onChange }) {
  const { currentResume, selectResume } = useCurrentResume();
  const selected = value || currentResume;
  const [mode, setMode] = useState(selected ? "current" : "upload");
  const [files, setFiles] = useState([]);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [items, setItems] = useState([]);
  const toast = useToast();

  useEffect(() => { if (mode === "history") history.list().then((r) => {
    const seen = new Set(); setItems(r.items.filter((i) => !seen.has(i.resume_id) && seen.add(i.resume_id)));
  }).catch((e) => toast.error(errMsg(e))); }, [mode]); // eslint-disable-line
  useEffect(() => { if (selected) setMode("current"); }, [selected?.id]);

  const changeResume = (resume) => {
    selectResume(resume);
    onChange(resume);
  };

  const upload = async () => {
    setBusy(true); setProgress(0);
    try {
      const res = await resume.upload(files, setProgress);
      res.errors.forEach((e) => toast.error(`${e.filename}: ${e.error}`));
      const r = res.resumes[0];
      if (r) { changeResume({ id: r.resume_id, name: r.filename }); toast.success(`${r.filename} uploaded and parsed`); setFiles([]); }
    } catch (e) { toast.error(errMsg(e)); } finally { setBusy(false); }
  };

  return (
    <div className="card p-5">
      <div className="mb-4 flex gap-2">
        {selected && <button type="button" onClick={() => setMode("current")} className={`btn ${mode === "current" ? "btn-navy" : "btn-ghost"} !py-1.5`}><FileText className="h-4 w-4" />Current resume</button>}
        {[["history", "Choose another", HistoryIcon], ["upload", "Upload new", Upload]].map(([k, l, I]) => (
          <button key={k} type="button" onClick={() => setMode(k)} className={`btn ${mode === k ? "btn-navy" : "btn-ghost"} !py-1.5`}><I className="h-4 w-4" />{l}</button>
        ))}
      </div>
      {selected && mode === "current" ? <div className="flex items-center gap-2 rounded-xl bg-green-50 px-3 py-3 text-sm text-green-800 ring-1 ring-green-200"><FileText className="h-4 w-4" /> Using <b className="truncate">{selected.name}</b> from your current session</div> : null}
      {mode === "current" && selected ? null : mode === "upload" ? (
        <div className="grid items-center gap-5 sm:grid-cols-[1fr_auto]">
          <div>
            <Dropzone files={files} setFiles={setFiles} multiple={false} disabled={busy} />
            <button type="button" className="btn btn-primary mt-3" disabled={!files.length || busy} onClick={upload}>{busy ? <><Spinner className="h-4 w-4" /> {progress < 100 ? `Uploading ${progress}%` : "Extracting text…"}</> : "Upload & use this resume"}</button>
          </div>
          <div className="hidden sm:block"><FloatingDoc size={90} scanning={busy} pop={!!files.length} /></div>
        </div>
      ) : items.length ? (
        <select className="input" value={selected?.id || ""} onChange={(e) => { const it = items.find((i) => i.resume_id === e.target.value); it && changeResume({ id: it.resume_id, name: it.filename }); }}>
          <option value="">Select a previous resume…</option>
          {items.map((i) => <option key={i.resume_id} value={i.resume_id}>{i.filename}{i.candidate_name ? ` — ${i.candidate_name}` : ""}</option>)}
        </select>
      ) : <p className="text-sm text-slate-500">No previous resumes yet. Upload one first.</p>}
    </div>
  );
}
