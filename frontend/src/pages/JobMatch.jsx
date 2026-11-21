import { useEffect, useState } from "react";
import { Download, Target, X } from "lucide-react";
import { MatchResult } from "../components/results";
import ResumeSource from "../components/ResumeSource";
import { Field, PageHeader, Spinner } from "../components/ui";
import useRoles from "../hooks/useRoles";
import { history, resume } from "../services/api";
import { useToast } from "../hooks/useToast";
import { downloadBlob, errMsg } from "../utils/format";
import { useCurrentResume } from "../hooks/useCurrentResume";

export function SkillInput({ skills, setSkills }) {
  const [v, setV] = useState("");
  const add = () => { const parts = v.split(",").map((s) => s.trim()).filter(Boolean); if (parts.length) setSkills([...new Set([...skills, ...parts])].slice(0, 60)); setV(""); };
  return (
    <div>
      <div className="flex flex-wrap gap-2">{skills.map((s) => <span key={s} className="chip bg-blue-50 text-blue-800 ring-1 ring-blue-200">{s}<button type="button" aria-label={`Remove ${s}`} onClick={() => setSkills(skills.filter((x) => x !== s))}><X className="h-3 w-3" /></button></span>)}</div>
      <input className="input mt-2" value={v} placeholder="Type a skill and press Enter (e.g. Python, SQL)" aria-label="Required skills" onChange={(e) => setV(e.target.value)} onBlur={add}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); add(); } }} />
    </div>
  );
}

export default function JobMatch() {
  const roles = useRoles();
  const { currentResume } = useCurrentResume();
  const [src, setSrc] = useState(currentResume);
  const [role, setRole] = useState("");
  const [jd, setJd] = useState("");
  const [skills, setSkills] = useState([]);
  const [busy, setBusy] = useState(false);
  const [out, setOut] = useState(null);
  const toast = useToast();

  useEffect(() => { if (currentResume) setSrc(currentResume); }, [currentResume]);

  const run = async () => {
    if (!src) return toast.error("Choose or upload a resume first");
    if (!role && !jd.trim() && !skills.length) return toast.error("Select a role, paste a job description or enter required skills");
    setBusy(true);
    try { setOut(await resume.match({ resume_id: src.id, job_role: role, job_description: jd, required_skills: skills })); } catch (e) { toast.error(errMsg(e)); } finally { setBusy(false); }
  };
  return (
    <div className="space-y-6">
      <PageHeader title="Job Description Matching" subtitle="Estimate how well a resume matches a job using TF-IDF cosine similarity plus transparent skill matching." />
      <ResumeSource value={src} onChange={(v) => { setSrc(v); setOut(null); }} />
      <div className="card grid gap-5 p-5 lg:grid-cols-2">
        <div className="space-y-4">
          <Field label="Job role"><select className="input" value={role} onChange={(e) => setRole(e.target.value)}><option value="">Select a role (optional)</option>{roles.map((r) => <option key={r.role}>{r.role}</option>)}</select></Field>
          <Field label="Required skills" hint="If provided, these override skills found in the job description."><SkillInput skills={skills} setSkills={setSkills} /></Field>
        </div>
        <Field label="Job description"><textarea className="input min-h-[190px]" value={jd} onChange={(e) => setJd(e.target.value)} maxLength={20000} placeholder="Paste the job description here…" /></Field>
        <div className="lg:col-span-2 flex flex-wrap gap-3">
          <button className="btn btn-primary" onClick={run} disabled={busy}>{busy ? <Spinner className="h-4 w-4" /> : <Target className="h-4 w-4" />}Analyze Match</button>
          {out && <button className="btn btn-ghost" onClick={async () => downloadBlob(await history.report(out.analysis_id), "match_report.pdf")}><Download className="h-4 w-4" />PDF report</button>}
        </div>
      </div>
      {out && <MatchResult m={out.match} />}
    </div>
  );
}
