import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { RotateCcw, SlidersHorizontal } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { meta } from "../services/api";
import { PageHeader, Section, Spinner } from "../components/ui";
import { useToast } from "../hooks/useToast";
import { errMsg } from "../utils/format";

const percent = (value) => `${(value * 100).toFixed(1)}%`;

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
    return { role: metrics.classes[i], accuracy: total ? Number(((row[i] / total) * 100).toFixed(1)) : 0 };
  });
  const summary = [
    ["Model shown", modelName],
    ["Test accuracy", percent(selected.accuracy)],
    ["Training resumes", metrics.dataset.rows_used.toLocaleString()],
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Model Overview" subtitle="A simple summary of how the resume role prediction model performs." />
      <div className="grid gap-4 sm:grid-cols-3">
        {summary.map(([label, value]) => (
          <div key={label} className="card p-5">
            <p className="text-sm text-slate-500">{label}</p>
            <p className="mt-2 text-xl font-semibold text-navy">{value}</p>
          </div>
        ))}
      </div>
      <Section title="Model comparison">
        <p className="mb-4 text-sm text-slate-500">Higher scores mean more accurate predictions. The training default is marked below.</p>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-xs text-slate-500">
              <tr><th className="py-2">Model</th><th>Validation score</th><th>Test accuracy</th><th>Training default</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {Object.entries(metrics.models).map(([name, result]) => (
                <tr key={name} className={name === modelName ? "bg-blue-50/50" : ""}>
                  <td className="py-3 font-medium text-navy">{name}</td>
                  <td>{percent(result.cv_f1_macro_mean)}</td>
                  <td>{percent(result.accuracy)}</td>
                  <td>{name === metrics.best_model ? <span className="chip bg-blue-50 text-brand">Default</span> : <span className="text-slate-400">—</span>}</td>
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
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="min-w-0 overflow-x-auto pb-2">
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
                    className="grid h-7 w-7 place-items-center rounded text-[10px]"
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
          <div className="min-w-0">
            <h3 className="text-sm font-semibold">Correct predictions by role</h3>
            <p className="mt-1 text-xs text-slate-500">Percentage of resumes correctly identified for each actual role.</p>
            <div className="mt-3 h-[510px]">
              <ResponsiveContainer>
                <BarChart data={roleAccuracy} layout="vertical" margin={{ left: 0, right: 12 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" domain={[0, 100]} tickFormatter={(value) => `${value}%`} fontSize={10} />
                  <YAxis type="category" dataKey="role" width={125} fontSize={9} interval={0} />
                  <Tooltip formatter={(value) => [`${value}%`, "Correct"]} />
                  <Bar dataKey="accuracy" fill="#2563EB" radius={[0, 4, 4, 0]} animationDuration={2200} animationEasing="ease-in-out" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </Section>
    </div>
  );
}
