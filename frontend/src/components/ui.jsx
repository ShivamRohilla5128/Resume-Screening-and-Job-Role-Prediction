import { Check, X, Loader2, Inbox, AlertTriangle, FlaskConical, CheckCircle2, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

export const PageHeader = ({ title, subtitle, actions }) => (
  <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
    <div className="min-w-0">
      <span className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-blue-100 bg-white/75 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[.16em] text-brand shadow-sm">
        <Sparkles className="h-3 w-3" /> Your workspace
      </span>
      <h1 className="text-2xl font-bold sm:text-3xl">{title}</h1>
      {subtitle && <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-slate-500">{subtitle}</p>}
    </div>
    {actions && <div className="shrink-0">{actions}</div>}
  </div>
);

export const Spinner = ({ className = "h-5 w-5" }) => <Loader2 className={`animate-spin ${className}`} aria-label="Loading" />;

export const Empty = ({ title, hint }) => (
  <div className="flex flex-col items-center gap-2 px-4 py-14 text-center">
    <span className="mb-1 grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-blue-50 to-violet-50 text-brand ring-1 ring-blue-100/80">
      <Inbox className="h-7 w-7" />
    </span>
    <p className="font-semibold text-navy">{title}</p>
    {hint && <p className="max-w-sm text-sm leading-relaxed text-slate-500">{hint}</p>}
  </div>
);

export const Notice = ({ tone = "warning", children }) => (
  <div className={`flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm shadow-sm ${tone === "warning" ? "border-amber-200 bg-gradient-to-r from-amber-50 to-white text-amber-900" : "border-blue-200 bg-gradient-to-r from-blue-50 to-white text-blue-900"}`}>
    {tone === "warning" ? <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> : <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />}
    <div>{children}</div>
  </div>
);

export const ModelBanner = ({ model }) =>
  model?.is_synthetic ? (
    <Notice>
      <div className="flex items-center gap-2">
        <FlaskConical className="h-4 w-4" />
        <b>Demo model active</b>
      </div>
      <p className="mt-0.5 text-xs opacity-80">Predictions use a synthetic training dataset and are intended for demonstration.</p>
    </Notice>
  ) : null;

/* 3D-ish tiles for matched / missing skills */
export function SkillChips({ skills, kind = "have", empty = "None" }) {
  if (!skills?.length) return <span className="text-sm text-slate-400">{empty}</span>;
  const tone = { have: "bg-green-50 text-green-800 ring-green-200", missing: "bg-amber-50 text-amber-800 ring-amber-200", info: "bg-blue-50 text-blue-800 ring-blue-200" }[kind];
  const Icon = kind === "missing" ? X : Check;
  return (
    <div className="flex flex-wrap gap-2">
      {skills.map((s, i) => (
        <span key={s} style={{ animationDelay: `${Math.min(i, 20) * 30}ms` }}
          className={`skill-in inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium ring-1 ring-inset shadow-[0_2px_0_rgba(20,33,61,.07)] ${tone}`}>
          {kind !== "info" && <Icon className="h-3 w-3" />} {s}
        </span>
      ))}
    </div>
  );
}

export const Bar = ({ value, color = "#2563EB" }) => (
  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
    <motion.div className="h-full rounded-full" style={{ background: color }} initial={{ width: 0 }} animate={{ width: `${Math.max(0, Math.min(100, value))}%` }} transition={{ duration: 1.8, ease: "easeInOut" }} />
  </div>
);

export const Field = ({ label, children, hint }) => (
  <label className="block"><span className="label">{label}</span>{children}{hint && <span className="mt-1 block text-xs text-slate-500">{hint}</span>}</label>
);

export const Section = ({ title, icon: Icon, children, right }) => (
  <section className="card section-card card-hover p-5">
    <div className="mb-4 flex items-center justify-between gap-3 border-b border-slate-100/90 pb-3">
      <div className="flex min-w-0 items-center gap-2.5">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 text-brand ring-1 ring-blue-100/80">
          {Icon ? <Icon className="h-4 w-4" /> : <span className="h-2 w-2 rounded-full bg-brand shadow-[0_0_0_4px_rgba(37,99,235,.10)]" />}
        </span>
        <h3 className="text-sm font-bold">{title}</h3>
      </div>
      {right}
    </div>
    {children}
  </section>
);

export const KV = ({ k, v }) => (
  <div className="flex gap-3 py-1.5 text-sm"><dt className="w-36 shrink-0 text-slate-500">{k}</dt><dd className="min-w-0 break-words font-medium">{v}</dd></div>
);
