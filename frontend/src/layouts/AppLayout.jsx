import { useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { LayoutDashboard, FileSearch, Target, ListOrdered, TrendingUp, PenLine, History, Cpu, LogOut, Menu, X, FileText, ArrowUpRight, Sparkles } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { CurrentResumeProvider } from "../hooks/useCurrentResume";

export const Logo = ({ dark = false }) => (
  <span className="flex items-center gap-2 font-semibold">
    <span className="relative grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-blue-400 via-brand to-indigo-600 text-white shadow-[0_6px_14px_-5px_rgba(37,99,235,.8)] ring-1 ring-white/25">
      <FileText className="h-4 w-4" />
      <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-400" />
    </span>
    <span className={dark ? "text-white" : "text-navy"}>ResumeAI</span>
  </span>
);

const NAV = [
  ["/app", "Dashboard", LayoutDashboard, true], ["/app/analyze", "Analyze Resume", FileSearch], ["/app/match", "Job Match", Target],
  ["/app/ranking", "Resume Ranking", ListOrdered], ["/app/skill-gap", "Skill Gap", TrendingUp], ["/app/improve", "Improve Resume", PenLine],
  ["/app/history", "History", History], ["/app/model", "ML Model", Cpu],
];

export default function AppLayout() {
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const side = (
    <nav className="relative flex h-full flex-col overflow-hidden bg-[linear-gradient(165deg,#172554_0%,#111f43_52%,#0b1733_100%)] p-4 text-slate-300">
      <div aria-hidden="true" className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-blue-500/10 blur-3xl" />
      <div className="relative mb-7 flex items-center justify-between px-2 pt-1">
        <Logo dark />
        <span className="grid h-8 w-8 place-items-center rounded-xl bg-white/[.07] text-blue-200"><Sparkles className="h-4 w-4" /></span>
      </div>
      <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[.18em] text-slate-500">Workspace</p>
      <div className="relative space-y-1">
        {NAV.map(([to, label, Icon, end]) => (
          <NavLink key={to} to={to} end={end} onClick={() => setOpen(false)}
            className={({ isActive }) => `group flex items-center gap-3 rounded-xl border px-3 py-2.5 text-sm transition duration-200 ${isActive ? "border-white/10 bg-gradient-to-r from-blue-500/25 to-indigo-400/10 font-semibold text-white shadow-[inset_3px_0_0_#60a5fa]" : "border-transparent hover:bg-white/[.06] hover:text-white"}`}>
            <Icon className={`h-4 w-4 transition-transform duration-200 group-hover:scale-110 ${loc.pathname === to || (to === "/app" && loc.pathname === "/app/") ? "text-blue-200" : "text-slate-400 group-hover:text-blue-200"}`} />{label}
          </NavLink>
        ))}
      </div>
      <div className="relative mt-auto">
        <Link to="/app/analyze" onClick={() => setOpen(false)} className="group mb-4 flex items-center justify-between rounded-2xl border border-blue-300/15 bg-gradient-to-br from-blue-500/20 to-indigo-400/10 p-3.5 transition hover:border-blue-200/30 hover:from-blue-500/25">
          <span><span className="block text-xs font-semibold text-white">Ready for a fresh start?</span><span className="mt-1 block text-[11px] text-blue-100/65">Analyze a resume</span></span>
          <ArrowUpRight className="h-4 w-4 text-blue-200 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
        </Link>
        <div className="flex items-center gap-3 border-t border-white/10 pt-4">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-blue-300 to-violet-300 text-sm font-bold text-navy ring-2 ring-white/10">
            {user?.name?.trim()?.[0]?.toUpperCase() || "U"}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-white">{user?.name || "Your account"}</p>
            <p className="truncate text-xs text-slate-400">{user?.email}</p>
          </div>
          <button onClick={() => { logout(); nav("/"); }} aria-label="Log out" title="Log out" className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-slate-400 transition hover:bg-white/10 hover:text-white">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </nav>
  );
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[260px_1fr]">
      <aside className="sticky top-0 z-30 hidden h-screen lg:block">{side}</aside>
      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200/70 bg-white/85 px-4 py-3 shadow-sm backdrop-blur-xl lg:hidden">
        <Logo />
        <div className="flex items-center gap-3"><span className="text-xs font-medium text-slate-500">Your workspace</span><button aria-label="Open menu" onClick={() => setOpen(true)} className="grid h-9 w-9 place-items-center rounded-xl border border-slate-200 bg-white text-navy transition hover:bg-blue-50"><Menu className="h-5 w-5" /></button></div>
      </div>
      <AnimatePresence>
        {open && (
          <motion.div className="fixed inset-0 z-50 lg:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
            <motion.div className="absolute inset-y-0 left-0 w-64" initial={{ x: -260 }} animate={{ x: 0 }} exit={{ x: -260 }}>{side}
              <button aria-label="Close menu" className="absolute right-3 top-4 text-white" onClick={() => setOpen(false)}><X className="h-5 w-5" /></button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <main className="app-main">
        <div className="relative z-10 mx-auto min-h-screen max-w-[1680px] p-4 sm:p-6 lg:p-8">
          <CurrentResumeProvider user={user}>
            <AnimatePresence mode="wait">
              <motion.div key={loc.pathname} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}><Outlet /></motion.div>
            </AnimatePresence>
          </CurrentResumeProvider>
        </div>
      </main>
    </div>
  );
}
