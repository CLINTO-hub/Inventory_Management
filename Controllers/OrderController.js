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


export const updateOrder = async (req, res) => {
  try {
    const { id } = req.params; // Order ID from URL
    const {
      customerName,
      customerPhoneNumber,
      rentingStartDate,
      rentingEndDate,
      totalPrice,
      rentedAmount,
      paymentStatus,
      orderStatus,
    } = req.body;

    // 1️⃣ Find the order
    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ message: "Order not found." });
    }

    // 2️⃣ Fetch product (to manage stock if rentedAmount changes)
    const product = await Product.findById(order.productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found." });
    }

    // 3️⃣ If rented amount is being changed, adjust product stock
    if (rentedAmount !== undefined && rentedAmount !== order.rentedAmount) {
      const diff = rentedAmount - order.rentedAmount; // positive means increasing rented items
      if (diff > 0 && product.stock < diff) {
        return res.status(400).json({
          message: `Not enough stock available. Only ${product.stock} item(s) left.`,
        });
      }

      // Adjust stock accordingly
      product.stock -= diff;
      await product.save();

      order.rentedAmount = rentedAmount;
    }

    // 4️⃣ Update other editable fields (only if provided)
    if (customerName) order.customerName = customerName.trim();
    if (customerPhoneNumber) order.customerPhoneNumber = customerPhoneNumber.trim();
    if (rentingStartDate) order.rentingStartDate = rentingStartDate;
    if (rentingEndDate) order.rentingEndDate = rentingEndDate;
    if (totalPrice) order.totalPrice = totalPrice;
    if (paymentStatus) order.paymentStatus = paymentStatus;
    if (orderStatus) order.orderStatus = orderStatus;

    await order.save();

    return res.status(200).json({
      message: "Order updated successfully.",
      order,
    });
  } catch (error) {
    console.error("Error updating order:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// ✅ Get all orders
export const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("productId", "name perDayPrice stock") // only select key product fields
      .populate("categoryId", "name") // populate category name
      .populate("createdBy", "name email") // populate user details
      .sort({ createdAt: -1 }); // latest first

    if (!orders || orders.length === 0) {
      return res.status(404).json({ message: "No orders found." });
    }

    return res.status(200).json({
      message: "Orders fetched successfully.",
      total: orders.length,
      orders,
    });
  } catch (error) {
    console.error("Error fetching orders:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};
