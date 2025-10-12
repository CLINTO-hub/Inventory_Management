import Billing from "../Models/BillModel.js";
import Order from "../Models/OrderModel.js";
import Product from "../Models/ProductModel.js";



export const generateBill = async (req, res) => {
  try {
    const { orderId } = req.params;

    // Fetch order details
    const order = await Order.findById(orderId)
      .populate("productId")
      .populate("categoryId")
      .populate("createdBy");

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    const product = await Product.findById(order.productId);

    // Calculate rented days
    const start = new Date(order.rentingStartDate);
    const end = new Date(order.rentingEndDate);
    const rentedDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));

    // Calculate total price (safety check)
    const totalPrice = rentedDays * product.perDayPrice;

    // Generate unique bill number
    const billNumber = `BILL-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // Create billing record
    const newBill = new Billing({
      orderId: order._id,
      userId: order.createdBy,
      productId: order.productId,
      categoryId: order.categoryId,
      billNumber,
      customerName: order.customerName,
      customerPhoneNumber: order.customerPhoneNumber,
      rentingStartDate: order.rentingStartDate,
      rentingEndDate: order.rentingEndDate,
      rentedDays,
      perDayPrice: product.perDayPrice,
      totalPrice,
      rentedAmount: order.rentedAmount,
      paymentStatus: order.paymentStatus,
      orderStatus: order.orderStatus,
    });

    await newBill.save();

    return res.status(201).json({
      message: "Bill generated successfully",
      bill: newBill,
    });
  } catch (error) {
    console.error("Error generating bill:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
