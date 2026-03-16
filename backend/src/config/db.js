import mongoose from "mongoose";

const normalizeAtlasUri = (uri = "") => {
  if (!uri.startsWith("mongodb://") || !uri.includes("mongodb.net:27017,")) {
    return uri;
  }

  const match = uri.match(/^mongodb:\/\/([^@]+)@([^/]+)\/([^?]+)\??(.*)$/i);
  if (!match) return uri;

  const [, auth, hosts, dbName, query = ""] = match;
  const firstHost = String(hosts).split(",")[0] || "";
  if (!firstHost) return uri;

  const clusterHost = firstHost.replace(/-shard-\d{2}-\d{2}\./i, ".").replace(/:\d+$/, "");
  if (!clusterHost.includes(".mongodb.net")) return uri;

  const params = new URLSearchParams(query);
  params.delete("ssl");
  params.delete("authSource");
  if (!params.has("retryWrites")) params.set("retryWrites", "true");
  if (!params.has("w")) params.set("w", "majority");

  const qs = params.toString();
  return `mongodb+srv://${auth}@${clusterHost}/${dbName}${qs ? `?${qs}` : ""}`;
};

export const connectDb = async () => {
  const originalUri = process.env.MONGODB_URI || "";
  const normalizedUri = normalizeAtlasUri(originalUri);
  const candidates = normalizedUri !== originalUri ? [normalizedUri, originalUri] : [originalUri];

  let lastError;

  try {
    for (const uri of candidates) {
      try {
        await mongoose.connect(uri, {
          serverSelectionTimeoutMS: 15000,
          family: 4
        });
        console.log("MongoDB connected");
        return;
      } catch (error) {
        lastError = error;
      }
    }

    throw lastError || new Error("MongoDB connection failed");
  } catch (error) {
    console.error("Mongo connection failed:", error.message);
    process.exit(1);
  }
};
