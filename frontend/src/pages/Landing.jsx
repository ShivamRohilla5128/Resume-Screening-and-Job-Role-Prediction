import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { FileSearch, Brain, Target, ListOrdered, TrendingUp, PenLine, Cpu, ArrowRight, ShieldCheck, Sparkles, Check, FileCheck2 } from "lucide-react";
import FloatingDoc from "../components/FloatingDoc";
import { Logo } from "../layouts/AppLayout";

const features = [
  [FileSearch, "Resume parsing", "Extracts contact details, education, skills, experience, projects and certifications from PDF/DOCX."],
  [Brain, "Job role prediction", "A trained TF-IDF classifier suggests the closest job roles with explainable text features."],
  [Target, "Job description match", "Transparent score from TF-IDF cosine similarity plus skill, experience and education signals."],
  [ListOrdered, "Candidate ranking", "Upload many resumes, rank them against one job, filter, sort and export CSV."],
  [TrendingUp, "Skill gap roadmap", "A learning plan generated from the candidate's actual missing skills."],
  [PenLine, "Resume improvement", "Rule-based feedback per section without inventing achievements."],
];
const steps = [["Upload", "PDF or DOCX resumes"], ["Extract", "Text, skills & details"], ["Predict", "Role + match score"], ["Improve", "Gaps, roadmap, report"]];
const tones = ["bg-blue-50 text-blue-600", "bg-violet-50 text-violet-600", "bg-cyan-50 text-cyan-700", "bg-amber-50 text-amber-600", "bg-emerald-50 text-emerald-600", "bg-pink-50 text-pink-600"];

export default function Landing() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <div aria-hidden="true" className="pointer-events-none absolute -right-40 top-36 h-96 w-96 rounded-full bg-blue-200/30 blur-3xl" />
      <header className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-4 pt-4 sm:px-6 lg:px-8">
        <div className="flex w-full items-center justify-between rounded-2xl border border-white/80 bg-white/75 px-4 py-3 shadow-card backdrop-blur-xl sm:px-5">
          <Logo />
          <nav aria-label="Main navigation" className="flex items-center gap-1.5 text-sm sm:gap-3">
            <a href="#features" className="hidden rounded-lg px-3 py-2 text-slate-600 transition hover:bg-blue-50 hover:text-brand sm:block">Features</a>
            <a href="#how" className="hidden rounded-lg px-3 py-2 text-slate-600 transition hover:bg-blue-50 hover:text-brand sm:block">How it works</a>
            <Link to="/login" className="btn btn-ghost !px-3 sm:!px-4">Log in</Link>
            <Link to="/signup" className="btn btn-primary !px-3 sm:!px-4">Sign up <ArrowRight className="h-4 w-4" /></Link>
          </nav>
        </div>
      </header>

      <section className="relative mx-auto grid max-w-7xl items-center gap-12 px-5 pb-16 pt-14 sm:px-8 md:grid-cols-[1.08fr_.92fr] md:pb-24 md:pt-20 lg:px-10">
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>
          <span className="chip border border-blue-100 bg-white/80 text-brand shadow-sm"><Sparkles className="h-3.5 w-3.5" /> Resume workflow, upgraded</span>
          <h1 className="mt-5 max-w-2xl text-4xl font-bold leading-[1.08] sm:text-5xl lg:text-6xl">
            Find the signal in every <span className="bg-gradient-to-r from-brand via-indigo-500 to-violet-500 bg-clip-text text-transparent">resume.</span>
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-slate-600 sm:text-lg">
            Explore job-role predictions, compare skills with a role, and turn resume feedback into clear next steps - all in one friendly workspace.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link to="/signup" className="btn btn-primary !px-6 !py-3">Get started <ArrowRight className="h-4 w-4" /></Link>
            <a href="#how" className="btn btn-ghost !px-6 !py-3">Take a quick tour</a>
          </div>
          <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-xs font-medium text-slate-500">
            {["PDF + DOCX", "Explainable results", "Human review"].map((item) => <span key={item} className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-emerald-600" />{item}</span>)}
          </div>
          <p className="mt-5 flex max-w-xl items-start gap-2 rounded-xl border border-blue-100/80 bg-white/65 px-3.5 py-3 text-xs leading-relaxed text-slate-500">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
            Built to support human review. Screening uses job-related information, not protected traits such as age, gender, religion, caste or photos.
          </p>
        </motion.div>
        <motion.div initial={{ opacity: 0, scale: .96 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: .12, duration: .55 }} className="relative mx-auto flex min-h-[350px] w-full max-w-lg items-center justify-center">
          <div aria-hidden="true" className="absolute inset-5 rounded-[2.5rem] bg-gradient-to-br from-blue-100 via-indigo-50 to-violet-100 shadow-inner" />
          <div aria-hidden="true" className="absolute inset-0 rounded-[2.5rem] border border-white/80" />
          <div className="relative z-10"><FloatingDoc size={190} scanning /><span className="ai-glow absolute -right-6 top-4 grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-brand to-violet-500 text-white shadow-lift"><Brain className="h-5 w-5" /></span></div>
          <div className="absolute left-2 top-10 z-20 hidden rounded-2xl border border-white/80 bg-white/90 p-3 shadow-lift sm:block">
            <span className="flex items-center gap-2 text-xs font-semibold text-navy"><FileCheck2 className="h-4 w-4 text-emerald-600" /> Resume parsed</span>
            <span className="mt-1 block text-[10px] text-slate-500">Skills and experience found</span>
          </div>
          <div className="absolute bottom-7 right-1 z-20 rounded-2xl border border-white/80 bg-white/90 p-3 shadow-lift sm:right-0">
            <span className="flex items-center gap-2 text-xs font-semibold text-navy"><Target className="h-4 w-4 text-brand" /> Role fit, made clear</span>
            <span className="mt-1 block text-[10px] text-slate-500">Explore matches and skill gaps</span>
          </div>
          <span aria-hidden="true" className="absolute bottom-10 left-8 h-3 w-3 rounded-full bg-violet-300 shadow-[0_0_0_8px_rgba(196,181,253,.15)]" />
        </motion.div>
      </section>

      <section id="features" className="relative mx-auto max-w-7xl scroll-mt-8 px-5 py-14 sm:px-8 lg:px-10">
        <div className="mb-7 max-w-2xl">
          <span className="text-xs font-bold uppercase tracking-[.16em] text-brand">One clear workflow</span>
          <h2 className="mt-2 text-2xl font-bold sm:text-3xl">Everything a screening workflow needs</h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-500">Move from the first upload to practical, role-aware insights without losing context.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map(([I, t, d], i) => <motion.div key={t} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: .2 }} transition={{ delay: (i % 3) * .06 }} className="card card-hover group p-5 sm:p-6">
            <span className={`mb-4 grid h-11 w-11 place-items-center rounded-2xl ${tones[i]} transition-transform duration-300 group-hover:rotate-[-5deg] group-hover:scale-110`}><I className="h-5 w-5" /></span>
            <h3 className="font-bold">{t}</h3><p className="mt-1.5 text-sm leading-relaxed text-slate-600">{d}</p>
          </motion.div>)}
        </div>
      </section>

      <section id="how" className="mx-auto max-w-7xl scroll-mt-8 px-5 py-14 sm:px-8 lg:px-10">
        <div className="mb-7 flex flex-wrap items-end justify-between gap-3">
          <div><span className="text-xs font-bold uppercase tracking-[.16em] text-violet-600">Easy as 1, 2, 3, 4</span><h2 className="mt-2 text-2xl font-bold sm:text-3xl">From resume to next step</h2></div>
          <p className="max-w-sm text-sm text-slate-500">Keep the process simple, transparent and easy to explore.</p>
        </div>
        <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map(([t, d], i) => <li key={t} className="card card-hover relative overflow-hidden p-5">
            <span aria-hidden="true" className="absolute -right-3 -top-5 text-7xl font-black text-blue-50">{`0${i + 1}`}</span>
            <span className="relative grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-brand to-violet-500 text-sm font-bold text-white shadow-md">{i + 1}</span>
            <p className="relative mt-4 font-bold">{t}</p><p className="relative mt-1 text-sm text-slate-600">{d}</p>
          </li>)}
        </ol>
      </section>

      <section className="mx-auto max-w-7xl px-5 pb-16 pt-4 sm:px-8 lg:px-10">
        <div className="relative flex flex-wrap items-center justify-between gap-5 overflow-hidden rounded-[2rem] bg-gradient-to-r from-navy via-[#253d75] to-brand p-6 text-white shadow-lift sm:p-9">
          <div aria-hidden="true" className="pointer-events-none absolute -right-8 -top-24 h-64 w-64 rounded-full border-[28px] border-white/[.08]" />
          <div className="relative"><span className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-100"><Sparkles className="h-3.5 w-3.5" /> Start exploring</span><h2 className="mt-2 text-2xl font-bold text-white sm:text-3xl">Make your next resume review clearer.</h2><p className="mt-2 max-w-xl text-sm text-blue-100/80">Create an account to explore the analysis and matching tools.</p></div>
          <Link to="/signup" className="btn relative bg-white !px-5 text-navy shadow-md hover:-translate-y-0.5 hover:bg-blue-50">Create your account <ArrowRight className="h-4 w-4" /></Link>
        </div>
      </section>

      <footer className="border-t border-slate-200/70 bg-white/65 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-5 py-6 text-sm text-slate-500 sm:px-8 lg:px-10">
          <Logo /><span>AI Resume Screening &amp; Job Role Prediction · ML Laboratory Project</span>
        </div>
      </footer>
    </div>
  );
}
