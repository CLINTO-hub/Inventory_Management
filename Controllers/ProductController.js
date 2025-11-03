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


export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params; // Product ID from URL
    const {
      name,
      description,
      perDayPrice,
      categoryId,
      categoryName,
      stock,
      updatedBy, // Admin performing update
    } = req.body;

    // 1. Validate product existence
    const existingProduct = await Product.findById(id);
    if (!existingProduct) {
      return res.status(404).json({ message: "Product not found" });
    }

    // 2. Validate admin performing the update
    if (!updatedBy) {
      return res.status(400).json({ message: "updatedBy is required" });
    }

    const adminExists = await Admin.findById(updatedBy).lean();
    if (!adminExists) {
      return res.status(404).json({ message: "Admin not found" });
    }

    // 3. Optional validations for incoming fields
    if (name && !name.trim()) {
      return res.status(400).json({ message: "Invalid product name" });
    }
    if (perDayPrice && (typeof perDayPrice !== "number" || perDayPrice <= 0)) {
      return res.status(400).json({ message: "perDayPrice must be positive" });
    }
    if (stock && (typeof stock !== "number" || stock < 0)) {
      return res.status(400).json({ message: "stock must be non-negative" });
    }

    // 4. Validate category if being changed
    let newCategoryName = existingProduct.categoryName;
    if (categoryId) {
      const category = await Category.findById(categoryId).lean();
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }
      newCategoryName = category.name;
    }

    // 5. Check duplicate name within same category (if name/category changes)
    if (name || categoryId) {
      const duplicate = await Product.findOne({
        _id: { $ne: id },
        categoryId: categoryId || existingProduct.categoryId,
        name: { $regex: new RegExp("^" + (name || existingProduct.name) + "$", "i") },
      }).lean();

      if (duplicate) {
        return res.status(409).json({ message: "Product name already exists in this category" });
      }
    }

    // 6. Update product
    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      {
        ...(name && { name: name.trim() }),
        ...(description && { description }),
        ...(perDayPrice && { perDayPrice }),
        ...(stock !== undefined && { stock }),
        ...(categoryId && { categoryId }),
        ...(newCategoryName && { categoryName: newCategoryName }),
      },
      { new: true }
    );

    return res.status(200).json({
      message: "Product updated successfully",
      product: updatedProduct,
    });
  } catch (error) {
    console.error("Error updating product:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};




// ProductController.js
export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { deletedBy } = req.body; // Admin performing deletion

    if (!id) {
      return res.status(400).json({ message: "Product ID is required" });
    }
    if (!deletedBy) {
      return res.status(400).json({ message: "deletedBy is required" });
    }

    const adminExists = await Admin.findById(deletedBy).lean();
    if (!adminExists) {
      return res.status(404).json({ message: "Admin not found" });
    }

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    await Product.findByIdAndDelete(id);

    return res.status(200).json({
      message: "Product deleted successfully",
      deletedProductId: id,
    });
  } catch (error) {
    console.error("Error deleting product:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};


export const getallProducts = async (req, res) => {
  try {
    const products = await Product.find()
      .populate("createdBy", "name email") // show admin info
      .populate("categoryId", "name") // show category name
      .sort({ createdAt: -1 }) // newest first
      .lean();

    return res.status(200).json({
      message: "All products fetched successfully",
      count: products.length,
      products,
    });
  } catch (error) {
    console.error("Error fetching all products:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};