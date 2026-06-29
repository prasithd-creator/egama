import express from "express";
import firecrawlController from "../Controller/firecrawlController.js";
import huggingFace from "../Controller/huggingFaceController.js";
import imageToVideoPrompt from "../Controller/huggingFaceVideoController.js";
import upload from "../middlewares/multer.js";
import { uploadImage } from "../Controller/uploadImage.js";

const userRouter = express.Router();

userRouter.post("/firecrawl", firecrawlController);
userRouter.post("/huggingface", huggingFace);
userRouter.post("/imageToVideoPrompt", imageToVideoPrompt);
userRouter.post("/uploadimage", upload.array("images"), uploadImage);


export default userRouter;