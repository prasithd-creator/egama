import { useState, useEffect, useContext, useRef } from "react";
import logo from "../../assets/egama_logo.png"
import axios from "axios";
import { AppContext } from "../../Context/createContent";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import TOPIC_SCENE_CONFIG from "../../assets/TopicScene";
import OllamaProgress from "./OllamaProgress";

export default function ChatGPTUrlScreen() {
    const navigate = useNavigate();
    const [url, setUrl] = useState<string>("");
    const [submittedUrl, setSubmittedUrl] = useState("");
    const [loading, setLoading] = useState<boolean>(false);
    const stored = localStorage.getItem("responseData");
    const parsed = stored ? JSON.parse(stored) : null;
    const [responseData, setResponseData] = useState(Array.isArray(parsed) ? parsed.length > 0 ? parsed : null : parsed && Object.keys(parsed).length > 0 ? parsed : null);
    const [content, setContent] = useState("");
    const context = useContext(AppContext);
    const [imgGenerated, setImgGenerated] = useState<boolean>(false);
    const [RequirementLoading, setRequirementLoading] = useState<boolean>(false);
    const BackendUrl = context?.BackendUrl as string;
    const [referenceImg, setReferenceImg] = useState<any>([]);
    const [selectedImages, setSelectedImages] = useState<string[]>([]);
    const [comfyImage, setComfyImage] = useState<any>(null);
    const [timer, setTimer] = useState<any>(0);
    const timerRef = useRef<any>(null);
    const [requirement, setRequirement] = useState<string>("");
    const [progress, setProgress] = useState(0);
    const [remaining, setRemaining] = useState<number | null>(null);
    const [result, setResult] = useState<any>(null);
    const [elapsed, setElapsed] = useState(0);
    const [characters, setCharacters] = useState(0);
    const [generatedScenes, setGeneratedScenes] = useState(0);
    const [scenes, setScenes] = useState<any>(null);
    const [generateScenes, setGenerateScenes] = useState<string>("Generate Scenes");
    const [stage, setStage] = useState<1 | 2>(1);
    const [totalScenes, setTotalScenes] = useState<number | null>(null);


    useEffect(() => {
        localStorage.setItem("responseData", JSON.stringify(responseData));
    }, [responseData]);


    //map the image for the referrences in the markdown
    useEffect(() => {
        if (!responseData?.markdown) return;

        const imageRegex = /!\[.*?\]\((https?:\/\/.*?)\)/g;

        const productImages = [...responseData.markdown.matchAll(imageRegex)]
            .map((match) => match[1])
            .slice(0, 15);

        setReferenceImg(productImages);
    }, [responseData?.markdown]);


    //submit the URL
    const handleSubmit = async () => {
        if (!url.trim()) return toast.error("Please paste a URL");

        try {
            setLoading(true);
            setSubmittedUrl(url);
            const res = await axios.post(
                `${BackendUrl}/api/firecrawl`,
                { url }
            );

            if (res.data.success) {
                const data = res.data.data;

                setResponseData(data);

                console.log(data);
            } else {
                toast.error(res.data.message);
            }
        } catch (error) {
            console.log(error);
            toast.error((error as Error).message);
        } finally {
            setLoading(false);
            // navigate("/images", { state: responseData });
        }
    };


    const pollOllamaJob = (
        jobId: string,
        onProgress: (data: any) => void
    ): Promise<any> => {
        return new Promise((resolve, reject) => {
            const interval = setInterval(async () => {
                try {
                    const progressResponse = await axios.get(
                        `${BackendUrl}/api/ollamaProgress/${jobId}`
                    );
                    const progressData = progressResponse.data;

                    onProgress(progressData);

                    if (progressData.status === "completed") {
                        clearInterval(interval);
                        resolve(progressData.data);
                    }

                    if (progressData.status === "failed") {
                        clearInterval(interval);
                        reject(new Error(progressData.error || "Generation failed"));
                    }
                } catch (error) {
                    clearInterval(interval);
                    reject(error);
                }
            }, 1000);
        });
    };



    //submit the requirement
    // const sendResponse = async () => {
    //     if (!selectedImages || selectedImages.length < 2) return toast.error("Please select 2 images");
    //     if (!requirement) return toast.error("Please select the requirement");
    //     //loading
    //     setRequirementLoading(true);
    //     setGenerateScenes("Ollama is thinking...");
    //     //stop the timer
    //     setTimer(0);
    //     timerRef.current = setInterval(() => {
    //         setTimer((prev: number) => prev + 1);
    //     }, 1000);
    //     const metadata = responseData?.metadata;

    //     if (!metadata) return;

    //     const updatedMetadata = {
    //         ...metadata,
    //         requirements: requirement,
    //     };
    //     const updatedResponseData = {
    //         ...responseData,
    //         metadata: updatedMetadata,
    //     };

    //     setResponseData({
    //         ...responseData,
    //         metadata: updatedMetadata,
    //     });

    //     const selectedScene =
    //         updatedMetadata.requirements as keyof typeof TOPIC_SCENE_CONFIG;

    //     const scene = TOPIC_SCENE_CONFIG[selectedScene];
    //     setScenes(scene);
    //     console.log(scene);
    //     console.log(updatedMetadata);
    //     console.log(updatedMetadata.description);
    //     console.log(updatedMetadata.requirements);
    //     let timer: any;
    //     try {
    //         setGenerateScenes("Ollama is Generating the Scenes...");
    //         const res = await axios.post(
    //             `${BackendUrl}/api/ollamaScences`, { text: updatedResponseData.metadata, webContent: responseData.makedown, scene, topic: selectedScene }
    //         )

    //         const jobId = res.data.jobId;
    //         timer = setInterval(async () => {
    //             try {

    //                 const progressResponse = await axios.get(
    //                     `${BackendUrl}/api/ollamaProgress/${jobId}`
    //                 );

    //                 const progressData = progressResponse.data;
    //                 console.log(progressData);
    //                 setProgress(progressData.progress);

    //                 setRemaining(progressData.remaining);

    //                 setElapsed(progressData.elapsed);

    //                 setCharacters(progressData.characters);

    //                 setGeneratedScenes(progressData.scenes);

    //                 if (progressData.status === "completed") {
    //                     // clearInterval(timer);
    //                     const scenes = progressData.data;
    //                     try {
    //                         setGenerateScenes("Ollama is Generating the Prompt...");
    //                         const res = await axios.post(
    //                             `${BackendUrl}/api/ollama`, { text: updatedResponseData.metadata, webContent: responseData.makedown, topic: selectedScene, scenes }
    //                         )
    //                         const prompt = res.data;
    //                         setImgGenerated(true);

    //                         const uploaded = await uploadComfy(selectedImages);

    //                         console.log("Upload completed:", uploaded);

    //                         navigate("/images", { state: { data: prompt, uploaded, requirements: responseData.metadata.requirements, details: responseData.metadata, webContent: responseData.makedown, scenes } });
    //                         console.log(res.data);
    //                         setRequirementLoading(false);
    //                     } catch (error) {
    //                         console.log(error);

    //                         setRequirementLoading(false);
    //                         return;
    //                     }
    //                 }
    //                 if (progressData.status === "failed") {

    //                     clearInterval(timer);

    //                     setRequirementLoading(false);

    //                     toast.error(
    //                         progressData.error || "Generation failed"
    //                     );
    //                 }
    //             } catch (error) {
    //                 console.log(error);
    //             }
    //         }, 1000);
    //     } catch (error) {
    //         console.log(error);
    //         toast.error((error as Error).message);
    //         setRequirementLoading(false);
    //     }
    // };

    const sendResponse = async () => {
        if (!selectedImages || selectedImages.length < 2) return toast.error("Please select 2 images");
        if (!requirement) return toast.error("Please select the requirement");

        // loading
        setRequirementLoading(true);
        setGenerateScenes("Ollama is thinking...");

        // stop the timer
        setTimer(0);
        timerRef.current = setInterval(() => {
            setTimer((prev: number) => prev + 1);
        }, 1000);

        const metadata = responseData?.metadata;
        if (!metadata) return;

        const updatedMetadata = {
            ...metadata,
            requirements: requirement,
        };
        const updatedResponseData = {
            ...responseData,
            metadata: updatedMetadata,
        };

        setResponseData({
            ...responseData,
            metadata: updatedMetadata,
        });

        const selectedScene =
            updatedMetadata.requirements as keyof typeof TOPIC_SCENE_CONFIG;

        const scene = TOPIC_SCENE_CONFIG[selectedScene];
        setScenes(scene);

        try {
            // ---- Stage 1: generate the screenplay/scenes ----
            setStage(1);
            setTotalScenes(scene.sceneCount ?? 0);
            setGenerateScenes("Ollama is Generating the Scenes...");

            const scenesRes = await axios.post(`${BackendUrl}/api/ollamaScences`, {
                text: updatedResponseData.metadata,
                webContent: responseData.makedown,
                scene,
                topic: selectedScene,
            });

            const scenesJobId = scenesRes.data.jobId;

            const screenplay = await pollOllamaJob(scenesJobId, (progressData) => {
                setProgress(progressData.progress);
                setRemaining(progressData.remaining);
                setElapsed(progressData.elapsed);
                setCharacters(progressData.characters);
                setGeneratedScenes(progressData.scenes);
            });

            // ---- Stage 2: generate the image prompts ----
            // The backend receives the FULL screenplay and internally generates
            // one image prompt per scene, scene by scene, reporting continuous
            // progress under a single jobId. It only resolves once every scene's
            // prompt has been generated.
            setStage(2);
            setTotalScenes(screenplay?.screenplay?.scene_count ?? 0);
            setGenerateScenes("Ollama is Generating the Prompts...");
            setProgress(0);
            setElapsed(0);
            setCharacters(0);
            setGeneratedScenes(0);

            const promptRes = await axios.post(`${BackendUrl}/api/ollama`, {
                text: updatedResponseData.metadata,
                webContent: responseData.makedown,
                scenes: screenplay,
            });

            const promptJobId = promptRes.data.jobId;

            const prompt = await pollOllamaJob(promptJobId, (progressData) => {
                setProgress(progressData.progress);
                setRemaining(progressData.remaining);
                setElapsed(progressData.elapsed);
                setCharacters(progressData.characters);
                setGeneratedScenes(progressData.scenes);
            });

            setImgGenerated(true);

            const uploaded = await uploadComfy(selectedImages);
            console.log("Upload completed:", uploaded);

            navigate("/images", {
                state: {
                    data: prompt, // { image_prompts: [...] }
                    uploaded,
                    requirements: responseData.metadata.requirements,
                    details: responseData.metadata,
                    webContent: responseData.makedown,
                    scenes: screenplay,
                },
            });

            setRequirementLoading(false);
        } catch (error) {
            console.log(error);
            toast.error((error as Error).message);
            setRequirementLoading(false);
        }
    };

    //select the images
    const handleSelectImage = (image: string) => {
        setSelectedImages((prev) => {
            // Unselect if already selected
            if (prev.includes(image)) {
                return prev.filter((img) => img !== image);
            }

            // Allow only 2 selections
            if (prev.length >= 2) {
                return [prev[1], image];
            }

            return [...prev, image];
        });
    };



    //upload the image to comfy
    const uploadComfy = async (imageUrls: string[]) => {
        const uploadedFiles: string[] = [];

        for (const imageUrl of imageUrls) {

            const imageResponse = await fetch(`${BackendUrl}/api/referenceimage`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ url: imageUrl, siteUrl: responseData?.metadata?.url }),
            });

            if (!imageResponse.ok) {
                console.error("Failed proxy fetch");
                continue;
            }

            const blob = await imageResponse.blob();

            const formData = new FormData();
            const extension = blob.type === "image/jpeg" ? "jpg" : blob.type === "image/webp" ? "webp" : "png";
            formData.append("image", blob, `image.${extension}`);
            formData.append("type", "input");

            const res = await fetch("/api/upload/image", {
                method: "POST",
                body: formData,
            });

            if (!res.ok) {
                console.error(await res.text());
                continue;
            }

            const data = await res.json();

            uploadedFiles.push(data.name);
            console.log("Uploaded:", data.name);
        }

        setComfyImage(uploadedFiles);
        return uploadedFiles;
    };


    //formet the timer
    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, "0")}`;
    };





    return (

        <div className="min-h-screen">


            {/* Logo */}
            <div className="absolute top-6 left-6 flex items-center gap-3">
                <img
                    src={logo}
                    alt="Logo"
                    className="w-16 object-contain"
                />

                <div>
                    <h1 className="text-white text-xl font-bold">
                        Egama AI
                    </h1>

                    <p className="text-gray-400 text-sm">
                        Workflow Dashboard
                    </p>
                </div>
            </div>

            {/* Main */}
            <div className="flex items-center justify-center min-h-screen px-4">

                <div className="w-full max-w-3xl">

                    {/* Title */}
                    <div className="text-center mb-10">

                        <h1 className="text-3xl font-bold text-white mb-1" onClick={() => navigate("/images", { state: responseData })}>
                            AI Workflow Generator
                        </h1>

                        <p className="text-gray-400 text-lg">
                            Submit your workflow and automate with AI
                        </p>

                    </div>

                    {/* Main Card */}
                    <div className="bg-[#1f2937] border border-gray-700 rounded-3xl shadow-2xl p-6">

                        {/* URL Input */}
                        <div className="flex flex-col md:flex-row gap-4">

                            <input
                                type="url"
                                placeholder="Paste your workflow URL..."
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                className="flex-1 bg-[#111827]  border border-gray-600   rounded-2xl  px-5 py-4 text-white placeholder-gray-500 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/30 transition-all
                        "
                            />

                            <button onClick={handleSubmit} disabled={loading} className="bg-green-500 hover:bg-green-600 text-white cursor-pointer px-8 py-4 rounded-2xl font-semibold transition-all disabled:opacity-50 shadow-lg hover:shadow-green-500/30">
                                {loading ? "Sending..." : "Submit URL"}
                            </button>

                        </div>

                        {/* Submitted URL */}
                        {submittedUrl && (
                            <div className="mt-6 bg-[#111827] border border-gray-700 rounded-2xl p-5">

                                <p className="text-gray-400 text-sm mb-2">
                                    Submitted URL
                                </p>

                                <p className="text-green-400 break-all">
                                    {submittedUrl}
                                </p>
                            </div>
                        )}

                        {/* Loading */}
                        {loading && (
                            <div className="mt-6 bg-[#111827] border border-gray-700 rounded-2xl p-5 flex items-center gap-4">

                                <div className="w-5 h-5 border-2 border-green-400 border-t-transparent rounded-full animate-spin"></div>

                                <p className="text-gray-300">
                                    Waiting for the response...
                                </p>

                            </div>
                        )}

                        {/* Response */}
                        {!loading && responseData &&
                            ((Array.isArray(responseData) && responseData.length > 0) || (!Array.isArray(responseData) && Object.keys(responseData).length > 0)
                            ) && (
                                <div className="mt-8 space-y-6">

                                    {/* Content Input */}


                                    {/* Response Box */}
                                    <div className="bg-[#111827] border border-gray-700 rounded-2xl overflow-hidden">
                                        {/* Header */}
                                        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-700">

                                            <div>
                                                <h2 className="text-white font-semibold text-lg cursor-pointer" title={responseData?.metadata?.title}>
                                                    {!responseData?.metadata?.title
                                                        ? "Workflow execution result"
                                                        : responseData.metadata.title.length > 30
                                                            ? responseData.metadata.title.slice(0, 30) + "..."
                                                            : responseData.metadata.title}
                                                </h2>

                                                <p className="text-gray-400 text-sm">
                                                    Workflow execution result
                                                </p>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>

                                                <span className="text-green-400 text-sm">
                                                    Live
                                                </span>
                                            </div>

                                        </div>

                                    </div>
                                    <div className="flex flex-col md:flex-row gap-4 overflow-x-auto scrollbar-2 scrollbar-track-gray-800 scrollbar-thumb-gray-600">
                                        {referenceImg?.map((item: string, index: number) => {
                                            const selected = selectedImages.includes(item);

                                            return (
                                                <div
                                                    key={index}
                                                    onClick={() => handleSelectImage(item)}
                                                    className={`relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all flex-shrink-0 ${selected
                                                        ? "border-blue-500"
                                                        : "border-transparent hover:border-gray-400"
                                                        }`}
                                                >
                                                    <img
                                                        src={item}
                                                        alt={`Reference ${index + 1}`}
                                                        className="w-64 h-40 object-cover"
                                                    />

                                                    {selected && (
                                                        <div className="absolute top-2 right-2 bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">
                                                            ✓
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                    <div className="flex flex-col md:flex-row gap-4">

                                        {/* <input
                                            type="text"
                                            placeholder="Describe user requirement..."
                                            value={content}
                                            onChange={(e) => setContent(e.target.value)}
                                            className="flex-1 bg-[#111827] border border-gray-600 rounded-2xl px-5 py-4 text-white placeholder-gray-500 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 transition-all"
                                        /> */}

                                        <select
                                            value={requirement}
                                            onChange={(e) => setRequirement(e.target.value)}
                                            className={`flex-1 bg-[#111827] border border-gray-700 rounded-xl px-4 py-3 pr-10 text-sm font-medium outline-none cursor-pointer appearance-none transition-all duration-200 hover:border-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 ${requirement ? "text-white" : "text-gray-500"
                                                }`}
                                        >
                                            <option value="" disabled>
                                                Select the requirement
                                            </option>

                                            {Object.entries(TOPIC_SCENE_CONFIG).map(([key, value]) => (
                                                <option
                                                    key={key}
                                                    value={key}
                                                    className="text-white bg-[#111827]"
                                                >
                                                    {`${key.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())} (${value.sceneCount} scenes)`}
                                                </option>
                                            ))}
                                        </select>


                                        <button onClick={sendResponse} className={`cursor-pointer bg-blue-500 hover:bg-blue-600 text-white px-8 py-4 rounded-2xl font-semibold transition-all shadow-lg hover:shadow-blue-500/30 ${!requirement ? "opacity-50 cursor-not-allowed" : ""}`}>
                                            {RequirementLoading ? "Sending..." : "Send Requirement"}
                                        </button>

                                    </div>

                                </div>
                            )}

                    </div>

                </div>

            </div>

            {/* resopnse Loading */}
            {
                RequirementLoading && (
                    <div className="fixed z-50 inset-0 bg-black/30 backdrop-blur-sm">

                        <div className="flex flex-col items-center justify-center w-full h-full gap-6">


                            <OllamaProgress
                                loading={RequirementLoading}
                                progress={progress}
                                remaining={remaining}
                                elapsed={elapsed}
                                scenes={generatedScenes}
                                totalScenes={scenes?.sceneCount}
                                characters={characters}
                                text={generateScenes}
                                stage={stage}
                            />


                        </div>

                    </div>
                )
            }


        </div>

    );
}