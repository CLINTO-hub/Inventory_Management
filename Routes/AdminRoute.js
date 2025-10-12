import express from "express";
import { adminLogin, adminSignup, createUserByAdmin } from "../Controllers/AdminController.js";




const router = express.Router();

router.post('/adminlogin', adminLogin)
router.post('/adminsignup', adminSignup)
router.post('/createuser', createUserByAdmin)


export default router;