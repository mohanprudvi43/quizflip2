import { useEffect, useState } from "react";
import AppShell from "../components/AppShell.jsx";
import api from "../services/api.js";

const LeaderboardPage = () => {
  const [period, setPeriod] = useState("daily");
  const [rows, setRows] = useState([]);

  useEffect(() => {
    const run = async () => {
      const { data } = await api.get(`/analytics/leaderboard?period=${period}`);
      setRows(data.rows);
    };
    run();
  }, [period]);

  return (
    <AppShell>
      <section className="panel">
        <div className="flex items-center justify-between">
          <h2 className="section-title">Leaderboard</h2>
          <select
            className="input-field max-w-40 px-3 py-2"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="domain">Domain-wise</option>
          </select>
        </div>

        <div className="mt-5 space-y-3">
          {rows.map((row) => (
            <div
              key={String(row.learnerId)}
              className="flex items-center justify-between rounded-2xl border border-white/60 bg-white/70 p-4 dark:border-slate-600 dark:bg-slate-900/45"
            >
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-blue-600 to-cyan-500 font-semibold text-white">
                  {row.rank}
                </span>
                <div>
                  <p className="font-semibold">{row.name}</p>
                  {row.domain ? <p className="text-xs text-slate-500">{row.domain}</p> : null}
                </div>
              </div>
              <p className="font-display text-xl">{row.points} pts</p>
            </div>
          ))}
        </div>
      </section>
    </AppShell>
  );
};

export default LeaderboardPage;
