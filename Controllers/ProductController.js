// controllers/productController.js
import Product from "../Models/ProductModel.js";
import Category from "../Models/CategoryModel.js";
import Admin from "../Models/AdminModel.js";

// ==================== CREATE PRODUCT ====================
export const createProduct = async (req, res) => {
  try {
    const { name, description, perDayPrice, createdBy, categoryId, categoryName, stock } = req.body;

    // 1. Field-specific validations
    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Product name is required" });
    }

    if (typeof perDayPrice !== "number" || perDayPrice <= 0) {
      return res.status(400).json({ message: "perDayPrice must be a positive number" });
    }

    if (!createdBy) {
      return res.status(400).json({ message: "createdBy is required" });
    }

    if (!categoryId) {
      return res.status(400).json({ message: "categoryId is required" });
    }

    if (!categoryName || !categoryName.trim()) {
      return res.status(400).json({ message: "categoryName is required" });
    }

    if (typeof stock !== "number" || stock < 0) {
      return res.status(400).json({ message: "stock must be a non-negative number" });
    }

    // 2. Validate Admin
    const adminExists = await Admin.findById(createdBy).lean();
    if (!adminExists) {
      return res.status(404).json({ message: "Admin not found" });
    }

    // 3. Validate Category
    const category = await Category.findById(categoryId).lean();
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    // 4. Check duplicate product name (case-insensitive) in same category
    const existingProduct = await Product.findOne({
      categoryId,
      name: { $regex: new RegExp("^" + name + "$", "i") },
    }).lean();

    if (existingProduct) {
      return res.status(409).json({ message: "Product name already exists in this category" });
    }

    // 5. Create product (use DB category.name to avoid trusting client for categoryName)
    const product = new Product({
      name: name.trim(),
      description: description || "",
      perDayPrice,
      createdBy,
      categoryId,
      categoryName: category.name, // overwrite from DB
      stock,
    });

    await product.save();

    return res.status(201).json({
      message: "Product created successfully",
      product,
    });
  } catch (error) {
    console.error("Error creating product:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

