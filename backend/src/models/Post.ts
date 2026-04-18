import mongoose, { Schema, type InferSchemaType } from "mongoose";

const MAX_CONTENT = 100_000;
const MAX_TAGS = 5;

const postSchema = new Schema(
  {
    author: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 220 },
    excerpt: { type: String, required: true, trim: true, maxlength: 320 },
    content: { type: String, required: true, maxlength: MAX_CONTENT },
    tags: {
      type: [String],
      default: [],
      validate: [(v: string[]) => v.length <= MAX_TAGS, `Max ${MAX_TAGS} tags`],
    },
    status: { type: String, enum: ["draft", "published"], default: "draft", index: true },
    coverImageUrl: { type: String, maxlength: 500 },
    readTimeMinutes: { type: Number, min: 1, max: 999 },
    likeCount: { type: Number, default: 0, min: 0 },
    commentCount: { type: Number, default: 0, min: 0 },
    publishedAt: { type: Date },
    category: { type: Schema.Types.ObjectId, ref: "Category", default: null, index: true },
  },
  { timestamps: true }
);

postSchema.index({ status: 1, publishedAt: -1 });
postSchema.index({ title: "text", excerpt: "text", tags: "text" }, { weights: { title: 5, excerpt: 2, tags: 1 } });

export type PostDoc = InferSchemaType<typeof postSchema> & { _id: mongoose.Types.ObjectId };
export const Post = mongoose.model("Post", postSchema);
