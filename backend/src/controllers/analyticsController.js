import User from "../models/User.js";
import Domain from "../models/Domain.js";
import QuizAttempt from "../models/QuizAttempt.js";

export const getLeaderboard = async (req, res, next) => {
  try {
    const { period = "daily", domainId } = req.query;

    const users = await User.find({ role: "learner" }).sort({ points: -1 }).limit(20);

    let rows = users.map((u, i) => ({
      rank: i + 1,
      learnerId: u._id,
      name: u.name,
      points: u.points
    }));

    if (period === "domain" && domainId) {
      const domain = await Domain.findById(domainId);
      const attempts = await QuizAttempt.aggregate([
        { $match: { domainId: domain._id } },
        { $group: { _id: "$learnerId", points: { $sum: { $multiply: ["$score", 10] } } } },
        { $sort: { points: -1 } },
        { $limit: 20 }
      ]);

      const nameMap = new Map(users.map((u) => [u._id.toString(), u.name]));

      rows = attempts.map((a, i) => ({
        rank: i + 1,
        learnerId: a._id,
        name: nameMap.get(a._id.toString()) || "Learner",
        points: a.points,
        domain: domain.name
      }));
    }

    return res.json({ period, rows });
  } catch (error) {
    return next(error);
  }
};
