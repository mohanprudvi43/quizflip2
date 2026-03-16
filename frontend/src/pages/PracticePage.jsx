import { useState } from "react";
import AppShell from "../components/AppShell.jsx";
import api from "../services/api.js";

const modes = [
  ["practice_hard", "Hard Questions Practice"],
  ["practice_medium", "Medium Questions Practice"],
  ["practice_easy", "Easy Questions Practice"],
  ["weak_topics", "Weak Topics Practice"]
];

const PracticePage = () => {
  const [mode, setMode] = useState("practice_hard");
  const [quiz, setQuiz] = useState(null);
  const domainId = localStorage.getItem("qf_domain");

  const load = async () => {
    const { data } = await api.post("/learner/quiz/generate", { domainId, source: mode });
    setQuiz(data);
  };

  return (
    <AppShell>
      <section className="panel">
        <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Adaptive Practice</p>
        <h2 className="section-title mt-2">Practice Sections</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {modes.map(([key, label]) => (
            <button
              key={key}
              type="button"
              className={`rounded-xl px-4 py-2 text-sm font-semibold ${mode === key ? "bg-blue-600 text-white" : "btn-secondary"}`}
              onClick={() => setMode(key)}
            >
              {label}
            </button>
          ))}
        </div>
        <button className="btn-primary mt-4 px-4 py-2" type="button" onClick={load}>
          Start Practice Quiz
        </button>

        {quiz ? (
          <div className="mt-4 rounded-2xl border border-white/60 bg-white/70 p-4 dark:border-slate-600 dark:bg-slate-900/45">
            <p className="text-sm text-slate-500">Practice quiz generated</p>
            <p className="font-semibold">Questions: {quiz.questions.length}</p>
          </div>
        ) : null}
      </section>
    </AppShell>
  );
};

export default PracticePage;
