import { useLocation, useNavigate } from "react-router"
import { useState, useContext, useEffect, useRef } from "react";
import workflow from "../../Comfy_Api/imageAPI-Img";
import { AppContext } from "../../Context/createContent";
import axios from "axios";
import { toast } from "react-toastify";
import RegenerateIcon from "../../assets/re_generate.svg";

function Images() {
    const location = useLocation();
    const navigate = useNavigate();
    const context = useContext(AppContext);
    const state = location?.state?.data?.data?.image_prompts as any;
    const responseData = state;
    const requirements = location?.state?.requirements as any;
    const [loading, setLoading] = useState<boolean>(false);
    const [imagegenerate, setImagegenerate] = useState<string[] | any>(null);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const backendUrl = context?.BackendUrl as string;
    const [videoPrompt, setVideoPrompt] = useState<any>(null);
    const [reGenerate, setRegenerate] = useState<boolean>(false);
    const [uploading, setUploading] = useState<boolean>(false);
    const [comfyImage, setComfyImage] = useState<any>(null);
    const [generateLoading, setGenerateLoading] = useState<boolean>(false);
    const referencesImg = location?.state?.uploaded as any;
    const companyDetails = location?.state?.details as any;
    const webContent = location?.state?.webContent as any;
    const [timer, setTimer] = useState<any>(0);
    const timerRef = useRef<any>(null);
    const cancelledRef = useRef(false);
    const [progress, setProgress] = useState(0);
    const scenes = location?.state?.scenes?.data?.screenplay?.scenes as any;



    //combin the prompt and negative prompt
    const combined = state?.map((item: any) => ({
        combined_prompt: `Prompt: ${item.prompt}, \nNegative Prompt: ${item.negative_prompt}`,
    }));



    /// final code
    const sleep = (ms: number) =>
        new Promise((resolve) => setTimeout(resolve, ms));

    const prompts = responseData;

    // ----------------------------
    // GENERATE IMAGE on Comfy UI
    // ----------------------------
    // const generateImage = async () => {
    //     try {
    //         cancelledRef.current = false;
    //         setLoading(true);
    //         const results: string[] = [];

    //         // LOOP PROMPTS ONE BY ONE
    //         for (const p of prompts) {
    //             if (cancelledRef.current) {
    //                 console.log("Generation stopped.");
    //                 break;
    //             }

    //             const wf = structuredClone(workflow);

    //             // references images prompt
    //             wf["135"].inputs.text = p; // your CLIPTextEncode node

    //             wf["125"].inputs.noise_seed = Math.floor(Math.random() * 999999999);


    //             if (referencesImg?.length >= 2) {
    //                 wf["76"].inputs.image = referencesImg[0];
    //                 wf["81"].inputs.image = referencesImg[1];
    //             } else {
    //                 throw new Error("Need 2 input images");
    //             }

    //             console.log("Sending prompt:", p);

    //             // 1. SEND REQUEST
    //             const res = await fetch("/api/prompt", {
    //                 method: "POST",
    //                 headers: { "Content-Type": "application/json" },
    //                 body: JSON.stringify({ prompt: wf }),
    //             });

    //             const data = await res.json();
    //             const promptId = data.prompt_id;
    //             const ws = new WebSocket("ws://192.168.0.161:5454/ws");

    //             ws.onmessage = (event) => {
    //                 const msg = JSON.parse(event.data);

    //                 if (msg.type === "progress") {
    //                     const { value, max } = msg.data;

    //                     const percent = Math.round((value / max) * 100);

    //                     setProgress(percent);
    //                     console.log("Progress:", percent);
    //                 }

    //                 if (
    //                     msg.type === "executing" &&
    //                     msg.data.node === null &&
    //                     msg.data.prompt_id === promptId
    //                 ) {
    //                     setProgress(100);
    //                     ws.close();
    //                 }
    //             };
    //             if (!promptId) continue;

    //             // 2. WAIT FOR IMAGE
    //             let imageUrl = null;

    //             for (let i = 0; i < 20; i++) {
    //                 console.log(cancelledRef.current);
    //                 if (cancelledRef.current) {
    //                     console.log("Generation cancelled by user.");
    //                     break;
    //                 }
    //                 await sleep(3000);

    //                 const historyRes = await fetch(`/api/history/${promptId}`);
    //                 const history = await historyRes.json();
    //                 console.log("History:", history);

    //                 const job = history?.[promptId];

    //                 if (!job) {
    //                     break;
    //                 }

    //                 if (job.status?.status_str === "error") {
    //                     console.log("Generation interrupted.");
    //                     break;
    //                 }

    //                 const image = job.outputs?.["94"]?.images?.[0];

    //                 if (image) {
    //                     imageUrl = `http://192.168.0.161:5454/api/view?filename=${image.filename}`;
    //                     break;
    //                 }
    //             }

    //             if (imageUrl) {
    //                 results.push(imageUrl);
    //                 setRegenerate(true);
    //                 setImagegenerate([...results]); // update UI live
    //             }


    //         }
    //     } catch (err) {
    //         console.error(err);
    //         toast.error("Failed to generate images");
    //     } finally {
    //         setLoading(false);
    //     }
    // };

    // Common function: generates ONE image
    const generateSingleImage = async (p: string) => {
        const wf = structuredClone(workflow);

        wf["135"].inputs.text = p;
        wf["125"].inputs.noise_seed = Math.floor(Math.random() * 999999999);

        if (referencesImg?.length >= 2) {
            wf["76"].inputs.image = referencesImg[0];
            wf["81"].inputs.image = referencesImg[1];
        } else {
            throw new Error("Need 2 input images");
        }

        const res = await fetch("/api/prompt", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ prompt: wf }),
        });

        const data = await res.json();
        const promptId = data.prompt_id;

        if (!promptId) return null;


        const ws = new WebSocket("ws://192.168.0.161:5454/ws");

        ws.onmessage = (event) => {
            const msg = JSON.parse(event.data);

            if (msg.type === "progress") {
                const { value, max } = msg.data;
                setProgress(Math.round((value / max) * 100));
            }

            if (
                msg.type === "executing" &&
                msg.data.node === null &&
                msg.data.prompt_id === promptId
            ) {
                setProgress(100);
                ws.close();
            }
        };


        for (let i = 0; i < 20; i++) {

            if (cancelledRef.current) {
                ws.close();
                break;
            }

            await sleep(3000);

            const historyRes =
                await fetch(`/api/history/${promptId}`);

            const history = await historyRes.json();

            const job = history?.[promptId];

            if (!job) continue;


            const image = job.outputs?.["94"]?.images?.[0];

            if (image) {
                ws.close();

                return `http://192.168.0.161:5454/api/view?filename=${image.filename}`;
            }
        }

        return null;
    };


    // generateImage
    const generateImage = async () => {
        try {
            cancelledRef.current = false;
            setLoading(true);

            const results: string[] = [];

            for (const p of prompts) {

                if (cancelledRef.current) break;

                const imageUrl = await generateSingleImage(p);

                if (imageUrl) {
                    results.push(imageUrl);

                    setRegenerate(true);
                    setImagegenerate([...results]);
                }
            }

        } catch (err) {
            console.error(err);
            toast.error("Failed to generate images");
        } finally {
            setLoading(false);
        }
    };

    // regenerateImage
    const regenerateImage = async (index: number) => {
        try {
            cancelledRef.current = false;
            setLoading(true);

            const imageUrl = await generateSingleImage(prompts[index]);

            if (imageUrl) {
                setImagegenerate((prev: string[]) => {
                    const updated = [...prev];
                    updated[index] = imageUrl; // replace only selected image
                    return updated;
                });
            }

        } catch (err) {
            console.error(err);
            toast.error("Regeneration failed");
        } finally {
            setLoading(false);
        }
    };

    ///cancellation for the image generation
    const cancelImageGeneration = async () => {
        try {
            cancelledRef.current = true;
            // cancel only one image {use: interrupt}
            await fetch("/api/interrupt", {
                method: "POST",
            });
            const res = await fetch("/api/queue", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ clear: true, }) });
            console.log(res);

            if (res.ok) {
                console.log("Image generation cancelled successfully");
            }

        } catch (error) {
            console.log(error);
        }
    }


    ///Generate the Image to Video Prompt
    const generateVideoPrompt = async (data: any) => {
        setGenerateLoading(true);
        setTimer(0);
        timerRef.current = setInterval(() => {
            setTimer((prev: number) => prev + 1);
        }, 1000);
        try {
            const res = await axios.post(`${backendUrl}/api/ollamaVideoPrompt`, { images: data, requirements, companyDetails, webContent, scenes });
            console.log(res);
            if (res.data.success) {
                console.log(res.data);
                setVideoPrompt(res.data);
                const uploaded = await uploadComfy(data);
                // navigate("/videos", { state: { details: responseData, videoPrompt: res.data, image: data, comfyImage: uploaded } });
            }
        } catch (error) {
            console.log(error);
        } finally {
            // Stop timer
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
            setGenerateLoading(false);
        }
    }



    ///Upload the image to the cloudinary
    const uploadImage = async () => {
        setUploading(true);
        console.log(imagegenerate);
        try {
            const res = await axios.post(`${backendUrl}/api/uploadimage`, { images: imagegenerate });
            console.log(res.data);
            if (res.data.success) {
                setImagegenerate(res.data.urls);
                generateVideoPrompt(res.data.urls);
            }
        }
        catch (error) {
            console.log(error);
        } finally {
            setUploading(false);
        }
    }

    ///Upload the image to comfy input
    const uploadComfy = async (imageUrls: string[]) => {
        const uploadedFiles: string[] = [];

        for (const imageUrl of imageUrls) {
            const imageResponse = await fetch(imageUrl);
            const blob = await imageResponse.blob();

            const formData = new FormData();
            formData.append("image", blob, "image.png");
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
        <div className="min-h-screen text-white p-6">

            {/* Header */}
            <div className={`flex items-center justify-between ${loading ? "mb-2" : "mb-10"}`}>
                <div>
                    <button onClick={() => navigate(-1)} className="cursor-pointer px-6 py-2 bg-gray-800 rounded-full hover:bg-gray-700 transition-all duration-200 ease-in-out">Back</button>
                </div>
                <div>
                    <h1 className="text-3xl font-bold">Image Prompts</h1>
                    <p className="text-gray-400 text-sm">
                        Generated workflow prompts & AI images
                    </p>
                </div>

                <div className="flex gap-4">
                    <button
                        onClick={generateImage}
                        disabled={loading}
                        className="bg-green-500 hover:bg-green-600 cursor-pointer disabled:opacity-50 text-white px-6 py-3 rounded-2xl font-semibold shadow-lg transition-all flex items-center gap-2"
                    >
                        {loading && <div className="w-5 h-5 border-2 border-green-900 border-t-transparent rounded-full animate-spin"></div>}
                        {!loading && reGenerate && <img src={RegenerateIcon} className="icon" alt="Regenerate" />}
                        {loading ? "Generating..." : reGenerate ? "Regenerate" : "Generate Images"}
                    </button>

                    {
                        loading &&
                        <button className="bg-red-500 hover:bg-red-600 cursor-pointer disabled:opacity-50 text-white px-6 py-3 rounded-2xl font-semibold shadow-lg transition-all flex items-center gap-2" onClick={cancelImageGeneration}>Cancel Generation</button>
                    }
                    {reGenerate &&
                        <button
                            onClick={uploadImage}
                            disabled={loading || uploading || generateLoading}
                            className="bg-blue-500 hover:bg-blue-600 cursor-pointer disabled:opacity-50 text-white px-6 py-3 rounded-2xl font-semibold shadow-lg transition-all flex items-center gap-2"
                        >
                            {uploading && <div className="w-5 h-5 border-2 border-blue-900 border-t-transparent rounded-full animate-spin"></div>}
                            {generateLoading && <div className="w-5 h-5 border-2 border-blue-900 border-t-transparent rounded-full animate-spin"></div>}
                            {uploading ? "Uploading..." : generateLoading ? "Generating Prompt..." : "Upload"}
                        </button>
                    }
                </div>
            </div>

            {/* ProgressBar */}
            {loading && (
                <div className="mb-4 w-full">
                    <div className="flex justify-between mb-2">
                        <span className="text-sm font-medium text-gray-300">
                            Generating...
                        </span>
                        <span className="text-sm font-semibold text-green-600">
                            {progress}%
                        </span>
                    </div>

                    <div className="w-full h-2 bg-gray-400 rounded-full overflow-hidden">
                        <div
                            className="h-full rounded-full bg-gradient-to-r from-green-400 via-green-500 to-emerald-600 transition-all duration-500 ease-in-out"
                            style={{
                                width: `${progress}%`,
                            }}
                        />
                    </div>
                </div>
            )}

            {/* Content Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-[calc(100vh-200px)]">

                {/* PROMPTS SECTION */}
                <div className="bg-[#1f2937] border border-gray-700 rounded-3xl shadow-2xl p-6 relative">

                    <div className="mb-4">
                        <h2 className="text-xl font-semibold text-white">
                            Prompt List
                        </h2>
                        <p className="text-gray-400 text-sm">
                            AI-generated instructions
                        </p>
                    </div>

                    <div className="space-y-4 max-h-[60vh] overflow-auto pr-2 scrollbar-2 scrollbar-track-gray-800 scrollbar-thumb-gray-600">
                        {(!state || state.length === 0) && (
                            <p className="text-gray-500 text-sm absolute top-1/2 left-1/2 transform translate-x-[-50%] translate-y-[-50%] w-fit">
                                No prompts available
                            </p>
                        )}

                        {combined?.map((item: any, index: number) => (
                            <div
                                key={index}
                                className="flex gap-4 bg-[#111827] border border-gray-700 rounded-2xl p-4 hover:border-green-500 transition-all"
                            >
                                {/* Index */}
                                <div className="p-2 px-4 h-fit flex items-center justify-center rounded-xl bg-green-500 text-black font-bold">
                                    {index + 1}
                                </div>

                                {/* Text */}
                                <p className="text-gray-300 text-sm leading-relaxed">
                                    {item?.combined_prompt}
                                </p>
                            </div>
                        ))}

                    </div>
                </div>

                {/* GENERATED IMAGES SECTION */}
                <div className="bg-[#1f2937] border border-gray-700 rounded-3xl shadow-2xl p-6 relative">

                    <div className="mb-4 flex items-center justify-between ">
                        <div>
                            <h2 className="text-xl font-semibold text-white">
                                Generated Images
                            </h2>
                            <p className="text-gray-400 text-sm">
                                AI visual output results
                            </p>
                        </div>

                        {imagegenerate?.length > 0 && (
                            <span className="bg-green-500 text-black px-4 py-1 rounded-full text-sm font-semibold">
                                {imagegenerate.length} images
                            </span>
                        )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pr-2 max-h-[60vh] overflow-auto scrollbar-2 scrollbar-track-gray-800 scrollbar-thumb-gray-600">
                        {
                            (!imagegenerate || imagegenerate?.length === 0) && (
                                <p className="text-gray-500 text-sm absolute top-1/2 left-1/2 transform translate-x-[-50%] translate-y-[-50%] w-fit">
                                    No images available
                                </p>
                            )
                        }

                        {imagegenerate?.map((item: any, index: number) => (
                            <div
                                key={index}
                                onClick={(e) => { setSelectedImage(item); e.stopPropagation() }}
                                className="relative group cursor-pointer rounded-2xl overflow-hidden border border-gray-700 hover:border-green-500 transition-all shadow-lg"
                            >
                                <img
                                    src={item}
                                    alt={`Generated ${index}`}
                                    className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                                <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                    <button
                                        className="px-5 py-2 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-full shadow-lg transition cursor-pointer"
                                        onClick={(e) => { regenerateImage(index); e.stopPropagation() }}
                                    >
                                        Regenerate
                                    </button>
                                </div>
                            </div>
                        ))}

                    </div>
                </div>
                {selectedImage && (
                    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50" onClick={() => setSelectedImage(null)}>

                        {/* Close button */}
                        <button
                            onClick={(e) => { setSelectedImage(null); e.stopPropagation() }}
                            className="absolute top-6 right-6 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-full font-semibold cursor-pointer"
                        >
                            ✕ Close
                        </button>

                        {/* Image */}
                        <img
                            onClick={(e) => e.stopPropagation()}
                            src={selectedImage}
                            alt="Preview"
                            className="max-w-[90%] max-h-[90%] rounded-2xl shadow-2xl border border-gray-700"
                        />
                    </div>
                )}

            </div>

            {
                generateLoading && (
                    <div className="fixed inset-0 z-50 bg-black/50 overflow-hidden">
                        <div className="flex flex-col items-center justify-center mt-6 w-full h-full">
                            <div className="w-30 h-30 border-4 border-t-transparent rounded-full animate-spin border-white"></div>
                            <p className="text-white animate-pulse duration-800">{formatTime(timer)}</p>
                            <p className="text-white animate-pulse duration-800">Waiting for the response...</p>
                        </div>
                    </div>
                )
            }

        </div>
    )
}

export default Images