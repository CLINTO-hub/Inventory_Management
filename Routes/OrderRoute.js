import express from "express";
import { cancelOrder, createOrder, getAllOrders, returnAfterRent, updateOrder } from "../Controllers/OrderController.js";




const router = express.Router();

router.post('/createorder', createOrder)
router.post('/cancelorder', cancelOrder)
router.post('/returnorder/:id', returnAfterRent)
router.post('/updateorder/:id', updateOrder)
router.get('/getallorders', getAllOrders)


export default router;