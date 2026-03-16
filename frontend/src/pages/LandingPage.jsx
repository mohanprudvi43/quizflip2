import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const LandingPage = () => {
  return (
    <div className="mx-auto max-w-6xl p-6 lg:p-8">
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="panel relative overflow-hidden p-8 md:p-12"
      >
        <div className="pointer-events-none absolute -right-24 -top-20 h-72 w-72 rounded-full bg-gradient-to-br from-blue-400/35 to-cyan-300/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-20 h-60 w-60 rounded-full bg-gradient-to-tr from-emerald-300/25 to-teal-300/10 blur-3xl" />

        <div className="relative z-10 grid gap-8 lg:grid-cols-[1.3fr_1fr]">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-blue-600 dark:text-blue-300">Adaptive Learning SaaS</p>
            <h1 className="mt-4 font-display text-4xl leading-tight md:text-6xl">
              Learn faster with flashcards, smart quizzes, and measurable mastery.
            </h1>
            <p className="mt-4 max-w-2xl text-slate-600 dark:text-slate-300">
              Quizflip2 personalizes each next step from your confidence and answers, then turns momentum into streaks and progress signals.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/auth" className="btn-primary px-5 py-3">
                Start Learning
              </Link>
              <Link to="/auth" className="btn-secondary px-5 py-3">
                Admin Login
              </Link>
            </div>
          </div>

          <div className="grid gap-3 self-end">
            {[
              ["Smart Quizzes", "Confidence-based question adaptation for every learner."],
              ["Streak Calendar", "Daily momentum visualized with heatmap insights."],
              ["Weak Topic Radar", "Spot what to review next with precision."]
            ].map(([title, desc]) => (
              <article key={title} className="rounded-2xl border border-white/60 bg-white/70 p-4 shadow-sm dark:border-slate-600 dark:bg-slate-900/45">
                <h3 className="font-display text-xl">{title}</h3>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{desc}</p>
              </article>
            ))}
          </div>
        </div>
      </motion.section>
    </div>
  );
};

export default LandingPage;
