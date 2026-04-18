import mongoose, { Schema, type InferSchemaType } from "mongoose";

/**
 * Two-level taxonomy only:
 * - Root: `parent` is null (e.g. "Languages & runtimes")
 * - Child: `parent` points at a root (e.g. "JavaScript / TypeScript"); posts attach here only.
 */
const categorySchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    slug: { type: String, required: true, lowercase: true, trim: true, maxlength: 96, unique: true },
    parent: { type: Schema.Types.ObjectId, ref: "Category", default: null, index: true },
    description: { type: String, trim: true, maxlength: 300 },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

categorySchema.index({ parent: 1, sortOrder: 1 });

export type CategoryDoc = InferSchemaType<typeof categorySchema> & { _id: mongoose.Types.ObjectId };
export const Category = mongoose.model("Category", categorySchema);
