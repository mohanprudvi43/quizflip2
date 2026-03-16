import Domain from "../models/Domain.js";
import Flashcard from "../models/Flashcard.js";
import { DEFAULT_FLASHCARDS_BY_DOMAIN } from "../config/defaultFlashcards.js";

export const seedDefaultFlashcardsForAllDomains = async ({ adminUserId, overwrite = false }) => {
  const allDomains = await Domain.find().select("_id name");
  const summary = [];

  for (const domain of allDomains) {
    const templates = DEFAULT_FLASHCARDS_BY_DOMAIN[domain.name] || [];
    if (!templates.length) {
      summary.push({ domain: domain.name, inserted: 0, skipped: true, reason: "No template" });
      continue;
    }

    const existingCount = await Flashcard.countDocuments({ domainId: domain._id });
    if (!overwrite && existingCount > 0) {
      summary.push({ domain: domain.name, inserted: 0, skipped: true, reason: "Already has flashcards" });
      continue;
    }

    if (overwrite && existingCount > 0) {
      await Flashcard.deleteMany({ domainId: domain._id });
    }

    const cards = templates.map((card) => ({
      domainId: domain._id,
      createdBy: adminUserId,
      topic: card.topic,
      chapterName: card.chapterName || card.topic,
      keyPoints: Array.isArray(card.keyPoints) ? card.keyPoints : card.back ? [card.back] : [],
      diagramText: card.diagramText || "",
      diagramUrl: card.diagramUrl || "",
      front: card.front || card.chapterName || card.topic,
      back:
        card.back ||
        (Array.isArray(card.keyPoints) && card.keyPoints.length ? card.keyPoints.join("; ") : ""),
      answer:
        card.answer ||
        (Array.isArray(card.keyPoints) && card.keyPoints.length ? card.keyPoints[0] : card.back || ""),
      mcqOptions: card.mcqOptions || []
    }));

    await Flashcard.insertMany(cards);
    summary.push({ domain: domain.name, inserted: cards.length, skipped: false });
  }

  return summary;
};
