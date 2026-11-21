import { useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { LayoutDashboard, FileSearch, Target, ListOrdered, TrendingUp, PenLine, History, Cpu, LogOut, Menu, X, FileText } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { CurrentResumeProvider } from "../hooks/useCurrentResume";

export const Logo = ({ dark = false }) => (
  <span className="flex items-center gap-2 font-semibold">
    <span className="grid h-8 w-8 place-items-center rounded-lg bg-navy text-white"><FileText className="h-4 w-4" /></span>
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
    <nav className="flex h-full flex-col bg-[linear-gradient(180deg,#172554_0%,#0f1f44_100%)] p-4 text-slate-300">
      <div className="mb-6 px-2 pt-1"><Logo dark /></div>
      <div className="space-y-1">
        {NAV.map(([to, label, Icon, end]) => (
          <NavLink key={to} to={to} end={end} onClick={() => setOpen(false)}
            className={({ isActive }) => `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${isActive ? "bg-white/10 text-white" : "hover:bg-white/5 hover:text-white"}`}>
            <Icon className="h-4 w-4" />{label}
          </NavLink>
        ))}
      </div>
      <div className="mt-auto border-t border-white/10 pt-4">
        <p className="truncate px-2 text-sm text-white">{user?.name}</p><p className="truncate px-2 text-xs text-slate-400">{user?.email}</p>
        <button onClick={() => { logout(); nav("/"); }} className="mt-3 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm hover:bg-white/5"><LogOut className="h-4 w-4" />Log out</button>
      </div>
    </nav>
  );
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[250px_1fr]">
      <aside className="sticky top-0 hidden h-screen lg:block">{side}</aside>
      <div className="flex items-center justify-between border-b bg-white px-4 py-3 lg:hidden">
        <Logo /><button aria-label="Open menu" onClick={() => setOpen(true)}><Menu className="h-6 w-6" /></button>
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
      <main className="min-w-0 p-4 sm:p-6 lg:p-8">
        <CurrentResumeProvider user={user}>
          <AnimatePresence mode="wait">
            <motion.div key={loc.pathname} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}><Outlet /></motion.div>
          </AnimatePresence>
        </CurrentResumeProvider>
      </main>
    </div>
  );
}
