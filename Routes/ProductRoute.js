import express from "express";
import { createProduct, deleteProduct, getallProducts, updateProduct } from "../Controllers/ProductController.js";



const router = express.Router();

router.post('/createproduct', createProduct )
router.put('/updateproduct/:id', updateProduct)
router.delete('/deleteproduct/:id', deleteProduct)
router.get('/getallproducts', getallProducts)


export default router;