import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AppShell from "../components/AppShell.jsx";
import api from "../services/api.js";

const difficultyList = ["Hard", "Medium", "Easy"];

const QuizPage = () => {
  const domainId = localStorage.getItem("qf_domain");
  const [quiz, setQuiz] = useState(null);
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [value, setValue] = useState("");
  const [confidence, setConfidence] = useState("Medium");
  const [timeLeft, setTimeLeft] = useState(30);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        setError("");
        const { data } = await api.post("/learner/quiz/generate", { domainId, source: "auto_10_percent" });
        setQuiz(data);
      } catch (err) {
        setError(err.response?.data?.message || "Unable to load quiz right now");
      }
    };
    load();
  }, [domainId]);

  useEffect(() => {
    if (!quiz) return;
    setTimeLeft(30);
    const timer = setInterval(() => setTimeLeft((t) => (t > 0 ? t - 1 : 0)), 1000);
    return () => clearInterval(timer);
  }, [idx, quiz]);

  const questions = Array.isArray(quiz?.questions) ? quiz.questions : [];
  const q = questions[idx] || null;
  const hasQuestions = questions.length > 0;

  if (!quiz) {
    return (
      <AppShell>
        <div className="skeleton h-80 rounded-3xl" />
      </AppShell>
    );
  }

  const next = async () => {
    if (!q) return;
    const isCorrect = value.trim().toLowerCase() === q.answer.trim().toLowerCase();
    const record = {
      flashcardId: q.flashcardId,
      questionType: q.type,
      prompt: q.prompt,
      userAnswer: value,
      correctAnswer: q.answer,
      isCorrect,
      confidence,
      topic: q.topic
    };

    const updated = [...answers, record];
    setAnswers(updated);
    setValue("");
    setConfidence("Medium");

    if (idx < questions.length - 1) {
      setIdx((i) => i + 1);
      return;
    }

    const { data } = await api.post("/learner/quiz/submit", {
      domainId,
      source: quiz.source,
      answers: updated,
      timeTakenSeconds: questions.length * 30 - timeLeft
    });
    setResult(data);
  };

  const pct = hasQuestions ? Math.round(((idx + 1) / questions.length) * 100) : 0;

  return (
    <AppShell>
      <section className="space-y-4">
        <div className="panel">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span>Quiz Progress {hasQuestions ? idx + 1 : 0}/{questions.length}</span>
            <span className="font-semibold">Timer: {timeLeft}s</span>
          </div>
          <div className="h-2 rounded bg-slate-200 dark:bg-slate-700">
            <div className="h-2 rounded bg-emerald-500" style={{ width: `${pct}%` }} />
          </div>
        </div>

        {error ? (
          <div className="panel">
            <h3 className="font-display text-2xl">Quiz Error</h3>
            <p className="mt-2 text-red-600">{error}</p>
          </div>
        ) : !result && !hasQuestions ? (
          <div className="panel">
            <h3 className="font-display text-2xl">No Quiz Available Yet</h3>
            <p className="mt-2 text-slate-600 dark:text-slate-300">
              Read more flashcards first. Quizzes are generated from cards you have already viewed.
            </p>
            <Link to="/learn" className="btn-primary mt-4 inline-flex px-5 py-3">
              Go To Flashcards
            </Link>
          </div>
        ) : !result ? (
          <div className="panel animate-floatUp">
            <p className="text-sm text-slate-500">{q.type === "mcq" ? "Multiple Choice" : "Fill in the blank"}</p>
            <h2 className="mt-2 font-display text-3xl">{q.prompt}</h2>

            {q.type === "mcq" ? (
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {(Array.isArray(q.options) ? q.options : []).map((opt) => (
                  <button
                    key={opt}
                    className={`btn-secondary w-full justify-start p-3 text-left ${value === opt ? "ring-2 ring-blue-500" : ""}`}
                    type="button"
                    onClick={() => setValue(opt)}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            ) : (
              <input
                className="input-field mt-5"
                placeholder="Type your answer"
                value={value}
                onChange={(e) => setValue(e.target.value)}
              />
            )}

            <div className="mt-5 flex flex-wrap gap-2">
              {difficultyList.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setConfidence(d)}
                  className={`rounded-xl px-4 py-2 text-sm ${
                    confidence === d ? "bg-blue-600 text-white" : "btn-secondary"
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>

            <button className="btn-primary mt-5 px-6 py-3" type="button" onClick={next}>
              {idx === questions.length - 1 ? "Submit Quiz" : "Next"}
            </button>
          </div>
        ) : (
          <div className="panel">
            <h3 className="font-display text-3xl">Quiz Completed</h3>
            <p className="mt-3">Score: {result.score}/{result.total}</p>
            <p>Accuracy: {result.accuracy}%</p>
            <p>Points Earned: +{result.pointsEarned}</p>
            <p>Weak Topics: {(result.weakTopics || []).join(", ") || "None"}</p>
          </div>
        )}
      </section>
    </AppShell>
  );
};

export default QuizPage;
