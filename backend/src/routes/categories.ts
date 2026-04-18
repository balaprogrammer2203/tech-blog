import { Router } from "express";
import type { Env } from "../config/env.js";
import { Category } from "../models/Category.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

export function createCategoriesRouter(_env: Env) {
  const router = Router();

  router.get(
    "/",
    asyncHandler(async (_req, res) => {
      const roots = await Category.find({ parent: null }).sort({ sortOrder: 1, name: 1 }).lean();
      const children = await Category.find({ parent: { $ne: null } })
        .sort({ sortOrder: 1, name: 1 })
        .populate("parent", "name slug")
        .lean();

      const byParent = new Map<string, typeof children>();
      for (const ch of children) {
        const rawParent = ch.parent as unknown;
        const pid =
          rawParent && typeof rawParent === "object" && "_id" in rawParent
            ? String((rawParent as { _id: { toString(): string } })._id)
            : String(rawParent);
        const list = byParent.get(pid) ?? [];
        list.push(ch);
        byParent.set(pid, list);
      }

      res.json({
        roots: roots.map((r) => ({
          id: String(r._id),
          name: r.name,
          slug: r.slug,
          description: r.description ?? undefined,
          children: (byParent.get(String(r._id)) ?? []).map((c) => ({
            id: String(c._id),
            name: c.name,
            slug: c.slug,
            description: c.description ?? undefined,
            parent:
              c.parent && typeof c.parent === "object" && "slug" in c.parent
                ? {
                    slug: (c.parent as unknown as { slug: string }).slug,
                    name: (c.parent as unknown as { name: string }).name,
                  }
                : undefined,
          })),
        })),
      });
    })
  );

  return router;
}
