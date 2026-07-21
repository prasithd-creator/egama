import mongoose from "mongoose";
import ImagePrompt from "../Models/imagePrompt.ts";

const connectDB = async () => {
    try {
        mongoose.connection.on("connected", () => {
            console.log("Connected to MongoDB");
        });
        console.log(process.env.MONGODB_URL)
        await mongoose.connect(`${process.env.MONGODB_URL}`, { dbName: "egamaFlow" });
        await ImagePrompt.syncIndexes();
    } catch (error) {
        console.error("MongoDB connection failed:", error);
        process.exit(1);
    }
};

export default connectDB;