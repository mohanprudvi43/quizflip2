import { useEffect, useState } from "react";
import { Bar, Doughnut, Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  Tooltip,
  Legend
} from "chart.js";
import AppShell from "../components/AppShell.jsx";
import ConceptCardVisualEditor from "../components/ConceptCardVisualEditor.jsx";
import api from "../services/api.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  Tooltip,
  Legend
);

const AdminDashboardPage = () => {
  const [data, setData] = useState(null);
  const [domains, setDomains] = useState([]);
  const [selectedDomain, setSelectedDomain] = useState("");
  const [domainForm, setDomainForm] = useState({ category: "", name: "", description: "" });
  const [editingDomainId, setEditingDomainId] = useState("");
  const [domainBusy, setDomainBusy] = useState(false);
  const [domainMessage, setDomainMessage] = useState("");
  const [domainError, setDomainError] = useState("");
  const [pdfFile, setPdfFile] = useState(null);
  const [overwrite, setOverwrite] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [savingEdited, setSavingEdited] = useState(false);
  const [savingVisual, setSavingVisual] = useState(false);
  const [visualOverwrite, setVisualOverwrite] = useState(false);
  const [rawConceptText, setRawConceptText] = useState("");
  const [textGenerating, setTextGenerating] = useState(false);
  const [quizCards, setQuizCards] = useState([]);
  const [quizLoading, setQuizLoading] = useState(false);
  const [quizSavingCardId, setQuizSavingCardId] = useState("");
  const [quizFilter, setQuizFilter] = useState("");
  const [uploadResult, setUploadResult] = useState(null);
  const [previewCards, setPreviewCards] = useState([]);
  const [uploadError, setUploadError] = useState("");

  useEffect(() => {
    const run = async () => {
      const [dashboardRes, domainRes] = await Promise.all([api.get("/admin/dashboard"), api.get("/domains")]);
      setData(dashboardRes.data);
      setDomains(domainRes.data || []);
    };
    run();
  }, []);

  useEffect(() => {
    if (!domains.length) return;
    if (!selectedDomain) {
      setSelectedDomain(String(domains[0]._id));
    }
  }, [domains, selectedDomain]);

  const refreshDashboard = async () => {
    const { data } = await api.get("/admin/dashboard");
    setData(data);
  };

  const refreshDomains = async () => {
    const { data } = await api.get("/domains");
    setDomains(data || []);
    return data || [];
  };

  const resetDomainForm = () => {
    setDomainForm({ category: "", name: "", description: "" });
    setEditingDomainId("");
  };

  const startEditDomain = (domain) => {
    setEditingDomainId(String(domain._id));
    setDomainForm({
      category: domain.category || "",
      name: domain.name || "",
      description: domain.description || ""
    });
    setDomainMessage("");
    setDomainError("");
  };

  const saveDomain = async (event) => {
    event.preventDefault();
    const payload = {
      category: domainForm.category.trim(),
      name: domainForm.name.trim(),
      description: domainForm.description.trim()
    };

    if (!payload.category || !payload.name) {
      setDomainError("Category and name are required.");
      return;
    }

    setDomainBusy(true);
    setDomainError("");
    setDomainMessage("");

    try {
      if (editingDomainId) {
        await api.put(`/domains/${editingDomainId}`, payload);
        setDomainMessage("Domain updated.");
      } else {
        await api.post("/domains", payload);
        setDomainMessage("Domain created.");
      }

      const updatedDomains = await refreshDomains();
      await refreshDashboard();
      if (updatedDomains.length && !selectedDomain) {
        setSelectedDomain(String(updatedDomains[0]._id));
      }
      resetDomainForm();
    } catch (error) {
      setDomainError(error.response?.data?.message || "Could not save domain.");
    } finally {
      setDomainBusy(false);
    }
  };

  const removeDomain = async (domain) => {
    const ok = window.confirm(`Delete domain \"${domain.name}\"? This also removes related flashcards and progress.`);
    if (!ok) return;

    setDomainBusy(true);
    setDomainError("");
    setDomainMessage("");

    try {
      await api.delete(`/domains/${domain._id}`);
      const updatedDomains = await refreshDomains();
      await refreshDashboard();

      if (String(selectedDomain) === String(domain._id)) {
        setSelectedDomain(updatedDomains[0]?._id ? String(updatedDomains[0]._id) : "");
      }

      setPreviewCards([]);
      setUploadResult(null);
      setDomainMessage("Domain deleted.");
      if (editingDomainId === String(domain._id)) {
        resetDomainForm();
      }
    } catch (error) {
      setDomainError(error.response?.data?.message || "Could not delete domain.");
    } finally {
      setDomainBusy(false);
    }
  };

  const uploadPdf = async (event, mode = "generate") => {
    event.preventDefault();
    if (!selectedDomain || !pdfFile) {
      setUploadError("Select a domain and PDF file first.");
      return;
    }

    setUploading(true);
    setUploadError("");
    setUploadResult(null);
    if (mode === "preview") {
      setPreviewCards([]);
    }

    try {
      const formData = new FormData();
      formData.append("pdf", pdfFile);
      formData.append("overwrite", overwrite ? "true" : "false");
      formData.append("preview", mode === "preview" ? "true" : "false");

      const { data: res } = await api.post(
        `/admin/domains/${selectedDomain}/conceptcards/upload-pdf?overwrite=${overwrite ? "true" : "false"}&preview=${
          mode === "preview" ? "true" : "false"
        }`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data"
          }
        }
      );

      if (mode === "preview") {
        setPreviewCards(Array.isArray(res.cards) ? res.cards : []);
        setUploadResult({
          message: res.message,
          domain: res.domain,
          inserted: 0,
          stats: res.stats
        });
      } else {
        setUploadResult(res);
        setPreviewCards([]);
        setPdfFile(null);
        event.target.reset();
      }
    } catch (error) {
      setUploadError(error.response?.data?.message || "Could not upload PDF.");
    } finally {
      setUploading(false);
    }
  };

  const generateFromText = async (mode = "preview") => {
    if (!selectedDomain) {
      setUploadError("Select a domain first.");
      return;
    }
    if (rawConceptText.trim().length < 120) {
      setUploadError("Paste more notes text (at least 120 characters).");
      return;
    }

    setTextGenerating(true);
    setUploadError("");
    setUploadResult(null);
    if (mode === "preview") {
      setPreviewCards([]);
    }

    try {
      const { data: res } = await api.post(
        `/admin/domains/${selectedDomain}/conceptcards/generate-text?overwrite=${overwrite ? "true" : "false"}&preview=${
          mode === "preview" ? "true" : "false"
        }`,
        {
          text: rawConceptText,
          overwrite,
          preview: mode === "preview"
        }
      );

      if (mode === "preview") {
        setPreviewCards(Array.isArray(res.cards) ? res.cards : []);
        setUploadResult({
          message: res.message,
          domain: res.domain,
          inserted: 0,
          stats: res.stats
        });
      } else {
        setUploadResult(res);
      }
    } catch (error) {
      setUploadError(error.response?.data?.message || "Could not generate cards from text.");
    } finally {
      setTextGenerating(false);
    }
  };

  const loadQuizCards = async () => {
    if (!selectedDomain) return;

    setQuizLoading(true);
    setUploadError("");
    try {
      const { data: res } = await api.get(`/admin/domains/${selectedDomain}/conceptcards/quiz`);
      setQuizCards(Array.isArray(res.cards) ? res.cards : []);
    } catch (error) {
      setUploadError(error.response?.data?.message || "Could not load quiz cards.");
    } finally {
      setQuizLoading(false);
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
    setUploadError("");

    try {
      await api.put(`/admin/conceptcards/${cardId}/quiz`, {
        authoredQuiz: card.authoredQuiz
      });
    } catch (error) {
      setUploadError(error.response?.data?.message || "Could not save quiz configuration.");
    } finally {
      setQuizSavingCardId("");
    }
  };

  const updatePreviewCard = (index, key, value) => {
    setPreviewCards((prev) =>
      prev.map((card, i) => {
        if (i !== index) return card;

        if (key === "keyPoints" || key === "key_points") {
          const normalized = value
            .split(/\r?\n/)
            .map((point) => point.trim())
            .filter(Boolean);

          return {
            ...card,
            keyPoints: normalized,
            key_points: normalized
          };
        }

        return { ...card, [key]: value };
      })
    );
  };

  const saveEditedCards = async () => {
    if (!selectedDomain || !previewCards.length) {
      setUploadError("Preview cards first before saving edited content.");
      return;
    }

    setSavingEdited(true);
    setUploadError("");

    try {
      const { data: res } = await api.post(`/admin/domains/${selectedDomain}/conceptcards/save-generated`, {
        overwrite,
        cards: previewCards
      });

      setUploadResult({
        message: res.message,
        domain: res.domain,
        inserted: res.inserted,
        stats: uploadResult?.stats || {}
      });
      setPreviewCards([]);
      setPdfFile(null);
    } catch (error) {
      setUploadError(error.response?.data?.message || "Could not save edited cards.");
    } finally {
      setSavingEdited(false);
    }
  };

  const saveVisualCard = async (cardPayload) => {
    if (!selectedDomain) {
      setUploadError("Choose a domain before saving visual cards.");
      return;
    }

    setSavingVisual(true);
    setUploadError("");

    try {
      const { data: res } = await api.post(`/admin/domains/${selectedDomain}/conceptcards/save-generated`, {
        overwrite: Boolean(cardPayload?.overwrite ?? visualOverwrite),
        cards: [cardPayload]
      });

      setUploadResult({
        message: "Visual concept card saved",
        domain: res.domain,
        inserted: res.inserted,
        stats: uploadResult?.stats || {}
      });
    } catch (error) {
      setUploadError(error.response?.data?.message || "Could not save visual concept card.");
    } finally {
      setSavingVisual(false);
    }
  };

  if (!data) {
    return (
      <AppShell showHeader={false}>
        <div className="skeleton h-96 rounded-3xl" />
      </AppShell>
    );
  }

  const domainBar = {
    labels: data.domainPopularity.map((d) => d.name),
    datasets: [{ label: "Popularity", data: data.domainPopularity.map((d) => d.popularityScore), backgroundColor: "#2f7df3" }]
  };

  const quizLine = {
    labels: data.quizStats.map((q, i) => `Domain ${i + 1}`),
    datasets: [{ label: "Avg Accuracy", data: data.quizStats.map((q) => q.avgAccuracy), borderColor: "#00b894" }]
  };

  const flashcardPie = {
    labels: data.flashcardEffectiveness.map((f) => f.topic),
    datasets: [{ data: data.flashcardEffectiveness.map((f) => f.usageCount), backgroundColor: ["#2f7df3", "#00b894", "#ff9f43", "#ee5253", "#5f27cd"] }]
  };

  return (
    <AppShell showHeader={false}>
      <section className="panel">
        <h4 className="section-title">Manage Domains</h4>
        <p className="mt-1 text-sm text-slate-500">Create, edit, and delete learning domains used across the platform.</p>

        <form className="mt-4 grid gap-3 md:grid-cols-3" onSubmit={saveDomain}>
          <label className="text-sm font-semibold">
            Category
            <input
              className="input-field mt-1"
              value={domainForm.category}
              onChange={(e) => setDomainForm((prev) => ({ ...prev, category: e.target.value }))}
              placeholder="Science"
            />
          </label>

          <label className="text-sm font-semibold">
            Domain Name
            <input
              className="input-field mt-1"
              value={domainForm.name}
              onChange={(e) => setDomainForm((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="Physics"
            />
          </label>

          <label className="text-sm font-semibold md:col-span-3">
            Description
            <textarea
              className="input-field mt-1 min-h-20"
              value={domainForm.description}
              onChange={(e) => setDomainForm((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="Core concepts, formulas, and problem solving."
            />
          </label>

          <div className="md:col-span-3 flex flex-wrap gap-2">
            <button className="btn-primary" type="submit" disabled={domainBusy}>
              {domainBusy ? "Saving..." : editingDomainId ? "Update Domain" : "Add Domain"}
            </button>
            {editingDomainId ? (
              <button className="btn-secondary" type="button" onClick={resetDomainForm} disabled={domainBusy}>
                Cancel Edit
              </button>
            ) : null}
          </div>
        </form>

        {domainMessage ? <p className="mt-3 text-sm text-emerald-700">{domainMessage}</p> : null}
        {domainError ? <p className="mt-3 text-sm text-red-600">{domainError}</p> : null}

        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500">
                <th className="px-2 py-2">Category</th>
                <th className="px-2 py-2">Name</th>
                <th className="px-2 py-2">Description</th>
                <th className="px-2 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {domains.map((domain) => (
                <tr key={String(domain._id)} className="border-t border-slate-200/70 dark:border-slate-700/60">
                  <td className="px-2 py-2">{domain.category}</td>
                  <td className="px-2 py-2 font-semibold">{domain.name}</td>
                  <td className="px-2 py-2 text-slate-600 dark:text-slate-300">{domain.description || "-"}</td>
                  <td className="px-2 py-2">
                    <div className="flex flex-wrap gap-2">
                      <button className="btn-secondary" type="button" onClick={() => startEditDomain(domain)} disabled={domainBusy}>
                        Edit
                      </button>
                      <button
                        className="btn-secondary border border-red-200 text-red-700 hover:bg-red-50 dark:border-red-900/60 dark:text-red-300"
                        type="button"
                        onClick={() => removeDomain(domain)}
                        disabled={domainBusy}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel">
        <h4 className="section-title">Generate ConceptCards From PDF</h4>
        <p className="mt-1 text-sm text-slate-500">
          Upload a domain PDF. The system extracts chapters and key concepts to create concept cards.
        </p>
        <p className="mt-1 text-xs text-slate-500">Maximum PDF size: 50MB.</p>

        <form className="mt-4 grid gap-3 md:grid-cols-2" onSubmit={(e) => uploadPdf(e, "generate")}>
          <label className="text-sm font-semibold">
            Domain
            <select
              className="input-field mt-1"
              value={selectedDomain}
              onChange={(e) => setSelectedDomain(e.target.value)}
            >
              {(domains || []).map((domain) => (
                <option key={String(domain._id)} value={String(domain._id)}>
                  {domain.name}
                </option>
              ))}
            </select>
          </label>

          <label className="text-sm font-semibold">
            PDF File
            <input
              className="input-field mt-1"
              type="file"
              accept="application/pdf"
              onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
            />
          </label>

          <label className="flex items-center gap-2 text-sm text-slate-600 md:col-span-2 dark:text-slate-300">
            <input
              type="checkbox"
              checked={overwrite}
              onChange={(e) => setOverwrite(e.target.checked)}
            />
            Replace existing flashcards for this domain
          </label>

          <div className="md:col-span-2">
            <div className="flex flex-wrap gap-2">
              <button className="btn-secondary" type="button" disabled={uploading} onClick={(e) => uploadPdf(e, "preview")}>
                {uploading ? "Working..." : "Preview Generated Cards"}
              </button>
              <button className="btn-primary" type="submit" disabled={uploading}>
                {uploading ? "Generating..." : "Save Generated ConceptCards"}
              </button>
            </div>
          </div>
        </form>

        {uploadError ? <p className="mt-3 text-sm text-red-600">{uploadError}</p> : null}

        {uploadResult ? (
          <div className="mt-4 rounded-2xl border border-white/60 bg-white/70 p-4 text-sm dark:border-slate-600 dark:bg-slate-900/45">
            <p className="font-semibold text-emerald-700 dark:text-emerald-300">{uploadResult.message}</p>
            <p className="mt-1">Domain: {uploadResult.domain?.name}</p>
            <p>{uploadResult.inserted ? `Inserted: ${uploadResult.inserted}` : "Preview only (not saved)"}</p>
            <p>Pages Read: {uploadResult.stats?.totalPages || 0}</p>
            <p>Sections Found: {uploadResult.stats?.totalSections || 0}</p>
          </div>
        ) : null}

        {previewCards.length ? (
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <h5 className="font-display text-xl">Preview Cards (Editable)</h5>
              <button className="btn-primary" type="button" disabled={savingEdited} onClick={saveEditedCards}>
                {savingEdited ? "Saving..." : "Save Edited Cards"}
              </button>
            </div>
            {previewCards.map((card, idx) => (
              <article key={`${card.chapterName}-${idx}`} className="rounded-2xl border border-white/60 bg-white/70 p-4 dark:border-slate-600 dark:bg-slate-900/45">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <h6 className="font-display text-lg leading-tight">{card.concept_title || card.topic || `Concept ${idx + 1}`}</h6>
                  {(card.chapterName || card.chapter) ? (
                    <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-100">
                      {card.chapterName || card.chapter}
                    </span>
                  ) : null}
                  {card.subject ? (
                    <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-800 dark:bg-blue-900/40 dark:text-blue-100">
                      {card.subject}
                    </span>
                  ) : null}
                </div>

                <label className="mt-2 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Definition (one sentence)
                  <textarea
                    className="input-field mt-1 min-h-20"
                    value={card.definition || ""}
                    onChange={(e) => updatePreviewCard(idx, "definition", e.target.value)}
                  />
                </label>

                <label className="mt-2 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Key Points (one per line)
                  <textarea
                    className="input-field mt-1 min-h-28"
                    value={Array.isArray(card.key_points || card.keyPoints) ? (card.key_points || card.keyPoints).join("\n") : ""}
                    onChange={(e) => {
                      updatePreviewCard(idx, "key_points", e.target.value);
                      updatePreviewCard(idx, "keyPoints", e.target.value);
                    }}
                  />
                </label>

                <label className="mt-2 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Short Explanation (2-3 sentences)
                  <textarea
                    className="input-field mt-1 min-h-20"
                    value={card.short_explanation || ""}
                    onChange={(e) => updatePreviewCard(idx, "short_explanation", e.target.value)}
                  />
                </label>

                <label className="mt-2 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Diagram Text
                  <textarea
                    className="input-field mt-1 min-h-20"
                    value={card.diagram || card.diagramText || ""}
                    onChange={(e) => {
                      updatePreviewCard(idx, "diagram", e.target.value);
                      updatePreviewCard(idx, "diagramText", e.target.value);
                    }}
                  />
                </label>
              </article>
            ))}
          </div>
        ) : null}
      </section>

      <section className="panel">
        <h4 className="section-title">Generate ConceptCards From Notes Text</h4>
        <p className="mt-1 text-sm text-slate-500">
          Paste short notes or chapter points. You can preview, edit, and save generated concept cards.
        </p>

        <label className="mt-3 block text-sm font-semibold">
          Notes Text
          <textarea
            className="input-field mt-1 min-h-40"
            placeholder="Paste chapter notes, bullets, or topic explanation text here..."
            value={rawConceptText}
            onChange={(e) => setRawConceptText(e.target.value)}
          />
        </label>

        <div className="mt-3 flex flex-wrap gap-2">
          <button className="btn-secondary" type="button" onClick={() => generateFromText("preview")} disabled={textGenerating}>
            {textGenerating ? "Working..." : "Preview From Text"}
          </button>
          <button className="btn-primary" type="button" onClick={() => generateFromText("generate")} disabled={textGenerating}>
            {textGenerating ? "Generating..." : "Save Generated From Text"}
          </button>
        </div>
      </section>

      <section className="panel">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h4 className="section-title">Quiz For ConceptCards</h4>
            <p className="mt-1 text-sm text-slate-500">
              Separate add/edit for quiz question, options, and answer mapped to each concept card.
            </p>
          </div>
          <button className="btn-secondary" type="button" onClick={loadQuizCards} disabled={quizLoading || !selectedDomain}>
            {quizLoading ? "Loading..." : "Load ConceptCards"}
          </button>
        </div>

        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <label className="text-sm font-semibold">
            Filter Concepts
            <input
              className="input-field mt-1"
              value={quizFilter}
              onChange={(e) => setQuizFilter(e.target.value)}
              placeholder="Search by concept or chapter"
            />
          </label>
          <div className="text-xs text-slate-500 md:pt-7">
            Loaded cards: {quizCards.length}
          </div>
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
                        onChange={(e) =>
                          updateQuizCard(card._id, (prev) => ({ ...prev, enabled: e.target.checked }))
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
                        onChange={(e) =>
                          updateQuizCard(card._id, (prev) => ({ ...prev, type: e.target.value }))
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
                        onChange={(e) =>
                          updateQuizCard(card._id, (prev) => ({ ...prev, answer: e.target.value }))
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
                      onChange={(e) =>
                        updateQuizCard(card._id, (prev) => ({ ...prev, prompt: e.target.value }))
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
                            onChange={(e) =>
                              updateQuizCard(card._id, (prev) => {
                                const nextOptions = [...(Array.isArray(prev.options) ? prev.options : [])];
                                nextOptions[optionIndex] = e.target.value;
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

      <ConceptCardVisualEditor
        saving={savingVisual}
        onSave={saveVisualCard}
        initialCard={previewCards[0] || null}
        domains={domains}
        selectedDomain={selectedDomain}
        onDomainChange={setSelectedDomain}
        overwriteExisting={visualOverwrite}
        onOverwriteChange={setVisualOverwrite}
      />

      <section className="grid gap-4 md:grid-cols-3">
        <div className="panel">
          <p className="text-sm text-slate-500">Total Learners</p>
          <h3 className="font-display text-4xl">{data.totalUsers}</h3>
        </div>
        <div className="panel md:col-span-2">
          <h4 className="section-title">Domain Popularity</h4>
          <Bar data={domainBar} />
        </div>
      </section>

      <section className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="panel">
          <h4 className="section-title">Quiz Accuracy Trends</h4>
          <Line data={quizLine} />
        </div>
        <div className="panel">
          <h4 className="section-title">Flashcard Effectiveness</h4>
          <Doughnut data={flashcardPie} />
        </div>
      </section>
    </AppShell>
  );
};

export default AdminDashboardPage;
