import express from "express";
import { userLogin } from "../Controllers/UserController.js";


const router = express.Router();

router.post('/userlogin', userLogin)


export default router;