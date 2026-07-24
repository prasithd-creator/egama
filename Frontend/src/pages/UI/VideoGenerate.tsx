import { useLocation, useNavigate } from "react-router"
import { useEffect, useState, useRef } from "react";
import workflow from "../../Comfy_Api/videoApi";
import { toast } from "react-toastify";
import axios from "axios";
import { useContext } from "react";
import { AppContext } from "../../Context/createContent";
import useLMNT from "../../API/LMNT";

function VideoGenerate() {
    const location = useLocation();
    const navigate = useNavigate();
    const state = location.state as any;
    const context = useContext(AppContext);
    const backendUrl = context?.BackendUrl as string;
    const [loading, setLoading] = useState<boolean>(false);
    const [reGenerate, setRegenerate] = useState<boolean>(false);
    const [videoPrompt, setVideoPrompt] = useState<any>([
        {
            "scene_number": 1,
            "beat": "after - reveal",
            "prompt": "A sun-drenched coastal highway sets the stage for a dynamic shot of the 2026 Ford Mustang® accelerating through sweeping curves. Cinematic camera movement emphasizes speed, power, and premium craftsmanship.",
            "negative_prompt": "morphing, distortion, warping, flicker, jitter, temporal artifacts, duplicate vehicles, blurry, low quality",

            "voice_profile": {
                "gender": "neutral",
                "tone": "professional",
                "pitch": "moderate",
                "pacing": "slow and deliberate",
                "accent": ""
            },

            "voice_over_segment": "Experience the thrill of driving a 2026 Ford Mustang®. Unleash your inner speedster on this coastal highway.",

            "style": "premium, cinematic, photoreal, documentary-grade, direct response",

            "ltx_settings_recommendation": "steps 36, CFG 3.2, 24fps",

            "creative_rationale": [
                "The scene establishes the confidence and performance of the 2026 Ford Mustang.",
                "The camera movement follows the car's aggressive stance and handling.",
                "The lighting highlights the premium exterior finish."
            ]
        },
        {
            "scene_number": 2,
            "beat": "feature showcase",
            "prompt": "A close-up cinematic sequence transitions from the exterior into the luxurious cockpit. The digital dashboard illuminates while ambient lighting enhances the premium cabin materials.",

            "negative_prompt": "blurry dashboard, distorted interior, flicker, duplicate steering wheel, artifacts, low quality",

            "voice_profile": {
                "gender": "neutral",
                "tone": "professional",
                "pitch": "moderate",
                "pacing": "slow and deliberate",
                "accent": ""
            },

            "voice_over_segment": "Step inside a driver-focused cockpit featuring cutting-edge technology, premium comfort, and intuitive controls designed for every journey.",

            "style": "premium, cinematic, photoreal, documentary-grade, luxury automotive",

            "ltx_settings_recommendation": "steps 36, CFG 3.2, 24fps",

            "creative_rationale": [
                "The interior showcases modern technology and premium materials.",
                "Camera movement guides the viewer naturally through the cabin.",
                "Lighting emphasizes luxury and comfort."
            ]
        }
    ]);
    const [imagePrompt, setImagePrompt] = useState<any>(null);
    const [imagegenerate, setImagegenerate] = useState<any>(null);
    const [videoGenerate, setVideoGenerate] = useState<any>(["https://res.cloudinary.com/dwdllwrim/video/upload/v1784874944/Voice_check_1_lxzb89.mp4", "https://res.cloudinary.com/dwdllwrim/video/upload/v1784874944/Voice_check_2_mfzn0j.mp4"]);
    const [selectedVideo, setSelectedVideo] = useState<string | null>("");
    const [viewMode, setViewMode] = useState<"generated" | "merged">("generated");
    const [mergedVideo, setMergedVideo] = useState<string>("");
    const cancelledRef = useRef(false);
    const [progress, setProgress] = useState(0);
    const { voiceModel } = context as any;
    const [audioList, setAudioList] = useState<any>([]);

    console.log(state);
    console.log(videoPrompt);
    console.log(Array.isArray(videoPrompt));
    console.log(typeof videoPrompt);

    useEffect(() => {
        setVideoPrompt(state?.videoPrompt?.data);
        setImagePrompt(state?.imagePrompt);
        setImagegenerate(state?.comfyImage);

    }, []);

    console.log(videoPrompt);


    /// final code change video generate
    const sleep = (ms: number) =>
        new Promise((resolve) => setTimeout(resolve, ms));

    const prompts = videoPrompt;

    // ----------------------------
    // GENERATE VIDEO
    // ----------------------------
    const generateVideo = async () => {
        try {
            setLoading(true);

            const results: string[] = [];

            for (let i = 0; i < prompts.length; i++) {
                const p = prompts[i];
                const img = imagegenerate?.[i]; // 👈 matching image

                const wf = structuredClone(workflow);

                // -------------------------
                // PROMPT INPUT
                // -------------------------
                wf["320:319"].inputs.value = p;

                // -------------------------
                // IMAGE INPUT
                // -------------------------
                if (img) {
                    wf["269"].inputs.image = img;
                }

                // -------------------------
                // RANDOM SEED
                // -------------------------
                const seed = Math.floor(Math.random() * 999999999);

                // Main noise (video structure)
                wf["320:276"].inputs.noise_seed = seed;

                // Secondary noise (motion / variation)
                wf["320:277"].inputs.noise_seed = seed + 1;
                wf["320:301"].inputs.value = 10;

                console.log("Sending:", { p, img });

                // 1. SEND REQUEST
                const res = await fetch("/api/prompt", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ prompt: wf, image: img }),
                });

                const data = await res.json();
                const promptId = data.prompt_id;

                if (!promptId) continue;

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
                }

                // 2. POLLING
                let videoUrl = null;

                for (let i = 0; i < 40; i++) {
                    await sleep(3000);

                    const historyRes = await fetch(`/api/history/${promptId}`);
                    const history = await historyRes.json();

                    const video =
                        history?.[promptId]?.outputs?.["75"]?.images?.[0];

                    if (video) {
                        console.log(video);
                        videoUrl = `http://192.168.0.161:5454/api/view?filename=${video.filename}&subfolder=${video.subfolder}`;
                        break;
                    }
                }

                if (videoUrl) {
                    results.push(videoUrl);
                    setRegenerate(true);
                    setVideoGenerate([...results]);
                }
            }
        } catch (err) {
            console.error(err);
            toast.error("Failed to generate videos");
        } finally {
            setLoading(false);
        }
    };

    const { getAudio } = useLMNT();

    //video merger
    const blobToBase64 = (blob: Blob): Promise<string> =>
        new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                const result = reader.result as string;
                resolve(result.split(",")[1]); // strip the data: prefix
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });

    const handleAudio = async () => {
        if (!voiceModel) {
            return toast.error("Please select a voice model");
        }

        try {
            const segments = videoPrompt
                ?.map((item: any) => item.voice_over_segment)
                .filter(Boolean);

            const results = [];

            for (const [index, segment] of segments.entries()) {
                const audioBlob = await getAudio(segment, voiceModel);
                const url = URL.createObjectURL(audioBlob); // keep for local preview only
                const base64 = await blobToBase64(audioBlob); // this is what goes to the backend

                results.push({
                    id: index + 1,
                    text: segment,
                    url,       // for playback in the UI
                    base64,    // for sending to mainMerge
                });
            }

            setAudioList(results as any);
            toast.success("All audio files generated successfully!");
        } catch (error) {
            console.error(error);
            toast.error("Audio generation failed");
        }
    };

    const mergeVideos = async () => {
        try {
            const res = await axios.post(`${backendUrl}/api/mainMerge`, {
                video: videoGenerate,
                audio: audioList.map((a: any) => ({ base64: a.base64 })), // send base64, not blob url
            });

            if (res.data.success) {
                setMergedVideo(res.data.output);
                setViewMode("merged");
            }
        } catch (error) {
            console.log(error);
        }
    };



    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white p-6">
            <button onClick={mergeVideos} className="px-6 py-2 bg-gray-800 rounded-full hover:bg-gray-700 transition cursor-pointer">Merge</button>

            <div className="flex items-center justify-between mb-10">
                <button
                    onClick={() => navigate(-1)}
                    className="px-6 py-2 bg-gray-800 rounded-full hover:bg-gray-700 transition cursor-pointer"
                >
                    Back
                </button>

                <div className="text-center">
                    <h1 className="text-3xl font-bold">Video Prompts</h1>
                    <p className="text-gray-400 text-sm">
                        AI-generated video prompts & outputs
                    </p>
                </div>

                <button
                    onClick={generateVideo}
                    disabled={loading}
                    className="bg-green-500 hover:bg-green-600 px-6 py-3 rounded-2xl font-semibold shadow-lg disabled:opacity-50 cursor-pointer flex items-center gap-2"
                >
                    {loading && <div className="w-5 h-5 border-2 border-t-transparent border-green-900 animate-spin rounded-full"></div>}
                    {loading
                        ? "Generating..."
                        : reGenerate
                            ? "Regenerate Video"
                            : "Generate Video"}
                </button>
            </div>

            <button
                onClick={handleAudio}
                className="px-6 py-2 bg-gray-800 rounded-full"
            >
                Audio
            </button>

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

            {/* MAIN GRID */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-[calc(100vh-200px)]">

                {/* PROMPTS SECTION */}
                <div className="bg-[#1f2937] border border-gray-700 rounded-3xl shadow-2xl p-6 relative">
                    <h2 className="text-xl font-semibold">Video Prompts</h2>
                    <p className="text-gray-400 text-sm mb-4">
                        AI-generated video instructions
                    </p>

                    <div className="space-y-4 max-h-[60vh] overflow-auto pr-2 scrollbar-2 scrollbar-track-gray-800 scrollbar-thumb-gray-600 hover:scrollbar-thumb-gray-500">
                        {(!videoPrompt || videoPrompt.length === 0) && (
                            <p className="text-gray-500 text-sm absolute top-1/2 left-1/2 transform translate-x-[-50%] translate-y-[-50%] w-fit">
                                No prompts available
                            </p>
                        )}

                        {videoPrompt?.map((item: any, index: number) => (
                            <div
                                key={index}
                                className="flex gap-4 bg-[#111827] border border-gray-700 rounded-2xl p-4 flex-col"
                            >
                                <div className="px-4 w-fit h-fit py-2 bg-green-500 text-black font-bold rounded-xl">
                                    {index + 1}
                                </div>

                                <p>headline:{item?.headline}</p>
                                <p>{item?.marketing_angle}</p>
                                <p>{item?.style}</p>
                                <p className="text-gray-300 text-sm leading-relaxed">
                                    {`Prompt:${item?.prompt};\n Negative Prompt: ${item?.negative_prompt}`}
                                </p>
                                <p>Voice Over:{item.voice_over_segment}</p>
                                <p>{item.cta}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* VIDEO OUTPUT SECTION */}
                <div className="bg-[#1f2937] border border-gray-700 rounded-3xl shadow-2xl p-6 relative">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h2 className="text-xl font-semibold">Generated Videos</h2>
                            <p className="text-gray-400 text-sm">
                                AI video output results
                            </p>
                        </div>
                        <div className="flex gap-3 mb-6">
                            <button
                                onClick={() => setViewMode("generated")}
                                className={`px-4 py-2 rounded-lg transition ${viewMode === "generated"
                                    ? "bg-green-600 text-white"
                                    : "bg-gray-800 text-gray-300"
                                    }`}
                            >
                                Generated Videos
                            </button>

                            <button
                                onClick={() => setViewMode("merged")}
                                disabled={!mergedVideo}
                                className={`px-4 py-2 rounded-lg transition ${viewMode === "merged"
                                    ? "bg-green-600 text-white"
                                    : "bg-gray-800 text-gray-300"
                                    } ${!mergedVideo ? "opacity-50 cursor-not-allowed" : ""
                                    }`}
                            >
                                Merged Video
                            </button>
                        </div>

                        {videoGenerate?.length > 0 && (
                            <span className="bg-green-500 text-black px-4 py-1 rounded-full text-sm font-semibold">
                                {videoGenerate.length} videos
                            </span>
                        )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[60vh] overflow-auto pr-2 scrollbar-2 scrollbar-track-gray-800 scrollbar-thumb-gray-600">

                        {videoGenerate?.length === 0 && (
                            <p className="text-gray-500 text-sm absolute top-1/2 left-1/2 transform translate-x-[-50%] translate-y-[-50%] w-fit">
                                No videos generated yet
                            </p>
                        )}

                        {viewMode === "generated" && videoGenerate?.map((video: string, index: number) => (
                            <div
                                key={index}
                                onClick={() => setSelectedVideo(video)}
                                className="cursor-pointer rounded-2xl overflow-hidden border border-gray-700 hover:border-green-500 transition"
                            >
                                <video
                                    src={video}
                                    className="w-full h-64 object-cover"
                                />
                            </div>
                        ))}

                        {viewMode === "merged" && (
                            <video src={mergedVideo} controls autoPlay className="w-full h-64 object-cover" />
                        )}

                        <div className="space-y-4">
                            {audioList.map((audio: any) => (
                                <div
                                    key={audio.id}
                                    className="border rounded-lg p-4 bg-gray-100"
                                >
                                    <p className="font-semibold">
                                        Scene {audio.id}
                                    </p>

                                    <p className="text-sm text-gray-600 mb-2">
                                        {audio.text}
                                    </p>

                                    <audio controls src={audio.url} className="w-full" />
                                </div>
                            ))}
                        </div>

                    </div>
                </div>
            </div>

            {/* VIDEO MODAL */}
            {selectedVideo && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">

                    <button
                        onClick={() => setSelectedVideo(null)}
                        className="absolute top-6 right-6 bg-red-500 px-4 py-2 rounded-full font-semibold cursor-pointer"
                    >
                        ✕ Close
                    </button>

                    <video
                        src={selectedVideo}
                        controls
                        autoPlay
                        className="max-w-[90%] max-h-[90%] rounded-2xl shadow-2xl border border-gray-700"
                    />
                </div>
            )}

        </div>
    );
};


export default VideoGenerate;