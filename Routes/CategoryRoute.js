import express from "express";
import { createCategory, deleteCategory, updateCategory } from "../Controllers/CategoryController.js";




const router = express.Router();

router.post('/createcategory', createCategory)
router.post('updatecategory', updateCategory)
router.post('/deletecategory', deleteCategory)


export default router;