import { useEffect, useRef, useState } from "react";
import { PenLine } from "lucide-react";
import { ReviewResult } from "../components/results";
import ResumeSource from "../components/ResumeSource";
import { Field, PageHeader, Spinner } from "../components/ui";
import useRoles from "../hooks/useRoles";
import { resume } from "../services/api";
import { useToast } from "../hooks/useToast";
import { errMsg } from "../utils/format";
import { useCurrentResume } from "../hooks/useCurrentResume";

export default function Improve() {
  const roles = useRoles();
  const { currentResume } = useCurrentResume();
  const [src, setSrc] = useState(currentResume);
  const [role, setRole] = useState("");
  const [busy, setBusy] = useState(false);
  const [out, setOut] = useState(null);
  const [error, setError] = useState("");
  const requestId = useRef(0);
  const toast = useToast();
  const loadReview = async (resumeId, targetRole) => {
    const request = ++requestId.current;
    setBusy(true);
    setError("");
    try {
      const result = await resume.improve(resumeId, targetRole);
      if (!result?.review || !Array.isArray(result.review.sections)) {
        throw new Error("The server returned an incomplete resume review. Please try again.");
      }
      if (request === requestId.current) setOut(result);
    } catch (e) {
      if (request === requestId.current) {
        setOut(null);
        setError(errMsg(e));
        toast.error(errMsg(e));
      }
    } finally {
      if (request === requestId.current) setBusy(false);
    }
  };
  useEffect(() => { if (currentResume) setSrc(currentResume); }, [currentResume]);
  useEffect(() => {
    if (!src?.id) return undefined;
    loadReview(src.id, role);
    return () => { requestId.current += 1; };
  }, [src?.id]); // eslint-disable-line

  const run = () => src ? loadReview(src.id, role) : toast.error("Choose or upload a resume first");
  return (
    <div className="space-y-6">
      <PageHeader title="Resume Improvement" subtitle="Section-by-section, rule-based feedback. Suggestions never invent experience, achievements or certifications." />
      <ResumeSource value={src} onChange={(v) => { setSrc(v); setOut(null); setError(""); }} />
      <div className="card flex flex-wrap items-end gap-4 p-5">
        <div className="min-w-[240px] flex-1"><Field label="Target role (optional)" hint="Defaults to the model's predicted role."><select className="input" value={role} onChange={(e) => setRole(e.target.value)}><option value="">Use predicted role</option>{roles.map((r) => <option key={r.role}>{r.role}</option>)}</select></Field></div>
        <button className="btn btn-primary" onClick={run} disabled={busy}>{busy ? <Spinner className="h-4 w-4" /> : <PenLine className="h-4 w-4" />}Review resume</button>
      </div>
      {busy && <p className="text-sm text-slate-500">Reviewing {src?.name || "resume"}…</p>}
      {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
      {out && <><p className="text-sm text-slate-500">Reviewed against: <b>{out.target_role}</b></p><ReviewResult r={out.review} /></>}
      {!src && <p className="text-sm text-slate-500">Select or upload a resume to see its improvement review.</p>}
    </div>
  );
}
