import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Download, Trash2 } from "lucide-react";
import AnalysisView from "../components/AnalysisView";
import { GapResult, MatchResult, ReviewResult } from "../components/results";
import { Notice, PageHeader, Section, Spinner } from "../components/ui";
import { history } from "../services/api";
import { useToast } from "../hooks/useToast";
import { downloadBlob, errMsg, fmtDate } from "../utils/format";

export default function HistoryDetail() {
  const { id } = useParams();
  const [a, setA] = useState(null);
  const toast = useToast();
  const nav = useNavigate();
  useEffect(() => { history.get(id).then(setA).catch((e) => { toast.error(errMsg(e)); nav("/app/history"); }); }, [id]); // eslint-disable-line
  if (!a) return <div className="grid place-items-center py-24"><Spinner className="h-8 w-8 text-brand" /></div>;

  const del = async () => { if (window.confirm("Delete this analysis and its stored resume text?")) { try { await history.remove(id); toast.success("Deleted"); nav("/app/history"); } catch (e) { toast.error(errMsg(e)); } } };
  return (
    <div className="space-y-6">
      <Link to="/app/history" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-navy"><ArrowLeft className="h-4 w-4" />Back to history</Link>
      <PageHeader title={a.info.name || a.filename} subtitle={`${a.filename} · analysed ${fmtDate(a.created_at)}`}
        actions={<div className="flex gap-2"><button className="btn btn-ghost" onClick={async () => downloadBlob(await history.report(id), `analysis_${a.filename}.pdf`)}><Download className="h-4 w-4" />PDF report</button><button className="btn btn-danger" onClick={del}><Trash2 className="h-4 w-4" />Delete</button></div>} />
      <AnalysisView a={a} />
      {a.match && <Section title="Job description match"><MatchResult m={a.match} /></Section>}
      {a.gap && <Section title={`Skill gap — ${a.gap.job_role}`}><GapResult g={a.gap} /></Section>}
      {a.review && <Section title="Resume improvement review"><ReviewResult r={a.review} /></Section>}
      {!a.resume_available && <Notice tone="info">The original resume text is no longer stored (deleted or retention period expired). Upload the file again to run new analyses.</Notice>}
    </div>
  );
}
