import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { FileText, Gauge, Brain, Layers, Activity } from "lucide-react";
import TiltCard from "../components/TiltCard";
import { Empty, PageHeader, Section, Spinner } from "../components/ui";
import { history } from "../services/api";
import { useToast } from "../hooks/useToast";
import { errMsg, fmtDate } from "../utils/format";

const PIE = ["#14213D", "#2563EB", "#60A5FA", "#93C5FD", "#16A34A", "#F59E0B", "#94A3B8", "#475569"];
const CARD_TONES = [
  "bg-blue-50 text-blue-700 ring-blue-100",
  "bg-emerald-50 text-emerald-700 ring-emerald-100",
  "bg-violet-50 text-violet-700 ring-violet-100",
  "bg-amber-50 text-amber-700 ring-amber-100",
];

export default function Dashboard() {
  const [s, setS] = useState(null);
  const toast = useToast();
  useEffect(() => { history.stats().then(setS).catch((e) => toast.error(errMsg(e))); }, []); // eslint-disable-line
  if (!s) return <div className="grid place-items-center py-24"><Spinner className="h-8 w-8 text-brand" /></div>;

  const cards = [
    [FileText, "Resumes analyzed", s.total_resumes, "Saved in your analysis history"],
    [Gauge, "Average match score", s.average_match_score != null ? `${s.average_match_score}%` : "—", "Across completed job matches"],
    [Brain, "Most predicted role", s.most_predicted_role || "—", "Most frequent in your history"],
    [Layers, "Job categories", s.total_job_categories, "Available in the trained model"],
  ];
  return (
    <div className="space-y-6">
      <PageHeader title="Your dashboard" subtitle="A snapshot of your saved analyses and the model. Every figure comes from your workspace data." actions={<Link to="/app/analyze" className="btn btn-primary"><FileText className="h-4 w-4" />Analyze a resume</Link>} />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(([I, label, val, helper], i) => (
          <TiltCard key={label}><motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }} className="card card-hover relative overflow-hidden p-5">
            <motion.span animate={{ y: [0, -3, 0] }} transition={{ repeat: Infinity, duration: 4 + i, ease: "easeInOut" }} className={`absolute right-4 top-4 grid h-11 w-11 place-items-center rounded-2xl shadow-sm ring-1 ${CARD_TONES[i]}`}><I className="h-5 w-5" /></motion.span>
            <p className="pr-12 text-sm font-medium text-slate-500">{label}</p><p className="mt-2 truncate pr-12 text-2xl font-bold text-navy">{val}</p>
            <p className="mt-4 border-t border-slate-100 pt-3 text-xs text-slate-400">{helper}</p>
          </motion.div></TiltCard>
        ))}
      </div>
      {s.total_resumes === 0 ? (
        <div className="card flex flex-col items-center p-5">
          <Empty title="Your insights start with one resume" hint="Upload a PDF or DOCX to see role predictions, skill insights and your first dashboard stats." />
          <Link to="/app/analyze" className="btn btn-primary mb-6"><FileText className="h-4 w-4" />Analyze your first resume</Link>
        </div>
      ) : (
        <>
          <div className="grid gap-5 lg:grid-cols-2">
            <Section title="Predicted job role distribution">
              <div className="h-64"><ResponsiveContainer><PieChart><Pie data={s.role_distribution} dataKey="count" nameKey="role" innerRadius={50} outerRadius={85} paddingAngle={2} animationDuration={2200} animationEasing="ease-in-out">{s.role_distribution.map((_, i) => <Cell key={i} fill={PIE[i % PIE.length]} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer></div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">{s.role_distribution.map((r, i) => <span key={r.role} className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full" style={{ background: PIE[i % PIE.length] }} />{r.role} ({r.count})</span>)}</div>
            </Section>
            <Section title="Match score distribution" right={<span className="text-xs text-slate-400">{s.matches_computed} match(es)</span>}>
              <div className="h-64"><ResponsiveContainer><BarChart data={s.score_distribution}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="range" fontSize={12} /><YAxis allowDecimals={false} fontSize={12} /><Tooltip /><Bar dataKey="count" fill="#2563EB" radius={[6, 6, 0, 0]} animationDuration={2200} animationEasing="ease-in-out" /></BarChart></ResponsiveContainer></div>
            </Section>
          </div>
          <Section title="Most frequent skills across analysed resumes">
            <div className="h-72"><ResponsiveContainer><BarChart data={s.skills_frequency} layout="vertical" margin={{ left: 30 }}><CartesianGrid strokeDasharray="3 3" horizontal={false} /><XAxis type="number" allowDecimals={false} fontSize={12} /><YAxis type="category" dataKey="skill" width={110} fontSize={12} /><Tooltip /><Bar dataKey="count" fill="#14213D" radius={[0, 6, 6, 0]} animationDuration={2200} animationEasing="ease-in-out" /></BarChart></ResponsiveContainer></div>
          </Section>
          <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
            <Section title="Recent resume analyses">
              <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="text-xs text-slate-500"><tr><th className="py-2">Resume</th><th>Predicted role</th><th>Prob.</th><th>Match</th><th>Date</th></tr></thead>
                <tbody className="divide-y divide-slate-100">{s.recent.map((r) => <tr key={r.id} className="hover:bg-slate-50"><td className="py-2"><Link to={`/app/history/${r.id}`} className="font-medium text-brand hover:underline">{r.candidate_name || r.filename}</Link></td><td>{r.predicted_role}</td><td>{(r.probability * 100).toFixed(0)}%</td><td>{r.match_score != null ? `${r.match_score}%` : "—"}</td><td className="whitespace-nowrap text-xs text-slate-500">{fmtDate(r.created_at)}</td></tr>)}</tbody></table></div>
            </Section>
            <Section title="Recent activity" icon={Activity}>
              <ul className="space-y-3 text-sm">{s.activity.map((a, i) => <li key={i} className="flex gap-3"><span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand" /><div><p>{a.label}</p><p className="text-xs text-slate-400">{fmtDate(a.at)}</p></div></li>)}</ul>
            </Section>
          </div>
        </>
      )}
    </div>
  );
}
