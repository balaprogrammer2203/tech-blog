import express from "express";
import compression from "compression";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import swaggerUi from "swagger-ui-express";
import type { Env } from "./config/env.js";
import { openApiDocument } from "./docs/openapi.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { createAuthRouter } from "./routes/auth.js";
import { createPostsRouter } from "./routes/posts.js";
import { createCommentsRouter } from "./routes/comments.js";
import { createLikesRouter } from "./routes/likes.js";
import { createBookmarksRouter } from "./routes/bookmarks.js";
import { createReportsRouter } from "./routes/reports.js";
import { createAdminUsersRouter } from "./routes/adminUsers.js";
import { createUploadRouter } from "./routes/upload.js";
import { createCategoriesRouter } from "./routes/categories.js";
import { createAdminCategoriesRouter } from "./routes/adminCategories.js";
import { createAdminTagsRouter } from "./routes/adminTags.js";
import { createAdminDashboardRouter } from "./routes/adminDashboard.js";
import { createTagsRouter } from "./routes/tags.js";

export function createApp(env: Env) {
  const app = express();

  const origins = [env.CLIENT_ORIGIN, env.ADMIN_ORIGIN].filter(Boolean);
  app.use(
    cors({
      origin: origins,
      credentials: true,
    })
  );

  // Swagger before Helmet so CSP does not block the UI scripts/styles
  app.use(
    "/api-docs",
    swaggerUi.serve,
    swaggerUi.setup(openApiDocument, {
      swaggerOptions: { persistAuthorization: true, docExpansion: "list" },
    })
  );
  app.get("/openapi.json", (_req, res) => res.json(openApiDocument));

  app.use(compression({ threshold: 1024 }));
  app.use(helmet());
  app.use(express.json({ limit: "2mb" }));
  app.use(cookieParser());

  app.use(
    rateLimit({
      windowMs: 60_000,
      max: env.NODE_ENV === "production" ? 120 : 600,
      standardHeaders: true,
      legacyHeaders: false,
      skip: (req) =>
        req.path === "/health" ||
        req.path === "/openapi.json" ||
        req.path.startsWith("/api-docs"),
    })
  );

  app.get("/health", (_req, res) => {
    res.json({ ok: true });
  });

  app.use("/api/auth", createAuthRouter(env));
  app.use("/api/categories", createCategoriesRouter(env));
  app.use("/api/tags", createTagsRouter(env));
  app.use("/api/posts", createPostsRouter(env));
  app.use("/api/posts/:postId/comments", createCommentsRouter(env));
  app.use("/api/posts/:postId/likes", createLikesRouter(env));
  app.use("/api/bookmarks", createBookmarksRouter(env));
  app.use("/api/reports", createReportsRouter(env));
  app.use("/api/admin/users", createAdminUsersRouter(env));
  app.use("/api/admin/categories", createAdminCategoriesRouter(env));
  app.use("/api/admin/tags", createAdminTagsRouter(env));
  app.use("/api/admin/dashboard", createAdminDashboardRouter(env));
  app.use("/api/upload", createUploadRouter(env));

  app.use(errorHandler);
  return app;
}
