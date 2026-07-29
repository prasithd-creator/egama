import axios from "axios";
import { useContext } from "react";
import { AppContext } from "../Context/createContent";



export const sendReGenerateVideoPrompt = async (prompt: string, change: string, allStates: any[]) => {
    const context = useContext(AppContext);
    const BackendUrl = context?.BackendUrl as string;
    console.log("Prompt:", prompt);
    console.log("Prompt Change:", change);
    console.log("All States:", allStates);
    try {
        const res = await axios.post(`${BackendUrl}/api/reGenerateOllamaPrompt`, {prompt, change})
    } catch (error) {
        
    }
    return "";
}