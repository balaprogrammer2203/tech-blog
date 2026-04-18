import mongoose, { Schema, type InferSchemaType } from "mongoose";

const reportSchema = new Schema(
  {
    reporter: { type: Schema.Types.ObjectId, ref: "User", required: true },
    targetType: { type: String, enum: ["post", "comment"], required: true },
    targetId: { type: Schema.Types.ObjectId, required: true },
    reason: { type: String, required: true, trim: true, maxlength: 500 },
    status: { type: String, enum: ["pending", "resolved", "dismissed"], default: "pending", index: true },
  },
  { timestamps: true }
);

reportSchema.index({ targetType: 1, targetId: 1 });

export type ReportDoc = InferSchemaType<typeof reportSchema> & { _id: mongoose.Types.ObjectId };
export const Report = mongoose.model("Report", reportSchema);
