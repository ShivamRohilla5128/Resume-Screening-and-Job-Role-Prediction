import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { FileSearch, Brain, Target, ListOrdered, TrendingUp, PenLine, Cpu, ArrowRight, ShieldCheck } from "lucide-react";
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
export default function Landing() {
  return (
    <div className="min-h-screen bg-surface">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
        <Logo />
        <nav className="flex items-center gap-2 text-sm">
          <a href="#features" className="hidden px-3 py-2 text-slate-600 hover:text-navy sm:block">Features</a>
          <a href="#how" className="hidden px-3 py-2 text-slate-600 hover:text-navy sm:block">How it works</a>
          <Link to="/login" className="btn btn-ghost">Log in</Link><Link to="/signup" className="btn btn-primary">Sign up</Link>
        </nav>
      </header>

      <section className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-14 md:grid-cols-[1.2fr_1fr] md:py-20">
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>
          <span className="chip bg-blue-50 text-brand ring-1 ring-blue-100"><Cpu className="h-3.5 w-3.5" /> Machine Learning Laboratory Project</span>
          <h1 className="mt-4 text-4xl font-bold leading-tight sm:text-5xl">Smarter Resume Screening with Machine Learning</h1>
          <p className="mt-4 max-w-xl text-lg text-slate-600">Upload resumes, predict the best-fit job role, measure how well a candidate matches a job description and see exactly which skills are missing - using trained NLP models, not hard-coded rules.</p>
          <div className="mt-7 flex flex-wrap gap-3"><Link to="/signup" className="btn btn-primary !px-6 !py-3">Get Started <ArrowRight className="h-4 w-4" /></Link><a href="#how" className="btn btn-ghost !px-6 !py-3">See how it works</a></div>
          <p className="mt-5 flex items-center gap-2 text-xs text-slate-500"><ShieldCheck className="h-4 w-4 text-success" /> Supports human review. Never uses age, gender, religion, caste, photos or other protected traits.</p>
        </motion.div>
        <div className="flex justify-center"><div className="relative"><FloatingDoc size={190} scanning /><span className="ai-glow absolute -right-6 top-6 grid h-11 w-11 place-items-center rounded-full bg-brand text-white"><Brain className="h-5 w-5" /></span></div></div>
      </section>

      <section id="features" className="mx-auto max-w-6xl px-5 py-12">
        <h2 className="text-2xl font-semibold">Everything a screening workflow needs</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map(([I, t, d]) => <div key={t} className="card card-hover p-5"><I className="mb-3 h-5 w-5 text-brand" /><h3 className="font-semibold">{t}</h3><p className="mt-1 text-sm text-slate-600">{d}</p></div>)}
        </div>
      </section>

      <section id="how" className="mx-auto max-w-6xl px-5 py-12">
        <h2 className="text-2xl font-semibold">How it works</h2>
        <ol className="mt-6 grid gap-4 sm:grid-cols-4">
          {steps.map(([t, d], i) => <li key={t} className="card p-5"><span className="grid h-7 w-7 place-items-center rounded-full bg-navy text-xs font-semibold text-white">{i + 1}</span><p className="mt-3 font-semibold">{t}</p><p className="text-sm text-slate-600">{d}</p></li>)}
        </ol>
      </section>

      <footer className="border-t bg-white"><div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-5 py-6 text-sm text-slate-500"><Logo /><span>AI Resume Screening &amp; Job Role Prediction · ML Laboratory Project</span></div></footer>
    </div>
  );
}
