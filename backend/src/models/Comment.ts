import mongoose, { Schema, type InferSchemaType } from "mongoose";

export const MAX_COMMENT_DEPTH = 2;

const commentSchema = new Schema(
  {
    post: { type: Schema.Types.ObjectId, ref: "Post", required: true, index: true },
    author: { type: Schema.Types.ObjectId, ref: "User", required: true },
    parent: { type: Schema.Types.ObjectId, ref: "Comment", default: null },
    depth: { type: Number, required: true, min: 0, max: MAX_COMMENT_DEPTH },
    body: { type: String, required: true, trim: true, maxlength: 2000 },
  },
  { timestamps: true }
);

commentSchema.index({ post: 1, createdAt: 1 });

export type CommentDoc = InferSchemaType<typeof commentSchema> & { _id: mongoose.Types.ObjectId };
export const Comment = mongoose.model("Comment", commentSchema);
