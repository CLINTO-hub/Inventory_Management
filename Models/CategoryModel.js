import mongoose from "mongoose";

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true, // category name should be unique
      trim: true,
    },
    description: {
      type: String,
      default: "",
    },
    // Reference to Admin who created this category
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      required: true,
    },
  },
  { timestamps: true } // auto adds createdAt, updatedAt
);

export default mongoose.model("Category", categorySchema);
