// Controllers/OrderController.js
import Order from "../Models/OrderModel.js";
import Product from "../Models/ProductModel.js";

/**
 * Helper: compute remaining qty for a product in an order
 */
const getRemainingQty = (productEntry) => {
  const returned = productEntry.returns?.reduce(
    (sum, r) => sum + r.returnedQuantity,
    0
  ) || 0;
  return productEntry.rentedAmount - returned;
};

/**
 * @desc Create a new order
 * Supports:
 *  - Existing frontend payload (single product)
 *  - New payload with `products` array
 * @route POST /orders/createorder
 */
export const createOrder = async (req, res) => {
  try {
    const {
      customerName,
      customerPhoneNumber,
      rentingStartDate,
      rentingEndDate,
      totalPrice, // not critical now; final amount calculated on full return
      products,   // optional array
      productId,  // single-product legacy fields
      productName,
      categoryId,
      categoryName,
      rentedAmount,
      createdBy,
      paymentStatus, // optional
      orderStatus,   // optional
    } = req.body;

    if (!customerName || !customerPhoneNumber || !rentingStartDate) {
      return res.status(400).json({
        message: "customerName, customerPhoneNumber and rentingStartDate are required",
      });
    }

    if (!createdBy) {
      return res.status(400).json({ message: "createdBy is required" });
    }

    const productsArray = [];

    if (Array.isArray(products) && products.length > 0) {
      // New multi-product style
      for (const item of products) {
        if (!item.productId || !item.rentedAmount) {
          return res.status(400).json({ message: "productId and rentedAmount required in products" });
        }

        const product = await Product.findById(item.productId);
        if (!product) {
          return res
            .status(404)
            .json({ message: `Product not found: ${item.productId}` });
        }

        if (product.stock < item.rentedAmount) {
          return res.status(400).json({
            message: `Insufficient stock for ${product.name}. Available: ${product.stock}`,
          });
        }

        // Reduce stock
        product.stock -= item.rentedAmount;
        await product.save();

        productsArray.push({
          productId: product._id,
          productName: product.name,
          categoryId: product.categoryId,
          categoryName: product.categoryName,
          rentedAmount: item.rentedAmount,
          perDayPrice: product.perDayPrice,
          returns: [],
        });
      }
    } else {
      // Legacy single-product style (current frontend)
      if (!productId || !rentedAmount) {
        return res.status(400).json({
          message: "Either 'products' array or (productId & rentedAmount) is required",
        });
      }

      const product = await Product.findById(productId);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      if (product.stock < rentedAmount) {
        return res.status(400).json({
          message: `Insufficient stock for ${product.name}. Available: ${product.stock}`,
        });
      }

      product.stock -= rentedAmount;
      await product.save();

      productsArray.push({
        productId: product._id,
        productName: product.name,
        categoryId: product.categoryId,
        categoryName: product.categoryName,
        rentedAmount,
        perDayPrice: product.perDayPrice,
        returns: [],
      });
    }

    const order = new Order({
      customerName,
      customerPhoneNumber,
      rentingStartDate,
      rentingEndDate: rentingEndDate || null,
      totalPrice: 0, // final price to be set on complete return
      paymentStatus: paymentStatus || "pending",
      orderStatus: orderStatus || "on_rent",
      products: productsArray,
      createdBy,
    });

    await order.save();

    return res.status(201).json({
      message: "Order created successfully",
      order,
    });
  } catch (error) {
    console.error("Error creating order:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

/**
 * @desc Cancel an order (restore remaining stock)
 * @route PUT /orders/:id/cancel
 */
export const cancelOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await Order.findById(id);
    if (!order) return res.status(404).json({ message: "Order not found" });

    if (order.orderStatus !== "on_rent") {
      return res.status(400).json({ message: "Order already completed or cancelled" });
    }

    // Restore only remaining quantities (not already returned)
    for (const item of order.products) {
      const remaining = getRemainingQty(item);
      if (remaining > 0) {
        const product = await Product.findById(item.productId);
        if (product) {
          product.stock += remaining;
          await product.save();
        }
      }
    }

    order.orderStatus = "cancelled";
    await order.save();

    res.status(200).json({ message: "Order cancelled & stock restored.", order });
  } catch (error) {
    console.error("Error cancelling order:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * @desc Legacy full return endpoint (if you ever use it globally)
 * @route PUT /orders/:id/return
 */
export const returnAfterRent = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await Order.findById(id);
    if (!order) return res.status(404).json({ message: "Order not found" });

    if (order.orderStatus !== "on_rent")
      return res.status(400).json({ message: "Order is not on rent" });

    // Restore all remaining stock
    for (const item of order.products) {
      const remaining = getRemainingQty(item);
      if (remaining > 0) {
        const product = await Product.findById(item.productId);
        if (product) {
          product.stock += remaining;
          await product.save();
        }
      }
    }

    order.orderStatus = "returned_after_rent";
    await order.save();

    res.status(200).json({ message: "Order returned & stock updated.", order });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * @desc Partial product return (bulk rental)
 * @route PUT /orders/:orderId/return-product
 * body: { productId, returnQuantity, returnDate }
 */
export const partialReturnProduct = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { productId, returnQuantity, returnDate } = req.body;

    if (!productId || !returnQuantity || !returnDate) {
      return res.status(400).json({
        message: "productId, returnQuantity and returnDate are required",
      });
    }

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: "Order not found" });

    const productEntry = order.products.find(
      (p) => p.productId.toString() === productId.toString()
    );
    if (!productEntry) {
      return res
        .status(404)
        .json({ message: "Product not found in this order" });
    }

    const remaining = getRemainingQty(productEntry);
    if (returnQuantity > remaining) {
      return res.status(400).json({
        message: `Only ${remaining} item(s) left to return for this product`,
      });
    }

    // Add return details
    productEntry.returns.push({
      returnedQuantity: returnQuantity,
      returnedDate: new Date(returnDate),
    });

    // Restore stock
    const product = await Product.findById(productId);
    if (product) {
      product.stock += returnQuantity;
      await product.save();
    }

    await order.save();

    // 🔥 Auto check full return & calculate final price
    let allReturned = true;
    let totalCost = 0;

    for (const item of order.products) {
      const remainingQty = getRemainingQty(item);
      if (remainingQty > 0) allReturned = false;

      for (const r of item.returns) {
        const start = new Date(order.rentingStartDate);
        const end = new Date(r.returnedDate);
        const diffTime = end - start;
        const days = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24))); // Min 1 day

        totalCost += days * item.perDayPrice * r.returnedQuantity;
      }
    }

    if (allReturned) {
      order.orderStatus = "returned_after_rent";
      order.totalPrice = totalCost;
      await order.save();
    }

    return res.status(200).json({
      message: allReturned
        ? "Order fully returned & total calculated"
        : "Product partially returned",
      order,
      allReturned, // 🔥 used by frontend to auto-close modal
      totalCost // Optional display
    });

  } catch (error) {
    console.error("Error partial returning product:", error);
    return res.status(500).json({ message: "Server Error" });
  }
};

/**
 * @desc Finalize order return and calculate final total
 * (Option B: customer pays once, at final return)
 * @route PUT /orders/:orderId/complete-return
 */
export const finalizeOrderReturn = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: "Order not found" });

    let totalCost = 0;
    let allReturned = true;

    for (const item of order.products) {
      const remaining = getRemainingQty(item);
      if (remaining > 0) {
        allReturned = false;
      }

      for (const r of item.returns) {
        const start = new Date(order.rentingStartDate);
        const end = new Date(r.returnedDate);
        const diffTime = end - start;
        const days = Math.max(
          1,
          Math.ceil(diffTime / (1000 * 60 * 60 * 24))
        );

        totalCost += days * item.perDayPrice * r.returnedQuantity;
      }
    }

    if (!allReturned) {
      return res.status(400).json({
        message:
          "Not all products/quantities are returned yet. Return remaining items first.",
      });
    }

    order.orderStatus = "returned_after_rent";
    order.totalPrice = totalCost;
    // Still keep paymentStatus as is (you can change from UI separately)
    await order.save();

    return res.status(200).json({
      message: "Order fully returned & total calculated",
      order,
    });
  } catch (error) {
    console.error("Error completing return:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

/**
 * @desc Update order basic fields (no stock changes here now)
 * @route POST /orders/updateorder/:id
 */
export const updateOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      customerName,
      customerPhoneNumber,
      rentingStartDate,
      rentingEndDate,
      totalPrice,
      paymentStatus,
      orderStatus,
    } = req.body;

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ message: "Order not found." });
    }

    if (customerName) order.customerName = customerName.trim();
    if (customerPhoneNumber)
      order.customerPhoneNumber = customerPhoneNumber.trim();
    if (rentingStartDate) order.rentingStartDate = rentingStartDate;
    if (rentingEndDate) order.rentingEndDate = rentingEndDate;
    if (typeof totalPrice === "number") order.totalPrice = totalPrice;
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

/**
 * @desc Get all orders (with search & pagination)
 * @route GET /orders/getallorders
 */
export const getAllOrders = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 9;
    const skip = (page - 1) * limit;
    const search = req.query.search ? req.query.search.trim() : "";

    const searchFilter = search
      ? {
          $or: [
            { customerName: { $regex: search, $options: "i" } },
            { customerPhoneNumber: { $regex: search, $options: "i" } },
            { "products.productName": { $regex: search, $options: "i" } },
            { "products.categoryName": { $regex: search, $options: "i" } },
            { orderStatus: { $regex: search, $options: "i" } },
            { paymentStatus: { $regex: search, $options: "i" } },
          ],
        }
      : {};

    const totalOrders = await Order.countDocuments(searchFilter);

    const orders = await Order.find(searchFilter)
      .populate("products.productId", "name perDayPrice stock")
      .populate("products.categoryId", "name")
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .exec();

    return res.status(200).json({
      message: "Orders fetched successfully.",
      total: totalOrders,
      currentPage: page,
      totalPages: Math.ceil(totalOrders / limit),
      orders,
    });
  } catch (error) {
    console.error("Error fetching orders:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};
