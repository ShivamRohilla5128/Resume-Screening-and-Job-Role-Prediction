import { useState } from "react";

/* Compact connected skill graph for one role: centre = role, nodes = required/optional skills.
   green = detected in the resume, amber = required but missing, blue = optional not detected. */
export default function SkillNodes({ role, required = [], optional = [], detected = [] }) {
  const [hover, setHover] = useState(null);
  const have = new Set(detected);
  const nodes = [...required.map((s) => ({ s, k: have.has(s) ? "have" : "missing" })), ...optional.map((s) => ({ s, k: have.has(s) ? "have" : "opt" }))];
  const W = 360, H = 270, cx = W / 2, cy = H / 2, n = nodes.length || 1;
  const col = { have: ["#DCFCE7", "#16A34A"], missing: ["#FEF3C7", "#F59E0B"], opt: ["#EFF6FF", "#93C5FD"] };
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full max-w-md" role="img" aria-label={`Skill map for ${role}`}>
      {nodes.map((nd, i) => {
        const a = (i / n) * Math.PI * 2 - Math.PI / 2, rx = i % 2 ? 128 : 100, ry = i % 2 ? 98 : 78;
        nd.x = cx + Math.cos(a) * rx; nd.y = cy + Math.sin(a) * ry; return null;
      })}
      {nodes.map((nd) => <line key={nd.s} x1={cx} y1={cy} x2={nd.x} y2={nd.y} stroke={hover === nd.s ? "#2563EB" : "#CBD5E1"} strokeWidth={hover === nd.s ? 2 : 1} style={{ transition: "stroke .2s" }} />)}
      <circle cx={cx} cy={cy} r="30" fill="#14213D" />
      <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central" fill="#fff" style={{ fontSize: 9, fontWeight: 600 }}>
        {role.split(" ").slice(0, 2).map((w, i) => <tspan key={i} x={cx} dy={i ? 11 : -5}>{w}</tspan>)}
      </text>
      {nodes.map((nd) => (
        <g key={nd.s} onMouseEnter={() => setHover(nd.s)} onMouseLeave={() => setHover(null)} style={{ cursor: "default" }}>
          <ellipse cx={nd.x} cy={nd.y + 2} rx="25" ry="11" fill="rgba(20,33,61,.08)" />
          <rect x={nd.x - 27} y={nd.y - 11} width="54" height="22" rx="11" fill={col[nd.k][0]} stroke={col[nd.k][1]} strokeWidth={hover === nd.s ? 2 : 1} />
          <text x={nd.x} y={nd.y} textAnchor="middle" dominantBaseline="central" fill="#1E293B" style={{ fontSize: 8, fontWeight: 500 }}>{nd.s.length > 11 ? nd.s.slice(0, 10) + "…" : nd.s}</text>
        </g>
      ))}
    </svg>
  );
}
