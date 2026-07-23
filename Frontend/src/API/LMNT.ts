import { useContext } from "react";
import axios from "axios";
import { AppContext } from "../Context/createContent";

export default function useLMNT() {
    const context = useContext(AppContext);
    const BackendUrl = context?.BackendUrl as string;

    const getAudio = async (text: string, voice: string) => {
        const response = await axios.post(
            `${BackendUrl}/api/textToSpeech`,
            { text, voice },
            {
                responseType: "blob",
            }
        );
        console.log(response);

        return response.data;
    };

    return { getAudio };
}