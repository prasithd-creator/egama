import axios from "axios";
import { toast } from "react-toastify";


export const sendReGenerateVideoPrompt = async (prompt: string, change: string, allStates: any, BackendUrl: string, sceneNumber: number) => {
    console.log("Prompt:", prompt);
    console.log("Prompt Change:", change);
    console.log("All States:", allStates);
    console.log("Backend URL:", BackendUrl);
    console.log("Scene Number:", sceneNumber);


    if (!change.trim()) {
        toast.warn("Please enter what you'd like to change in the prompt.");
        return "Please enter what you'd like to change in the prompt.";
    }
    const res = await axios.post(`${BackendUrl}/api/reGenerateOllamaPrompt`, { prompt, changes: change, category: allStates?.scenes?.screenplay?.company_name, brand: allStates?.scenes?.screenplay?.brand_name, topic: allStates?.requirements, sceneNumber, generation_type: "video_prompts" });

    if (!res.data.success || !res.data.jobId) {
        toast.error(res.data.message);
        return res.data.message;
    }



    console.log(res.data);

    return res.data;
}


