import User from "../models/User.js";
import Domain from "../models/Domain.js";
import QuizAttempt from "../models/QuizAttempt.js";
import Flashcard from "../models/Flashcard.js";
import LearnerProgress from "../models/LearnerProgress.js";
import { seedDefaultFlashcardsForAllDomains } from "../services/flashcardSeedService.js";
import { generateFlashcardsFromPdf, generateFlashcardsFromText } from "../services/pdfFlashcardService.js";

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

const buildPreviewCards = (cards) =>
  cards.slice(0, 8).map((card) => ({
    subject: card.subject,
    chapter: card.chapter,
    concept_title: card.concept_title,
    definition: card.definition,
    key_points: card.key_points,
    short_explanation: card.short_explanation,
    diagram: card.diagram,
    chapterName: card.chapterName,
    topic: card.topic,
    keyPoints: card.keyPoints,
    diagramText: card.diagramText
  }));

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
  const answer = String(card.answer || definition || keyPoints[0] || card.back || "").trim();

  return {
    domainId,
    subject: String(card.subject || "").trim(),
    chapter: chapterName,
    concept_title: conceptTitle,
    definition,
    key_points: keyPoints,
    short_explanation: shortExplanation,
    diagram: String(card.diagram || card.diagramText || "").trim(),
    memory_trick: "",
    layout_json: normalizeLayoutJson(card.layout_json),
    topic: conceptTitle,
    chapterName,
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
    createdBy
  };
};

export const getAdminDashboard = async (_req, res, next) => {
  try {
    const [totalUsers, domainPopularity, quizStats, flashcardEffectiveness, learnerProgress] =
      await Promise.all([
        User.countDocuments({ role: "learner" }),
        Domain.find().sort({ popularityScore: -1 }).select("name popularityScore"),
        QuizAttempt.aggregate([
          {
            $group: {
              _id: "$domainId",
              attempts: { $sum: 1 },
              avgAccuracy: { $avg: "$accuracy" }
            }
          }
        ]),
        Flashcard.aggregate([
          {
            $lookup: {
              from: "quizattempts",
              localField: "_id",
              foreignField: "answers.flashcardId",
              as: "attempts"
            }
          },
          {
            $project: {
              topic: 1,
              domainId: 1,
              usageCount: { $size: "$attempts" }
            }
          },
          { $sort: { usageCount: -1 } },
          { $limit: 10 }
        ]),
        LearnerProgress.find().select("domainId progressPercent quizzesTaken")
      ]);

    return res.json({
      totalUsers,
      domainPopularity,
      quizStats,
      flashcardEffectiveness,
      learnerProgress
    });
  } catch (error) {
    return next(error);
  }
};

export const seedDomainFlashcardsAsAdmin = async (req, res, next) => {
  try {
    const overwrite = String(req.query.overwrite || "false") === "true";
    const summary = await seedDefaultFlashcardsForAllDomains({
      adminUserId: req.user._id,
      overwrite
    });

    return res.json({
      message: "Default flashcard seeding completed",
      overwrite,
      summary
    });
  } catch (error) {
    return next(error);
  }
};

export const generateDomainFlashcardsFromPdfAsAdmin = async (req, res, next) => {
  try {
    const { domainId } = req.params;
    const overwrite = String(req.body.overwrite || req.query.overwrite || "false") === "true";
    const preview = String(req.body.preview || req.query.preview || "false") === "true";

    if (!req.file) {
      return res.status(400).json({ message: "PDF file is required" });
    }

    const domain = await Domain.findById(domainId);
    if (!domain) {
      return res.status(404).json({ message: "Domain not found" });
    }

    const { cards, stats } = await generateFlashcardsFromPdf({
      fileBuffer: req.file.buffer,
      domainId,
      createdBy: req.user._id,
      domainName: domain.name
    });

    if (preview) {
      return res.json({
        message: "Concept card preview generated from PDF",
        domain: { id: domain._id, name: domain.name },
        preview: true,
        generated: cards.length,
        stats,
        cards: buildPreviewCards(cards)
      });
    }

    if (overwrite) {
      await Flashcard.deleteMany({ domainId });
    }

    const docs = await Flashcard.insertMany(cards);

    return res.status(201).json({
      message: "Concept cards generated from PDF",
      domain: { id: domain._id, name: domain.name },
      overwrite,
      inserted: docs.length,
      stats
    });
  } catch (error) {
    return next(error);
  }
};

export const generateDomainFlashcardsFromTextAsAdmin = async (req, res, next) => {
  try {
    const { domainId } = req.params;
    const overwrite = String(req.body.overwrite || req.query.overwrite || "false") === "true";
    const preview = String(req.body.preview || req.query.preview || "false") === "true";
    const text = String(req.body.text || "").trim();

    if (text.length < 120) {
      return res.status(400).json({ message: "Please provide more text (at least 120 characters)." });
    }

    const domain = await Domain.findById(domainId);
    if (!domain) {
      return res.status(404).json({ message: "Domain not found" });
    }

    const { cards, stats } = await generateFlashcardsFromText({
      text,
      domainId,
      createdBy: req.user._id,
      domainName: domain.name
    });

    if (preview) {
      return res.json({
        message: "Concept card preview generated from text",
        domain: { id: domain._id, name: domain.name },
        preview: true,
        generated: cards.length,
        stats,
        cards: buildPreviewCards(cards)
      });
    }

    if (overwrite) {
      await Flashcard.deleteMany({ domainId });
    }

    const docs = await Flashcard.insertMany(cards);

    return res.status(201).json({
      message: "Concept cards generated from text",
      domain: { id: domain._id, name: domain.name },
      overwrite,
      inserted: docs.length,
      stats
    });
  } catch (error) {
    return next(error);
  }
};

export const saveEditedDomainFlashcardsAsAdmin = async (req, res, next) => {
  try {
    const { domainId } = req.params;
    const { cards = [], overwrite = false } = req.body;

    if (!Array.isArray(cards) || !cards.length) {
      return res.status(400).json({ message: "cards array is required" });
    }

    const domain = await Domain.findById(domainId);
    if (!domain) {
      return res.status(404).json({ message: "Domain not found" });
    }

    const normalized = cards
      .map((card) => normalizeCardInput(card, domainId, req.user._id))
      .filter((card) => card.answer && card.topic);

    if (!normalized.length) {
      return res.status(400).json({ message: "No valid cards to save" });
    }

    if (String(overwrite) === "true" || overwrite === true) {
      await Flashcard.deleteMany({ domainId });
    }

    const docs = await Flashcard.insertMany(normalized);

    return res.status(201).json({
      message: "Edited flashcards saved",
      domain: { id: domain._id, name: domain.name },
      inserted: docs.length
    });
  } catch (error) {
    return next(error);
  }
};

export const listDomainConceptCardQuizAsAdmin = async (req, res, next) => {
  try {
    const { domainId } = req.params;

    const domain = await Domain.findById(domainId).select("name");
    if (!domain) {
      return res.status(404).json({ message: "Domain not found" });
    }

    const cards = await Flashcard.find({ domainId })
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

export const updateConceptCardQuizAsAdmin = async (req, res, next) => {
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

    const card = await Flashcard.findByIdAndUpdate(
      cardId,
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
