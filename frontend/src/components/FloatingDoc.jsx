/* Small floating 3D resume illustration (pure CSS 3D). `scanning` shows a scan line while the backend is working. */
export default function FloatingDoc({ scanning = false, pop = false, size = 150, className = "" }) {
  return (
    <div className={`doc3d ${className}`} style={{ width: size, height: size * 1.3 }} aria-hidden="true">
      <div className={`doc3d-inner h-full w-full ${pop ? "pop" : ""}`}>
        <div className="doc3d-page h-full w-full p-3.5">
          <div className="mb-3 flex items-center gap-2"><div className="h-7 w-7 rounded-full bg-brand/15 ring-1 ring-brand/30" /><div className="flex-1 space-y-1.5"><div className="h-2 w-3/4 rounded bg-navy/80" /><div className="h-1.5 w-1/2 rounded bg-slate-300" /></div></div>
          {[90, 100, 70, 95, 60].map((w, i) => <div key={i} className="mb-2 h-1.5 rounded bg-slate-200" style={{ width: `${w}%` }} />)}
          <div className="mt-3 flex flex-wrap gap-1.5">{["w-8", "w-10", "w-7"].map((w, i) => <div key={i} className={`h-3 rounded-full bg-brand/20 ${w}`} />)}</div>
          {[85, 65].map((w, i) => <div key={i} className="mt-3 h-1.5 rounded bg-slate-200" style={{ width: `${w}%` }} />)}
          {scanning && <div className="scanline" />}
        </div>
      </div>
    </div>
  );
}
