import { useEffect, useState } from "react";
import CalendarHeatmap from "react-calendar-heatmap";
import "react-calendar-heatmap/dist/styles.css";
import AppShell from "../components/AppShell.jsx";
import api from "../services/api.js";

const StreakCalendarPage = () => {
  const [data, setData] = useState(null);

  useEffect(() => {
    const run = async () => {
      const { data: res } = await api.get("/learner/streak");
      setData(res);
    };
    run();
  }, []);

  if (!data) {
    return (
      <AppShell>
        <div className="skeleton h-64 rounded-3xl" />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <section className="panel">
        <h2 className="section-title">Learning Streak</h2>
        <p className="mt-1 text-sm text-slate-500">Current streak: {data.streakCount} days | Longest: {data.longestStreak}</p>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-white/60 bg-white/70 p-4 dark:border-slate-600 dark:bg-slate-900/45">
            <p className="text-xs uppercase tracking-widest text-slate-500">Current Streak</p>
            <p className="mt-2 font-display text-4xl">{data.streakCount}</p>
          </div>
          <div className="rounded-2xl border border-white/60 bg-white/70 p-4 dark:border-slate-600 dark:bg-slate-900/45">
            <p className="text-xs uppercase tracking-widest text-slate-500">Longest Streak</p>
            <p className="mt-2 font-display text-4xl">{data.longestStreak}</p>
          </div>
        </div>

        <div className="mt-5 overflow-x-auto">
          <CalendarHeatmap
            startDate={new Date(new Date().setMonth(new Date().getMonth() - 6))}
            endDate={new Date()}
            values={data.heatmap.map((d) => ({ date: d.dateKey, count: d.questionsSolved }))}
            classForValue={(value) => {
              if (!value || !value.count) return "color-empty";
              if (value.count < 5) return "color-github-1";
              if (value.count < 10) return "color-github-2";
              if (value.count < 20) return "color-github-3";
              return "color-github-4";
            }}
          />
        </div>
      </section>
    </AppShell>
  );
};

export default StreakCalendarPage;
