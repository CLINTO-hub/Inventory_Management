import express from "express";
import { generateBill } from "../Controllers/BillingController.js";
import { protect } from "../Middilewares/authMiddleware.js";

const router = express.Router();

router.post('/create-bill', generateBill)


export default router;