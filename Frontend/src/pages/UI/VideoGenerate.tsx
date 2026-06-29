import { useLocation, useNavigate } from "react-router"
import { useEffect, useState } from "react";
import workflow from "../../Comfy_Api/videoApi";
import { toast } from "react-toastify";

function VideoGenerate() {
    const location = useLocation();
    const navigate = useNavigate();
    const state = location.state as any;
    const [loading, setLoading] = useState<boolean>(false);
    const [reGenerate, setRegenerate] = useState<boolean>(false);
    const [videoPrompt, setVideoPrompt] = useState<any>(null);
    const [imagePrompt, setImagePrompt] = useState<any>(null);
    const [imagegenerate, setImagegenerate] = useState<any>(null);
    const [videoGenerate, setVideoGenerate] = useState<any>([]);
    const [selectedVideo, setSelectedVideo] = useState<string | null>(null);

    useEffect(() => {
        setVideoPrompt(state?.videoPrompt);
        setImagePrompt(state?.imagePrompt);
        setImagegenerate(state?.comfyImage);
    }, []);


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

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white p-6">

            {/* HEADER */}
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
                    className="bg-green-500 hover:bg-green-600 px-6 py-3 rounded-2xl font-semibold shadow-lg disabled:opacity-50 cursor-pointer"
                >
                    {loading
                        ? "Generating..."
                        : reGenerate
                            ? "Regenerate Video"
                            : "Generate Video"}
                </button>
            </div>

            {/* MAIN GRID */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-[calc(100vh-200px)]">

                {/* PROMPTS SECTION */}
                <div className="bg-[#1f2937] border border-gray-700 rounded-3xl shadow-2xl p-6">
                    <h2 className="text-xl font-semibold">Video Prompts</h2>
                    <p className="text-gray-400 text-sm mb-4">
                        AI-generated video instructions
                    </p>

                    <div className="space-y-4 max-h-[600px] overflow-auto pr-2">
                        {(!videoPrompt || videoPrompt.length === 0) && (
                            <p className="text-gray-500 text-sm">
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

                                <p>headline:{item.headline}</p>
                                <p>{item.marketing_angle}</p>
                                <p>{item.style}</p>
                                <p className="text-gray-300 text-sm leading-relaxed">
                                    {item.prompt}
                                </p>
                                <p>{item.cta}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* VIDEO OUTPUT SECTION */}
                <div className="bg-[#1f2937] border border-gray-700 rounded-3xl shadow-2xl p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h2 className="text-xl font-semibold">Generated Videos</h2>
                            <p className="text-gray-400 text-sm">
                                AI video output results
                            </p>
                        </div>

                        {videoGenerate?.length > 0 && (
                            <span className="bg-green-500 text-black px-4 py-1 rounded-full text-sm font-semibold">
                                {videoGenerate.length} videos
                            </span>
                        )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[600px] overflow-auto pr-2">

                        {videoGenerate?.length === 0 && (
                            <p className="text-gray-500 text-sm">
                                No videos generated yet
                            </p>
                        )}

                        {videoGenerate?.map((video: string, index: number) => (
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