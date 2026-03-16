import mongoose from "mongoose";

const dailyActivitySchema = new mongoose.Schema(
  {
    learnerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    dateKey: { type: String, required: true },
    questionsSolved: { type: Number, default: 0 }
  },
  { timestamps: true }
);

dailyActivitySchema.index({ learnerId: 1, dateKey: 1 }, { unique: true });

export default mongoose.model("DailyActivity", dailyActivitySchema);
