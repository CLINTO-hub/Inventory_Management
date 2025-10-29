import express from "express";
import { createCategory, deleteCategory, getAllCategories, updateCategory } from "../Controllers/CategoryController.js";




const router = express.Router();

router.post('/createcategory', createCategory)
router.post('/updatecategory', updateCategory)
router.post('/deletecategory', deleteCategory)
router.get('/getallcategories', getAllCategories)


export default router;