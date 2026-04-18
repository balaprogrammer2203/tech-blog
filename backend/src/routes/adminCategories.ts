import { Router, type Response } from "express";
import mongoose from "mongoose";
import type { Env } from "../config/env.js";
import { Category } from "../models/Category.js";
import { Post } from "../models/Post.js";
import { slugify } from "../utils/slug.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { HttpError } from "../middleware/errorHandler.js";
import { authMiddleware, requireAdmin } from "../middleware/auth.js";
import {
  adminCategoryCreateSchema,
  adminCategoryExportByIdsSchema,
  adminCategoryListQuerySchema,
  adminCategoryUpdateSchema,
} from "../validators/schemas.js";

const admin = (env: Env) => [authMiddleware(env), requireAdmin];

async function uniqueCategorySlug(base: string): Promise<string> {
  let slug = base.slice(0, 96);
  for (let i = 0; i < 8; i++) {
    const exists = await Category.exists({ slug });
    if (!exists) return slug;
    slug = `${base.slice(0, 80)}-${Math.random().toString(36).slice(2, 6)}`.slice(0, 96);
  }
  return `${base.slice(0, 80)}-${Date.now().toString(36)}`.slice(0, 96);
}

function csvEscape(val: string | number | undefined | null): string {
  const s = val === undefined || val === null ? "" : String(val);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function buildListMatch(q: string | undefined, level: string, parentId: string | undefined): Record<string, unknown> {
  const filter: Record<string, unknown> = {};
  const trimmed = q?.trim();
  if (trimmed) {
    const re = new RegExp(trimmed.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    filter.$or = [{ name: re }, { slug: re }];
  }
  if (parentId && mongoose.isValidObjectId(parentId)) {
    filter.parent = new mongoose.Types.ObjectId(parentId);
  } else {
    if (level === "root") filter.parent = null;
    else if (level === "child") filter.parent = { $ne: null };
  }
  return filter;
}

type CategoryExportAggRow = {
  _id: mongoose.Types.ObjectId;
  name: string;
  slug: string;
  parent: mongoose.Types.ObjectId | null;
  description?: string;
  sortOrder: number;
  createdAt: Date;
  parentName?: string;
  parentIdStr: string;
  level: number;
  postCount: number;
};

function exportPipeline(match: Record<string, unknown>, rowLimit: number): mongoose.PipelineStage[] {
  return [
    { $match: match },
    {
      $lookup: {
        from: "categories",
        localField: "parent",
        foreignField: "_id",
        as: "_p",
      },
    },
    {
      $addFields: {
        parentName: { $arrayElemAt: ["$_p.name", 0] },
        parentIdStr: {
          $cond: [{ $eq: [{ $size: "$_p" }, 0] }, "", { $toString: { $arrayElemAt: ["$_p._id", 0] } }],
        },
        level: { $cond: [{ $eq: ["$parent", null] }, 0, 1] },
      },
    },
    {
      $lookup: {
        from: "posts",
        let: { cid: "$_id" },
        pipeline: [{ $match: { $expr: { $eq: ["$category", "$$cid"] } } }, { $count: "c" }],
        as: "_cnt",
      },
    },
    { $addFields: { postCount: { $ifNull: [{ $arrayElemAt: ["$_cnt.c", 0] }, 0] } } },
    { $project: { _p: 0, _cnt: 0 } },
    { $sort: { sortOrder: 1, name: 1 } },
    { $limit: rowLimit },
  ];
}

function exportRowsToCsv(rows: CategoryExportAggRow[]): string {
  const header = ["id", "name", "slug", "level", "parentId", "parentName", "postCount", "sortOrder", "description", "createdAt"];
  const lines = [
    header.join(","),
    ...rows.map((r) =>
      [
        csvEscape(String(r._id)),
        csvEscape(r.name),
        csvEscape(r.slug),
        csvEscape(r.level),
        csvEscape(r.parentIdStr || ""),
        csvEscape(r.parentName ?? ""),
        csvEscape(r.postCount),
        csvEscape(r.sortOrder ?? 0),
        csvEscape(r.description ?? ""),
        csvEscape(r.createdAt?.toISOString?.() ?? ""),
      ].join(",")
    ),
  ];
  return lines.join("\n");
}

async function sendCategoriesCsv(res: Response, filename: string, match: Record<string, unknown>, rowLimit: number): Promise<void> {
  const rows = await Category.aggregate<CategoryExportAggRow>(exportPipeline(match, rowLimit));
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.send(exportRowsToCsv(rows));
}

function uniqueObjectIdsFromStrings(ids: string[]): mongoose.Types.ObjectId[] {
  const seen = new Set<string>();
  const out: mongoose.Types.ObjectId[] = [];
  for (const id of ids) {
    if (!mongoose.isValidObjectId(id)) continue;
    const s = String(id);
    if (seen.has(s)) continue;
    seen.add(s);
    out.push(new mongoose.Types.ObjectId(s));
  }
  return out;
}

export function createAdminCategoriesRouter(env: Env) {
  const router = Router();

  router.get(
    "/export",
    ...admin(env),
    asyncHandler(async (req, res) => {
      const raw = adminCategoryListQuerySchema.partial().parse(req.query);
      const level = raw.level ?? "all";
      const q = raw.q;
      const parentId = raw.parentId;
      const match = buildListMatch(q, level, parentId);
      await sendCategoriesCsv(res, "categories.csv", match, 2000);
    })
  );

  router.post(
    "/export",
    ...admin(env),
    asyncHandler(async (req, res) => {
      const { ids } = adminCategoryExportByIdsSchema.parse(req.body);
      const oids = uniqueObjectIdsFromStrings(ids);
      if (!oids.length) throw new HttpError(400, "No valid category ids");
      await sendCategoriesCsv(res, "categories-selected.csv", { _id: { $in: oids } }, oids.length);
    })
  );

  router.get(
    "/",
    ...admin(env),
    asyncHandler(async (req, res) => {
      const query = adminCategoryListQuerySchema.parse(req.query);
      const skip = (query.page - 1) * query.limit;
      const match = buildListMatch(query.q, query.level, query.parentId);
      const sortDir = query.sortOrder === "desc" ? -1 : 1;
      const sortField = query.sortField;
      const sortObj: Record<string, 1 | -1> = { [sortField]: sortDir };
      if (sortField !== "name") sortObj.name = 1;

      const pipeline: mongoose.PipelineStage[] = [
        { $match: match },
        {
          $lookup: {
            from: "categories",
            localField: "parent",
            foreignField: "_id",
            as: "_p",
          },
        },
        {
          $addFields: {
            parentName: { $arrayElemAt: ["$_p.name", 0] },
            parentSlug: { $arrayElemAt: ["$_p.slug", 0] },
            level: { $cond: [{ $eq: ["$parent", null] }, 0, 1] },
          },
        },
        {
          $lookup: {
            from: "posts",
            let: { cid: "$_id" },
            pipeline: [{ $match: { $expr: { $eq: ["$category", "$$cid"] } } }, { $count: "c" }],
            as: "_cnt",
          },
        },
        { $addFields: { postCount: { $ifNull: [{ $arrayElemAt: ["$_cnt.c", 0] }, 0] } } },
        { $project: { _p: 0, _cnt: 0 } },
        {
          $facet: {
            data: [{ $sort: sortObj }, { $skip: skip }, { $limit: query.limit }],
            meta: [{ $count: "total" }],
          },
        },
      ];

      const agg = await Category.aggregate<{ data: unknown[]; meta: { total: number }[] }>(pipeline);
      const bucket = agg[0] ?? { data: [], meta: [] };
      const total = bucket.meta[0]?.total ?? 0;
      const items = (bucket.data as Record<string, unknown>[]).map((r) => ({
        id: String(r._id),
        name: r.name as string,
        slug: r.slug as string,
        level: r.level as number,
        parentId: r.parent ? String(r.parent) : null,
        parentName: (r.parentName as string | undefined) ?? null,
        parentSlug: (r.parentSlug as string | undefined) ?? null,
        postCount: r.postCount as number,
        sortOrder: r.sortOrder as number,
        description: (r.description as string | undefined) ?? null,
        createdAt: r.createdAt as Date,
        updatedAt: r.updatedAt as Date,
      }));

      res.json({
        items,
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit) || 1,
      });
    })
  );

  router.get(
    "/:id",
    ...admin(env),
    asyncHandler(async (req, res) => {
      const id = req.params.id;
      if (!mongoose.isValidObjectId(id)) throw new HttpError(400, "Invalid id");
      const cat = await Category.findById(id).populate("parent", "name slug").lean();
      if (!cat) throw new HttpError(404, "Not found");
      const postCount = await Post.countDocuments({ category: id });
      const childCount = await Category.countDocuments({ parent: id });
      const parentDoc =
        cat.parent && typeof cat.parent === "object" && "_id" in cat.parent
          ? (cat.parent as unknown as { _id: mongoose.Types.ObjectId; name: string; slug: string })
          : null;
      const parentIdStr = parentDoc ? String(parentDoc._id) : cat.parent ? String(cat.parent) : null;
      res.json({
        id: String(cat._id),
        name: cat.name,
        slug: cat.slug,
        parentId: parentIdStr,
        parent: parentDoc
          ? {
              id: String(parentDoc._id),
              name: parentDoc.name,
              slug: parentDoc.slug,
            }
          : null,
        level: cat.parent ? 1 : 0,
        description: cat.description ?? null,
        sortOrder: cat.sortOrder ?? 0,
        postCount,
        childCount,
        createdAt: cat.createdAt,
        updatedAt: cat.updatedAt,
      });
    })
  );

  router.post(
    "/",
    ...admin(env),
    asyncHandler(async (req, res) => {
      const body = adminCategoryCreateSchema.parse(req.body);
      const slugBase = body.slug?.trim() ? slugify(body.slug) : slugify(body.name);
      const slug = await uniqueCategorySlug(slugBase);
      let parent: mongoose.Types.ObjectId | null = null;
      if (body.parentId && mongoose.isValidObjectId(body.parentId)) {
        const p = await Category.findById(body.parentId).lean();
        if (!p || p.parent != null) throw new HttpError(400, "parentId must reference a root category");
        parent = p._id;
      }
      const doc = await Category.create({
        name: body.name.trim(),
        slug,
        parent,
        description: body.description?.trim(),
        sortOrder: body.sortOrder ?? 0,
      });
      res.status(201).json({ id: String(doc._id), slug: doc.slug });
    })
  );

  router.patch(
    "/:id",
    ...admin(env),
    asyncHandler(async (req, res) => {
      const id = req.params.id;
      if (!mongoose.isValidObjectId(id)) throw new HttpError(400, "Invalid id");
      const body = adminCategoryUpdateSchema.parse(req.body);
      const cat = await Category.findById(id);
      if (!cat) throw new HttpError(404, "Not found");

      if (body.name !== undefined) cat.name = body.name.trim();
      if (body.description !== undefined) cat.description = body.description?.trim();
      if (body.sortOrder !== undefined) cat.sortOrder = body.sortOrder;

      if (body.slug !== undefined && body.slug.trim()) {
        const next = slugify(body.slug).slice(0, 96);
        if (next !== cat.slug) {
          const taken = await Category.exists({ slug: next, _id: { $ne: cat._id } });
          if (taken) throw new HttpError(409, "Slug already in use");
          cat.slug = next;
        }
      }

      if (body.parentId !== undefined) {
        if (cat.parent == null) {
          if (body.parentId != null && String(body.parentId) !== "") {
            throw new HttpError(400, "Cannot assign a parent to a root category");
          }
        } else {
          if (body.parentId == null || String(body.parentId) === "") {
            throw new HttpError(400, "Subcategories must keep a root parent");
          }
          if (!mongoose.isValidObjectId(body.parentId)) throw new HttpError(400, "Invalid parentId");
          const p = await Category.findById(body.parentId).lean();
          if (!p || p.parent != null) throw new HttpError(400, "parentId must reference a root category");
          cat.parent = p._id;
        }
      }

      await cat.save();
      res.json({ id: String(cat._id), slug: cat.slug });
    })
  );

  router.delete(
    "/:id",
    ...admin(env),
    asyncHandler(async (req, res) => {
      const id = req.params.id;
      if (!mongoose.isValidObjectId(id)) throw new HttpError(400, "Invalid id");
      const children = await Category.countDocuments({ parent: id });
      if (children > 0) throw new HttpError(400, "Delete child categories first");
      const posts = await Post.countDocuments({ category: id });
      if (posts > 0) throw new HttpError(400, `Cannot delete: ${posts} post(s) use this category`);
      const deleted = await Category.findByIdAndDelete(id);
      if (!deleted) throw new HttpError(404, "Not found");
      res.status(204).end();
    })
  );

  return router;
}
