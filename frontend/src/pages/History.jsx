import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Download, GitCompare, Trash2 } from "lucide-react";
import { Empty, PageHeader, Section, Spinner } from "../components/ui";
import { history } from "../services/api";
import { useToast } from "../hooks/useToast";
import { downloadBlob, errMsg, fmtDate } from "../utils/format";

function Compare({ ids }) {
  const [docs, setDocs] = useState(null);
  useEffect(() => { setDocs(null); Promise.all(ids.map(history.get)).then(setDocs).catch(() => setDocs([])); }, [ids.join()]); // eslint-disable-line
  if (!docs) return <Spinner />;
  if (docs.length < 2) return <p className="text-sm text-red-600">Could not load both reports.</p>;
  const [a, b] = docs;
  const sa = new Set(a.info.skills), sb = new Set(b.info.skills);
  const shared = [...sa].filter((s) => sb.has(s));
  const rows = [
    ["File", a.filename, b.filename], ["Candidate", a.info.name || "Not detected", b.info.name || "Not detected"],
    ["Predicted role", a.prediction.primary.role, b.prediction.primary.role],
    ["Role probability", `${(a.prediction.primary.probability * 100).toFixed(1)}%`, `${(b.prediction.primary.probability * 100).toFixed(1)}%`],
    ["Match score", a.match ? `${a.match.overall_score}%` : "—", b.match ? `${b.match.overall_score}%` : "—"],
    ["Resume review score", a.review ? `${a.review.overall}/100` : "—", b.review ? `${b.review.overall}/100` : "—"],
    ["Experience (yrs)", a.info.years_experience ?? "—", b.info.years_experience ?? "—"], ["Skills detected", sa.size, sb.size],
    ["Only in this resume", [...sa].filter((s) => !sb.has(s)).join(", ") || "—", [...sb].filter((s) => !sa.has(s)).join(", ") || "—"],
  ];
  return (
    <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="text-xs text-slate-500"><tr><th className="py-2" /><th>Report A</th><th>Report B</th></tr></thead>
      <tbody className="divide-y divide-slate-100">{rows.map(([k, x, y]) => <tr key={k} className="align-top"><td className="w-44 py-2 text-slate-500">{k}</td><td className="pr-4">{x}</td><td>{y}</td></tr>)}</tbody></table>
      <p className="mt-3 text-sm"><b>Shared skills ({shared.length}):</b> {shared.join(", ") || "none"}</p></div>
  );
}

export default function History() {
  const [items, setItems] = useState(null);
  const [sel, setSel] = useState([]);
  const toast = useToast();
  const load = () => history.list().then((r) => setItems(r.items)).catch((e) => toast.error(errMsg(e)));
  useEffect(() => { load(); }, []); // eslint-disable-line

  const del = async (it) => {
    if (!window.confirm(`Delete the analysis of "${it.filename}"? The stored resume text is removed too.`)) return;
    try { await history.remove(it.id); setSel((s) => s.filter((x) => x !== it.id)); toast.success("Deleted"); load(); } catch (e) { toast.error(errMsg(e)); }
  };
  const pdf = async (it) => { try { downloadBlob(await history.report(it.id), `analysis_${it.filename}.pdf`); } catch (e) { toast.error(errMsg(e)); } };
  const toggle = (id) => setSel((s) => (s.includes(id) ? s.filter((x) => x !== id) : s.length >= 2 ? [s[1], id] : [...s, id]));

  if (!items) return <div className="grid place-items-center py-24"><Spinner className="h-8 w-8 text-brand" /></div>;
  return (
    <div className="space-y-6">
      <PageHeader title="History" subtitle="Saved analyses. Select two to compare them side by side. Resume text is auto-deleted after the retention period." />
      {sel.length === 2 && <Section title="Comparison" icon={GitCompare}><Compare ids={sel} /></Section>}
      <div className="card p-5">
        {items.length === 0 ? <Empty title="No saved analyses" hint="Analyzed resumes will appear here." /> : (
          <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="text-xs text-slate-500"><tr><th className="w-8" /><th className="py-2">Resume</th><th>Type</th><th>Predicted role</th><th>Match</th><th>Date</th><th /></tr></thead>
            <tbody className="divide-y divide-slate-100">{items.map((it) => (
              <tr key={it.id} className="hover:bg-slate-50">
                <td><input type="checkbox" aria-label={`Select ${it.filename} for comparison`} checked={sel.includes(it.id)} onChange={() => toggle(it.id)} className="h-4 w-4 accent-brand" /></td>
                <td className="py-2.5"><Link to={`/app/history/${it.id}`} className="font-medium text-brand hover:underline">{it.candidate_name || it.filename}</Link><span className="block text-xs text-slate-400">{it.filename}</span></td>
                <td className="capitalize">{it.kind}</td><td>{it.predicted_role} <span className="text-xs text-slate-400">{(it.probability * 100).toFixed(0)}%</span></td>
                <td>{it.match_score != null ? `${it.match_score}%` : "—"}</td><td className="whitespace-nowrap text-xs text-slate-500">{fmtDate(it.created_at)}</td>
                <td className="whitespace-nowrap text-right"><button className="btn btn-ghost !p-2" aria-label="Download PDF" onClick={() => pdf(it)}><Download className="h-4 w-4" /></button> <button className="btn btn-danger !p-2" aria-label="Delete" onClick={() => del(it)}><Trash2 className="h-4 w-4" /></button></td>
              </tr>))}</tbody></table></div>
        )}
      </div>
    </div>
  );
}
