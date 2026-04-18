import { Router } from "express";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import type { Env } from "../config/env.js";
import { authMiddleware } from "../middleware/auth.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { HttpError } from "../middleware/errorHandler.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024, files: 1 },
});

function cloudinaryConfigured(env: Env): boolean {
  return Boolean(env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET);
}

export function createUploadRouter(env: Env) {
  const router = Router();
  const requireUser = authMiddleware(env);

  if (cloudinaryConfigured(env)) {
    cloudinary.config({
      cloud_name: env.CLOUDINARY_CLOUD_NAME,
      api_key: env.CLOUDINARY_API_KEY,
      api_secret: env.CLOUDINARY_API_SECRET,
    });
  }

  router.post(
    "/image",
    requireUser,
    upload.single("file"),
    asyncHandler(async (req, res) => {
      if (!cloudinaryConfigured(env)) {
        throw new HttpError(503, "Image upload not configured");
      }
      const file = req.file;
      if (!file?.buffer) throw new HttpError(400, "Missing file");
      const folder = env.NODE_ENV === "production" ? "tech-blog/prod" : "tech-blog/dev";
      const result = await new Promise<{ secure_url: string }>((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream({ folder, resource_type: "image" }, (err, callResult) => {
          if (err || !callResult?.secure_url) reject(err ?? new Error("Upload failed"));
          else resolve({ secure_url: callResult.secure_url });
        });
        stream.end(file.buffer);
      });
      res.json({ url: result.secure_url });
    })
  );

  return router;
}
