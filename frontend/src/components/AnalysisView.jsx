import { useMemo, useState } from "react";
import { User, GraduationCap, Briefcase, Award, FolderGit2, Sparkles, Brain } from "lucide-react";
import ProgressRing from "./ProgressRing";
import SkillNodes from "./SkillNodes";
import TiltCard from "./TiltCard";
import { Bar, KV, Notice, Section, SkillChips } from "./ui";
import useRoles from "../hooks/useRoles";
import { orND, pct } from "../utils/format";

const List = ({ items }) => (Array.isArray(items) && items.length ? <ul className="list-disc space-y-1 pl-5 text-sm">{items.map((x, i) => <li key={i}>{x}</li>)}</ul> : <span className="text-sm text-slate-400">Not detected</span>);

export default function AnalysisView({ a }) {
  const { info, prediction: p, review } = a;
  const roles = useRoles();
  const choices = [p.primary, ...p.alternatives];
  const [sel, setSel] = useState(p.primary.role);
  const ref = useMemo(() => roles.find((r) => r.role === sel), [roles, sel]);

  return (
    <div className="space-y-5">
      <div className="grid gap-5 lg:grid-cols-2">
        <Section title="Candidate details" icon={User}>
          <dl className="divide-y divide-slate-100">
            <KV k="Name" v={orND(info.name)} /><KV k="Email" v={orND(info.email)} /><KV k="Phone" v={orND(info.phone)} />
            <KV k="Experience" v={info.years_experience != null ? `${info.years_experience} year(s)` : "Not detected"} />
            <KV k="Highest education" v={orND(info.education_level_label)} />
          </dl>
          {info.summary && <p className="mt-3 rounded-xl bg-slate-50 p-3 text-sm text-slate-600"><b className="text-ink">Summary: </b>{info.summary}</p>}
        </Section>
        <Section title="Detected skills" icon={Sparkles}>
          <SkillChips skills={info.skills} kind="info" empty="No recognised skills" />
          <p className="mt-3 text-xs text-slate-400">Matched against a vocabulary of known technical skills; unlisted skills are not detected.</p>
        </Section>
        <Section title="Education" icon={GraduationCap}><List items={info.education} /></Section>
        <Section title="Experience" icon={Briefcase}><List items={info.experience} /></Section>
        <Section title="Projects" icon={FolderGit2}><List items={info.projects} /></Section>
        <Section title="Certifications" icon={Award}><List items={info.certifications} /></Section>
      </div>

      <Section title="Predicted job role" icon={Brain}>
        <div className="grid gap-6 lg:grid-cols-[200px_1fr_1fr]">
          <TiltCard><div className="flex flex-col items-center gap-1 rounded-xl bg-slate-50 p-4 text-center">
            <ProgressRing value={p.primary.probability * 100} size={110} label="model probability" color="#2563EB" />
            <p className="mt-1 text-base font-semibold text-navy">{p.primary.role}</p>
          </div></TiltCard>
          <div>
            <p className="mb-2 text-sm font-medium">Top alternatives <span className="font-normal text-slate-400">(click to inspect skills)</span></p>
            <div className="space-y-2.5">
              {choices.map((c, i) => (
                <button key={c.role} type="button" onClick={() => setSel(c.role)} className={`block w-full rounded-lg p-2 text-left transition ${sel === c.role ? "bg-blue-50 ring-1 ring-brand/30" : "hover:bg-slate-50"}`}>
                  <div className="mb-1 flex justify-between text-sm"><span className={i === 0 ? "font-semibold" : ""}>{c.role}</span><span>{pct(c.probability, 1)}</span></div>
                  <Bar value={c.probability * 100} color={i === 0 ? "#2563EB" : "#94A3B8"} />
                </button>
              ))}
            </div>
            <div className="mt-4 space-y-3 text-sm">
              <div><p className="mb-1.5 font-medium">Skills supporting the prediction</p><SkillChips skills={p.supporting_skills} kind="have" empty="None of the role's reference skills were detected" /></div>
              <div><p className="mb-1.5 font-medium">Relevant skills that are missing</p><SkillChips skills={p.missing_skills} kind="missing" empty="No required skills missing" /></div>
              {p.top_terms.length > 0 && <div><p className="mb-1.5 font-medium">Top text features behind the prediction</p><SkillChips skills={p.top_terms.map((t) => t.term)} kind="info" /></div>}
            </div>
          </div>
          <div className="flex flex-col items-center">
            {ref ? <SkillNodes role={ref.role} required={ref.required} optional={ref.optional} detected={info.skills} /> : <p className="text-sm text-slate-400">No skill reference for “{sel}”</p>}
            <p className="mt-1 text-center text-xs text-slate-500"><span className="text-success">●</span> detected &nbsp;<span className="text-warning">●</span> required, missing &nbsp;<span className="text-blue-300">●</span> optional</p>
          </div>
        </div>
        <div className="mt-4 space-y-2">
          <Notice tone="info">{p.note}</Notice>
          {p.low_signal && <Notice>Very little recognisable text was found, so this prediction is unreliable.</Notice>}
        </div>
      </Section>

      {review && (
        <Section title="Resume health snapshot">
          <div className="flex flex-wrap items-center gap-6">
            <ProgressRing value={review.overall} size={96} label="rule-based score" />
            <div className="min-w-[240px] flex-1 space-y-2">
              {review.sections.map((s) => <div key={s.key} className="grid grid-cols-[150px_1fr_40px] items-center gap-3 text-xs"><span>{s.label}</span><Bar value={s.score} color={s.score >= 75 ? "#16A34A" : s.score >= 40 ? "#2563EB" : "#F59E0B"} /><span className="text-right text-slate-500">{s.score}</span></div>)}
            </div>
          </div>
        </Section>
      )}
    </div>
  );
}
