import express from "express";
import { createProduct, deleteProduct, updateProduct } from "../Controllers/ProductController.js";



const router = express.Router();

router.post('/createproduct', createProduct )
router.post('/updateproduct', updateProduct)
router.post('/deleteproduct', deleteProduct)


export default router;