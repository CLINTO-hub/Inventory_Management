import express from "express";
import { cancelOrder, createOrder, returnAfterRent } from "../Controllers/OrderController.js";




const router = express.Router();

router.post('/createorder', createOrder)
router.post('/cancelorder', cancelOrder)
router.post('/returnorder', returnAfterRent)


export default router;