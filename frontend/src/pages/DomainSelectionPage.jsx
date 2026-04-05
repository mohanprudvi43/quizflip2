import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppShell from "../components/AppShell.jsx";
import api from "../services/api.js";

const DomainSelectionPage = () => {
  const [domains, setDomains] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const run = async () => {
      const { data } = await api.get("/domains");
      setDomains(data);
      setLoading(false);
    };
    run();
  }, []);

  const selectDomain = async (domainId) => {
    await api.post("/learner/start-domain", { domainId });
    localStorage.setItem("qf_domain", domainId);
    navigate("/learn");
  };

  const openConceptCards = (domainId) => {
    localStorage.setItem("qf_domain", domainId);
    navigate(`/domains/${domainId}/create-cards`);
  };

  return (
    <AppShell>
      <section className="panel">
        <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Learning Paths</p>
        <h2 className="section-title mt-2">Choose Your Domain</h2>
        <p className="mt-2 text-sm text-slate-500">Pick one to start personalized flashcards and adaptive quizzes.</p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => <div key={i} className="skeleton h-44 rounded-2xl" />)
          : domains.map((d) => (
              <article
                key={d._id}
                className="panel group relative overflow-hidden text-left transition hover:-translate-y-1"
              >
                <div className="pointer-events-none absolute right-0 top-0 h-20 w-20 rounded-full bg-gradient-to-br from-blue-400/25 to-cyan-300/10 blur-xl" />
                <p className="text-xs uppercase tracking-widest text-slate-500">{d.category}</p>
                <h3 className="mt-2 font-display text-2xl">{d.name}</h3>
                <p className="mt-3 text-sm text-slate-500">Click to start adaptive learning track.</p>
                <div className="mt-4 h-1 rounded bg-blue-100 dark:bg-slate-700">
                  <div className="h-1 w-0 rounded bg-blue-600 transition-all group-hover:w-full" />
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <button type="button" className="btn-primary" onClick={() => selectDomain(d._id)}>
                    Start Learning
                  </button>
                  <button type="button" className="btn-secondary" onClick={() => openConceptCards(d._id)}>
                    Create Concept Cards
                  </button>
                </div>
              </article>
            ))}
      </section>
    </AppShell>
  );
};

export default DomainSelectionPage;
