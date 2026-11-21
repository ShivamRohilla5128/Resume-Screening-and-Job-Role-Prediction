import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Cpu, Gauge, Layers, RotateCcw, SlidersHorizontal } from "lucide-react";
import { PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart, ResponsiveContainer, Tooltip } from "recharts";
import { meta } from "../services/api";
import { Section, Spinner } from "../components/ui";
import { useToast } from "../hooks/useToast";
import { errMsg } from "../utils/format";

const percent = (value) => `${(value * 100).toFixed(1)}%`;

function RoleAccuracyTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const { role, accuracy, correct, total, errors } = payload[0].payload;
  return (
    <div className="card min-w-44 p-3 text-xs shadow-lift">
      <p className="mb-1 font-semibold text-navy">{role}</p>
      <p className="text-slate-600">Accuracy: <b>{accuracy.toFixed(1)}%</b></p>
      <p className="text-slate-600">Correct: <b>{correct} of {total}</b></p>
      <p className="text-slate-600">Incorrect: <b>{errors}</b></p>
    </div>
  );
}

export default function MLModel() {
  const [metrics, setMetrics] = useState(null);
  const [displayModel, setDisplayModel] = useState("");
  const toast = useToast();

  useEffect(() => {
    meta.metrics().then((data) => {
      setMetrics(data);
      setDisplayModel(data.best_model);
    }).catch((e) => toast.error(errMsg(e)));
  }, []); // eslint-disable-line
  if (!metrics) return <div className="grid place-items-center py-24"><Spinner className="h-8 w-8 text-brand" /></div>;

  const modelName = metrics.models[displayModel] ? displayModel : metrics.best_model;
  const selected = metrics.models[modelName];
  const matrix = selected.confusion_matrix;
  const maxCount = Math.max(1, ...matrix.flat());
  const roleAccuracy = matrix.map((row, i) => {
    const total = row.reduce((sum, count) => sum + count, 0);
    const correct = row[i];
    return {
      role: metrics.classes[i],
      accuracy: total ? Number(((correct / total) * 100).toFixed(1)) : 0,
      correct,
      total,
      errors: total - correct,
    };
  });
  const summary = [
    { label: "Inspecting model", value: modelName, helper: modelName === metrics.best_model ? "Training default" : "Comparison view only", Icon: Cpu, tone: "bg-blue-50 text-brand" },
    { label: "Test accuracy", value: percent(selected.accuracy), helper: "Correct predictions on held-out resumes", Icon: Gauge, tone: "bg-emerald-50 text-emerald-700" },
    { label: "Training data", value: metrics.dataset.rows_used.toLocaleString(), helper: `${metrics.dataset.n_classes} job roles`, Icon: Layers, tone: "bg-violet-50 text-violet-700" },
  ];

  return (
    <div className="space-y-6">
      <motion.header
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative isolate overflow-hidden rounded-3xl bg-gradient-to-br from-navy via-[#1D356B] to-brand p-6 text-white shadow-lift sm:p-8"
      >
        <div aria-hidden="true" className="pointer-events-none absolute -right-12 -top-24 h-64 w-64 rounded-full border-[30px] border-white/10" />
        <div aria-hidden="true" className="pointer-events-none absolute -bottom-28 right-36 h-48 w-48 rounded-full bg-blue-400/20 blur-3xl" />
        <div className="relative max-w-2xl">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-blue-100 ring-1 ring-inset ring-white/15">
            <Cpu className="h-3.5 w-3.5" /> Model insights
          </span>
          <h1 className="mt-4 text-3xl font-bold text-white sm:text-4xl">Model overview</h1>
          <p className="mt-2 text-sm leading-relaxed text-blue-100/90 sm:text-base">
            Compare model performance, explore role predictions, and inspect where each model gets it right.
          </p>
        </div>
      </motion.header>
      <div className="grid gap-4 sm:grid-cols-3">
        {summary.map(({ label, value, helper, Icon, tone }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            whileHover={{ y: -4 }}
            className="card card-hover p-5"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm text-slate-500">{label}</p>
                <p className="mt-2 truncate text-xl font-semibold text-navy">{value}</p>
              </div>
              <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${tone}`}><Icon className="h-5 w-5" /></span>
            </div>
            <p className="mt-3 text-xs text-slate-500">{helper}</p>
          </motion.div>
        ))}
      </div>
      <Section title="Model comparison">
        <p className="mb-4 text-sm text-slate-500">Higher scores mean more accurate predictions. The training default is marked below.</p>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-xs text-slate-500">
              <tr><th className="py-2">Model</th><th className="min-w-40">Validation score</th><th className="min-w-40">Test accuracy</th><th>Training default</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {Object.entries(metrics.models).map(([name, result]) => (
                <tr key={name} className={`transition-colors hover:bg-slate-50 ${name === modelName ? "bg-blue-50/60" : ""}`}>
                  <td className="py-3 pr-4 font-medium text-navy">{name}</td>
                  {[result.cv_f1_macro_mean, result.accuracy].map((score, i) => (
                    <td key={i} className="py-3 pr-5">
                      <div className="flex items-center gap-3">
                        <span className="w-12 shrink-0 tabular-nums">{percent(score)}</span>
                        <div className="h-1.5 min-w-16 flex-1 overflow-hidden rounded-full bg-slate-100">
                          <motion.div initial={{ width: 0 }} animate={{ width: percent(score) }} transition={{ duration: 1.4, delay: 0.1 }} className={`h-full rounded-full ${i === 0 ? "bg-blue-300" : "bg-brand"}`} />
                        </div>
                      </div>
                    </td>
                  ))}
                  <td>{name === metrics.best_model ? <span className="chip bg-blue-50 text-brand">Default</span> : <span className="text-slate-300">—</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>
      <Section title="Prediction matrix">
        <div className="mb-5 rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 to-white p-4 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-blue-100 text-brand">
              <SlidersHorizontal className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-navy">Model display controls</p>
              <p className="mt-0.5 text-xs text-slate-500">Choose which model’s matrix and graph to inspect. This does not change live predictions.</p>
            </div>
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:min-w-64">
              <label htmlFor="matrix-model" className="text-xs font-medium text-slate-600">Currently viewing</label>
              <div className="flex gap-2">
                <select id="matrix-model" className="input min-w-0" value={modelName} onChange={(e) => setDisplayModel(e.target.value)}>
                  {Object.keys(metrics.models).map((name) => <option key={name} value={name}>{name}</option>)}
                </select>
                <button type="button" className="btn btn-ghost shrink-0 !px-3" title="Reset to training default" aria-label="Reset to training default" disabled={modelName === metrics.best_model} onClick={() => setDisplayModel(metrics.best_model)}>
                  <RotateCcw className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
        <p className="mb-4 text-sm text-slate-500">Rows show the actual role; columns show the predicted role. Correct predictions are on the diagonal.</p>
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(400px,0.9fr)]">
          <div className="min-w-0 rounded-2xl border border-slate-100 bg-slate-50/70 p-4 overflow-x-auto pb-2">
            <div
              role="grid"
              aria-label={`Prediction matrix for ${modelName}`}
              key={modelName}
              className="grid w-fit gap-1"
              style={{ gridTemplateColumns: `140px repeat(${matrix.length}, 28px)` }}
            >
              <div className="flex items-end pb-1 text-[10px] font-medium text-slate-500">Actual / Predicted</div>
              {metrics.classes.map((_, i) => <div key={`col-${i}`} className="text-center text-[10px] text-slate-500" title={metrics.classes[i]}>{i + 1}</div>)}
              {matrix.flatMap((row, i) => [
                <div key={`row-${i}`} className="truncate pr-2 text-xs text-slate-600" title={metrics.classes[i]}>{metrics.classes[i]}</div>,
                ...row.map((count, j) => (
                  <motion.div
                    key={`${i}-${j}`}
                    role="gridcell"
                    aria-label={`Actual ${metrics.classes[i]}, predicted ${metrics.classes[j]}: ${count}`}
                    title={`Actual: ${metrics.classes[i]} · Predicted: ${metrics.classes[j]} · Count: ${count}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 1.4, delay: i * 0.1, ease: "easeInOut" }}
                    className="grid h-7 w-7 cursor-help place-items-center rounded text-[10px] transition-[filter,box-shadow] hover:z-10 hover:brightness-110 hover:shadow-md"
                    style={{
                      backgroundColor: i === j
                        ? `rgba(37, 99, 235, ${0.08 + 0.82 * count / maxCount})`
                        : count ? `rgba(245, 158, 11, ${0.12 + 0.7 * count / maxCount})` : "#F1F5F9",
                      color: count / maxCount > 0.55 ? "#fff" : "#475569",
                    }}
                  >
                    {count || ""}
                  </motion.div>
                )),
              ])}
            </div>
            <div className="mt-4 grid gap-x-4 gap-y-1 text-xs text-slate-500 sm:grid-cols-2 lg:grid-cols-3">
              {metrics.classes.map((role, i) => <p key={role}>{i + 1}. {role}</p>)}
            </div>
          </div>
          <div className="min-w-0 rounded-2xl border border-slate-100 bg-gradient-to-b from-blue-50/70 to-white p-4">
            <h3 className="text-sm font-semibold">Accuracy radar</h3>
            <p className="mt-1 text-xs text-slate-500">Hover over any point for the role’s prediction details.</p>
            <div className="mt-3 h-[480px]">
              <ResponsiveContainer>
                <RadarChart data={roleAccuracy} outerRadius="82%">
                  <PolarGrid stroke="#CBD5E1" />
                  <PolarAngleAxis dataKey="role" tick={false} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tickFormatter={(value) => `${value}%`} tick={{ fontSize: 9 }} />
                  <Radar dataKey="accuracy" name="Accuracy" stroke="#2563EB" strokeWidth={2} fill="#3B82F6" fillOpacity={0.28} dot={{ r: 4, fill: "#1D4ED8" }} activeDot={{ r: 7, fill: "#1D4ED8" }} animationDuration={2200} animationEasing="ease-in-out" />
                  <Tooltip content={<RoleAccuracyTooltip />} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </Section>
    </div>
  );
}
