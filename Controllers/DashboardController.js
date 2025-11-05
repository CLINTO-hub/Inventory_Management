import Category from "../Models/CategoryModel.js";
import Product from "../Models/ProductModel.js";
import Order from "../Models/OrderModel.js";

export const getDashboardStats = async (req, res) => {
  try {
    // Get counts from all collections in parallel
    const [
      totalCategories,
      totalProducts,
      totalOrders,
      activeOrders,
      totalRevenue,
      categories,
      products,
      recentOrders
    ] = await Promise.all([
      // Total counts
      Category.countDocuments(),
      Product.countDocuments(),
      Order.countDocuments(),
      Order.countDocuments({ orderStatus: 'on_rent' }),
      
      // Total revenue (sum of all order totals)
      Order.aggregate([
        { $match: { paymentStatus: 'paid' } },
        { $group: { _id: null, total: { $sum: '$totalPrice' } } }
      ]),
      
      // Recent categories and products for activity
      Category.find().sort({ createdAt: -1 }).limit(5),
      Product.find().sort({ createdAt: -1 }).limit(5),
      
      // Recent orders
      Order.find()
        .populate('productId', 'name')
        .populate('createdBy', 'name')
        .sort({ createdAt: -1 })
        .limit(5)
    ]);

    // Calculate revenue
    const revenue = totalRevenue.length > 0 ? totalRevenue[0].total : 0;

    // Get low stock products (less than 10)
    const lowStockProducts = await Product.countDocuments({ stock: { $lt: 10 } });

    // Get pending payments
    const pendingPayments = await Order.countDocuments({ paymentStatus: 'pending' });

    // Format response
    const stats = {
      overview: {
        totalCategories,
        totalProducts,
        totalOrders,
        activeOrders,
        totalRevenue: revenue,
        lowStockProducts,
        pendingPayments
      },
      recentActivity: {
        categories: categories.map(cat => ({
          name: cat.name,
          createdAt: cat.createdAt
        })),
        products: products.map(prod => ({
          name: prod.name,
          price: prod.perDayPrice,
          stock: prod.stock
        })),
        orders: recentOrders.map(order => ({
          customerName: order.customerName,
          productName: order.productId?.name || order.productName,
          totalPrice: order.totalPrice,
          status: order.orderStatus
        }))
      },
      charts: {
        // You can add chart data here later
        orderStatus: await getOrderStatusDistribution(),
        revenueByMonth: await getRevenueByMonth()
      }
    };

    res.status(200).json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching dashboard statistics",
      error: error.message
    });
  }
};

// Helper function for order status distribution
const getOrderStatusDistribution = async () => {
  const result = await Order.aggregate([
    {
      $group: {
        _id: '$orderStatus',
        count: { $sum: 1 }
      }
    }
  ]);
  
  return result.reduce((acc, curr) => {
    acc[curr._id] = curr.count;
    return acc;
  }, {});
};

// Helper function for monthly revenue
const getRevenueByMonth = async () => {
  const result = await Order.aggregate([
    {
      $match: {
        paymentStatus: 'paid',
        createdAt: { $gte: new Date(new Date().getFullYear(), 0, 1) } // Current year
      }
    },
    {
      $group: {
        _id: { $month: '$createdAt' },
        revenue: { $sum: '$totalPrice' }
      }
    },
    {
      $sort: { '_id': 1 }
    }
  ]);

  return result;
};