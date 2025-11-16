// Models/OrderModel.js
import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    customerName: { type: String, required: true, trim: true },
    customerPhoneNumber: { type: String, required: true, trim: true },

    // One common rental period for the order (Option A)
    rentingStartDate: { type: Date, required: true },
    rentingEndDate: { type: Date, required: false }, // may be empty in bulk scenario

    // Final total after all returns are done
    totalPrice: { type: Number, default: 0 },

    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed"],
      default: "pending",
    },

    orderStatus: {
      type: String,
      enum: ["on_rent", "returned_after_rent", "cancelled"],
      default: "on_rent",
    },

    // Multiple products in an order
    products: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        productName: { type: String, required: true },
        categoryId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Category",
          required: true,
        },
        categoryName: { type: String, required: true },
        rentedAmount: { type: Number, required: true },
        perDayPrice: { type: Number, required: true }, // snapshot of price at rent time

        // Partial returns for this product
        returns: [
          {
            returnedQuantity: { type: Number, required: true },
            returnedDate: { type: Date, required: true },
          },
        ],
      },
    ],

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin", // assuming admin creates orders
      required: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Order", orderSchema);
