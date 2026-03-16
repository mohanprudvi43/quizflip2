import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Clock3, Sparkles, Target, Trophy } from "lucide-react";
import AppShell from "../components/AppShell.jsx";
import api from "../services/api.js";

const ProgressDashboardPage = () => {
  const navigate = useNavigate();
  const domainId = localStorage.getItem("qf_domain");
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const metricCards = useMemo(() => {
    if (!data) return [];

    return [
      {
        label: "Flashcards Completed",
        value: `${data.progressPercent}%`,
        subtitle: "of selected domain",
        icon: Target,
        tone: "from-blue-500/20 to-cyan-500/20"
      },
      {
        label: "Quizzes Taken",
        value: data.quizzesTaken,
        subtitle: "total attempts",
        icon: Trophy,
        tone: "from-amber-500/20 to-orange-500/20"
      },
      {
        label: "Quiz Accuracy",
        value: `${data.quizAccuracy}%`,
        subtitle: "overall accuracy",
        icon: Sparkles,
        tone: "from-emerald-500/20 to-teal-500/20"
      },
      {
        label: "Time Spent",
        value: `${Math.ceil(data.timeSpentSeconds / 60)}m`,
        subtitle: "focused learning",
        icon: Clock3,
        tone: "from-fuchsia-500/20 to-rose-500/20"
      }
    ];
  }, [data]);

  useEffect(() => {
    const run = async () => {
      setIsLoading(true);
      setError("");

      try {
        const res = await api.get(`/learner/progress/${domainId}`);
        setData(res.data);
      } catch (fetchError) {
        setError(fetchError.response?.data?.message || "Could not load progress right now.");
      } finally {
        setIsLoading(false);
      }
    };

    if (!domainId) {
      setIsLoading(false);
      return;
    }

    run();
  }, [domainId]);

  if (!domainId) {
    return (
      <AppShell>
        <section className="panel">
          <p className="text-sm text-slate-500">No domain selected</p>
          <h2 className="mt-2 font-display text-3xl">Choose a Domain First</h2>
          <p className="mt-2 max-w-xl text-sm text-slate-500">
            Pick a learning domain to unlock personalized analytics, weak-topic insights, and streak progress.
          </p>
          <button
            type="button"
            onClick={() => navigate("/domains")}
            className="btn-primary mt-5 gap-2"
          >
            Select Domain
            <ArrowRight size={16} />
          </button>
        </section>
      </AppShell>
    );
  }

  if (isLoading) {
    return (
      <AppShell>
        <div className="space-y-4">
          <div className="skeleton h-44 rounded-3xl" />
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {[1, 2, 3, 4].map((item) => (
              <div key={item} className="skeleton h-28 rounded-2xl" />
            ))}
          </div>
          <div className="skeleton h-36 rounded-3xl" />
        </div>
      </AppShell>
    );
  }

  if (error) {
    return (
      <AppShell>
        <section className="panel">
          <p className="text-sm text-red-500">Error loading analytics</p>
          <h2 className="mt-2 font-display text-2xl">{error}</h2>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="btn-secondary mt-5"
          >
            Retry
          </button>
        </section>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <section className="panel relative overflow-hidden">
        <div className="pointer-events-none absolute -right-24 -top-20 h-60 w-60 rounded-full bg-gradient-to-br from-blue-400/30 to-cyan-300/20 blur-2xl" />
        <div className="pointer-events-none absolute -left-20 bottom-0 h-40 w-40 rounded-full bg-gradient-to-tr from-emerald-400/25 to-teal-300/10 blur-2xl" />

        <div className="relative z-10 grid gap-6 md:grid-cols-[1.4fr_auto] md:items-center">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Progress Snapshot</p>
            <h2 className="mt-2 font-display text-3xl md:text-4xl">You are building strong momentum</h2>
            <p className="mt-2 max-w-2xl text-sm text-slate-500">
              Continue your streak and focus on weak topics to raise your accuracy faster.
            </p>

            <div className="mt-5">
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="text-slate-500">Domain completion</span>
                <span className="font-semibold">{data.progressPercent}%</span>
              </div>
              <div className="h-3 rounded-full bg-slate-200/70 dark:bg-slate-700/50">
                <div
                  className="h-3 rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all duration-700"
                  style={{ width: `${Math.max(6, data.progressPercent)}%` }}
                />
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => navigate("/learn")}
                className="btn-primary"
              >
                Continue Learning
              </button>
              <button
                type="button"
                onClick={() => navigate("/practice")}
                className="btn-secondary"
              >
                Practice Weak Topics
              </button>
            </div>
          </div>

          <div className="mx-auto grid h-40 w-40 place-items-center rounded-full bg-slate-50/70 p-2 dark:bg-slate-900/50">
            <div
              className="grid h-full w-full place-items-center rounded-full"
              style={{
                background: `conic-gradient(#2f7df3 ${data.progressPercent * 3.6}deg, rgba(148, 163, 184, 0.25) 0deg)`
              }}
            >
              <div className="grid h-28 w-28 place-items-center rounded-full bg-white text-center dark:bg-slate-900">
                <p className="text-xs uppercase tracking-widest text-slate-500">Done</p>
                <p className="font-display text-3xl">{data.progressPercent}%</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metricCards.map((card, index) => {
          const Icon = card.icon;

          return (
            <article key={card.label} className="panel animate-floatUp" style={{ animationDelay: `${index * 70}ms` }}>
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-500">{card.label}</p>
                <span className={`rounded-xl bg-gradient-to-br p-2 ${card.tone}`}>
                  <Icon size={16} className="text-slate-700 dark:text-slate-200" />
                </span>
              </div>
              <h3 className="mt-3 font-display text-4xl">{card.value}</h3>
              <p className="mt-1 text-xs uppercase tracking-wider text-slate-500">{card.subtitle}</p>
            </article>
          );
        })}
      </section>

      <section className="panel mt-4">
        <div className="flex items-center justify-between gap-4">
          <h4 className="font-display text-2xl">Weak Topics Radar</h4>
          <button
            type="button"
            onClick={() => navigate("/streak")}
            className="btn-secondary text-xs uppercase tracking-wider"
          >
            View Streak
          </button>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {(data.weakTopics.length ? data.weakTopics : ["No weak topics yet"]).map((topic) => (
            <span
              key={topic}
              className="rounded-full border border-red-200/60 bg-red-50/80 px-3 py-1 text-sm font-medium text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-200"
            >
              {topic}
            </span>
          ))}
        </div>
      </section>
    </AppShell>
  );
};

export default ProgressDashboardPage;
