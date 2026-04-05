import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AppShell from "../components/AppShell.jsx";
import ConceptCardVisualEditor from "../components/ConceptCardVisualEditor.jsx";
import api from "../services/api.js";

const LearnerConceptCardsPage = () => {
  const navigate = useNavigate();
  const { domainId: routeDomainId } = useParams();

  const [domains, setDomains] = useState([]);
  const [selectedDomain, setSelectedDomain] = useState(routeDomainId || localStorage.getItem("qf_domain") || "");
  const [loading, setLoading] = useState(true);
  const [savingVisual, setSavingVisual] = useState(false);
  const [visualOverwrite, setVisualOverwrite] = useState(false);
  const [cards, setCards] = useState([]);
  const [editorCard, setEditorCard] = useState(null);
  const [quizCards, setQuizCards] = useState([]);
  const [quizLoading, setQuizLoading] = useState(false);
  const [quizSavingCardId, setQuizSavingCardId] = useState("");
  const [quizFilter, setQuizFilter] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (routeDomainId) {
      setSelectedDomain(routeDomainId);
    }
  }, [routeDomainId]);

  useEffect(() => {
    const loadDomains = async () => {
      try {
        const { data } = await api.get("/domains");
        const safeDomains = Array.isArray(data) ? data : [];
        setDomains(safeDomains);

        const hasRouteDomain = safeDomains.some((domain) => String(domain._id) === String(routeDomainId));
        if (!hasRouteDomain && safeDomains.length && !selectedDomain) {
          setSelectedDomain(String(safeDomains[0]._id));
        }
      } catch (err) {
        setError(err.response?.data?.message || "Could not load domains.");
      } finally {
        setLoading(false);
      }
    };

    loadDomains();
  }, [routeDomainId]);

  const loadMyCards = async (domainId) => {
    const { data } = await api.get(`/learner/domains/${domainId}/conceptcards`);
    setCards(Array.isArray(data.cards) ? data.cards : []);
  };

  const loadQuizCards = async (domainId) => {
    setQuizLoading(true);
    try {
      const { data } = await api.get(`/learner/domains/${domainId}/conceptcards/quiz`);
      setQuizCards(Array.isArray(data.cards) ? data.cards : []);
    } finally {
      setQuizLoading(false);
    }
  };

  const refreshDomainData = async (domainId) => {
    if (!domainId) return;
    await Promise.all([loadMyCards(domainId), loadQuizCards(domainId)]);
  };

  useEffect(() => {
    if (!selectedDomain) return;
    localStorage.setItem("qf_domain", selectedDomain);
    refreshDomainData(selectedDomain).catch((err) => {
      setError(err.response?.data?.message || "Could not load your concept cards.");
    });
  }, [selectedDomain]);

  const selectedDomainName = useMemo(
    () => domains.find((domain) => String(domain._id) === String(selectedDomain))?.name || "",
    [domains, selectedDomain]
  );

  const saveVisualCard = async (cardPayload) => {
    if (!selectedDomain) {
      setError("Choose a domain before saving cards.");
      return;
    }

    setSavingVisual(true);
    setError("");
    setMessage("");

    try {
      const { data } = await api.post(`/learner/domains/${selectedDomain}/conceptcards/save-generated`, {
        overwrite: Boolean(cardPayload?.overwrite ?? visualOverwrite),
        cards: [cardPayload]
      });

      setMessage(`${data.message}. Inserted: ${data.inserted || 0}, Updated: ${data.updated || 0}.`);
      await refreshDomainData(selectedDomain);
      setEditorCard(null);
    } catch (err) {
      setError(err.response?.data?.message || "Could not save concept card.");
    } finally {
      setSavingVisual(false);
    }
  };

  const removeCard = async (cardId) => {
    const ok = window.confirm("Delete this concept card?");
    if (!ok) return;

    setError("");
    setMessage("");

    try {
      await api.delete(`/learner/conceptcards/${cardId}`);
      setMessage("Concept card deleted.");
      await refreshDomainData(selectedDomain);
      if (String(editorCard?._id) === String(cardId)) {
        setEditorCard(null);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Could not delete concept card.");
    }
  };

  const updateQuizCard = (cardId, updater) => {
    setQuizCards((prev) =>
      prev.map((card) => {
        if (String(card._id) !== String(cardId)) return card;
        const authoredQuiz = updater(card.authoredQuiz || {});
        return { ...card, authoredQuiz };
      })
    );
  };

  const saveQuizCard = async (cardId) => {
    const card = quizCards.find((item) => String(item._id) === String(cardId));
    if (!card) return;

    setQuizSavingCardId(String(cardId));
    setError("");

    try {
      await api.put(`/learner/conceptcards/${cardId}/quiz`, {
        authoredQuiz: card.authoredQuiz
      });
      setMessage("Quiz configuration saved.");
    } catch (err) {
      setError(err.response?.data?.message || "Could not save quiz configuration.");
    } finally {
      setQuizSavingCardId("");
    }
  };

  if (loading) {
    return (
      <AppShell>
        <div className="skeleton h-72 rounded-3xl" />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <section className="panel">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Learner Studio</p>
            <h2 className="section-title mt-2">Create Private Concept Cards</h2>
            <p className="mt-2 text-sm text-slate-500">
              Build your own deck in each domain with the same visual editor and quiz authoring workflow.
            </p>
          </div>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => {
              if (selectedDomain) {
                localStorage.setItem("qf_domain", selectedDomain);
              }
              navigate("/learn");
            }}
          >
            Back To Learning
          </button>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <label className="text-sm font-semibold">
            Domain
            <select
              className="input-field mt-1"
              value={selectedDomain}
              onChange={(event) => {
                setSelectedDomain(event.target.value);
                setEditorCard(null);
              }}
            >
              <option value="">Select domain</option>
              {domains.map((domain) => (
                <option key={String(domain._id)} value={String(domain._id)}>
                  {domain.name}
                </option>
              ))}
            </select>
          </label>
          <div className="rounded-2xl border border-white/60 bg-white/70 p-3 text-sm dark:border-slate-700 dark:bg-slate-900/40">
            <p className="text-xs uppercase tracking-[0.12em] text-slate-500">Domain</p>
            <p className="mt-1 font-semibold">{selectedDomainName || "Select a domain"}</p>
            <p className="mt-1 text-slate-500">My private cards: {cards.length}</p>
          </div>
        </div>

        {message ? <p className="mt-3 text-sm text-emerald-700 dark:text-emerald-300">{message}</p> : null}
        {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
      </section>

      <ConceptCardVisualEditor
        key={editorCard?._id || "new-card"}
        saving={savingVisual}
        onSave={saveVisualCard}
        initialCard={editorCard}
        domains={domains}
        selectedDomain={selectedDomain}
        onDomainChange={(value) => {
          setSelectedDomain(value);
          setEditorCard(null);
        }}
        overwriteExisting={visualOverwrite}
        onOverwriteChange={setVisualOverwrite}
      />

      <section className="panel mt-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h4 className="section-title">My Concept Cards</h4>
            <p className="mt-1 text-sm text-slate-500">Edit and delete your private cards for this domain.</p>
          </div>
        </div>

        {!cards.length ? (
          <p className="text-sm text-slate-500">No cards yet. Use the visual editor above to create your first card.</p>
        ) : (
          <div className="space-y-3">
            {cards.map((card) => (
              <article
                key={String(card._id)}
                className="rounded-2xl border border-white/60 bg-white/70 p-4 dark:border-slate-600 dark:bg-slate-900/45"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.14em] text-slate-500">{card.chapterName || "Chapter"}</p>
                    <h5 className="font-display text-xl">{card.concept_title || card.topic || "Concept"}</h5>
                    <p className="mt-1 text-sm text-slate-500">{card.definition || "No definition yet."}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" className="btn-secondary" onClick={() => setEditorCard(card)}>
                      Edit In Visual Editor
                    </button>
                    <button
                      type="button"
                      className="btn-secondary border border-red-200 text-red-700 hover:bg-red-50 dark:border-red-900/60 dark:text-red-300"
                      onClick={() => removeCard(card._id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="panel mt-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h4 className="section-title">Quiz For My Concept Cards</h4>
            <p className="mt-1 text-sm text-slate-500">Add manual quiz prompts and answers for your private deck cards.</p>
          </div>
          <button className="btn-secondary" type="button" onClick={() => loadQuizCards(selectedDomain)} disabled={quizLoading || !selectedDomain}>
            {quizLoading ? "Loading..." : "Refresh Quiz Cards"}
          </button>
        </div>

        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <label className="text-sm font-semibold">
            Filter Concepts
            <input
              className="input-field mt-1"
              value={quizFilter}
              onChange={(event) => setQuizFilter(event.target.value)}
              placeholder="Search by concept or chapter"
            />
          </label>
          <div className="text-xs text-slate-500 md:pt-7">Loaded cards: {quizCards.length}</div>
        </div>

        <div className="mt-4 space-y-4">
          {quizCards
            .filter((card) => {
              const haystack = `${card.concept_title || ""} ${card.topic || ""} ${card.chapterName || ""}`.toLowerCase();
              return haystack.includes(quizFilter.trim().toLowerCase());
            })
            .map((card) => {
              const authored = card.authoredQuiz || { enabled: false, type: "mcq", prompt: "", options: [], answer: "" };
              const options = Array.isArray(authored.options) ? authored.options : [];
              const paddedOptions = [...options, "", "", ""].slice(0, 4);

              return (
                <article key={String(card._id)} className="rounded-2xl border border-white/60 bg-white/70 p-4 dark:border-slate-600 dark:bg-slate-900/45">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-xs uppercase tracking-[0.14em] text-slate-500">{card.chapterName || "Chapter"}</p>
                      <h5 className="font-display text-xl">{card.concept_title || card.topic}</h5>
                    </div>
                    <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                      <input
                        type="checkbox"
                        checked={Boolean(authored.enabled)}
                        onChange={(event) =>
                          updateQuizCard(card._id, (prev) => ({ ...prev, enabled: event.target.checked }))
                        }
                      />
                      Enable manual quiz
                    </label>
                  </div>

                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Question Type
                      <select
                        className="input-field mt-1"
                        value={authored.type || "mcq"}
                        onChange={(event) =>
                          updateQuizCard(card._id, (prev) => ({ ...prev, type: event.target.value }))
                        }
                      >
                        <option value="mcq">MCQ</option>
                        <option value="fill_blank">Fill Blank</option>
                      </select>
                    </label>
                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Correct Answer
                      <input
                        className="input-field mt-1"
                        value={authored.answer || ""}
                        onChange={(event) =>
                          updateQuizCard(card._id, (prev) => ({ ...prev, answer: event.target.value }))
                        }
                        placeholder="Correct answer"
                      />
                    </label>
                  </div>

                  <label className="mt-3 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Prompt
                    <textarea
                      className="input-field mt-1 min-h-16"
                      value={authored.prompt || ""}
                      onChange={(event) =>
                        updateQuizCard(card._id, (prev) => ({ ...prev, prompt: event.target.value }))
                      }
                      placeholder="Write the quiz question"
                    />
                  </label>

                  {authored.type !== "fill_blank" ? (
                    <div className="mt-3 grid gap-2 md:grid-cols-2">
                      {paddedOptions.map((option, optionIndex) => (
                        <label key={`${card._id}-opt-${optionIndex}`} className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                          Option {optionIndex + 1}
                          <input
                            className="input-field mt-1"
                            value={option}
                            onChange={(event) =>
                              updateQuizCard(card._id, (prev) => {
                                const nextOptions = [...(Array.isArray(prev.options) ? prev.options : [])];
                                nextOptions[optionIndex] = event.target.value;
                                return { ...prev, options: nextOptions.slice(0, 4) };
                              })
                            }
                            placeholder={`Option ${optionIndex + 1}`}
                          />
                        </label>
                      ))}
                    </div>
                  ) : null}

                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      className="btn-primary"
                      type="button"
                      onClick={() => saveQuizCard(card._id)}
                      disabled={quizSavingCardId === String(card._id)}
                    >
                      {quizSavingCardId === String(card._id) ? "Saving..." : "Save Quiz"}
                    </button>
                  </div>
                </article>
              );
            })}
        </div>
      </section>
    </AppShell>
  );
};

export default LearnerConceptCardsPage;
