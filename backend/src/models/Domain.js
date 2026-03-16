import mongoose from "mongoose";

const domainSchema = new mongoose.Schema(
  {
    category: { type: String, required: true },
    name: { type: String, required: true, unique: true },
    description: { type: String, default: "" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    popularityScore: { type: Number, default: 0 }
  },
  { timestamps: true }
);

export default mongoose.model("Domain", domainSchema);
