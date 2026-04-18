import mongoose from "mongoose";
import { loadEnv } from "./config/env.js";
import { createApp } from "./app.js";

const env = loadEnv();

mongoose.set("strictQuery", true);

await mongoose.connect(env.MONGODB_URI, {
  maxPoolSize: env.MONGODB_MAX_POOL_SIZE,
  serverSelectionTimeoutMS: 10_000,
});

const app = createApp(env);
app.listen(env.PORT, () => {
  console.log(`API listening on :${env.PORT}`);
});
