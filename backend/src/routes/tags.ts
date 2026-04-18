import { Router } from "express";
import type { Env } from "../config/env.js";
import { Tag } from "../models/Tag.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

export function createTagsRouter(_env: Env) {
  const router = Router();

  router.get(
    "/",
    asyncHandler(async (_req, res) => {
      const items = await Tag.find().sort({ sortOrder: 1, name: 1 }).select("name slug").lean();
      res.json({
        items: items.map((t) => ({
          id: String(t._id),
          name: t.name,
          slug: t.slug,
        })),
      });
    })
  );

  return router;
}
