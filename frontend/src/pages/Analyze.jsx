import { useEffect, useState } from "react";
import { Download, ScanSearch, UploadCloud } from "lucide-react";
import { motion } from "framer-motion";
import AnalysisView from "../components/AnalysisView";
import Dropzone from "../components/Dropzone";
import FloatingDoc from "../components/FloatingDoc";
import { Bar, KV, ModelBanner, PageHeader, Section, SkillChips, Spinner } from "../components/ui";
import { history, meta, resume } from "../services/api";
import { useToast } from "../hooks/useToast";
import { useCurrentResume } from "../hooks/useCurrentResume";
import { downloadBlob, errMsg, fmtSize, orND } from "../utils/format";

export default function Analyze() {
  const [files, setFiles] = useState([]);
  const [uploaded, setUploaded] = useState([]);       // [{resume_id, filename, size, text_preview, info}]
  const [results, setResults] = useState({});         // resume_id -> analysis
  const [active, setActive] = useState(null);
  const [status, setStatus] = useState("");           // real backend stage
  const [progress, setProgress] = useState(0);
  const [busy, setBusy] = useState(false);
  const [model, setModel] = useState(null);
  const { selectResume } = useCurrentResume();
  const toast = useToast();

  useEffect(() => { meta.metrics().then((m) => setModel(m)).catch(() => {}); }, []);

  const upload = async () => {
    setBusy(true); setProgress(0); setStatus("Uploading…");
    try {
      const res = await resume.upload(files, (p) => { setProgress(p); setStatus(p < 100 ? `Uploading… ${p}%` : "Server is extracting text…"); });
      res.errors.forEach((e) => toast.error(`${e.filename}: ${e.error}`));
      if (res.resumes.length) {
        setUploaded((u) => [...u, ...res.resumes]);
        setActive(res.resumes[0].resume_id);
        selectResume({ id: res.resumes[0].resume_id, name: res.resumes[0].filename });
        setFiles([]);
        toast.success(`${res.resumes.length} resume(s) parsed`);
      }
    } catch (e) { toast.error(errMsg(e)); } finally { setBusy(false); setStatus(""); }
  };

  const analyze = async () => {
    setBusy(true);
    try {
      for (let i = 0; i < uploaded.length; i++) {
        const r = uploaded[i];
        if (results[r.resume_id]) continue;
        setStatus(`Analyzing ${i + 1}/${uploaded.length}: ${r.filename}…`);
        const a = await resume.analyze(r.resume_id);
        setResults((x) => ({ ...x, [r.resume_id]: a }));
      }
      toast.success("Analysis complete");
    } catch (e) { toast.error(errMsg(e)); } finally { setBusy(false); setStatus(""); }
  };

  const report = async (id) => { try { downloadBlob(await history.report(id), "resume_analysis.pdf"); } catch (e) { toast.error(errMsg(e)); } };
  const cur = uploaded.find((u) => u.resume_id === active);
  const res = cur && results[cur.resume_id];

  return (
    <div className="space-y-6">
      <PageHeader title="Analyze Resume" subtitle="Upload PDF or DOCX resumes, preview the extracted text, then run the trained model." />
      <ModelBanner model={model} />
      <div className="card grid items-center gap-6 overflow-hidden p-5 md:grid-cols-[1fr_auto]">
        <div>
          <Dropzone files={files} setFiles={setFiles} disabled={busy} />
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button className="btn btn-navy" disabled={!files.length || busy} onClick={upload}><UploadCloud className="h-4 w-4" />Upload &amp; extract</button>
            <button className="btn btn-primary" disabled={!uploaded.length || busy || uploaded.every((u) => results[u.resume_id])} onClick={analyze}><ScanSearch className="h-4 w-4" />Analyze Resume{uploaded.length > 1 ? "s" : ""}</button>
            {busy && <span className="flex items-center gap-2 text-sm text-slate-600"><Spinner className="h-4 w-4" />{status}</span>}
          </div>
          {busy && progress > 0 && progress < 100 && <div className="mt-3 max-w-md"><Bar value={progress} /></div>}
        </div>
        <div className="hidden md:block"><FloatingDoc size={120} scanning={busy} pop={files.length > 0} /></div>
      </div>

      {uploaded.length > 0 && (
        <>
          <div className="flex flex-wrap gap-2">
            {uploaded.map((u) => <button key={u.resume_id} onClick={() => { setActive(u.resume_id); selectResume({ id: u.resume_id, name: u.filename }); }} className={`btn !py-1.5 ${active === u.resume_id ? "btn-navy" : "btn-ghost"}`}>{u.filename}{results[u.resume_id] && <span className="h-2 w-2 rounded-full bg-success" />}</button>)}
          </div>
          {cur && (
            <motion.div key={cur.resume_id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
              <div className="grid gap-5 lg:grid-cols-2">
                <Section title="Extracted text preview" right={<span className="text-xs text-slate-400">{cur.char_count.toLocaleString()} characters · {fmtSize(cur.size)}</span>}>
                  <pre className="max-h-72 overflow-auto whitespace-pre-wrap rounded-xl bg-slate-50 p-3 text-xs leading-relaxed">{cur.text_preview}</pre>
                </Section>
                <Section title="Extracted fields (before ML)">
                  <dl className="divide-y divide-slate-100"><KV k="Name" v={orND(cur.info.name)} /><KV k="Email" v={orND(cur.info.email)} /><KV k="Phone" v={orND(cur.info.phone)} /><KV k="Education" v={orND(cur.info.education?.[0])} /><KV k="Experience" v={cur.info.years_experience != null ? `${cur.info.years_experience} year(s)` : "Not detected"} /><KV k="Certifications" v={orND(cur.info.certifications?.[0])} /></dl>
                  <div className="mt-3"><SkillChips skills={cur.info.skills} kind="info" empty="No skills detected" /></div>
                </Section>
              </div>
              {res ? (
                <>
                  <div className="flex justify-end"><button className="btn btn-ghost" onClick={() => report(res.id)}><Download className="h-4 w-4" />Download PDF report</button></div>
                  <AnalysisView a={res} />
                </>
              ) : <p className="text-sm text-slate-500">Click <b>Analyze Resume</b> to predict the job role and review the resume.</p>}
            </motion.div>
          )}
        </>
      )}
    </div>
  );
}
