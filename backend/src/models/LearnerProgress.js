import mongoose from "mongoose";

const reviewStateSchema = new mongoose.Schema(
  {
    flashcardId: { type: mongoose.Schema.Types.ObjectId, ref: "Flashcard", required: true },
    nextDueQuiz: { type: Number, default: 0 },
    interval: { type: Number, default: 0 },
    difficultyBucket: { type: String, enum: ["Hard", "Medium", "Easy"], default: "Medium" },
    incorrectCount: { type: Number, default: 0 },
    seenCount: { type: Number, default: 0 }
  },
  { _id: false }
);

const progressSchema = new mongoose.Schema(
  {
    learnerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    domainId: { type: mongoose.Schema.Types.ObjectId, ref: "Domain", required: true },
    viewedFlashcards: [{ type: mongoose.Schema.Types.ObjectId, ref: "Flashcard" }],
    timeSpentSeconds: { type: Number, default: 0 },
    progressPercent: { type: Number, default: 0 },
    quizzesTaken: { type: Number, default: 0 },
    totalQuestionsAnswered: { type: Number, default: 0 },
    totalCorrectAnswers: { type: Number, default: 0 },
    weakTopics: [{ type: String }],
    quizCounter: { type: Number, default: 0 },
    lastQuizMilestone: { type: Number, default: 0 },
    reviewStates: [reviewStateSchema]
  },
  { timestamps: true }
);

progressSchema.index({ learnerId: 1, domainId: 1 }, { unique: true });

export default mongoose.model("LearnerProgress", progressSchema);
