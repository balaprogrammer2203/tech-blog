import { Router, type Response } from "express";
import mongoose from "mongoose";
import type { Env } from "../config/env.js";
import { Tag } from "../models/Tag.js";
import { Post } from "../models/Post.js";
import { slugify } from "../utils/slug.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { HttpError } from "../middleware/errorHandler.js";
import { authMiddleware, requireAdmin } from "../middleware/auth.js";
import {
  adminTagCreateSchema,
  adminTagExportByIdsSchema,
  adminTagListQuerySchema,
  adminTagUpdateSchema,
} from "../validators/schemas.js";
import { bustPostCachesForTag, syncEmbeddedTagLabelsOnPosts } from "../utils/tag.js";

const admin = (env: Env) => [authMiddleware(env), requireAdmin];

async function uniqueTagSlug(base: string): Promise<string> {
  let slug = base.slice(0, 96);
  for (let i = 0; i < 8; i++) {
    const exists = await Tag.exists({ slug });
    if (!exists) return slug;
    slug = `${base.slice(0, 80)}-${Math.random().toString(36).slice(2, 6)}`.slice(0, 96);
  }
  return `${base.slice(0, 80)}-${Date.now().toString(36)}`.slice(0, 96);
}

function csvEscape(val: string | number | undefined | null): string {
  const s = val === undefined || null ? "" : String(val);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function buildListMatch(q: string | undefined): Record<string, unknown> {
  const filter: Record<string, unknown> = {};
  const trimmed = q?.trim();
  if (trimmed) {
    const re = new RegExp(trimmed.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    filter.$or = [{ name: re }, { slug: re }];
  }
  return filter;
}

type TagExportRow = {
  _id: mongoose.Types.ObjectId;
  name: string;
  slug: string;
  description?: string;
  sortOrder: number;
  createdAt: Date;
  postCount: number;
};

function exportPipeline(match: Record<string, unknown>, rowLimit: number): mongoose.PipelineStage[] {
  return [
    { $match: match },
    {
      $lookup: {
        from: "posts",
        let: { tid: "$_id" },
        pipeline: [{ $match: { $expr: { $in: ["$$tid", "$tags"] } } }, { $count: "c" }],
        as: "_cnt",
      },
    },
    { $addFields: { postCount: { $ifNull: [{ $arrayElemAt: ["$_cnt.c", 0] }, 0] } } },
    { $project: { _cnt: 0 } },
    { $sort: { sortOrder: 1, name: 1 } },
    { $limit: rowLimit },
  ];
}

function exportRowsToCsv(rows: TagExportRow[]): string {
  const header = ["id", "name", "slug", "postCount", "sortOrder", "description", "createdAt"];
  const lines = [
    header.join(","),
    ...rows.map((r) =>
      [
        csvEscape(String(r._id)),
        csvEscape(r.name),
        csvEscape(r.slug),
        csvEscape(r.postCount),
        csvEscape(r.sortOrder ?? 0),
        csvEscape(r.description ?? ""),
        csvEscape(r.createdAt?.toISOString?.() ?? ""),
      ].join(",")
    ),
  ];
  return lines.join("\n");
}

async function sendTagsCsv(res: Response, filename: string, match: Record<string, unknown>, rowLimit: number): Promise<void> {
  const rows = await Tag.aggregate<TagExportRow>(exportPipeline(match, rowLimit));
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

export function createAdminTagsRouter(env: Env) {
  const router = Router();

  router.get(
    "/export",
    ...admin(env),
    asyncHandler(async (req, res) => {
      const raw = adminTagListQuerySchema.partial().parse(req.query);
      const match = buildListMatch(raw.q);
      await sendTagsCsv(res, "tags.csv", match, 2000);
    })
  );

  router.post(
    "/export",
    ...admin(env),
    asyncHandler(async (req, res) => {
      const { ids } = adminTagExportByIdsSchema.parse(req.body);
      const oids = uniqueObjectIdsFromStrings(ids);
      if (!oids.length) throw new HttpError(400, "No valid tag ids");
      await sendTagsCsv(res, "tags-selected.csv", { _id: { $in: oids } }, oids.length);
    })
  );

  router.get(
    "/",
    ...admin(env),
    asyncHandler(async (req, res) => {
      const query = adminTagListQuerySchema.parse(req.query);
      const skip = (query.page - 1) * query.limit;
      const match = buildListMatch(query.q);
      const sortDir = query.sortOrder === "desc" ? -1 : 1;
      const sortField = query.sortField;
      const sortObj: Record<string, 1 | -1> = { [sortField]: sortDir };
      if (sortField !== "name") sortObj.name = 1;

      const pipeline: mongoose.PipelineStage[] = [
        { $match: match },
        {
          $lookup: {
            from: "posts",
            let: { tid: "$_id" },
            pipeline: [{ $match: { $expr: { $in: ["$$tid", "$tags"] } } }, { $count: "c" }],
            as: "_cnt",
          },
        },
        { $addFields: { postCount: { $ifNull: [{ $arrayElemAt: ["$_cnt.c", 0] }, 0] } } },
        { $project: { _cnt: 0 } },
        {
          $facet: {
            data: [{ $sort: sortObj }, { $skip: skip }, { $limit: query.limit }],
            meta: [{ $count: "total" }],
          },
        },
      ];

      const agg = await Tag.aggregate<{ data: unknown[]; meta: { total: number }[] }>(pipeline);
      const bucket = agg[0] ?? { data: [], meta: [] };
      const total = bucket.meta[0]?.total ?? 0;
      const items = (bucket.data as Record<string, unknown>[]).map((r) => ({
        id: String(r._id),
        name: r.name as string,
        slug: r.slug as string,
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
      const tag = await Tag.findById(id).lean();
      if (!tag) throw new HttpError(404, "Not found");
      const postCount = await Post.countDocuments({ "tags.tagId": id });
      res.json({
        id: String(tag._id),
        name: tag.name,
        slug: tag.slug,
        description: tag.description ?? null,
        sortOrder: tag.sortOrder ?? 0,
        postCount,
        createdAt: tag.createdAt,
        updatedAt: tag.updatedAt,
      });
    })
  );

  router.post(
    "/",
    ...admin(env),
    asyncHandler(async (req, res) => {
      const body = adminTagCreateSchema.parse(req.body);
      const slugBase = body.slug?.trim() ? slugify(body.slug) : slugify(body.name);
      const slug = await uniqueTagSlug(slugBase);
      const doc = await Tag.create({
        name: body.name.trim(),
        slug,
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
      const body = adminTagUpdateSchema.parse(req.body);
      const tag = await Tag.findById(id);
      if (!tag) throw new HttpError(404, "Not found");

      if (body.name !== undefined) tag.name = body.name.trim();
      if (body.description !== undefined) tag.description = body.description?.trim();
      if (body.sortOrder !== undefined) tag.sortOrder = body.sortOrder;

      if (body.slug !== undefined && body.slug.trim()) {
        const next = slugify(body.slug).slice(0, 96);
        if (next !== tag.slug) {
          const taken = await Tag.exists({ slug: next, _id: { $ne: tag._id } });
          if (taken) throw new HttpError(409, "Slug already in use");
          tag.slug = next;
        }
      }

      await tag.save();
      await syncEmbeddedTagLabelsOnPosts(tag._id, tag.name, tag.slug);
      await bustPostCachesForTag(tag._id);
      res.json({ id: String(tag._id), slug: tag.slug });
    })
  );

  router.delete(
    "/:id",
    ...admin(env),
    asyncHandler(async (req, res) => {
      const id = req.params.id;
      if (!mongoose.isValidObjectId(id)) throw new HttpError(400, "Invalid id");
      const posts = await Post.countDocuments({ "tags.tagId": id });
      if (posts > 0) throw new HttpError(400, `Cannot delete: ${posts} post(s) use this tag`);
      const deleted = await Tag.findByIdAndDelete(id);
      if (!deleted) throw new HttpError(404, "Not found");
      res.status(204).end();
    })
  );

  return router;
}
