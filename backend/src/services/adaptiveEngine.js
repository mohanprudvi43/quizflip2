import { CONFIDENCE } from "../config/constants.js";

export const buildQuestionFromFlashcard = (flashcard, index = 0) => {
  const chapter = flashcard.chapterName || flashcard.topic;
  const keyPoint =
    Array.isArray(flashcard.keyPoints) && flashcard.keyPoints.length
      ? flashcard.keyPoints[0]
      : flashcard.answer;
  const isMcq = index % 2 === 0;
  if (isMcq) {
    const options = flashcard.mcqOptions?.length
      ? flashcard.mcqOptions
      : [keyPoint, "Core definition", "Optional concept", "Extended example"];

    return {
      flashcardId: flashcard._id,
      type: "mcq",
      prompt: `In chapter \"${chapter}\", which key point is correct?`,
      options,
      answer: keyPoint,
      topic: flashcard.topic
    };
  }

  return {
    flashcardId: flashcard._id,
    type: "fill_blank",
    prompt: `Chapter \"${chapter}\": one key point is ____`,
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
