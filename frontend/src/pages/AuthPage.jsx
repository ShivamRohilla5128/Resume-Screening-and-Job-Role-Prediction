import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Brain, CheckCircle2, Eye, EyeOff, Mail, Lock, User, ShieldCheck, Sparkles, Target, Lightbulb } from "lucide-react";
import FloatingDoc from "../components/FloatingDoc";
import Particles from "../components/Particles";
import TiltCard from "../components/TiltCard";
import { Spinner } from "../components/ui";
import { Logo } from "../layouts/AppLayout";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "../hooks/useToast";
import { auth } from "../services/api";
import { errMsg } from "../utils/format";

const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/;
const SHOWCASE = [
  {
    title: "Role insights",
    description: "Explore likely job roles and see how the model interprets resume details.",
    Icon: Brain,
  },
  {
    title: "Skill matching",
    description: "Compare a resume with a role and find the skills that match or need attention.",
    Icon: Target,
  },
  {
    title: "Practical feedback",
    description: "Turn resume gaps into useful next steps, without inventing experience.",
    Icon: Lightbulb,
  },
];

export default function AuthPage({ mode }) {
  const [f, setF] = useState({ name: "", email: "", password: "", confirm: "", remember: true });
  const [activeShowcase, setActiveShowcase] = useState(0);
  const [show, setShow] = useState(false);
  const [errs, setErrs] = useState({});
  const [busy, setBusy] = useState(false);
  const [ok, setOk] = useState(false);
  const { login, register } = useAuth();
  const toast = useToast();
  const nav = useNavigate();
  const loc = useLocation();
  const set = (k) => (e) => setF({ ...f, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value });

  const validate = () => {
    const e = {};
    if (mode === "signup" && !f.name.trim()) e.name = "Enter your name";
    if (!EMAIL.test(f.email)) e.email = "Enter a valid e-mail address";
    if (mode !== "forgot") {
      if (f.password.length < 8) e.password = "At least 8 characters";
      else if (mode === "signup" && (!/[A-Za-z]/.test(f.password) || !/\d/.test(f.password))) e.password = "Include a letter and a number";
      if (mode === "signup" && f.confirm !== f.password) e.confirm = "Passwords do not match";
    }
    setErrs(e); return !Object.keys(e).length;
  };

  const submit = async (ev) => {
    ev.preventDefault();
    if (!validate()) return;
    setBusy(true);
    try {
      if (mode === "forgot") { const r = await auth.forgot(f.email); toast.success(r.message); }
      else {
        if (mode === "login") await login(f.email, f.password, f.remember); else await register(f.name, f.email, f.password);
        setOk(true); toast.success(mode === "login" ? "Welcome back!" : "Account created");
        setTimeout(() => nav(loc.state?.from || "/app", { replace: true }), 800);
      }
    } catch (e) { toast.error(errMsg(e)); } finally { setBusy(false); }
  };

  const titles = { login: ["Welcome back", "Log in to continue screening resumes."], signup: ["Create your account", "Start analysing resumes in minutes."], forgot: ["Reset your password", "Enter your e-mail and we'll generate a reset link."] };
  const Err = ({ k }) => (errs[k] ? <p className="mt-1 text-xs text-red-600" role="alert">{errs[k]}</p> : null);
  const showcase = SHOWCASE[activeShowcase];
  const ShowcaseIcon = showcase.Icon;

  return (
    <div className="relative grid min-h-screen overflow-hidden bg-surface lg:grid-cols-[1fr_.9fr]">
      <div aria-hidden="true" className="pointer-events-none absolute -left-40 top-20 h-96 w-96 rounded-full bg-blue-200/30 blur-3xl" />
      <Particles />
      <div className="relative z-10 flex flex-col justify-center px-5 py-8 sm:px-12 lg:px-16">
        <Link to="/" className="mb-7 w-fit"><Logo /></Link>
        <TiltCard max={4} className="w-full max-w-md">
          <div className="card relative overflow-hidden rounded-[1.75rem] border-white/90 p-6 shadow-lift sm:p-8">
            <div aria-hidden="true" className="pointer-events-none absolute -right-12 -top-14 h-36 w-36 rounded-full bg-gradient-to-br from-blue-100/70 to-violet-100/50 blur-2xl" />
            <AnimatePresence mode="wait">
              {ok ? (
                <motion.div key="ok" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center gap-3 py-14 text-center">
                  <span className="grid h-16 w-16 place-items-center rounded-2xl bg-emerald-50 text-success ring-1 ring-emerald-100"><CheckCircle2 className="h-9 w-9" /></span>
                  <p className="font-semibold text-navy">You’re all set!</p><p className="text-sm text-slate-500">Taking you to your workspace…</p>
                </motion.div>
              ) : (
                <motion.form key={mode} onSubmit={submit} noValidate initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.2 }} className="space-y-4">
                  <div className="mb-5 flex items-start gap-3">
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-brand to-violet-500 text-white shadow-md"><Brain className="h-5 w-5" /></span>
                    <div><span className="mb-1 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-[.15em] text-brand"><Sparkles className="h-3 w-3" /> ResumeAI workspace</span><h1 className="text-xl font-bold sm:text-2xl">{titles[mode][0]}</h1><p className="mt-1 text-sm text-slate-500">{titles[mode][1]}</p></div>
                  </div>
                  {mode === "signup" && <div><label className="label" htmlFor="name">Full name</label><div className="relative"><User className="absolute left-3 top-3 h-4 w-4 text-slate-400" /><input id="name" className="input !pl-9" value={f.name} onChange={set("name")} autoComplete="name" /></div><Err k="name" /></div>}
                  <div><label className="label" htmlFor="email">E-mail</label><div className="relative"><Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" /><input id="email" type="email" className="input !pl-9" value={f.email} onChange={set("email")} autoComplete="email" /></div><Err k="email" /></div>
                  {mode !== "forgot" && (
                    <div><label className="label" htmlFor="password">Password</label>
                      <div className="relative"><Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                        <input id="password" type={show ? "text" : "password"} className="input !px-9" value={f.password} onChange={set("password")} autoComplete={mode === "login" ? "current-password" : "new-password"} />
                        <button type="button" aria-label={show ? "Hide password" : "Show password"} onClick={() => setShow(!show)} className="absolute right-3 top-2.5 text-slate-400 hover:text-navy">{show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></div><Err k="password" /></div>
                  )}
                  {mode === "signup" && <div><label className="label" htmlFor="confirm">Confirm password</label><input id="confirm" type={show ? "text" : "password"} className="input" value={f.confirm} onChange={set("confirm")} autoComplete="new-password" /><Err k="confirm" /></div>}
                  {mode === "login" && (
                    <div className="flex items-center justify-between text-sm"><label className="flex items-center gap-2"><input type="checkbox" checked={f.remember} onChange={set("remember")} className="h-4 w-4 rounded accent-brand" />Remember me</label><Link to="/forgot-password" className="text-brand hover:underline">Forgot password?</Link></div>
                  )}
                  <button className="btn btn-primary w-full" disabled={busy}>{busy && <Spinner className="h-4 w-4" />}{{ login: "Log in", signup: "Create account", forgot: "Send reset link" }[mode]}</button>
                  <p className="flex items-center justify-center gap-1.5 pt-1 text-[11px] text-slate-400"><ShieldCheck className="h-3.5 w-3.5 text-emerald-600" /> Your account keeps your workspace private.</p>
                  <p className="text-center text-sm text-slate-500">
                    {mode === "login" ? <>No account? <Link to="/signup" className="text-brand hover:underline">Sign up</Link></> : <>Back to <Link to="/login" className="text-brand hover:underline">log in</Link></>}
                  </p>
                </motion.form>
              )}
            </AnimatePresence>
          </div>
        </TiltCard>
      </div>
      <div className="relative hidden items-center justify-center overflow-hidden p-12 lg:flex">
        <div aria-hidden="true" className="absolute inset-5 rounded-[2.5rem] bg-gradient-to-br from-navy via-[#1e3a72] to-brand shadow-lift" />
        <div aria-hidden="true" className="absolute right-0 top-0 h-72 w-72 rounded-full bg-violet-400/20 blur-3xl" />
        <div aria-hidden="true" className="absolute bottom-8 left-4 h-64 w-64 rounded-full bg-blue-400/20 blur-3xl" />
        <div className="relative z-10 max-w-md text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-medium text-blue-100"><Sparkles className="h-3.5 w-3.5" /> Explore the workspace</span>
          <div className="mx-auto mt-6 w-full max-w-[330px] rounded-[2rem] border border-white/15 bg-white/[.06] p-5 shadow-[0_20px_60px_-35px_rgba(0,0,0,.7)]">
            <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[.06] px-3 py-2 text-left">
              <span className="flex min-w-0 items-center gap-2 text-xs font-semibold text-white">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-white/10 text-blue-100"><ShowcaseIcon className="h-4 w-4" /></span>
                <span className="truncate">{showcase.title}</span>
              </span>
              <span className="ml-2 rounded-full bg-emerald-300/15 px-2 py-1 text-[9px] font-semibold uppercase tracking-wide text-emerald-200">Preview</span>
            </div>
            <motion.div key={`visual-${activeShowcase}`} initial={{ opacity: 0, y: 8, scale: .97 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: .2 }} className="flex min-h-[230px] items-center justify-center">
              <FloatingDoc size={150} scanning={activeShowcase === 1} pop={activeShowcase === 2} />
            </motion.div>
            <motion.div key={`copy-${activeShowcase}`} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .18 }} aria-live="polite">
              <h2 className="text-base font-semibold text-white">{showcase.title}</h2>
              <p className="mx-auto mt-1.5 min-h-10 max-w-xs text-xs leading-relaxed text-blue-100/80">{showcase.description}</p>
            </motion.div>
            <div className="mt-4 flex flex-wrap justify-center gap-2" role="group" aria-label="Explore workspace features">
              {SHOWCASE.map(({ title }, index) => (
                <button key={title} type="button" aria-pressed={activeShowcase === index} onClick={() => setActiveShowcase(index)}
                  className={`rounded-full border px-3 py-1.5 text-[11px] font-medium transition duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-offset-2 focus-visible:ring-offset-navy ${activeShowcase === index ? "border-white/30 bg-white text-navy shadow-md" : "border-white/15 bg-white/[.08] text-white/90 hover:-translate-y-0.5 hover:border-white/30 hover:bg-white/[.15]"}`}>
                  {title}
                </button>
              ))}
            </div>
          </div>
          <p className="mt-4 flex items-center justify-center gap-1.5 text-[11px] text-blue-100/65"><Sparkles className="h-3 w-3" /> Choose a feature to preview it</p>
        </div>
      </div>
    </div>
  );
}
