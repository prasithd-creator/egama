import express from "express";
import firecrawlController from "../Controller/firecrawlController.js";
import huggingFace from "../Controller/huggingFaceController.js";
import imageToVideoPrompt from "../Controller/huggingFaceVideoController.js";
import upload from "../middlewares/multer.js";
import { uploadImage } from "../Controller/uploadImage.js";
import referenceimage from "../Controller/Images/referencesImage.js";
import ollama from "../Controller/Ollama/Ollama.js";
import ollamaVideoPrompt from "../Controller/Ollama/OllamaVideoPrompt.js";
import { mainMerge } from "../Controller/ffmpeg/mainMerge.js";
import ollamaScences from "../Controller/Ollama/OllamaScens.js";
import { getProgress } from "../Controller/Ollama/Ollama-progress.js";
import { uploadImages } from "../Controller/UploadDB/uploadImageDB.js";
import { getMongoData } from "../Controller/UploadDB/getMongoData.js";
import {cancelGeneration} from "../Controller/cancelController.js";
import ollamaImageAnalysis from "../Controller/Ollama/OllamaImageAnalysis.js";
import textToSpeech from "../Controller/LMNT/textToSpeech.js";


const userRouter = express.Router();

userRouter.post("/firecrawl", firecrawlController);
userRouter.post("/huggingface", huggingFace);
userRouter.post("/imageToVideoPrompt", imageToVideoPrompt);
userRouter.post("/uploadimage", upload.array("images"), uploadImage);
userRouter.post("/referenceimage", referenceimage);
userRouter.post("/ollama", ollama);
userRouter.post("/ollamaVideoPrompt", ollamaVideoPrompt);
userRouter.post("/mainMerge", upload.fields([
    { name: "video1", maxCount: 1 },
    { name: "video2", maxCount: 1 }
]), mainMerge);
userRouter.post("/ollamaScences", ollamaScences);
userRouter.get("/ollamaProgress/:id", getProgress);
userRouter.post("/uploadImage/db", uploadImages);
userRouter.get("/getMongoData", getMongoData);
userRouter.post("/cancelGeneration", cancelGeneration);
userRouter.post("/ollamaImageAnalysis", ollamaImageAnalysis);
userRouter.post("/textToSpeech", textToSpeech);


export default userRouter;