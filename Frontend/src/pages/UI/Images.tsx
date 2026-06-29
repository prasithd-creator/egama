import { useLocation, useNavigate } from "react-router"
import { useState, useContext, useEffect } from "react";
import workflow from "../../Comfy_Api/ImageAPI";
import { AppContext } from "../../Context/createContent";
import axios from "axios";
import { toast } from "react-toastify";

function Images() {
    const location = useLocation();
    const navigate = useNavigate();
    const context = useContext(AppContext);
    const state = location.state as any;
    const responseData = state;
    const [loading, setLoading] = useState<boolean>(false);
    const [imagegenerate, setImagegenerate] = useState<any>(null);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const backendUrl = context?.BackendUrl as string;
    const [videoPrompt, setVideoPrompt] = useState<any>(null);
    const [reGenerate, setRegenerate] = useState<boolean>(false);
    const [uploading, setUploading] = useState<boolean>(false);
    const [comfyImage, setComfyImage] = useState<any>(null);
    const [generateLoading, setGenerateLoading] = useState<boolean>(false);


    /// final code
    const sleep = (ms: number) =>
        new Promise((resolve) => setTimeout(resolve, ms));

    const prompts = responseData;

    // ----------------------------
    // GENERATE IMAGE
    // ----------------------------
    const generateImage = async () => {
        try {
            setLoading(true);
            const results: string[] = [];

            // LOOP PROMPTS ONE BY ONE
            for (const p of prompts) {
                const wf = structuredClone(workflow);

                wf["58"].inputs.value = p;
                wf["57:3"].inputs.seed = Math.floor(Math.random() * 999999999);

                console.log("Sending:", p);

                // 1. SEND REQUEST
                const res = await fetch("/api/prompt", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ prompt: wf }),
                });

                const data = await res.json();
                const promptId = data.prompt_id;

                if (!promptId) continue;

                // 2. WAIT FOR IMAGE
                let imageUrl = null;

                for (let i = 0; i < 20; i++) {
                    await sleep(3000);

                    const historyRes = await fetch(`/api/history/${promptId}`);
                    const history = await historyRes.json();

                    const image =
                        history?.[promptId]?.outputs?.["9"]?.images?.[0];

                    if (image) {
                        imageUrl = `http://192.168.0.161:5454/api/view?filename=${image.filename}`;
                        break;
                    }
                }

                if (imageUrl) {
                    results.push(imageUrl);
                    setRegenerate(true);
                    setImagegenerate([...results]); // update UI live
                }
            }

        } catch (err) {
            console.error(err);
            toast.error("Failed to generate images");
        } finally {
            setLoading(false);
        }
    };


    ///Generate the Image to Video Prompt
    const generateVideoPrompt = async (data: any) => {
        setGenerateLoading(true);
        try {
            const res = await axios.post(`${backendUrl}/api/imageToVideoPrompt`, { images: data });
            if (res.data.success) {
                console.log(res.data.data);
                setVideoPrompt(res.data.data);
                const uploaded = await uploadComfy(data);
                navigate("/videos", { state: { imagePrompt: responseData, videoPrompt: res.data.data, image: data, comfyImage: uploaded } });
            }
        } catch (error) {
            console.log(error);
        } finally {
            setGenerateLoading(false);
        }
    }

    console.log(imagegenerate);

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
    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-10">
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
                        className="bg-green-500 hover:bg-green-600 cursor-pointer disabled:opacity-50 text-white px-6 py-3 rounded-2xl font-semibold shadow-lg transition-all"
                    >
                        {loading ? "Generating..." : reGenerate ? "Regenerate" : "Generate Images"}
                    </button>
                    {reGenerate &&
                        <button
                            onClick={uploadImage}
                            disabled={loading}
                            className="bg-blue-500 hover:bg-blue-600 cursor-pointer disabled:opacity-50 text-white px-6 py-3 rounded-2xl font-semibold shadow-lg transition-all"
                        >
                            {uploading ? "uploading..." : generateLoading ? "Generating Prompt..." : "Upload"}
                        </button>
                    }
                </div>
            </div>

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

                    <div className="space-y-4 max-h-[600px] overflow-auto pr-2">
                        {(!state || state.length === 0) && (
                            <p className="text-gray-500 text-sm absolute top-1/2 left-1/2 transform translate-x-[-50%] translate-y-[-50%] w-fit">
                                No prompts available
                            </p>
                        )}

                        {state?.map((item: any, index: number) => (
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
                                    {item}
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

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[600px] overflow-auto pr-2">
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
                                onClick={() => setSelectedImage(item)}
                                className="group cursor-pointer rounded-2xl overflow-hidden border border-gray-700 hover:border-green-500 transition-all shadow-lg"
                            >
                                <img
                                    src={item}
                                    alt={`Generated ${index}`}
                                    className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                            </div>
                        ))}

                    </div>
                </div>
                {selectedImage && (
                    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">

                        {/* Close button */}
                        <button
                            onClick={() => setSelectedImage(null)}
                            className="absolute top-6 right-6 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-full font-semibold cursor-pointer"
                        >
                            ✕ Close
                        </button>

                        {/* Image */}
                        <img
                            src={selectedImage}
                            alt="Preview"
                            className="max-w-[90%] max-h-[90%] rounded-2xl shadow-2xl border border-gray-700"
                        />
                    </div>
                )}

            </div>
        </div>
    )
}

export default Images