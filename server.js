import express from "express";
import dotenv from 'dotenv';
import ConnectDB from "./Config/ConnectDB.js"
import cors from "cors";
import cookieParser from "cookie-parser";


const app = express();

dotenv.config();
app.use(cors({
     origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
}));


const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(cookieParser());


app.get('/',(req,res)=>{
    res.send('Hello World!');
})

app.listen(PORT, () => {
    ConnectDB();
    console.log(`Server is running on port ${PORT}`);
});    