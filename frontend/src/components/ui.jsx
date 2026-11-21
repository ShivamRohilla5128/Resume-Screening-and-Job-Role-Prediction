import { Check, X, Loader2, Inbox, AlertTriangle, FlaskConical, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";

export const PageHeader = ({ title, subtitle, actions }) => (
  <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
    <div>
      <h1 className="text-2xl font-semibold">{title}</h1>
      {subtitle && <p className="mt-1 max-w-2xl text-sm text-slate-500">{subtitle}</p>}
    </div>
    {actions}
  </div>
);

export const Spinner = ({ className = "h-5 w-5" }) => <Loader2 className={`animate-spin ${className}`} aria-label="Loading" />;

export const Empty = ({ title, hint }) => (
  <div className="flex flex-col items-center gap-2 py-12 text-center">
    <Inbox className="h-8 w-8 text-slate-300" />
    <p className="font-medium">{title}</p>
    {hint && <p className="max-w-sm text-sm text-slate-500">{hint}</p>}
  </div>
);

export const Notice = ({ tone = "warning", children }) => (
  <div className={`flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm shadow-sm ${tone === "warning" ? "border-amber-200 bg-amber-50/90 text-amber-900" : "border-blue-200 bg-blue-50/90 text-blue-900"}`}>
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
  <section className="card card-hover p-5">
    <div className="mb-3 flex items-center justify-between gap-2">
      <h3 className="flex items-center gap-2 text-sm font-semibold">{Icon && <Icon className="h-4 w-4 text-brand" />}{title}</h3>{right}
    </div>
    {children}
  </section>
);

export const KV = ({ k, v }) => (
  <div className="flex gap-3 py-1.5 text-sm"><dt className="w-36 shrink-0 text-slate-500">{k}</dt><dd className="min-w-0 break-words font-medium">{v}</dd></div>
);
