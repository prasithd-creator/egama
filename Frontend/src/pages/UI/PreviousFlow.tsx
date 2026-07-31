import { Folder, FileText, FolderOpen, ChevronRight, ChevronDown, Image as ImageIcon, Play, Tag } from "lucide-react";
import { useState, useEffect, useContext } from "react";
import axios from "axios";
import { AppContext } from "../../Context/createContent";
import { useNavigate } from "react-router-dom";

function PreviousFlow() {
    const navigate = useNavigate();
    const [data, setData] = useState<any[]>([]);
    const [selected, setSelected] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const context = useContext(AppContext);
    const BackendUrl = context?.BackendUrl as string;
    const [responseData, setResponseData] = useState<any>(null);

    useEffect(() => {
        const webContent = localStorage.getItem("responseData");

        if (webContent) {
            const data = JSON.parse(webContent);
            setResponseData(data);
        }
    }, []);

    // Accordion behavior: only a single folder id and a single brand key can be open at once.
    const [openFolder, setOpenFolder] = useState<number | null>(() => {
        const saved = localStorage.getItem("openFolder");
        return saved ? JSON.parse(saved) : null;
    });
    const [openBrand, setOpenBrand] = useState<string | null>(() => {
        const saved = localStorage.getItem("openBrand");
        return saved ? JSON.parse(saved) : null;
    });
    // Remember which topic was selected so a refresh can land back on it.
    const [selectedId, setSelectedId] = useState<string | null>(() => {
        return localStorage.getItem("selectedTopicId");
    });

    useEffect(() => {
        localStorage.setItem("openFolder", JSON.stringify(openFolder));
    }, [openFolder]);

    useEffect(() => {
        localStorage.setItem("openBrand", JSON.stringify(openBrand));
    }, [openBrand]);

    useEffect(() => {
        if (selectedId) {
            localStorage.setItem("selectedTopicId", selectedId);
        }
    }, [selectedId]);

    const toggleFolder = (id: number) => {
        setOpenFolder((prev) => {
            const next = prev === id ? null : id;
            // Closing/changing a folder should also close whatever brand was open,
            // since brands belong to a single folder.
            if (next !== prev) {
                setOpenBrand(null);
            }
            return next;
        });
    };

    const toggleBrand = (key: string) => {
        setOpenBrand((prev) => (prev === key ? null : key));
    };

    useEffect(() => {
        const fetchProjects = async () => {
            setLoading(true);
            try {
                const response = await axios.get(`${BackendUrl}/api/getMongoData`);
                console.log(response.data);

                const projects = response.data.data.map((project: any, index: number) => ({
                    id: index + 1,
                    name: project.category,

                    brands: (project.brands || []).map((brand: any, brandIndex: number) => ({
                        id: brandIndex,
                        name: brand.name,

                        topics: (brand.topics || []).map((topic: any, topicIndex: number) => ({
                            id: `${index}-${brandIndex}-${topicIndex}`,
                            name: topic.name,
                            folderName: project.category,
                            brandName: brand.name,

                            images: (topic.image_prompts || [])
                                .filter((img: any) => img.image_url)
                                .map((img: any) => img.image_url),
                            scenes: (topic.scene_prompts[topicIndex] || []),
                            imagePrompt: (topic.image_prompts || []),
                            videosPrompt: (topic.video_prompts || []),
                            videos: (topic.video_prompts || []).filter((video: any) => video.video_url).map((video: any) => video.video_url),
                        }))
                    }))
                }));

                setData(projects);
                console.log(projects);

                if (projects.length && projects[0].brands.length && projects[0].brands[0].topics.length) {
                    // Try to restore the exact previously-selected topic (and its folder/brand)
                    // from localStorage; fall back to the first topic if nothing matches.
                    let restoredTopic: any = null;
                    let restoredFolderId: number | null = null;
                    let restoredBrandKey: string | null = null;

                    if (selectedId) {
                        outer:
                        for (const folder of projects) {
                            for (const brand of folder.brands) {
                                const match = brand.topics.find((t: any) => t.id === selectedId);
                                if (match) {
                                    restoredTopic = match;
                                    restoredFolderId = folder.id;
                                    restoredBrandKey = `${folder.id}-${brand.id}`;
                                    break outer;
                                }
                            }
                        }
                    }

                    if (restoredTopic) {
                        setSelected(restoredTopic);
                        setOpenFolder(restoredFolderId);
                        setOpenBrand(restoredBrandKey);
                    } else {
                        const firstTopic = projects[0].brands[0].topics[0];
                        setSelected(firstTopic);
                        setSelectedId(firstTopic.id);
                        setOpenFolder(projects[0].id);
                        setOpenBrand(`${projects[0].id}-0`);
                    }
                }
            } catch (error) {
                console.log(error);
            } finally {
                setLoading(false);
            }
        };

        fetchProjects();
    }, []);

    const selectTopic = (topic: any) => {
        setSelected(topic);
        setSelectedId(topic.id);
    };

    const clickEvent = (img: string, index: number) => {

        navigate("/images", {
            state: {
                data: {
                    image_prompts: [selected.imagePrompt[index]], // only the clicked image prompt
                },
                requirements: responseData?.metadata?.requirements,
                webContent: responseData?.markdown,
                from: location.pathname,
                scenes: selected.scenes, // optional: matching scene
                uploaded: [img],                  // only the clicked image
            },
        });

        console.log(selected.scenes);
    }

    return (
        <div className="h-screen bg-[#111827] text-white flex w-full">

            {/* Sidebar */}
            <div className="w-72 border-r border-gray-800 overflow-y-auto scrollbar-thumb-gray-600">
                <div className="flex items-center gap-3 px-6 py-5 border-b border-white/10 mb-4">
                    <button
                        onClick={() => window.history.back()}
                        className="h-10 w-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all cursor-pointer"
                    >
                        <span className="material-symbols-outlined text-gray-300">
                            arrow_back_ios_new
                        </span>
                    </button>

                    <div>
                        <h2 className="text-lg font-semibold">Previous Projects</h2>
                        <p className="text-xs text-gray-400">Browse generated projects</p>
                    </div>
                </div>

                {loading ? (
                    <div className="text-gray-400 px-4">Loading projects...</div>
                ) : data.length === 0 ? (
                    <div className="text-gray-500 px-4">No projects found.</div>
                ) : (
                    <div className="px-2">
                        {data.map((folder) => (
                            <div key={folder.id} className="mb-3 bg-gray-800 rounded-lg">
                                {/* Category Header */}
                                <button
                                    onClick={() => toggleFolder(folder.id)}
                                    className="flex items-center gap-2 text-yellow-500 font-semibold w-full cursor-pointer hover:bg-gray-700/40 px-3 py-2 rounded-lg"
                                >
                                    {openFolder === folder.id ? (
                                        <ChevronDown size={18} className="text-yellow-500" />
                                    ) : (
                                        <ChevronRight size={18} className="text-yellow-500" />
                                    )}

                                    {openFolder === folder.id ? (
                                        <FolderOpen size={24} className="text-yellow-500" />
                                    ) : (
                                        <Folder size={24} />
                                    )}
                                    <span className="truncate">
                                        {folder.name.length > 20
                                            ? `${folder.name.slice(0, 26)}...`
                                            : folder.name}
                                    </span>
                                </button>

                                {/* Brands */}
                                {openFolder === folder.id && (
                                    <div className="ml-4 space-y-2 pr-2 pb-2">
                                        {folder.brands.map((brand: any) => {
                                            const brandKey = `${folder.id}-${brand.id}`;
                                            const brandOpen = openBrand === brandKey;

                                            return (
                                                <div key={brandKey}>
                                                    <button
                                                        onClick={() => toggleBrand(brandKey)}
                                                        className="flex items-center gap-2 text-sm text-blue-400 font-medium w-full cursor-pointer hover:bg-gray-700/40 px-3 py-1.5 rounded-lg"
                                                    >
                                                        {brandOpen ? (
                                                            <ChevronDown size={14} className="text-blue-400" />
                                                        ) : (
                                                            <ChevronRight size={14} className="text-blue-400" />
                                                        )}
                                                        <Tag size={16} />
                                                        <span className="truncate">{brand.name}</span>
                                                    </button>

                                                    {/* Topics */}
                                                    {brandOpen && (
                                                        <div className="ml-6 space-y-1 pr-2 pb-1">
                                                            {brand.topics.map((topic: any) => (
                                                                <button
                                                                    key={topic.id}
                                                                    onClick={() => selectTopic(topic)}
                                                                    className={`w-full text-left px-3 py-2 rounded-lg transition cursor-pointer ${selected?.id === topic.id
                                                                        ? "bg-gradient-to-r from-green-500 to-emerald-600"
                                                                        : "hover:bg-gray-700"
                                                                        }`}
                                                                >
                                                                    <div className="flex items-center gap-2">
                                                                        <FileText size={16} />
                                                                        {topic.name.charAt(0).toUpperCase() + topic.name.slice(1)}
                                                                    </div>
                                                                </button>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="flex-1 p-6 overflow-y-auto scrollbar-thumb-gray-600 scrollbar-track-gray-800">
                {!selected ? (
                    <div className="text-gray-500">Select a project</div>
                ) : (
                    <>
                        <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2 flex-wrap">
                            <span className="text-yellow-500 text-xl">
                                {selected.folderName?.charAt(0).toUpperCase() + selected.folderName?.slice(1)}
                            </span>
                            <span className="material-symbols-outlined" style={{ fontSize: "16px", color: "gray" }}>
                                arrow_forward_ios
                            </span>
                            <span className="text-blue-400 text-xl">
                                {selected.brandName?.charAt(0).toUpperCase() + selected.brandName?.slice(1)}
                            </span>
                            <span className="material-symbols-outlined" style={{ fontSize: "16px", color: "gray" }}>
                                arrow_forward_ios
                            </span>
                            <span>
                                {selected.name.charAt(0).toUpperCase() + selected.name.slice(1)}
                            </span>
                        </h2>

                        {/* Images */}
                        <div className="flex justify-between">
                            <h3 className="flex items-center gap-2 text-lg mb-4">
                                <ImageIcon size={20} />
                                Images
                            </h3>
                            {selected.imagePrompt.length > 0 && <button className="px-2 bg-[image:var(--gradient-primary)] py-2 rounded-lg mb-5 hover:bg-[image:var(--gradient-glow)] cursor-pointer" onClick={() =>
                                navigate(`/images`,
                                    {
                                        state: {
                                            data: { image_prompts: selected.imagePrompt },
                                            requirements: responseData?.metadata?.requirements,
                                            webContent: responseData?.markdown,
                                            from: location.pathname,
                                            scenes: selected.scenes,
                                            uploaded: selected.images
                                        },
                                        replace: true
                                    })}
                            >Images Flow</button>}
                        </div>


                        <div className="grid grid-cols-3 gap-5 mb-10" >
                            {selected.images.length ? (
                                selected.images.map((img: string, index: number) => (
                                    <div
                                        key={index}
                                        className="rounded-xl overflow-hidden border border-gray-700 relative group"
                                    >
                                        <img
                                            src={img}
                                            alt=""
                                            className="w-full h-52 object-cover cursor-pointer transition-transform duration-300 group-hover:scale-105"

                                        />

                                        <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                            <button
                                                className="px-5 py-2 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-full shadow-lg transition cursor-pointer"
                                                onClick={() => clickEvent(img, index)}
                                            >
                                                Regenerate
                                            </button>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-gray-500">No images generated.</div>
                            )}
                        </div>

                        {/* Videos */}
                        <div className="flex justify-between">
                            <h3 className="flex items-center gap-2 text-lg mb-4">
                                <Play size={20} />
                                Videos
                            </h3>

                            {selected.videosPrompt.length > 0 && <button className="px-2 bg-[image:var(--gradient-primary)] py-2 rounded-lg mb-5 hover:bg-[image:var(--gradient-glow)] cursor-pointer" onClick={() =>
                                navigate(`/videos`,
                                    {
                                        state: {
                                            imagePrompts: selected.imagePrompt,
                                            requirements: responseData?.metadata?.requirements,
                                            webContent: responseData?.markdown,
                                            from: location.pathname,
                                            scenes: selected.scenes,
                                            image: selected.images,
                                            videoPrompt: { data: selected.videosPrompt }
                                        },
                                    })
                            }
                            >Videos Flow</button>}
                        </div>

                        <div className="grid grid-cols-2 gap-5">
                            {selected.videos.length ? (
                                selected.videos.map((video: string, index: number) => (
                                    <video
                                        key={index}
                                        controls
                                        src={video}
                                        className="rounded-xl border border-gray-700"
                                    />
                                ))
                            ) : (
                                <div className="text-gray-500">No videos generated.</div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

export default PreviousFlow;