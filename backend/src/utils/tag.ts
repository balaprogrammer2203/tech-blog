import mongoose from "mongoose";
import { Post } from "../models/Post.js";
import { Tag } from "../models/Tag.js";
import { HttpError } from "../middleware/errorHandler.js";
import { delCachePrefix } from "../lib/ttlCache.js";

export type PostTagJson = { id: string; name: string; slug: string };

/** Embedded `{ tagId, name, slug }` on Post, or legacy populated Tag docs. */
export function formatPostTags(tags: unknown): PostTagJson[] {
  if (!Array.isArray(tags)) return [];
  const out: PostTagJson[] = [];
  for (const t of tags) {
    if (!t || typeof t !== "object") continue;
    const o = t as Record<string, unknown>;
    if ("tagId" in o && o.tagId && "name" in o && "slug" in o) {
      out.push({
        id: String(o.tagId as mongoose.Types.ObjectId),
        name: String(o.name),
        slug: String(o.slug),
      });
    } else if ("_id" in o && "name" in o && "slug" in o) {
      const c = o as { _id: mongoose.Types.ObjectId; name: string; slug: string };
      out.push({ id: String(c._id), name: c.name, slug: c.slug });
    }
  }
  return out;
}

export type PostTagEmbed = { tagId: mongoose.Types.ObjectId; name: string; slug: string };

/** Resolve client tag ids to embedded snapshots (id + name + slug from Tag collection). */
export async function resolvePostTagEmbeddings(tagIdStrings: readonly string[]): Promise<PostTagEmbed[]> {
  const seen = new Set<string>();
  const ordered: string[] = [];
  for (const raw of tagIdStrings) {
    const s = String(raw).trim();
    if (!s) continue;
    if (!mongoose.isValidObjectId(s)) throw new HttpError(400, "Invalid tag id");
    if (seen.has(s)) continue;
    seen.add(s);
    ordered.push(s);
  }
  if (ordered.length > 5) throw new HttpError(400, "Max 5 tags");
  if (ordered.length === 0) return [];
  const oids = ordered.map((id) => new mongoose.Types.ObjectId(id));
  const found = await Tag.find({ _id: { $in: oids } })
    .select("_id name slug")
    .lean();
  if (found.length !== ordered.length) throw new HttpError(400, "One or more tag ids are unknown");
  const byId = new Map(found.map((d) => [String(d._id), d]));
  return ordered.map((id) => {
    const d = byId.get(id)!;
    return { tagId: d._id, name: d.name, slug: d.slug };
  });
}

export async function resolveTagSlugFilter(slug: string | undefined): Promise<mongoose.Types.ObjectId | null> {
  const s = typeof slug === "string" ? slug.trim() : "";
  if (!s) return null;
  const tag = await Tag.findOne({ slug: s }).select("_id").lean();
  if (!tag) throw new HttpError(404, "Unknown tag slug");
  return tag._id;
}

export async function bustPostCachesForTag(tagId: mongoose.Types.ObjectId): Promise<void> {
  const posts = await Post.find({ "tags.tagId": tagId }).select("slug").lean();
  for (const p of posts) {
    delCachePrefix(`post:slug:${p.slug}`);
  }
}

/** After a Tag rename/slug change, keep denormalized copies on posts in sync. */
export async function syncEmbeddedTagLabelsOnPosts(
  tagId: mongoose.Types.ObjectId,
  name: string,
  slug: string
): Promise<void> {
  await Post.updateMany(
    { "tags.tagId": tagId },
    { $set: { "tags.$[elem].name": name, "tags.$[elem].slug": slug } },
    { arrayFilters: [{ "elem.tagId": tagId }] }
  );
}
