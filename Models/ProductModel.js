import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
    },
    perDayPrice: {
      type: Number,
      required: true, // rate/day as given in PDF
    },
    // Reference to Admin who created this product
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      required: true,
    },
    // Reference to Category
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    categoryName: {
      type: String,
      required: true, // denormalized field for quick access
      trim: true,
    },
    stock:{
      type: Number,
      required: true,
    }
  },
  { timestamps: true }
);

export default mongoose.model("Product", productSchema);
