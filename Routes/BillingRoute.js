import express from "express";
import { generateBill } from "../Controllers/BillingController.js";

const router = express.Router();

router.post('/create-bill', generateBill)


export default router;