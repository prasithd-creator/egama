import { useLocation, useNavigate } from "react-router"
import { useState, useContext, useEffect, useRef } from "react";
import workflow from "../../Comfy_Api/imageAPI-Img";
import { AppContext } from "../../Context/createContent";
import axios from "axios";
import { toast } from "react-toastify";
import RegenerateIcon from "../../assets/re_generate.svg";
import OllamaProgress from "./OllamaProgress";

const STORAGE_KEY = "imagesPageState";
const JOB_STORAGE_KEY = "imagesPageActiveJob";

function Images() {
    const location = useLocation();
    const navigate = useNavigate();
    const context = useContext(AppContext);
    const allStatesRef = useRef<any>(
        location?.state ??
        (() => {
            try {
                const cached = sessionStorage.getItem(STORAGE_KEY);
                return cached ? JSON.parse(cached) : null;
            } catch {
                return null;
            }
        })()
    );
    const allStates = allStatesRef.current;
    const state = allStates?.data?.image_prompts as any;
    const [imgPromptState, setImgPromptState] = useState(state);
    const requirements = allStates?.requirements as any;
    const [loading, setLoading] = useState<boolean>(false);
    const defaultImages = [
        "https://res.cloudinary.com/dwdllwrim/image/upload/v1783928702/comfyui/hcdhd7j7iuo9tlsrk3k9.png",
        "https://res.cloudinary.com/dwdllwrim/image/upload/v1783683976/comfyui/urlk3hydhtcoe8gfmdsm.png",
    ];
    const images = imgPromptState?.map((item: any) => item.image_url).filter(Boolean) ?? [];
    const [imagegenerate, setImagegenerate] = useState<string[]>(images.length ? images : defaultImages);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const backendUrl = context?.BackendUrl as string;
    const [videoPrompt, setVideoPrompt] = useState<any>(null);
    const [reGenerate, setRegenerate] = useState<boolean>(false);
    const [uploading, setUploading] = useState<boolean>(false);
    const [comfyImage, setComfyImage] = useState<any>(null);
    const [generateLoading, setGenerateLoading] = useState<boolean>(false);
    const referencesImg = allStates?.uploaded as any;
    const companyDetails = allStates?.details as any;
    const webContent = allStates?.webContent as any;
    const [timer, setTimer] = useState<any>(0);
    const timerRef = useRef<any>(null);
    const cancelledRef = useRef(false);
    const [progress, setProgress] = useState(0);
    const scenes = allStates?.scenes?.screenplay?.scenes as any;
    const [elapsed, setElapsed] = useState(0);
    const [characters, setCharacters] = useState(0);
    const [generatedScenes, setGeneratedScenes] = useState(0);
    const [totalScenes, setTotalScenes] = useState<number | null>(null);
    const [remaining, setRemaining] = useState<number | null>(null);
    const [generateScenes, setGenerateScenes] = useState<string>("Generate Video Prompt");
    const [jobId, setJobId] = useState<string | null>(null);
    const [editIndex, setEditIndex] = useState<number | null>(null);
    const [promptChange, setPromptChange] = useState<string>("");
    const activeGenerationRef = useRef(false);

    // Tracks *what kind* of job jobId refers to, so a resumed job after a
    // refresh knows where to apply its result (which index / which flow).
    const jobMetaRef = useRef<{ type: "regenerate" | "videoPrompt"; index?: number } | null>(null);


    console.log(allStates?.details?.title);
    console.log(allStates)
    //combin the prompt and negative prompt
    const combined = imgPromptState?.map((item: any) => ({
        combined_prompt: `Prompt: ${item.prompt}, \nNegative Prompt: ${item.negative_prompt}`,
    }));

    console.log(combined);

    console.log(scenes);


    // Cache the initial navigation payload as soon as we land with real router state
    useEffect(() => {
        if (location.state) {
            try {
                sessionStorage.setItem(STORAGE_KEY, JSON.stringify(location.state));
            } catch {
                // ignore quota errors
            }
        }
    }, [location.state]);

    // Keep the cached copy in sync with edits (prompt regeneration etc.) so a
    // refresh mid-edit restores the latest prompts, not the original ones.
    useEffect(() => {
        if (!allStates) return;
        try {
            const merged = {
                ...allStates,
                data: { ...allStates.data, image_prompts: imgPromptState }
            };
            sessionStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
        } catch {
            // ignore quota errors
        }
    }, [imgPromptState]);



    // If there's truly nothing to show (first visit, no cache), bounce back
    useEffect(() => {
        if (!allStates) {
            navigate("/", { replace: true });
        }
    }, []);


    // ----------------------------
    // RESUME AN IN-FLIGHT JOB AFTER A REFRESH
    // ----------------------------
    useEffect(() => {
        let cached: any = null;
        try {
            const raw = sessionStorage.getItem(JOB_STORAGE_KEY);
            cached = raw ? JSON.parse(raw) : null;
        } catch {
            cached = null;
        }

        if (!cached?.jobId) return;

        const { jobId: savedJobId, type, index } = cached;

        setJobId(savedJobId);
        setGenerateLoading(true);
        activeGenerationRef.current = true;
        jobMetaRef.current = { type, index };

        if (type === "regenerate") {
            setGenerateScenes("Regenerating prompt...");
        } else {
            setGenerateScenes("Generating Video Prompt...");
            setTimer(0);
            timerRef.current = setInterval(() => {
                setTimer((prev: number) => prev + 1);
            }, 1000);
        }

        pollOllamaJob(savedJobId, (progressData) => {
            setProgress(progressData.progress ?? 0);
            if (type === "videoPrompt") {
                setRemaining(progressData.remaining);
                setElapsed(progressData.elapsed);
                setCharacters(progressData.characters);
                setGeneratedScenes(progressData.scenes);
            }
        })
            .then(async (result) => {
                if (type === "regenerate" && typeof index === "number") {
                    setImgPromptState((prev: any[]) => {
                        const updated = [...prev];
                        updated[index] = {
                            ...updated[index],
                            prompt: result.prompt
                        };
                        return updated;
                    });
                } else if (type === "videoPrompt") {
                    setVideoPrompt(result);
                    const uploaded = await uploadComfy(imagegenerate);
                    navigate("/videos", {
                        state: {
                            details: imgPromptState,
                            videoPrompt: result,
                            image: imagegenerate,
                            comfyImage: uploaded
                        }
                    });
                }
            })
            .catch((err) => {
                console.log("Resumed job failed:", err);
                toast.error("Previous generation could not be resumed");
            })
            .finally(() => {
                if (timerRef.current) clearInterval(timerRef.current);
                activeGenerationRef.current = false;
                jobMetaRef.current = null;
                setGenerateLoading(false);
                setJobId(null);
            });

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Persist / clear the active job descriptor whenever jobId changes
    useEffect(() => {
        if (jobId && jobMetaRef.current) {
            sessionStorage.setItem(
                JOB_STORAGE_KEY,
                JSON.stringify({ jobId, ...jobMetaRef.current })
            );
        } else {
            sessionStorage.removeItem(JOB_STORAGE_KEY);
        }
    }, [jobId]);


    // ----------------------------
    // NAVIGATION GUARDS
    // ----------------------------
    useEffect(() => {
        if (!activeGenerationRef.current) return;

        const cancelJob = () => {
            if (!jobId) return;
            console.log("Cancelling job:", jobId);
            navigator.sendBeacon(
                `${backendUrl}/api/cancelGeneration`,
                JSON.stringify({
                    jobId: jobId
                })
            );
            sessionStorage.removeItem(JOB_STORAGE_KEY);
        };


        // Browser back button — only place we can actually ask & branch on the answer
        const handlePopState = () => {
            if (!generateLoading && !jobId) return;

            const confirmLeave = window.confirm(
                "Generation is still running. Do you want to leave and cancel it?"
            );

            if (confirmLeave) {
                cancelJob();
                window.history.back();
            } else {
                window.history.pushState(null, "", window.location.href);
            }
        };


        // Refresh / close tab — browsers only show their own generic prompt here,
        // there's no way to run custom confirm logic or know which the user chose
        // ahead of time. We warn, but we do NOT cancel the job on unload anymore —
        // the job keeps running on the backend and gets resumed on next mount
        // (see the "RESUME AN IN-FLIGHT JOB" effect above).
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (!generateLoading && !jobId) return;

            e.preventDefault();
            e.returnValue = "";
        };


        // create history lock
        window.history.pushState(null, "", window.location.href);
        window.addEventListener("popstate", handlePopState);

        window.addEventListener(
            "beforeunload",
            handleBeforeUnload
        );

        console.log("runing")
        return () => {
            window.removeEventListener(
                "popstate",
                handlePopState
            );

            window.removeEventListener(
                "beforeunload",
                handleBeforeUnload
            );
        };



    }, [generateLoading, jobId]);


    /// final code
    const sleep = (ms: number) =>
        new Promise((resolve) => setTimeout(resolve, ms));

    const prompts = imgPromptState;

    // ----------------------------
    // GENERATE IMAGE on Comfy UI
    // ----------------------------

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
                    const res = await axios.post(`${backendUrl}/api/uploadImage/db`, { imageUrl, sceneNumber: p.scene_number, topicName: allStates.requirements, companyName: allStates?.details?.title });
                    if (!res.data.success) {
                        throw new Error(res.data.message);
                    }

                    console.log(res.data);
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
    const pollOllamaJob = (
        jobId: string,
        onProgress: (data: any) => void
    ): Promise<any> => {
        return new Promise((resolve, reject) => {
            const interval = setInterval(async () => {
                try {
                    const progressResponse = await axios.get(
                        `${backendUrl}/api/ollamaProgress/${jobId}`
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

                    if (progressData.status === "cancelled") {
                        clearInterval(interval);
                        reject(new Error("Generation cancelled"));
                    }
                } catch (error) {
                    clearInterval(interval);
                    reject(error);
                }
            }, 1000);
        });
    };


    ///Generate the Image to Video Prompt
    const generateVideoPrompt = async (data: any) => {
        activeGenerationRef.current = true;
        setGenerateLoading(true);
        setTimer(0);
        timerRef.current = setInterval(() => {
            setTimer((prev: number) => prev + 1);
        }, 1000);

        // Reset progress UI for this stage
        setProgress(0);
        setElapsed(0);
        setCharacters(0);
        setGeneratedScenes(0);
        setTotalScenes(data.length);

        try {
            const res = await axios.post(`${backendUrl}/api/ollamaVideoPrompt`, {
                images: data,
                requirements,
                companyDetails,
                webContent,
                scenes,
                sceneDetails: allStates?.scenes?.screenplay,
                imagePrompts: state,
            });

            if (!res.data.success) {
                throw new Error(res.data.message);
            }

            const newJobId = res.data.jobId;
            jobMetaRef.current = { type: "videoPrompt" };
            setJobId(newJobId);

            const videoPromptResult = await pollOllamaJob(newJobId, (progressData) => {
                setProgress(progressData.progress);
                setRemaining(progressData.remaining);
                setElapsed(progressData.elapsed);
                setCharacters(progressData.characters);
                setGeneratedScenes(progressData.scenes);
            });

            if (!videoPromptResult) {
                throw new Error("Video prompt generation failed");
            }

            console.log(videoPromptResult);
            setVideoPrompt(videoPromptResult);

            const uploaded = await uploadComfy(data);
            navigate("/videos", { state: {scenes: scenes, imagePrompts: imgPromptState, videoPrompt: videoPromptResult, image: data, comfyImage: uploaded } });
        } catch (error) {
            console.log(error);
        } finally {
            // Stop timer
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
            activeGenerationRef.current = false;
            jobMetaRef.current = null;
            setGenerateLoading(false);
            setJobId(null);
        }
    };



    ///Upload the image to the cloudinary
    const uploadImage = async () => {
        setUploading(true);

        const payLoad = prompts.map((p: any, index: number) => ({
            sceneNumber: p.scene_number,
            image: imagegenerate[index]
        }));

        try {
            const res = await axios.post(
                `${backendUrl}/api/uploadimage`,
                {
                    images: payLoad
                }
            );

            console.log(res.data);

            if (res.data.success) {

                const uploadedImages = res.data.urls;
                console.log(uploadedImages);


                // keep only urls for image processing
                setImagegenerate(
                    uploadedImages.map((item: any) => item.secure_url)
                );
                generateVideoPrompt(
                    uploadedImages.map((item: any) => item.secure_url)
                );
                for (const item of uploadedImages) {

                    await axios.post(
                        `${backendUrl}/api/uploadImage/db`,
                        {
                            imageUrl: item.secure_url,
                            sceneNumber: item.sceneNumber,
                            topicName: allStates.requirements,
                            companyName: allStates?.scenes?.screenplay?.company_name,
                            brandName: allStates?.scenes?.screenplay?.brand_name
                        }
                    );

                }
            }

        } catch (error) {
            console.log(error);

        } finally {
            setUploading(false);
        }
    };

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


    //Regenerate the prompt
    const handlePromptChange = async (index: number) => {

        const change = promptChange;
        const imagePrompt = imgPromptState[index];

        try {

            activeGenerationRef.current = true;

            setGenerateScenes("Ollama is thinking...");
            setProgress(0);
            setGenerateLoading(true);


            const res = await axios.post(
                `${backendUrl}/api/reGenerateOllamaPrompt`,
                {
                    prompt: imagePrompt.prompt,
                    changes: change
                }
            );


            if (!res.data.success || !res.data.jobId) {
                throw new Error(
                    res.data.message || "Failed to start prompt regeneration"
                );
            }


            setGenerateScenes("Regenerating prompt...");

            const newJobId = res.data.jobId;
            jobMetaRef.current = { type: "regenerate", index };
            setJobId(newJobId);


            const updatedPrompt = await pollOllamaJob(
                newJobId,
                (progressData) => {
                    setProgress(progressData.progress ?? 0);
                }
            );


            setImgPromptState((prev: any[]) => {
                const updated = [...prev];

                updated[index] = {
                    ...updated[index],
                    prompt: updatedPrompt.prompt
                };

                return updated;
            });


        } catch (error) {

            console.log(
                "Regenerate prompt error:",
                error
            );

        } finally {

            activeGenerationRef.current = false;
            jobMetaRef.current = null;
            setGenerateLoading(false);
            setJobId(null);

        }
    };


    return (
        <div className="min-h-screen text-white p-6">

            {/* Header */}
            <div className={`flex items-center justify-between ${loading ? "mb-2" : "mb-10"}`}>
                <div>
                    <button onClick={() => navigate(allStates?.from || "/", { replace: true })} className="cursor-pointer px-6 py-2 bg-gray-800 rounded-full hover:bg-gray-700 transition-all duration-200 ease-in-out">Back</button>
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
                    {!reGenerate &&
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
                                className={`${editIndex === index ? "pb-16" : ""} relative flex gap-4 bg-[#111827] border border-gray-700 rounded-2xl p-4 transition-all`}
                            >
                                {/* Index */}
                                <div className="p-2 px-4 h-fit flex items-center justify-center rounded-xl bg-green-500 text-black font-bold">
                                    {index + 1}
                                </div>

                                {/* Text */}
                                <p className="text-gray-300 text-sm leading-relaxed mt-2 pr-2">
                                    {item?.combined_prompt}
                                </p>

                                {/* Edit Button */}
                                <button
                                    className={`absolute top-2 right-2 flex items-center justify-center text-gray-400 hover:text-white border border-gray-800 hover:border-[var(--primary)] hover:scale-110 transition-all duration-200 px-2 py-1.5 rounded-full cursor-pointer ${editIndex === index
                                        ? "bg-[var(--primary)] text-white" : "bg-gray-800"}`}
                                    onClick={() => setEditIndex(index)} title="Edit"
                                >
                                    <span className="material-symbols-outlined text-[20px]">
                                        edit
                                    </span>
                                </button>

                                {/* Edit Input */}
                                {editIndex === index && (
                                    <div className="absolute bottom-3 left-4 right-4 flex gap-2">
                                        <input
                                            type="text"
                                            value={promptChange}
                                            onChange={(e) => setPromptChange(e.target.value)}
                                            placeholder="Enter the changes..."
                                            className="flex-1 bg-gray-900 border border-gray-600 rounded-lg px-4 py-2 text-white text-sm outline-none hover:border-green-500 focus:border-green-500 focus:ring-2 focus:ring-green-500/30 transition-all"
                                        />

                                        <button
                                            className="bg-green-500 hover:bg-green-600 text-black px-3 rounded-lg flex items-center justify-center cursor-pointer" title="Send Changes"
                                            onClick={() => handlePromptChange(index)}
                                        >
                                            <span className="material-symbols-outlined">
                                                send
                                            </span>
                                        </button>
                                    </div>
                                )}
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

            {/* resopnse Loading */}
            {
                generateLoading && (
                    <div className="fixed z-50 inset-0 bg-black/30 backdrop-blur-sm">

                        <div className="flex flex-col items-center justify-center w-full h-full gap-6">


                            <OllamaProgress
                                loading={generateLoading}
                                progress={progress}
                                remaining={remaining}
                                elapsed={elapsed}
                                scenes={generatedScenes}
                                totalScenes={imgPromptState?.length}
                                characters={characters}
                                text={generateScenes}
                            />


                        </div>

                    </div>
                )
            }

        </div>
    )
}

export default Images