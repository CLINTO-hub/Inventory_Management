import express from "express";
import { adminLogin, adminSignup, createUserByAdmin, logout } from "../Controllers/AdminController.js";
import { protect } from "../Middilewares/authMiddleware.js";




const router = express.Router();

router.post('/adminlogin', adminLogin)
router.post('/adminsignup', adminSignup)
router.post('/createuser',createUserByAdmin)
router.post('/logout', protect, logout);

export default router;