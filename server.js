import express from "express";
import dotenv from 'dotenv';
import ConnectDB from "./Config/ConnectDB.js"
import cors from "cors";
import cookieParser from "cookie-parser";
import AdminRoute from "./Routes/AdminRoute.js";
import UserRoute from "./Routes/UserRoute.js";
import ProductRoute from "./Routes/ProductRoute.js";
import CategoryRoute from "./Routes/CategoryRoute.js";
import BillingRoute from "./Routes/BillingRoute.js";
import OrderRoute from "./Routes/OrderRoute.js";
import DashboardRoute from "./Routes/DashboardRoute.js";

dotenv.config();

await ConnectDB()


const app = express();



app.use(cors({
  origin: "*", // Allow requests from any domain
  credentials: true, 
}));

const PORT = process.env.PORT || 5001;

app.use(express.json());
app.use(cookieParser());



app.use('/api/admin', AdminRoute)
app.use('/api/user', UserRoute)
app.use('/api/product', ProductRoute)
app.use('/api/category', CategoryRoute)
app.use('/api/billing', BillingRoute)
app.use('/api/orders', OrderRoute)
app.use('/api/dashboard', DashboardRoute);


app.get('/', (req, res) => {
    res.send('Hello World!');
})

app.listen(PORT, () => {
    
    console.log(`Server is running on port ${PORT}`);
});    