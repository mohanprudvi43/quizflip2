import Domain from "../models/Domain.js";
import Flashcard from "../models/Flashcard.js";
import QuizAttempt from "../models/QuizAttempt.js";
import LearnerProgress from "../models/LearnerProgress.js";
import LeaderboardSnapshot from "../models/LeaderboardSnapshot.js";

export const listDomains = async (_req, res, next) => {
  try {
    const domains = await Domain.find().sort({ category: 1, name: 1 });
    return res.json(domains);
  } catch (error) {
    return next(error);
  }
};

export const createDomain = async (req, res, next) => {
  try {
    const { category, name, description } = req.body;
    const domain = await Domain.create({
      category,
      name,
      description,
      createdBy: req.user._id
    });
    return res.status(201).json(domain);
  } catch (error) {
    return next(error);
  }
};

export const updateDomain = async (req, res, next) => {
  try {
    const { domainId } = req.params;
    const { category, name, description } = req.body;

    const update = {
      ...(typeof category === "string" ? { category: category.trim() } : {}),
      ...(typeof name === "string" ? { name: name.trim() } : {}),
      ...(typeof description === "string" ? { description: description.trim() } : {})
    };

    if (!Object.keys(update).length) {
      return res.status(400).json({ message: "Nothing to update" });
    }

    const domain = await Domain.findByIdAndUpdate(domainId, update, {
      new: true,
      runValidators: true
    });

    if (!domain) {
      return res.status(404).json({ message: "Domain not found" });
    }

    return res.json(domain);
  } catch (error) {
    return next(error);
  }
};

export const deleteDomain = async (req, res, next) => {
  try {
    const { domainId } = req.params;

    const domain = await Domain.findById(domainId);
    if (!domain) {
      return res.status(404).json({ message: "Domain not found" });
    }

    await Promise.all([
      Flashcard.deleteMany({ domainId }),
      QuizAttempt.deleteMany({ domainId }),
      LearnerProgress.deleteMany({ domainId }),
      LeaderboardSnapshot.deleteMany({ domainId })
    ]);

    await domain.deleteOne();

    return res.json({ message: "Domain deleted" });
  } catch (error) {
    return next(error);
  }
};

export const uploadFlashcards = async (req, res, next) => {
  try {
    const { domainId, cards } = req.body;

    if (!domainId || !Array.isArray(cards) || !cards.length) {
      return res.status(400).json({ message: "domainId and cards are required" });
    }

    const payload = cards.map((card) => ({
      domainId,
      topic: card.topic,
      chapterName: card.chapterName || card.topic,
      keyPoints: Array.isArray(card.keyPoints)
        ? card.keyPoints
        : card.back
          ? [card.back]
          : [],
      diagramText: card.diagramText || "",
      diagramUrl: card.diagramUrl || "",
      front: card.front || card.chapterName || card.topic,
      back: card.back || (Array.isArray(card.keyPoints) ? card.keyPoints.join("; ") : ""),
      mcqOptions: card.mcqOptions || [],
      answer: card.answer || (Array.isArray(card.keyPoints) && card.keyPoints.length ? card.keyPoints[0] : card.back),
      createdBy: req.user._id
    }));

    const docs = await Flashcard.insertMany(payload);
    return res.status(201).json({ inserted: docs.length });
  } catch (error) {
    return next(error);
  }
};

export const listFlashcardsByDomain = async (req, res, next) => {
  try {
    const { domainId } = req.params;
    const query =
      req.user?.role === "admin"
        ? { domainId }
        : {
            domainId,
            $or: [{ visibility: { $ne: "private" } }, { createdBy: req.user._id }]
          };

    const flashcards = await Flashcard.find(query).sort({ createdAt: 1 });
    return res.json(flashcards);
  } catch (error) {
    return next(error);
  }
};
