import mongoose, { Schema, type InferSchemaType } from "mongoose";

const tagSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    slug: { type: String, required: true, lowercase: true, trim: true, maxlength: 96, unique: true },
    description: { type: String, trim: true, maxlength: 300 },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

tagSchema.index({ sortOrder: 1, name: 1 });

export type TagDoc = InferSchemaType<typeof tagSchema> & { _id: mongoose.Types.ObjectId };
export const Tag = mongoose.model("Tag", tagSchema);
