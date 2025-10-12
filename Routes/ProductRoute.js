import express from "express";
import { createProduct } from "../Controllers/ProductController.js";



const router = express.Router();

router.post('/createproduct', createProduct )


export default router;