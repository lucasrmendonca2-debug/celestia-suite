import mongoose from "mongoose";
import { env } from "../config/env.js";
import { logger } from "../bot/utils/logger.js";

let connected = false;

export async function connectDatabase() {
  if (connected) return;
  mongoose.set("strictQuery", true);
  await mongoose.connect(env.MONGO_URI);
  connected = true;
  logger.info("✅ MongoDB conectado");
}

export async function disconnectDatabase() {
  if (!connected) return;
  await mongoose.disconnect();
  connected = false;
}

export { mongoose };
