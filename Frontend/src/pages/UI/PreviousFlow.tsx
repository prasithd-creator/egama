import { Folder, FileText, FolderOpen, ChevronRight, ChevronDown, Image as ImageIcon, Play, Tag } from "lucide-react";
import { useState, useEffect, useContext } from "react";
import axios from "axios";
import { AppContext } from "../../Context/createContent";

function PreviousFlow() {
    const [data, setData] = useState<any[]>([]);
    const [selected, setSelected] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const context = useContext(AppContext);
    const BackendUrl = context?.BackendUrl as string;

    // openFolders now tracks category ids, openBrands tracks composite "categoryId-brandIndex" keys
    const [openFolders, setOpenFolders] = useState<number[]>([]);
    const [openBrands, setOpenBrands] = useState<string[]>([]);

    const toggleFolder = (id: number) => {
        setOpenFolders((prev) =>
            prev.includes(id)
                ? prev.filter((folderId) => folderId !== id)
                : [...prev, id]
        );
    };

    const toggleBrand = (key: string) => {
        setOpenBrands((prev) =>
            prev.includes(key)
                ? prev.filter((k) => k !== key)
                : [...prev, key]
        );
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

                            images: (topic.image_prompts || [])
                                .filter((img: any) => img.image_url)
                                .map((img: any) => img.image_url),

                            imagePrompt: (topic.image_prompts || []).map((img: any) => img.prompt),
                            videos: topic.video_prompts || []
                        }))
                    }))
                }));

                setData(projects);
                console.log(projects);

                if (projects.length && projects[0].brands.length && projects[0].brands[0].topics.length) {
                    setSelected(projects[0].brands[0].topics[0]);
                    setOpenFolders([projects[0].id]);
                    setOpenBrands([`${projects[0].id}-0`]);
                }
            } catch (error) {
                console.log(error);
            } finally {
                setLoading(false);
            }
        };

        fetchProjects();
    }, []);

    return (
        <div className="h-screen bg-[#111827] text-white flex">

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
                                    {openFolders.includes(folder.id) ? (
                                        <ChevronDown size={18} className="text-yellow-500" />
                                    ) : (
                                        <ChevronRight size={18} className="text-yellow-500" />
                                    )}

                                    {openFolders.includes(folder.id) ? (
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
                                {openFolders.includes(folder.id) && (
                                    <div className="ml-4 space-y-2 pr-2 pb-2">
                                        {folder.brands.map((brand: any) => {
                                            const brandKey = `${folder.id}-${brand.id}`;
                                            const brandOpen = openBrands.includes(brandKey);

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
                                                                    onClick={() => setSelected(topic)}
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
                        <h2 className="text-2xl font-semibold mb-6">
                            {selected.name.charAt(0).toUpperCase() + selected.name.slice(1)}
                        </h2>

                        {/* Images */}
                        <h3 className="flex items-center gap-2 text-lg mb-4">
                            <ImageIcon size={20} />
                            Images
                        </h3>

                        <div className="grid grid-cols-3 gap-5 mb-10">
                            {selected.images.length ? (
                                selected.images.map((img: string, index: number) => (
                                    <img
                                        key={index}
                                        src={img}
                                        alt=""
                                        className="rounded-xl border border-gray-700 object-cover w-full h-52"
                                    />
                                ))
                            ) : (
                                <div className="text-gray-500">No images generated.</div>
                            )}
                        </div>

                        {/* Videos */}
                        <h3 className="flex items-center gap-2 text-lg mb-4">
                            <Play size={20} />
                            Videos
                        </h3>

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