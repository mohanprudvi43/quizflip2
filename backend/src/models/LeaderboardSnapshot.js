import mongoose from "mongoose";

const entrySchema = new mongoose.Schema(
  {
    learnerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    learnerName: { type: String, required: true },
    points: { type: Number, required: true },
    domainId: { type: mongoose.Schema.Types.ObjectId, ref: "Domain" },
    domainName: { type: String, default: "All" }
  },
  { _id: false }
);

const leaderboardSchema = new mongoose.Schema(
  {
    period: { type: String, enum: ["daily", "weekly", "domain"], required: true },
    key: { type: String, required: true },
    entries: [entrySchema]
  },
  { timestamps: true }
);

leaderboardSchema.index({ period: 1, key: 1 }, { unique: true });

export default mongoose.model("LeaderboardSnapshot", leaderboardSchema);
