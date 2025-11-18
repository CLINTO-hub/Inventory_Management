import express from "express";
import { cancelOrder, createOrder, deleteOrder, finalizeOrderReturn, getAllOrders, partialReturnProduct, returnAfterRent, updateOrder } from "../Controllers/OrderController.js";





const router = express.Router();

router.post('/createorder', createOrder)
router.post('/updateorder/:id', updateOrder)
router.get('/getallorders', getAllOrders)

router.put("/:id/cancel", cancelOrder);
router.put("/:id/return", returnAfterRent);

// New partial return & finalize
router.put("/:orderId/return-product", partialReturnProduct);
router.put("/:orderId/complete-return", finalizeOrderReturn);
router.post("/:orderId/deleteproduct", deleteOrder)


export default router;