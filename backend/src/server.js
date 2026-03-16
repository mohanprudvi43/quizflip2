import dotenv from "dotenv";
import { connectDb } from "./config/db.js";
import { bootstrapSystem } from "./config/bootstrap.js";
import { app } from "./app.js";

dotenv.config();

const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || "0.0.0.0";

const start = async () => {
  await connectDb();
  await bootstrapSystem();

  app.listen(PORT, HOST, () => {
    console.log(`Backend running on http://localhost:${PORT}`);
    console.log(`Backend LAN access: http://<your-local-ip>:${PORT}`);
  });
};

start();
