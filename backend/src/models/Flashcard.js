import mongoose from "mongoose";

const authoredQuizSchema = new mongoose.Schema(
  {
    enabled: { type: Boolean, default: false },
    type: { type: String, enum: ["mcq", "fill_blank"], default: "mcq" },
    prompt: { type: String, default: "" },
    options: [{ type: String }],
    answer: { type: String, default: "" }
  },
  { _id: false }
);

const flashcardSchema = new mongoose.Schema(
  {
    domainId: { type: mongoose.Schema.Types.ObjectId, ref: "Domain", required: true },
    subject: { type: String, default: "" },
    chapter: { type: String, default: "" },
    concept_title: { type: String, default: "" },
    definition: { type: String, default: "" },
    key_points: [{ type: String }],
    short_explanation: { type: String, default: "" },
    diagram: { type: String, default: "" },
    memory_trick: { type: String, default: "" },
    layout_json: { type: mongoose.Schema.Types.Mixed, default: [] },
    topic: { type: String, required: true },
    chapterName: { type: String, default: "" },
    keyPoints: [{ type: String }],
    diagramText: { type: String, default: "" },
    diagramUrl: { type: String, default: "" },
    front: { type: String, required: true },
    back: { type: String, required: true },
    mcqOptions: [{ type: String }],
    answer: { type: String, required: true },
    authoredQuiz: { type: authoredQuizSchema, default: () => ({ enabled: false, type: "mcq", options: [] }) },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }
  },
  { timestamps: true }
);

export default mongoose.model("Flashcard", flashcardSchema);
