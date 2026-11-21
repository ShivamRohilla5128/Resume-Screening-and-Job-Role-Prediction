import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowDown, ArrowUp, Download, ListOrdered } from "lucide-react";
import Dropzone from "../components/Dropzone";
import { SkillInput } from "./JobMatch";
import { Bar, Empty, Field, Notice, PageHeader, Spinner } from "../components/ui";
import useRoles from "../hooks/useRoles";
import { screening } from "../services/api";
import { useToast } from "../hooks/useToast";
import { downloadBlob, errMsg, scoreColor, toCSV } from "../utils/format";

const COLS = [["rank", "#"], ["name", "Candidate"], ["predicted_role", "Predicted role"], ["years_experience", "Exp. (yrs)"], ["match_score", "Match"]];

export default function Ranking() {
  const roles = useRoles();
  const [files, setFiles] = useState([]);
  const [jd, setJd] = useState("");
  const [skills, setSkills] = useState([]);
  const [role, setRole] = useState("");
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [res, setRes] = useState(null);
  const [sort, setSort] = useState({ key: "rank", dir: 1 });
  const [q, setQ] = useState("");
  const [min, setMin] = useState(0);
  const [roleF, setRoleF] = useState("");
  const toast = useToast();

  const run = async () => {
    if (!files.length) return toast.error("Upload at least one resume");
    if (!role && !jd.trim() && !skills.length) return toast.error("Provide a job description, required skills or a role");
    setBusy(true); setProgress(0);
    try {
      const r = await screening.rank(files, { job_description: jd, required_skills: skills.join(","), job_role: role }, setProgress);
      setRes(r); toast.success(`Ranked ${r.ranked.length} candidate(s)${r.failed.length ? `, ${r.failed.length} failed` : ""}`);
    } catch (e) { toast.error(errMsg(e)); } finally { setBusy(false); }
  };

  const rows = useMemo(() => {
    if (!res) return [];
    const t = q.toLowerCase();
    const f = res.ranked.filter((r) => r.match_score >= min && (!roleF || r.predicted_role === roleF) && (!t || (r.name + r.skills.join(" ")).toLowerCase().includes(t)));
    return f.sort((a, b) => { const x = a[sort.key] ?? -1, y = b[sort.key] ?? -1; return (x > y ? 1 : x < y ? -1 : 0) * sort.dir; });
  }, [res, q, min, roleF, sort]);

  const exportCsv = () => downloadBlob(new Blob([toCSV([["Rank", "Candidate", "File", "Predicted role", "Role probability", "Experience (yrs)", "Skills", "Match score", "Matched skills", "Missing skills", "Status"],
    ...rows.map((r) => [r.rank, r.name, r.filename, r.predicted_role, r.probability, r.years_experience ?? "", r.skills.join("; "), r.match_score, r.matched_skills.join("; "), r.missing_skills.join("; "), r.status]),
    ...res.failed.map((f) => ["", "", f.filename, "", "", "", "", "", "", "", `failed: ${f.error}`])])], { type: "text/csv" }), "resume_ranking.csv");
  const th = (k) => setSort((s) => ({ key: k, dir: s.key === k ? -s.dir : 1 }));

  return (
    <div className="space-y-6">
      <PageHeader title="Resume Ranking" subtitle="Screen many resumes against one job. Ranking uses job-related criteria only." />
      <div className="card grid gap-5 p-5 lg:grid-cols-2">
        <div className="space-y-4">
          <Dropzone files={files} setFiles={setFiles} disabled={busy} />
          <Field label="Job role (optional)"><select className="input" value={role} onChange={(e) => setRole(e.target.value)}><option value="">None</option>{roles.map((r) => <option key={r.role}>{r.role}</option>)}</select></Field>
          <Field label="Required skills"><SkillInput skills={skills} setSkills={setSkills} /></Field>
        </div>
        <Field label="Job description"><textarea className="input min-h-[260px]" value={jd} onChange={(e) => setJd(e.target.value)} maxLength={20000} placeholder="Paste the job description…" /></Field>
        <div className="lg:col-span-2 flex flex-wrap items-center gap-3">
          <button className="btn btn-primary" onClick={run} disabled={busy}>{busy ? <Spinner className="h-4 w-4" /> : <ListOrdered className="h-4 w-4" />}Rank candidates</button>
          {busy && <span className="text-sm text-slate-500">{progress < 100 ? `Uploading ${progress}%` : "Server is analysing all resumes…"}</span>}
        </div>
      </div>

      {res && (
        <div className="space-y-4">
          <Notice tone="info">{res.fairness_note}</Notice>
          <div className="card p-5">
            <div className="mb-4 flex flex-wrap items-end gap-3">
              <input className="input max-w-xs" placeholder="Search name or skill…" aria-label="Search" value={q} onChange={(e) => setQ(e.target.value)} />
              <select className="input max-w-[220px]" aria-label="Filter by role" value={roleF} onChange={(e) => setRoleF(e.target.value)}><option value="">All predicted roles</option>{[...new Set(res.ranked.map((r) => r.predicted_role))].map((r) => <option key={r}>{r}</option>)}</select>
              <label className="flex items-center gap-2 text-sm">Min match <input type="range" min="0" max="100" value={min} onChange={(e) => setMin(+e.target.value)} /> <b className="w-8">{min}%</b></label>
              <button className="btn btn-ghost ml-auto" onClick={exportCsv}><Download className="h-4 w-4" />Export CSV</button>
            </div>
            {rows.length ? (
              <div className="overflow-x-auto"><table className="w-full text-left text-sm">
                <thead className="text-xs text-slate-500"><tr>{COLS.map(([k, l]) => <th key={k} className="cursor-pointer select-none py-2 pr-3" onClick={() => th(k)}><span className="inline-flex items-center gap-1">{l}{sort.key === k && (sort.dir === 1 ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />)}</span></th>)}<th>Skills</th><th>Missing skills</th><th>Status</th></tr></thead>
                <tbody className="divide-y divide-slate-100">{rows.map((r) => (
                  <tr key={r.analysis_id} className="align-top hover:bg-slate-50">
                    <td className="py-2.5 pr-3 font-semibold">{r.rank}</td>
                    <td className="pr-3"><Link className="font-medium text-brand hover:underline" to={`/app/history/${r.analysis_id}`}>{r.name}</Link>{!r.name_detected && <span className="block text-xs text-slate-400">name not detected</span>}</td>
                    <td className="pr-3">{r.predicted_role}<span className="block text-xs text-slate-400">{(r.probability * 100).toFixed(0)}%</span></td>
                    <td className="pr-3">{r.years_experience ?? "—"}</td>
                    <td className="w-36 pr-3"><div className="mb-1 font-medium">{r.match_score.toFixed(1)}%</div><Bar value={r.match_score} color={scoreColor(r.match_score)} /></td>
                    <td className="max-w-[220px] pr-3 text-xs">{r.skills.slice(0, 8).join(", ") || "—"}</td>
                    <td className="max-w-[200px] pr-3 text-xs text-amber-700">{r.missing_skills.join(", ") || "None"}</td>
                    <td><span className="chip bg-green-50 text-green-800">Analyzed</span></td>
                  </tr>))}</tbody></table></div>
            ) : <Empty title="No candidates match the current filters" />}
            {res.failed.length > 0 && <div className="mt-4 space-y-1">{res.failed.map((f) => <p key={f.filename} className="text-sm text-red-600">✗ {f.filename}: {f.error}</p>)}</div>}
          </div>
        </div>
      )}
    </div>
  );
}
