import { motion } from "framer-motion";
import { scoreColor } from "../utils/format";

export default function ProgressRing({ value = 0, size = 120, stroke = 10, label, color, suffix = "%" }) {
  const r = (size - stroke) / 2, c = 2 * Math.PI * r, v = Math.max(0, Math.min(100, value));
  return (
    <div className="relative inline-flex flex-col items-center" style={{ width: size }}>
      <svg width={size} height={size} role="img" aria-label={`${label || "Score"} ${Math.round(v)}${suffix}`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#E2E8F0" strokeWidth={stroke} />
        <motion.circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color || scoreColor(v)} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={c} initial={{ strokeDashoffset: c }} animate={{ strokeDashoffset: c * (1 - v / 100) }} transition={{ duration: 2.4, ease: "easeInOut" }}
          transform={`rotate(-90 ${size / 2} ${size / 2})`} />
        <text x="50%" y="50%" dominantBaseline="central" textAnchor="middle" className="fill-navy font-semibold" style={{ fontSize: size * 0.24 }}>{Math.round(v)}{suffix}</text>
      </svg>
      {label && <span className="mt-1 text-center text-xs text-slate-500">{label}</span>}
    </div>
  );
}
