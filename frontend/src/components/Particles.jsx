import { useMemo } from "react";

/* A handful of tiny CSS particles (hidden automatically for reduced motion). */
export default function Particles({ count = 12 }) {
  const items = useMemo(() => Array.from({ length: count }, (_, i) => ({
    left: `${(i * 83) % 100}%`, size: 3 + ((i * 7) % 4), dur: 14 + ((i * 5) % 10), delay: -((i * 3) % 14),
  })), [count]);
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {items.map((p, i) => <span key={i} className="particle" style={{ left: p.left, width: p.size, height: p.size, animationDuration: `${p.dur}s`, animationDelay: `${p.delay}s` }} />)}
    </div>
  );
}
