import express from "express";
import cors from "cors";
import "dotenv/config";
import userRouter from "./Router/userRouter.js";
import { connectCloudinary } from "./Config/Cloudinary.js";
import path from "path";
import connectDB from "./Config/mongoDB.ts";
import dns from "node:dns";
dns.setServers(["1.1.1.1", "8.8.8.8"]);
const app = express();
const PORT = process.env.PORT || 5000;
connectDB();
connectCloudinary();

app.use(cors());
app.use(express.json());
app.use(
    "/videos",
    express.static(path.join(process.cwd(), "videos"))
);

// Routes
app.get("/", (req, res) => {
    res.send("Hello World!");
})
app.use("/api", userRouter);

app.listen(process.env.PORT, '0.0.0.0', () => {
    console.log(`Server is running on port ${process.env.PORT}`);
});