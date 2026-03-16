import User from "../models/User.js";
import Domain from "../models/Domain.js";
import QuizAttempt from "../models/QuizAttempt.js";
import Flashcard from "../models/Flashcard.js";
import LearnerProgress from "../models/LearnerProgress.js";
import { seedDefaultFlashcardsForAllDomains } from "../services/flashcardSeedService.js";
import { generateFlashcardsFromPdf } from "../services/pdfFlashcardService.js";

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
    memory_trick: String(card.memory_trick || "").trim(),
    layout_json:
      Array.isArray(card.layout_json) || (card.layout_json && typeof card.layout_json === "object")
        ? card.layout_json
        : typeof card.layout_json === "string"
          ? (() => {
              try {
                return JSON.parse(card.layout_json);
              } catch {
                return [];
              }
            })()
          : [],
    topic: conceptTitle,
    chapterName,
    keyPoints,
    diagramText: String(card.diagramText || card.diagram || "").trim(),
    diagramUrl: String(card.diagramUrl || "").trim(),
    front: String(card.front || `${conceptTitle}: What is the core definition?`).trim(),
    back: String(card.back || `${definition} ${shortExplanation}`.trim() || keyPoints.join("; ")).trim(),
    mcqOptions: Array.isArray(card.mcqOptions)
      ? card.mcqOptions.map((option) => String(option || "").trim()).filter(Boolean).slice(0, 4)
      : [],
    answer,
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
        cards: cards.slice(0, 8).map((card) => ({
          subject: card.subject,
          chapter: card.chapter,
          concept_title: card.concept_title,
          definition: card.definition,
          key_points: card.key_points,
          short_explanation: card.short_explanation,
          diagram: card.diagram,
          memory_trick: card.memory_trick,
          chapterName: card.chapterName,
          topic: card.topic,
          keyPoints: card.keyPoints,
          diagramText: card.diagramText,
          front: card.front,
          back: card.back
        }))
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
      .filter((card) => card.front && card.back && card.answer);

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
