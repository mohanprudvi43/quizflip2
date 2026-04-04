import { CONFIDENCE } from "../config/constants.js";

const normalizeValue = (value = "") => String(value).trim().toLowerCase().replace(/\s+/g, " ");

const uniqueOptions = (items = []) => {
  const seen = new Set();
  const out = [];

  items.forEach((item) => {
    const text = String(item || "").trim();
    if (!text) return;
    const key = normalizeValue(text);
    if (seen.has(key)) return;
    seen.add(key);
    out.push(text);
  });

  return out;
};

const buildFallbackOptions = (flashcard, answer) => {
  const keyPoints = Array.isArray(flashcard.keyPoints) ? flashcard.keyPoints : [];
  const definitionParts = String(flashcard.definition || "")
    .split(/[.;]+/)
    .map((part) => part.trim())
    .filter(Boolean);

  const candidates = uniqueOptions([
    ...keyPoints,
    ...definitionParts,
    flashcard.back,
    flashcard.short_explanation,
    `A common confusion with ${flashcard.topic || "this concept"}`,
    `An incomplete statement about ${flashcard.chapterName || flashcard.topic || "the chapter"}`
  ]).filter((item) => normalizeValue(item) !== normalizeValue(answer));

  return uniqueOptions([answer, ...candidates]).slice(0, 4);
};

export const buildQuestionFromFlashcard = (flashcard, index = 0) => {
  const authored = flashcard.authoredQuiz || {};
  if (authored.enabled && authored.prompt && authored.answer) {
    const authoredType = authored.type === "fill_blank" ? "fill_blank" : "mcq";
    const authoredOptions = authoredType === "mcq" ? uniqueOptions(authored.options || []).slice(0, 4) : [];
    return {
      flashcardId: flashcard._id,
      type: authoredType,
      prompt: authored.prompt,
      options: authoredOptions,
      answer: authored.answer,
      topic: flashcard.topic
    };
  }

  const chapter = flashcard.chapterName || flashcard.topic;
  const keyPoint =
    Array.isArray(flashcard.keyPoints) && flashcard.keyPoints.length
      ? flashcard.keyPoints[0]
      : flashcard.answer;
  const isMcq = index % 2 === 0;
  if (isMcq) {
    const options = flashcard.mcqOptions?.length
      ? uniqueOptions(flashcard.mcqOptions).slice(0, 4)
      : buildFallbackOptions(flashcard, keyPoint);

    return {
      flashcardId: flashcard._id,
      type: "mcq",
      prompt: `Which statement is most accurate about ${flashcard.topic || "this concept"} in ${chapter}?`,
      options,
      answer: keyPoint,
      topic: flashcard.topic
    };
  }

  return {
    flashcardId: flashcard._id,
    type: "fill_blank",
    prompt: `Complete the key idea from ${chapter}: ____`,
    options: [],
    answer: keyPoint,
    topic: flashcard.topic
  };
};

export const applySpacedRepetition = (state, confidence) => {
  if (confidence === CONFIDENCE.HARD) {
    return {
      ...state,
      interval: 0,
      nextDueQuiz: state.nextDueQuiz + 1,
      difficultyBucket: CONFIDENCE.HARD
    };
  }

  if (confidence === CONFIDENCE.MEDIUM) {
    return {
      ...state,
      interval: 1,
      nextDueQuiz: state.nextDueQuiz + 2,
      difficultyBucket: CONFIDENCE.MEDIUM
    };
  }

  return {
    ...state,
    interval: 2,
    nextDueQuiz: state.nextDueQuiz + 4,
    difficultyBucket: CONFIDENCE.EASY
  };
};

export const scoreWeakTopics = (answers) => {
  const stats = {};

  answers.forEach((ans) => {
    if (!stats[ans.topic]) {
      stats[ans.topic] = { wrong: 0, total: 0 };
    }
    stats[ans.topic].total += 1;
    if (!ans.isCorrect) stats[ans.topic].wrong += 1;
  });

  return Object.entries(stats)
    .filter(([, value]) => value.wrong > 0)
    .sort((a, b) => b[1].wrong - a[1].wrong)
    .map(([topic]) => topic)
    .slice(0, 5);
};
