import mongoose from "mongoose";

const { Schema } = mongoose;

const commentSchema = new Schema(
  {
    content: { type: String, required: true },
    author: { type: mongoose.SchemaTypes.ObjectId, ref: "User" },
    blog: { type: mongoose.SchemaTypes.ObjectId, ref: "Blog" },
  },
  {
    timestamps: true,
  }
);
export default mongoose.model("Comment", commentSchema, "comments");
