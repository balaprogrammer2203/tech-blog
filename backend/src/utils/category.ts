import mongoose from "mongoose";
import { Category } from "../models/Category.js";
import { HttpError } from "../middleware/errorHandler.js";

/** Resolves `categoryId` to an ObjectId only if it is a second-level (leaf) category. */
export async function requireLeafCategoryId(categoryId: string | undefined): Promise<mongoose.Types.ObjectId | undefined> {
  if (categoryId === undefined || categoryId === "") return undefined;
  if (!mongoose.isValidObjectId(categoryId)) throw new HttpError(400, "Invalid categoryId");
  const cat = await Category.findById(categoryId).select("parent").lean();
  if (!cat) throw new HttpError(400, "Unknown category");
  if (cat.parent == null) {
    throw new HttpError(400, "Use a subcategory (second level), not a root category");
  }
  return cat._id;
}

export async function resolveCategoryFilter(query: {
  category?: string;
  categorySlug?: string;
}): Promise<mongoose.Types.ObjectId | null> {
  const slug = typeof query.categorySlug === "string" ? query.categorySlug.trim() : "";
  const id = typeof query.category === "string" ? query.category.trim() : "";
  if (slug && id) throw new HttpError(400, "Use only one of category or categorySlug");
  if (slug) {
    const cat = await Category.findOne({ slug, parent: { $ne: null } }).select("_id").lean();
    if (!cat) throw new HttpError(404, "Unknown category slug");
    return cat._id;
  }
  if (id) {
    if (!mongoose.isValidObjectId(id)) throw new HttpError(400, "Invalid category");
    const cat = await Category.findOne({ _id: id, parent: { $ne: null } }).select("_id").lean();
    if (!cat) throw new HttpError(404, "Unknown category");
    return cat._id;
  }
  return null;
}

export function formatPostCategory(
  cat: unknown
): { id: string; slug: string; name: string; parent: { slug: string; name: string } } | null {
  if (!cat || typeof cat !== "object") return null;
  const c = cat as {
    _id: mongoose.Types.ObjectId;
    slug: string;
    name: string;
    parent?: unknown;
  };
  if (!c.parent || typeof c.parent !== "object") return null;
  const p = c.parent as { slug: string; name: string };
  return {
    id: String(c._id),
    slug: c.slug,
    name: c.name,
    parent: { slug: p.slug, name: p.name },
  };
}
