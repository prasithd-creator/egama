import React, { useEffect, useState } from 'react'
import { Link, Loader2, X, ArrowRight, ShieldCheck, ArrowUpRight } from "lucide-react";
import TOPIC_SCENE_CONFIG from "../../../assets/TopicScene";

interface ScenesProps {
    images: string[];
    onSelectScenes?: (scenes: string[]) => void;
}


function Scenes({ images, onSelectScenes }: ScenesProps) {

    const [requiredScenes, setRequiredScenes] = useState<any>(null);
    const [selectedImages, setSelectedImages] = useState<string[]>(images || []);

    useEffect(() => {
        setSelectedImages(images);
        console.log(images + "-=====================================================");
    }, [images]);
    useEffect(() => {
        console.log(TOPIC_SCENE_CONFIG);
        console.log(selectedImages);
    }, [])
    return (
        <>
            <section className="w-full max-w-3xl mx-auto">
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5 md:p-6 shadow-[0_8px_30px_rgba(0,0,0,0.25)] backdrop-blur-sm h-full">

                    {/* Header */}
                    <div className="mb-5 sm:mb-6">
                        <div className="flex items-start gap-3">
                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[image:var(--gradient-glow)] text-sm font-bold text-white shadow-lg shadow-green-500/20">
                                03
                            </span>

                            <div className="min-w-0">
                                <h2 className="text-sm font-semibold tracking-tight text-white sm:text-base md:text-lg">
                                    Select the Scenes
                                </h2>

                                <p className="text-xs leading-relaxed text-gray-400 sm:text-sm italic">
                                    Select the scenes you want to generate
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* URL Input + Submit */}
                    <div className="flex w-full flex-col gap-3 sm:gap-4 lg:flex-row">

                        <select
                            value={requiredScenes}
                            onChange={(e) => setRequiredScenes(e.target.value)}
                            className={`flex-1 bg-[#111827] border border-gray-700 rounded-xl px-4 py-3 pr-10 text-sm font-medium outline-none cursor-pointer appearance-none transition-all duration-200 hover:border-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 ${requiredScenes ? "text-white" : "text-gray-500"
                                }`}

                        >
                            <option value="" disabled selected>Select a Scene</option>
                            {
                                Object.entries(TOPIC_SCENE_CONFIG).map(([key, value]) => (
                                    <option key={key} value={key} className='bg-gray-800 text-white'>
                                        {`${key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())} (${value.sceneCount} scenes)`}
                                    </option>
                                ))
                            }
                        </select>

                        <button className={`bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg ${!requiredScenes ? 'opacity-50 cursor-not-allowed' : ''}`}>Select</button>
                    </div>

                    {/* Security Message */}
                    <div className="mt-3 flex items-start gap-2 text-[11px] text-gray-500 sm:items-center sm:text-xs">
                        <ShieldCheck
                            size={14}
                            className="mt-0.5 shrink-0 text-green-500/70 sm:mt-0"
                        />
                        <span>Your URL is processed securely.</span>
                    </div>
                </div>
            </section>
        </>
    )
}

export default Scenes