import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Brain, CheckCircle2, Eye, EyeOff, Mail, Lock, User } from "lucide-react";
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

export default function AuthPage({ mode }) {
  const [f, setF] = useState({ name: "", email: "", password: "", confirm: "", remember: true });
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

  return (
    <div className="relative grid min-h-screen overflow-hidden bg-surface lg:grid-cols-2">
      <Particles />
      <div className="relative z-10 flex flex-col justify-center px-5 py-10 sm:px-12">
        <Link to="/" className="mb-8 w-fit"><Logo /></Link>
        <TiltCard max={4} className="w-full max-w-md">
          <div className="card relative overflow-hidden p-7">
            <AnimatePresence mode="wait">
              {ok ? (
                <motion.div key="ok" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center gap-3 py-14">
                  <CheckCircle2 className="h-14 w-14 text-success" /><p className="font-semibold">Success - redirecting…</p>
                </motion.div>
              ) : (
                <motion.form key={mode} onSubmit={submit} noValidate initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.2 }} className="space-y-4">
                  <div className="flex items-center gap-3"><span className="ai-glow grid h-10 w-10 place-items-center rounded-full bg-brand text-white"><Brain className="h-5 w-5" /></span>
                    <div><h1 className="text-xl font-semibold">{titles[mode][0]}</h1><p className="text-sm text-slate-500">{titles[mode][1]}</p></div></div>
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
                  <p className="text-center text-sm text-slate-500">
                    {mode === "login" ? <>No account? <Link to="/signup" className="text-brand hover:underline">Sign up</Link></> : <>Back to <Link to="/login" className="text-brand hover:underline">log in</Link></>}
                  </p>
                </motion.form>
              )}
            </AnimatePresence>
          </div>
        </TiltCard>
      </div>
      <div className="relative hidden items-center justify-center lg:flex"><div className="absolute inset-y-0 left-0 w-px bg-slate-200" />
        <div className="text-center"><FloatingDoc size={210} /><p className="mx-auto mt-8 max-w-xs text-sm text-slate-500">Parse resumes, predict roles and surface skill gaps - with transparent, explainable results.</p></div>
      </div>
    </div>
  );
}
