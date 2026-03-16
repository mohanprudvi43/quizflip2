import mongoose from "mongoose";

const answerSchema = new mongoose.Schema(
  {
    flashcardId: { type: mongoose.Schema.Types.ObjectId, ref: "Flashcard", required: true },
    questionType: { type: String, enum: ["mcq", "fill_blank"], required: true },
    prompt: { type: String, required: true },
    userAnswer: { type: String, default: "" },
    correctAnswer: { type: String, required: true },
    isCorrect: { type: Boolean, required: true },
    confidence: { type: String, enum: ["Hard", "Medium", "Easy"], required: true },
    topic: { type: String, required: true }
  },
  { _id: false }
);

const quizAttemptSchema = new mongoose.Schema(
  {
    learnerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    domainId: { type: mongoose.Schema.Types.ObjectId, ref: "Domain", required: true },
    source: {
      type: String,
      enum: ["auto_10_percent", "practice_hard", "practice_medium", "practice_easy", "weak_topics"],
      default: "auto_10_percent"
    },
    score: { type: Number, required: true },
    totalQuestions: { type: Number, required: true },
    accuracy: { type: Number, required: true },
    timeTakenSeconds: { type: Number, default: 0 },
    answers: [answerSchema]
  },
  { timestamps: true }
);

export default mongoose.model("QuizAttempt", quizAttemptSchema);
