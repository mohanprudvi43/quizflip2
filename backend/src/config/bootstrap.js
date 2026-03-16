import User from "../models/User.js";
import Domain from "../models/Domain.js";
import { DEFAULT_DOMAINS } from "./constants.js";
import { seedDefaultFlashcardsForAllDomains } from "../services/flashcardSeedService.js";

export const bootstrapSystem = async () => {
  const adminEmail = process.env.ADMIN_BOOTSTRAP_EMAIL;
  const adminPassword = process.env.ADMIN_BOOTSTRAP_PASSWORD;
  let adminUser = null;

  if (adminEmail && adminPassword) {
    const exists = await User.findOne({ email: adminEmail });
    if (!exists) {
      adminUser = await User.create({
        name: "System Admin",
        email: adminEmail,
        password: adminPassword,
        role: "admin"
      });
      console.log("Default admin created");
    } else {
      exists.role = "admin";
      exists.password = adminPassword;
      await exists.save();
      adminUser = exists;
      console.log("Configured admin credentials synchronized");
    }

    const demoted = await User.updateMany(
      { role: "admin", email: { $ne: adminEmail } },
      { $set: { role: "learner" } }
    );
    if (demoted.modifiedCount > 0) {
      console.log(`Demoted ${demoted.modifiedCount} non-configured admin account(s)`);
    }
  }

  if (!adminUser) {
    adminUser = await User.findOne({ role: "admin" });
  }

  const existingDomains = await Domain.countDocuments();
  if (existingDomains === 0) {
    const rows = [];
    DEFAULT_DOMAINS.forEach((group) => {
      group.domains.forEach((name) => rows.push({ category: group.category, name }));
    });
    await Domain.insertMany(rows);
    console.log("Default domains seeded");
  }

  if (!adminUser) {
    console.log("No admin available for default flashcard seeding");
    return;
  }

  const result = await seedDefaultFlashcardsForAllDomains({ adminUserId: adminUser._id, overwrite: false });
  result
    .filter((r) => !r.skipped)
    .forEach((r) => console.log(`Seeded ${r.inserted} flashcards for ${r.domain}`));
};
