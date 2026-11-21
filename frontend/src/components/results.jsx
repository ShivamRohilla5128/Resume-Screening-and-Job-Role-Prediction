import { motion } from "framer-motion";
import { Bar as RBar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { CheckCircle2, XCircle, Lightbulb, Map, FolderGit2, Info } from "lucide-react";
import ProgressRing from "./ProgressRing";
import TiltCard from "./TiltCard";
import { Bar, Notice, Section, SkillChips } from "./ui";
import { scoreColor } from "../utils/format";

export function MatchResult({ m }) {
  const pie = [{ name: "Matched", value: m.matched_skills.length, c: "#16A34A" }, { name: "Missing", value: m.missing_skills.length, c: "#F59E0B" }];
  return (
    <div className="space-y-5">
      <div className="grid gap-5 lg:grid-cols-[260px_1fr]">
        <TiltCard><div className="card flex flex-col items-center gap-2 p-6">
          <ProgressRing value={m.overall_score} size={150} stroke={12} label="Estimated compatibility" />
          <p className="mt-1 text-center text-xs text-slate-500">{m.job_role ? `Role: ${m.job_role}` : "Custom requirements"}</p>
        </div></TiltCard>
        <Section title="How the score is built" icon={Info}>
          <div className="space-y-3">
            {m.components.map((c) => (
              <div key={c.key}>
                <div className="mb-1 flex justify-between text-sm"><span className="font-medium">{c.label} <span className="text-xs font-normal text-slate-400">(weight {Math.round(c.weight * 100)}%)</span></span><span>{c.score.toFixed(0)}%</span></div>
                <Bar value={c.score} color={scoreColor(c.score)} /><p className="mt-1 text-xs text-slate-500">{c.detail}</p>
              </div>
            ))}
          </div>
        </Section>
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        <Section title="Skills comparison">
          <div className="grid grid-cols-2 items-center gap-2">
            <div className="h-44">
              <ResponsiveContainer><PieChart><Pie data={pie} dataKey="value" innerRadius={42} outerRadius={68} paddingAngle={3} animationDuration={2200} animationEasing="ease-in-out">{pie.map((p) => <Cell key={p.name} fill={p.c} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer>
            </div>
            <ul className="space-y-1 text-sm"><li className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-success" />Matched: <b>{m.matched_skills.length}</b></li><li className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-warning" />Missing: <b>{m.missing_skills.length}</b></li>
              {m.keyword_similarity != null && <li className="pt-1 text-slate-500">TF-IDF similarity: {m.keyword_similarity}%</li>}</ul>
          </div>
        </Section>
        <Section title="Component scores">
          <div className="h-44"><ResponsiveContainer><BarChart data={m.components.map((c) => ({ name: c.label.split(" ")[0], score: c.score }))}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="name" fontSize={11} /><YAxis domain={[0, 100]} fontSize={11} /><Tooltip /><RBar dataKey="score" radius={[6, 6, 0, 0]} animationDuration={2200} animationEasing="ease-in-out">{m.components.map((c) => <Cell key={c.key} fill={scoreColor(c.score)} />)}</RBar></BarChart></ResponsiveContainer></div>
        </Section>
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        <Section title="Matched skills" icon={CheckCircle2}><SkillChips skills={m.matched_skills} kind="have" /></Section>
        <Section title="Missing skills" icon={XCircle}><SkillChips skills={m.missing_skills} kind="missing" empty="No required skills are missing" /></Section>
      </div>
      {m.bonus_matched?.length > 0 && <Section title="Bonus skills (role-relevant, not required)"><SkillChips skills={m.bonus_matched} kind="info" /></Section>}
      {m.suggestions?.length > 0 && <Section title="Improvement suggestions" icon={Lightbulb}><ul className="list-disc space-y-1.5 pl-5 text-sm">{m.suggestions.map((s) => <li key={s}>{s}</li>)}</ul></Section>}
      <Notice tone="info">{m.disclaimer}</Notice>
    </div>
  );
}

export function GapResult({ g }) {
  return (
    <div className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-3">
        <TiltCard><div className="card flex justify-center p-5"><ProgressRing value={g.coverage.required} label="Required skills covered" /></div></TiltCard>
        <TiltCard><div className="card flex justify-center p-5"><ProgressRing value={g.coverage.optional} label="Optional skills covered" color="#2563EB" /></div></TiltCard>
        <TiltCard><div className="card flex h-full flex-col items-center justify-center p-5 text-center"><p className="text-3xl font-semibold text-navy">{g.total_weeks || 0}</p><p className="text-xs text-slate-500">estimated weeks of learning<br />(heuristic: 2/3/4 weeks per beginner/intermediate/advanced skill)</p></div></TiltCard>
      </div>
      <div className="grid gap-5 lg:grid-cols-3">
        <Section title="Existing skills" icon={CheckCircle2}><SkillChips skills={g.existing.map((s) => s.skill)} kind="have" /></Section>
        <Section title="Missing (required)" icon={XCircle}><SkillChips skills={g.missing_required.map((s) => s.skill)} kind="missing" empty="Nothing required is missing" /></Section>
        <Section title="Missing (optional)"><SkillChips skills={g.missing_optional.map((s) => s.skill)} kind="info" empty="All optional skills present" /></Section>
      </div>
      <Section title="Learning categories">
        <div className="grid gap-4 sm:grid-cols-3">
          {["beginner", "intermediate", "advanced"].map((lv) => (
            <div key={lv}><p className="mb-2 text-xs font-semibold capitalize text-slate-500">{lv}</p><SkillChips skills={g.levels[lv]} kind="info" empty="—" /></div>
          ))}
        </div>
      </Section>
      <Section title="Personalised roadmap" icon={Map}>
        {g.roadmap.length ? (
          <ol className="relative space-y-4 border-l-2 border-slate-200 pl-5">
            {g.roadmap.map((p, i) => (
              <motion.li key={p.phase} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.12 }} className="relative">
                <span className="absolute -left-[27px] top-1 h-3 w-3 rounded-full bg-brand ring-4 ring-white" />
                <p className="font-medium">{p.phase} <span className="text-xs font-normal text-slate-500">· ~{p.weeks} weeks</span></p>
                <div className="my-2"><SkillChips skills={p.skills} kind="info" /></div>
                {p.required.length > 0 && <p className="text-xs text-amber-700">Required for this role: {p.required.join(", ")}</p>}
                <p className="mt-1 text-sm text-slate-500">{p.focus}</p>
              </motion.li>
            ))}
          </ol>
        ) : <p className="text-sm text-slate-500">No gaps found for this role - nothing to learn right now.</p>}
      </Section>
      {g.projects.length > 0 && (
        <Section title="Recommended practice projects" icon={FolderGit2}>
          <div className="grid gap-3 sm:grid-cols-2">
            {g.projects.map((p) => <div key={p.title} className="rounded-xl border border-slate-200 p-3.5"><p className="font-medium">{p.title}</p><p className="my-1 text-sm text-slate-500">{p.description}</p><SkillChips skills={p.skills} kind="info" /></div>)}
          </div>
        </Section>
      )}
    </div>
  );
}

export function ReviewResult({ r }) {
  const st = { good: "text-success", needs_work: "text-warning", weak: "text-red-600" };
  return (
    <div className="space-y-5">
      <div className="grid gap-5 lg:grid-cols-[260px_1fr]">
        <TiltCard><div className="card flex justify-center p-6"><ProgressRing value={r.overall} size={150} stroke={12} label="Role-aware resume score" /></div></TiltCard>
        <div className="grid gap-5 sm:grid-cols-2">
          <Section title="Strengths" icon={CheckCircle2}>{r.strengths.length ? <ul className="list-disc space-y-1 pl-5 text-sm">{r.strengths.map((s) => <li key={s}>{s}</li>)}</ul> : <p className="text-sm text-slate-400">None detected yet</p>}</Section>
          <Section title="Weaknesses" icon={XCircle}>{r.weaknesses.length ? <ul className="list-disc space-y-1 pl-5 text-sm">{r.weaknesses.map((s) => <li key={s}>{s}</li>)}</ul> : <p className="text-sm text-slate-400">No major weaknesses</p>}</Section>
        </div>
      </div>
      <div className="grid gap-5 md:grid-cols-2">
        {r.sections.map((s) => (
          <section key={s.key} className="card card-hover p-5">
            <div className="mb-2 flex items-center justify-between"><h3 className="text-sm font-semibold">{s.label}</h3><span className={`text-sm font-semibold ${st[s.status]}`}>{s.score}/100</span></div>
            <Bar value={s.score} color={scoreColor(s.score)} />
            {s.issues.length > 0 && <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-600">{s.issues.map((x) => <li key={x}>{x}</li>)}</ul>}
            {s.tips.length > 0 && <ul className="mt-2 space-y-1.5 text-sm">{s.tips.map((x) => <li key={x} className="flex gap-2"><Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-brand" />{x}</li>)}</ul>}
            {!s.issues.length && !s.tips.length && <p className="mt-3 text-sm text-slate-500">Looks good.</p>}
          </section>
        ))}
      </div>
      {r.wording_examples?.length > 0 && (
        <Section title="Wording to improve (from your own resume)">
          <div className="space-y-3">{r.wording_examples.map((w, i) => <div key={i} className="rounded-xl bg-slate-50 p-3 text-sm"><p className="text-slate-500 line-through decoration-slate-300">{w.original}</p><p className="mt-1">{w.suggestion}</p></div>)}</div>
        </Section>
      )}
      <Notice tone="info">{r.disclaimer}</Notice>
    </div>
  );
}
