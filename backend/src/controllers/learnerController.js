import Domain from "../models/Domain.js";
import Flashcard from "../models/Flashcard.js";
import LearnerProgress from "../models/LearnerProgress.js";
import QuizAttempt from "../models/QuizAttempt.js";
import DailyActivity from "../models/DailyActivity.js";
import User from "../models/User.js";
import {
  buildQuestionFromFlashcard,
  applySpacedRepetition,
  scoreWeakTopics
} from "../services/adaptiveEngine.js";

const MAX_LAYOUT_BYTES = 2 * 1024 * 1024;

const toNumber = (value, fallback) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

const normalizeLayoutJson = (layoutValue) => {
  const parsed =
    Array.isArray(layoutValue) || (layoutValue && typeof layoutValue === "object")
      ? layoutValue
      : typeof layoutValue === "string"
        ? (() => {
            try {
              return JSON.parse(layoutValue);
            } catch {
              return [];
            }
          })()
        : [];

  const arrayLayout = Array.isArray(parsed) ? parsed : [];
  const safeLayout = arrayLayout
    .map((raw, idx) => {
      if (!raw || typeof raw !== "object") return null;
      const type = String(raw.type || "").trim();
      if (!["text", "image", "shape", "arrow"].includes(type)) return null;

      const normalized = {
        id: String(raw.id || `${Date.now()}-${idx}`).trim(),
        type,
        x: toNumber(raw.x, 0),
        y: toNumber(raw.y, 0),
        width: Math.max(20, toNumber(raw.width, type === "text" ? 180 : 120)),
        height: Math.max(20, toNumber(raw.height, type === "text" ? 40 : 80)),
        rotation: toNumber(raw.rotation, 0),
        fill: String(raw.fill || (type === "shape" ? "#93c5fd" : "#111827")),
        stroke: String(raw.stroke || "#2563eb")
      };

      if (type === "text") {
        normalized.text = String(raw.text || "Text");
        normalized.fontSize = Math.max(10, toNumber(raw.fontSize, 24));
        normalized.fontFamily = String(raw.fontFamily || "Sora");
        normalized.align = ["left", "center", "right"].includes(String(raw.align || "")) ? String(raw.align) : "left";
        normalized.verticalAlign = ["top", "middle", "bottom"].includes(String(raw.verticalAlign || ""))
          ? String(raw.verticalAlign)
          : "top";
        normalized.lineHeight = Math.max(0.6, toNumber(raw.lineHeight, 1.2));
        normalized.letterSpacing = toNumber(raw.letterSpacing, 0);
        normalized.padding = Math.max(0, toNumber(raw.padding, 0));
      }

      if (type === "image") {
        const src = String(raw.src || "").trim();
        if (!src) return null;
        normalized.src = src;
      }

      return normalized;
    })
    .filter(Boolean);

  if (Buffer.byteLength(JSON.stringify(safeLayout), "utf8") > MAX_LAYOUT_BYTES) {
    return [];
  }

  return safeLayout;
};

const normalizeAuthoredQuiz = (payload = {}) => {
  const type = String(payload.type || "mcq").toLowerCase() === "fill_blank" ? "fill_blank" : "mcq";
  const options = Array.isArray(payload.options)
    ? payload.options.map((item) => String(item || "").trim()).filter(Boolean)
    : [];

  const dedupedOptions = [...new Set(options)].slice(0, 4);
  const prompt = String(payload.prompt || "").trim();
  const answer = String(payload.answer || "").trim();
  const enabled = Boolean(payload.enabled);

  return {
    enabled,
    type,
    prompt,
    options: type === "mcq" ? dedupedOptions : [],
    answer
  };
};

const normalizeCardInput = (card, domainId, createdBy) => {
  const keyPointsInput = card.keyPoints || card.key_points;
  const keyPoints = Array.isArray(keyPointsInput)
    ? keyPointsInput.map((point) => String(point || "").trim()).filter(Boolean)
    : String(keyPointsInput || "")
        .split(/\r?\n|;/)
        .map((point) => point.trim())
        .filter(Boolean);

  const conceptTitle = String(card.concept_title || card.topic || card.chapterName || "Core Concept").trim();
  const chapterName = String(card.chapterName || card.chapter || conceptTitle).trim();
  const definition = String(card.definition || keyPoints[0] || card.answer || "").trim();
  const shortExplanation = String(card.short_explanation || card.back || "").trim();
  const answer = String(card.answer || definition || keyPoints[0] || conceptTitle || "Core Concept").trim();
  const normalizedTopic = conceptTitle || "Core Concept";
  const normalizedChapter = chapterName || normalizedTopic;

  return {
    domainId,
    subject: String(card.subject || "").trim(),
    chapter: normalizedChapter,
    concept_title: normalizedTopic,
    definition,
    key_points: keyPoints,
    short_explanation: shortExplanation,
    diagram: String(card.diagram || card.diagramText || "").trim(),
    memory_trick: "",
    layout_json: normalizeLayoutJson(card.layout_json),
    topic: normalizedTopic,
    chapterName: normalizedChapter,
    keyPoints,
    diagramText: String(card.diagramText || card.diagram || "").trim(),
    diagramUrl: String(card.diagramUrl || "").trim(),
    front: "",
    back: "",
    mcqOptions: Array.isArray(card.mcqOptions)
      ? card.mcqOptions.map((option) => String(option || "").trim()).filter(Boolean).slice(0, 4)
      : [],
    answer,
    authoredQuiz: normalizeAuthoredQuiz(card.authoredQuiz || {}),
    visibility: "private",
    createdBy
  };
};

const domainVisibilityQuery = (user, domainId) =>
  user?.role === "admin"
    ? { domainId }
    : {
        domainId,
        $or: [{ visibility: { $ne: "private" } }, { createdBy: user._id }]
      };

const learnerOwnedCardQuery = (user, cardId) =>
  user?.role === "admin"
    ? { _id: cardId }
    : { _id: cardId, createdBy: user._id, visibility: "private" };

const getOrCreateProgress = async (learnerId, domainId) => {
  let progress = await LearnerProgress.findOne({ learnerId, domainId });
  if (!progress) {
    progress = await LearnerProgress.create({ learnerId, domainId });
  }
  return progress;
};

export const startDomainLearning = async (req, res, next) => {
  try {
    const { domainId } = req.body;
    const domain = await Domain.findById(domainId);

    if (!domain) return res.status(404).json({ message: "Domain not found" });

    await getOrCreateProgress(req.user._id, domainId);
    await Domain.findByIdAndUpdate(domainId, { $inc: { popularityScore: 1 } });

    return res.json({ message: "Domain selected", domainId });
  } catch (error) {
    return next(error);
  }
};

export const markFlashcardViewed = async (req, res, next) => {
  try {
    const { domainId, flashcardId, timeSpentSeconds } = req.body;
    const visibleDomainQuery = domainVisibilityQuery(req.user, domainId);
    const flashcard = await Flashcard.findOne({ _id: flashcardId, ...visibleDomainQuery }).select("_id");

    if (!flashcard) {
      return res.status(404).json({ message: "Flashcard not found for this domain" });
    }

    const total = await Flashcard.countDocuments(visibleDomainQuery);

    const progress = await getOrCreateProgress(req.user._id, domainId);

    const wasViewed = progress.viewedFlashcards.some((id) => id.toString() === flashcardId);
    if (!wasViewed) {
      progress.viewedFlashcards.push(flashcardId);
    }
    progress.timeSpentSeconds += Number(timeSpentSeconds || 0);
    progress.progressPercent = total > 0 ? Math.round((progress.viewedFlashcards.length / total) * 100) : 0;

    const milestonesReached = Math.floor(progress.progressPercent / 10);
    const hasNewMilestone = milestonesReached > progress.lastQuizMilestone;
    if (hasNewMilestone) {
      progress.lastQuizMilestone = milestonesReached;
    }

    await progress.save();

    return res.json({
      progressPercent: progress.progressPercent,
      viewedFlashcards: progress.viewedFlashcards.length,
      shouldGenerateQuiz: hasNewMilestone,
      milestone: milestonesReached
    });
  } catch (error) {
    return next(error);
  }
};

const pickPracticeFlashcards = async (progress, domainId, mode, user) => {
  const scopedDomainQuery = domainVisibilityQuery(user, domainId);
  const viewedSet = new Set(progress.viewedFlashcards.map((id) => id.toString()));
  const reviewedIds = progress.reviewStates.map((s) => s.flashcardId.toString());
  const dueReviewIds = progress.reviewStates
    .filter((s) => s.nextDueQuiz <= progress.quizCounter + 1)
    .map((s) => s.flashcardId.toString());

  if (mode === "weak_topics" && progress.weakTopics.length) {
    return Flashcard.find({ ...scopedDomainQuery, topic: { $in: progress.weakTopics } }).limit(15);
  }

  if (["practice_hard", "practice_medium", "practice_easy"].includes(mode)) {
    const bucket = mode === "practice_hard" ? "Hard" : mode === "practice_medium" ? "Medium" : "Easy";
    const bucketIds = progress.reviewStates
      .filter((s) => s.difficultyBucket === bucket)
      .map((s) => s.flashcardId);
    if (bucketIds.length) {
      return Flashcard.find({ ...scopedDomainQuery, _id: { $in: bucketIds } }).limit(15);
    }
  }

  if (mode === "auto_10_percent") {
    const dueIds = dueReviewIds.filter((id) => viewedSet.has(id));
    const dueCards = dueIds.length
      ? await Flashcard.find({ ...scopedDomainQuery, _id: { $in: dueIds } }).limit(15)
      : [];

    if (dueCards.length >= 10) {
      return dueCards.slice(0, 15);
    }

    const remainingSlots = 15 - dueCards.length;
    const viewedOnlyIds = [...viewedSet].filter((id) => !dueIds.includes(id));
    if (viewedOnlyIds.length) {
      const viewedCards = await Flashcard.find({ ...scopedDomainQuery, _id: { $in: viewedOnlyIds } }).limit(remainingSlots);
      return [...dueCards, ...viewedCards].slice(0, 15);
    }

    return dueCards;
  }

  const fallbackIds = reviewedIds.length ? reviewedIds : [...viewedSet];
  if (fallbackIds.length) {
    return Flashcard.find({ ...scopedDomainQuery, _id: { $in: fallbackIds } }).limit(15);
  }

  return Flashcard.find(scopedDomainQuery).limit(15);
};

export const generateQuiz = async (req, res, next) => {
  try {
    const { domainId, source = "auto_10_percent" } = req.body;
    const progress = await getOrCreateProgress(req.user._id, domainId);

    const cards = await pickPracticeFlashcards(progress, domainId, source, req.user);
    const questions = cards.map((card, idx) => buildQuestionFromFlashcard(card, idx));

    return res.json({
      domainId,
      source,
      questions,
      timerSecondsPerQuestion: 30
    });
  } catch (error) {
    return next(error);
  }
};

export const submitQuiz = async (req, res, next) => {
  try {
    const { domainId, source, timeTakenSeconds, answers } = req.body;
    const progress = await getOrCreateProgress(req.user._id, domainId);

    const score = answers.filter((a) => a.isCorrect).length;
    const accuracy = answers.length ? Math.round((score / answers.length) * 100) : 0;

    await QuizAttempt.create({
      learnerId: req.user._id,
      domainId,
      source,
      score,
      totalQuestions: answers.length,
      accuracy,
      timeTakenSeconds,
      answers
    });

    progress.quizzesTaken += 1;
    progress.quizCounter += 1;
    progress.totalQuestionsAnswered += answers.length;
    progress.totalCorrectAnswers += score;

    answers.forEach((ans) => {
      const idx = progress.reviewStates.findIndex(
        (s) => s.flashcardId.toString() === ans.flashcardId.toString()
      );

      const prev =
        idx >= 0
          ? progress.reviewStates[idx]
          : {
              flashcardId: ans.flashcardId,
              nextDueQuiz: progress.quizCounter,
              interval: 0,
              difficultyBucket: "Medium",
              incorrectCount: 0,
              seenCount: 0
            };

      const updated = applySpacedRepetition(
        {
          ...prev.toObject?.(),
          flashcardId: prev.flashcardId,
          nextDueQuiz: prev.nextDueQuiz,
          interval: prev.interval,
          difficultyBucket: prev.difficultyBucket,
          incorrectCount: prev.incorrectCount,
          seenCount: prev.seenCount + 1
        },
        ans.confidence
      );

      if (!ans.isCorrect) updated.incorrectCount += 1;

      if (idx >= 0) {
        progress.reviewStates[idx] = updated;
      } else {
        progress.reviewStates.push(updated);
      }
    });

    progress.weakTopics = scoreWeakTopics(answers);
    await progress.save();

    const now = new Date();
    const dateKey = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}-${String(
      now.getUTCDate()
    ).padStart(2, "0")}`;

    await DailyActivity.findOneAndUpdate(
      { learnerId: req.user._id, dateKey },
      { $inc: { questionsSolved: answers.length } },
      { upsert: true, new: true }
    );

    const pointsEarned = score * 10;
    await User.findByIdAndUpdate(req.user._id, { $inc: { points: pointsEarned } });

    return res.json({
      score,
      total: answers.length,
      accuracy,
      pointsEarned,
      weakTopics: progress.weakTopics
    });
  } catch (error) {
    return next(error);
  }
};

export const getProgressByDomain = async (req, res, next) => {
  try {
    const { domainId } = req.params;
    const progress = await getOrCreateProgress(req.user._id, domainId);

    const quizAccuracy = progress.totalQuestionsAnswered
      ? Math.round((progress.totalCorrectAnswers / progress.totalQuestionsAnswered) * 100)
      : 0;

    return res.json({
      progressPercent: progress.progressPercent,
      quizzesTaken: progress.quizzesTaken,
      quizAccuracy,
      weakTopics: progress.weakTopics,
      timeSpentSeconds: progress.timeSpentSeconds
    });
  } catch (error) {
    return next(error);
  }
};

export const getStreakCalendar = async (req, res, next) => {
  try {
    const activities = await DailyActivity.find({ learnerId: req.user._id }).sort({ dateKey: 1 });

    let currentStreak = 0;
    let longestStreak = 0;
    let prevDate = null;

    activities.forEach((a) => {
      const d = new Date(`${a.dateKey}T00:00:00Z`);

      if (!prevDate) {
        currentStreak = 1;
      } else {
        const diff = (d - prevDate) / (1000 * 60 * 60 * 24);
        if (diff === 1) currentStreak += 1;
        else if (diff > 1) currentStreak = 1;
      }

      longestStreak = Math.max(longestStreak, currentStreak);
      prevDate = d;
    });

    return res.json({
      heatmap: activities,
      streakCount: currentStreak,
      longestStreak
    });
  } catch (error) {
    return next(error);
  }
};

export const listMyConceptCardsByDomain = async (req, res, next) => {
  try {
    const { domainId } = req.params;
    const domain = await Domain.findById(domainId).select("name");
    if (!domain) {
      return res.status(404).json({ message: "Domain not found" });
    }

    const cards = await Flashcard.find({ domainId, createdBy: req.user._id, visibility: "private" }).sort({ createdAt: -1 });

    return res.json({
      domain: { id: domain._id, name: domain.name },
      cards
    });
  } catch (error) {
    return next(error);
  }
};

export const saveMyConceptCardsByDomain = async (req, res, next) => {
  try {
    const { domainId } = req.params;
    const { cards = [], overwrite = false } = req.body;

    if (!Array.isArray(cards) || !cards.length) {
      return res.status(400).json({ message: "cards array is required" });
    }

    const domain = await Domain.findById(domainId).select("name");
    if (!domain) {
      return res.status(404).json({ message: "Domain not found" });
    }

    const normalizedEntries = cards
      .map((card) => ({
        input: card,
        normalized: normalizeCardInput(card, domainId, req.user._id)
      }))
      .filter((entry) => entry.normalized.answer && entry.normalized.topic);

    if (!normalizedEntries.length) {
      return res.status(400).json({ message: "No valid cards to save. Add concept title or definition." });
    }

    const overwriteRequested = String(overwrite) === "true" || overwrite === true;
    const shouldOverwrite = overwriteRequested && normalizedEntries.length > 1;

    if (shouldOverwrite) {
      await Flashcard.deleteMany({
        domainId,
        createdBy: req.user._id,
        visibility: "private"
      });
    }

    const updates = [];
    const creates = [];

    normalizedEntries.forEach((entry) => {
      const hasId = Boolean(entry.input && entry.input._id);
      if (hasId) {
        updates.push({ id: entry.input._id, payload: entry.normalized });
      } else {
        creates.push(entry.normalized);
      }
    });

    let inserted = 0;
    if (creates.length) {
      const docs = await Flashcard.insertMany(creates);
      inserted += docs.length;
    }

    let updated = 0;
    for (const item of updates) {
      const updatedDoc = await Flashcard.findOneAndUpdate(
        { _id: item.id, domainId, createdBy: req.user._id, visibility: "private" },
        item.payload,
        { new: true, runValidators: true }
      ).select("_id");

      if (updatedDoc) {
        updated += 1;
      }
    }

    return res.status(201).json({
      message: "My concept cards saved",
      domain: { id: domain._id, name: domain.name },
      inserted,
      updated,
      overwriteApplied: shouldOverwrite,
      overwriteSkippedSingleCard: overwriteRequested && !shouldOverwrite
    });
  } catch (error) {
    return next(error);
  }
};

export const deleteMyConceptCard = async (req, res, next) => {
  try {
    const { cardId } = req.params;
    const deleted = await Flashcard.findOneAndDelete(learnerOwnedCardQuery(req.user, cardId)).select("_id");

    if (!deleted) {
      return res.status(404).json({ message: "Concept card not found" });
    }

    return res.json({ message: "Concept card deleted" });
  } catch (error) {
    return next(error);
  }
};

export const listMyConceptCardQuizByDomain = async (req, res, next) => {
  try {
    const { domainId } = req.params;

    const domain = await Domain.findById(domainId).select("name");
    if (!domain) {
      return res.status(404).json({ message: "Domain not found" });
    }

    const cards = await Flashcard.find({ domainId, createdBy: req.user._id, visibility: "private" })
      .select("concept_title topic chapterName authoredQuiz answer mcqOptions")
      .sort({ createdAt: 1 });

    return res.json({
      domain: { id: domain._id, name: domain.name },
      cards: cards.map((card) => ({
        _id: card._id,
        concept_title: card.concept_title,
        topic: card.topic,
        chapterName: card.chapterName,
        authoredQuiz: {
          enabled: Boolean(card.authoredQuiz?.enabled),
          type: card.authoredQuiz?.type || "mcq",
          prompt: card.authoredQuiz?.prompt || "",
          options: Array.isArray(card.authoredQuiz?.options) ? card.authoredQuiz.options : [],
          answer: card.authoredQuiz?.answer || ""
        },
        fallback: {
          answer: card.answer || "",
          options: Array.isArray(card.mcqOptions) ? card.mcqOptions : []
        }
      }))
    });
  } catch (error) {
    return next(error);
  }
};

export const updateMyConceptCardQuiz = async (req, res, next) => {
  try {
    const { cardId } = req.params;
    const authoredQuiz = normalizeAuthoredQuiz(req.body?.authoredQuiz || req.body || {});

    if (authoredQuiz.enabled) {
      if (!authoredQuiz.prompt || !authoredQuiz.answer) {
        return res.status(400).json({ message: "Quiz prompt and answer are required when enabled." });
      }

      if (authoredQuiz.type === "mcq") {
        if (authoredQuiz.options.length !== 4) {
          return res.status(400).json({ message: "MCQ requires exactly 4 unique options." });
        }
        const hasAnswerInOptions = authoredQuiz.options.some(
          (option) => option.toLowerCase() === authoredQuiz.answer.toLowerCase()
        );
        if (!hasAnswerInOptions) {
          return res.status(400).json({ message: "Correct answer must match one option." });
        }
      }
    }

    const card = await Flashcard.findOneAndUpdate(
      learnerOwnedCardQuery(req.user, cardId),
      { authoredQuiz },
      { new: true, runValidators: true }
    ).select("_id concept_title topic authoredQuiz");

    if (!card) {
      return res.status(404).json({ message: "Concept card not found" });
    }

    return res.json({ message: "Quiz configuration saved", card });
  } catch (error) {
    return next(error);
  }
};
