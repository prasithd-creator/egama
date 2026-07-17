import mongoose from "mongoose";

const connectDB = async () => {
    try {
        mongoose.connection.on("connected", () => {
            console.log("Connected to MongoDB");
        });
        console.log(process.env.MONGODB_URL)
        await mongoose.connect(`${process.env.MONGODB_URL}`, {dbName: "egamaFlow"});
        console.log(mongoose.connection.name);
    } catch (error) {
        console.error("MongoDB connection failed:", error);
        process.exit(1);
    }
};

export default connectDB;