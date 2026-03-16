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
    const total = await Flashcard.countDocuments({ domainId });

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

const pickPracticeFlashcards = async (progress, domainId, mode) => {
  const viewedSet = new Set(progress.viewedFlashcards.map((id) => id.toString()));
  const reviewedIds = progress.reviewStates.map((s) => s.flashcardId.toString());
  const dueReviewIds = progress.reviewStates
    .filter((s) => s.nextDueQuiz <= progress.quizCounter + 1)
    .map((s) => s.flashcardId.toString());

  if (mode === "weak_topics" && progress.weakTopics.length) {
    return Flashcard.find({ domainId, topic: { $in: progress.weakTopics } }).limit(15);
  }

  if (["practice_hard", "practice_medium", "practice_easy"].includes(mode)) {
    const bucket = mode === "practice_hard" ? "Hard" : mode === "practice_medium" ? "Medium" : "Easy";
    const bucketIds = progress.reviewStates
      .filter((s) => s.difficultyBucket === bucket)
      .map((s) => s.flashcardId);
    if (bucketIds.length) {
      return Flashcard.find({ _id: { $in: bucketIds } }).limit(15);
    }
  }

  if (mode === "auto_10_percent") {
    const dueIds = dueReviewIds.filter((id) => viewedSet.has(id));
    const dueCards = dueIds.length
      ? await Flashcard.find({ _id: { $in: dueIds }, domainId }).limit(15)
      : [];

    if (dueCards.length >= 10) {
      return dueCards.slice(0, 15);
    }

    const remainingSlots = 15 - dueCards.length;
    const viewedOnlyIds = [...viewedSet].filter((id) => !dueIds.includes(id));
    if (viewedOnlyIds.length) {
      const viewedCards = await Flashcard.find({ _id: { $in: viewedOnlyIds }, domainId }).limit(remainingSlots);
      return [...dueCards, ...viewedCards].slice(0, 15);
    }

    return dueCards;
  }

  const fallbackIds = reviewedIds.length ? reviewedIds : [...viewedSet];
  if (fallbackIds.length) {
    return Flashcard.find({ _id: { $in: fallbackIds } }).limit(15);
  }

  return Flashcard.find({ domainId }).limit(15);
};

export const generateQuiz = async (req, res, next) => {
  try {
    const { domainId, source = "auto_10_percent" } = req.body;
    const progress = await getOrCreateProgress(req.user._id, domainId);

    const cards = await pickPracticeFlashcards(progress, domainId, source);
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
