// Controllers/DashboardController.js
import Category from "../Models/CategoryModel.js";
import Product from "../Models/ProductModel.js";
import Order from "../Models/OrderModel.js";

export const getDashboardStats = async (req, res) => {
  try {
    const [
      totalCategories,
      totalProducts,
      totalOrders,
      activeOrders,
      totalRevenue,
      categories,
      products,
      recentOrders,
    ] = await Promise.all([
      Category.countDocuments(),
      Product.countDocuments(),
      Order.countDocuments(),
      Order.countDocuments({ orderStatus: "on_rent" }),

      // Sum only completed/paid orders totalPrice
      Order.aggregate([
        { $match: { paymentStatus: "paid" } },
        { $group: { _id: null, total: { $sum: "$totalPrice" } } },
      ]),

      Category.find().sort({ createdAt: -1 }).limit(5),
      Product.find().sort({ createdAt: -1 }).limit(5),

      Order.find()
        .populate("products.productId", "name")
        .populate("createdBy", "name")
        .sort({ createdAt: -1 })
        .limit(5),
    ]);

    const revenue = totalRevenue.length > 0 ? totalRevenue[0].total : 0;
    const lowStockProducts = await Product.countDocuments({
      stock: { $lt: 10 },
    });
    const pendingPayments = await Order.countDocuments({
      paymentStatus: "pending",
    });

    const stats = {
      overview: {
        totalCategories,
        totalProducts,
        totalOrders,
        activeOrders,
        totalRevenue: revenue,
        lowStockProducts,
        pendingPayments,
      },
      recentActivity: {
        categories: categories.map((cat) => ({
          name: cat.name,
          createdAt: cat.createdAt,
        })),
        products: products.map((prod) => ({
          name: prod.name,
          price: prod.perDayPrice,
          stock: prod.stock,
        })),
        orders: recentOrders.map((order) => {
          const firstProduct = order.products?.[0];
          const productName =
            order.products?.length > 1
              ? `${order.products.length} products`
              : firstProduct?.productId?.name || firstProduct?.productName || "N/A";

          return {
            customerName: order.customerName,
            productName,
            totalPrice: order.totalPrice,
            status: order.orderStatus,
            createdAt: order.createdAt,
          };
        }),
      },
      charts: {
        orderStatus: await getOrderStatusDistribution(),
        revenueByMonth: await getRevenueByMonth(),
      },
    };

    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching dashboard statistics",
      error: error.message,
    });
  }
};

const getOrderStatusDistribution = async () => {
  const result = await Order.aggregate([
    {
      $group: {
        _id: "$orderStatus",
        count: { $sum: 1 },
      },
    },
  ]);

  return result.reduce((acc, curr) => {
    acc[curr._id] = curr.count;
    return acc;
  }, {});
};

const getRevenueByMonth = async () => {
  const result = await Order.aggregate([
    {
      $match: {
        paymentStatus: "paid",
        createdAt: { $gte: new Date(new Date().getFullYear(), 0, 1) },
      },
    },
    {
      $group: {
        _id: { $month: "$createdAt" },
        revenue: { $sum: "$totalPrice" },
      },
    },
    { $sort: { "_id": 1 } },
  ]);

  return result;
};
