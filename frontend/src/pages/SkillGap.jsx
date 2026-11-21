import { useEffect, useState } from "react";
import { TrendingUp } from "lucide-react";
import { GapResult } from "../components/results";
import ResumeSource from "../components/ResumeSource";
import { Field, PageHeader, Spinner } from "../components/ui";
import useRoles from "../hooks/useRoles";
import { resume } from "../services/api";
import { useToast } from "../hooks/useToast";
import { errMsg } from "../utils/format";
import { useCurrentResume } from "../hooks/useCurrentResume";

export default function SkillGap() {
  const roles = useRoles();
  const { currentResume } = useCurrentResume();
  const [src, setSrc] = useState(currentResume);
  const [role, setRole] = useState("");
  const [busy, setBusy] = useState(false);
  const [out, setOut] = useState(null);
  const toast = useToast();

  useEffect(() => { if (currentResume) setSrc(currentResume); }, [currentResume]);

  useEffect(() => { if (src) resume.predict(src.id).then((r) => setRole((cur) => cur || r.prediction.primary.role)).catch(() => {}); }, [src]);
  const run = async () => {
    if (!src || !role) return toast.error("Choose a resume and a job role");
    setBusy(true);
    try { setOut((await resume.gap(src.id, role)).gap); } catch (e) { toast.error(errMsg(e)); } finally { setBusy(false); }
  };
  return (
    <div className="space-y-6">
      <PageHeader title="Skill Gap Analysis" subtitle="Compare detected skills with a role's reference skills and get a roadmap built from the real gaps." />
      <ResumeSource value={src} onChange={(v) => { setSrc(v); setOut(null); setRole(""); }} />
      <div className="card flex flex-wrap items-end gap-4 p-5">
        <div className="min-w-[240px] flex-1"><Field label="Target job role" hint="Pre-filled with the model's predicted role - change it to explore another path."><select className="input" value={role} onChange={(e) => setRole(e.target.value)}><option value="">Select a role</option>{roles.map((r) => <option key={r.role}>{r.role}</option>)}</select></Field></div>
        <button className="btn btn-primary" onClick={run} disabled={busy}>{busy ? <Spinner className="h-4 w-4" /> : <TrendingUp className="h-4 w-4" />}Analyze skill gap</button>
      </div>
      {out && <GapResult g={out} />}
    </div>
  );
}
