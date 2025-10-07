import Order from "../Models/OrderModel.js";
import Product from "../Models/ProductModel.js";

/**
 * @desc Create a new order
 * @route POST /api/orders
 */
export const createOrder = async (req, res) => {
  try {
    const {
      customerName,
      customerPhoneNumber,
      rentingStartDate,
      rentingEndDate,
      totalPrice,
      rentedAmount,
      productId,
      productName,
      categoryId,
      categoryName,
      createdBy,
    } = req.body;

    // Validate required fields
    if (
      !customerName ||
      !customerPhoneNumber ||
      !rentingStartDate ||
      !rentingEndDate ||
      !totalPrice ||
      !rentedAmount ||
      !productId ||
      !productName ||
      !categoryId ||
      !categoryName ||
      !createdBy
    ) {
      return res.status(400).json({
        message: "All fields are required.",
      });
    }

    // Fetch product
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found." });
    }

    // Check stock
    if (product.stock < rentedAmount) {
      return res.status(400).json({
        message: `Only ${product.stock} item(s) available in stock.`,
      });
    }

    // Reduce stock
    product.stock -= rentedAmount;
    await product.save();

    // Create order
    const order = await Order.create({
      customerName,
      customerPhoneNumber,
      rentingStartDate,
      rentingEndDate,
      totalPrice,
      rentedAmount,
      productId,
      productName,
      categoryId,
      categoryName,
      createdBy,
    });

    return res.status(201).json({
      message: "Order created successfully.",
      order,
    });
  } catch (error) {
    console.error("Error creating order:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

/**
 * @desc Cancel an order
 * @route PUT /api/orders/:id/cancel
 */
export const cancelOrder = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ message: "Order not found." });
    }

    // Only allow cancellation if it's currently on rent
    if (order.orderStatus !== "on_rent") {
      return res.status(400).json({
        message: `Cannot cancel an order with status '${order.orderStatus}'.`,
      });
    }

    // Restore stock
    const product = await Product.findById(order.productId);
    if (product) {
      product.stock += order.rentedAmount;
      await product.save();
    }

    // Update order status
    order.orderStatus = "cancelled";
    await order.save();

    return res.status(200).json({
      message: "Order cancelled successfully and stock restored.",
      order,
    });
  } catch (error) {
    console.error("Error cancelling order:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

/**
 * @desc Mark order as returned after rent
 * @route PUT /api/orders/:id/return
 */
export const returnAfterRent = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ message: "Order not found." });
    }

    // Only allow return if it's currently on rent
    if (order.orderStatus !== "on_rent") {
      return res.status(400).json({
        message: `Cannot mark return for order with status '${order.orderStatus}'.`,
      });
    }

    // Restore stock
    const product = await Product.findById(order.productId);
    if (product) {
      product.stock += order.rentedAmount;
      await product.save();
    }

    // Update order status
    order.orderStatus = "returned_after_rent";
    await order.save();

    return res.status(200).json({
      message: "Order marked as returned and stock updated.",
      order,
    });
  } catch (error) {
    console.error("Error returning order:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
