import Admin from "../Models/AdminModel.js";
import Category from "../Models/CategoryModel.js";


export const createCategory = async (req, res) => {
  try {
    const { name, description, createdBy } = req.body;

    // 1. Validate required fields
    if (!name || !createdBy) {
      return res.status(400).json({ message: "Name and createdBy are required" });
    }

    // 2. Check if Admin exists (reference validation)
    const adminExists = await Admin.findById(createdBy).lean();
    if (!adminExists) {
      return res.status(404).json({ message: "Admin not found" });
    }

    // 3. Check for duplicate category (case-insensitive)
    const existingCategory = await Category.findOne({
      name: { $regex: new RegExp("^" + name + "$", "i") },
    }).lean();

    if (existingCategory) {
      return res.status(409).json({ message: "Category name already exists" });
    }

    // 4. Create new category
    const category = new Category({
      name: name.trim(),
      description: description || "",
      createdBy,
    });

    await category.save();

    return res.status(200).json({
      message: "Category created successfully",
      category,
    });
  } catch (error) {
    console.error("Error creating category:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};


export const updateCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const { name, description, updatedBy } = req.body;

    // Validate ID
    if (!categoryId) {
      return res.status(400).json({ message: "Category ID is required" });
    }

    // Validate updater
    if (!updatedBy) {
      return res.status(400).json({ message: "updatedBy (Admin ID) is required" });
    }

    const adminExists = await Admin.findById(updatedBy).lean();
    if (!adminExists) {
      return res.status(404).json({ message: "Admin not found" });
    }

    // Find category
    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    // Check duplicate category name (if name is being updated)
    if (name && name.trim().toLowerCase() !== category.name.toLowerCase()) {
      const existingCategory = await Category.findOne({
        name: { $regex: new RegExp("^" + name + "$", "i") },
      }).lean();

      if (existingCategory) {
        return res.status(409).json({ message: "Category name already exists" });
      }
      category.name = name.trim();
    }

    // Update description if provided
    if (description !== undefined) {
      category.description = description;
    }

    await category.save();

    return res.status(200).json({
      message: "Category updated successfully",
      category,
    });
  } catch (error) {
    console.error("Error updating category:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};



export const deleteCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;

    if (!categoryId) {
      return res.status(400).json({ message: "Category ID is required" });
    }

    const category = await Category.findByIdAndDelete(categoryId);

    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    return res.status(200).json({
      message: "Category deleted successfully",
      category,
    });
  } catch (error) {
    console.error("Error deleting category:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};