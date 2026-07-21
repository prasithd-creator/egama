import { Folder, FileText, FolderOpen, ChevronRight, ChevronDown, Image as ImageIcon, Play } from "lucide-react";
import { useState, useEffect, useContext } from "react";
import axios from "axios";
import { AppContext } from "../../Context/createContent";





function PreviousFlow() {
    const [data, setData] = useState<any[]>([]);
    const [selected, setSelected] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const context = useContext(AppContext);
    const BackendUrl = context?.BackendUrl as string;
    const [openFolders, setOpenFolders] = useState<number[]>([]);


    const toggleFolder = (id: number) => {
        setOpenFolders((prev) =>
            prev.includes(id)
                ? prev.filter((folderId) => folderId !== id)
                : [...prev, id]
        );
    };


    useEffect(() => {

        const fetchProjects = async () => {

            try {

                const response = await axios.get(`${BackendUrl}/api/getMongoData`);
                console.log(response.data);

                const projects = response.data.data.map((project: any, index: number) => ({

                    id: index + 1,

                    name: project.category,

                    items: project.topics.map((topic: any, topicIndex: number) => ({

                        id: project._id,

                        name: topic.name,

                        images: topic.image_prompts
                            .filter((img: any) => img.image_url)
                            .map((img: any) => img.image_url),

                        imagePrompt: topic.image_prompts.map((img: any) => img.prompt),
                        videos: topic.video_prompts || []

                    }))

                }));


                setData(projects);
                console.log(projects);

                if (projects.length) {
                    setSelected(projects[0].items[0]);
                }

            } catch (error) {

                console.log(error);

            }

        };


        fetchProjects();

    }, []);

    return (
        <div className="h-screen bg-[#111827] text-white flex">

            {/* Sidebar */}

            <div className="w-72 border-r border-gray-800 p-5 overflow-y-auto scrollbar-thumb-gray-600">
                <div className="flex items-center gap-3 mb-5">
                    <button
                        onClick={() => window.history.back()}
                        className="w-9 h-9 flex items-center justify-center rounded-full text-gray-400 hover:text-white hover:bg-gray-800 transition-all duration-200 cursor-pointer"
                    >
                        <span
                            className="material-symbols-outlined"
                            style={{ fontSize: "20px" }}
                        >
                            arrow_back_ios_new
                        </span>
                    </button>

                    <h2 className="text-xl font-semibold text-white leading-none">
                        Previous Projects
                    </h2>
                </div>

                {loading ? (

                    <div className="text-gray-400">
                        Loading projects...
                    </div>

                ) : data.length === 0 ? (

                    <div className="text-gray-500">
                        No projects found.
                    </div>

                ) : (


                    data.map((folder) => (
                        <div key={folder.id} className="mb-5">
                            {/* Folder Header */}
                            <button
                                onClick={() => toggleFolder(folder.id)}
                                className="flex items-center gap-2 text-yellow-400 font-semibold mb-2 w-full cursor-pointer hover:bg-gray-800 px-3 py-2 rounded-lg"
                            >
                                {openFolders.includes(folder.id) ? (
                                    <ChevronDown size={18} />
                                ) : (
                                    <ChevronRight size={18} />
                                )}

                                {openFolders.includes(folder.id) ? (
                                    <FolderOpen size={24} />
                                ) : (
                                    <Folder size={24} />
                                )}
                                <span className="truncate">
                                    {folder.name.length > 20
                                        ? `${folder.name.slice(0, 26)}...`
                                        : folder.name}
                                </span>
                            </button>

                            {/* Folder Items */}
                            {openFolders.includes(folder.id) && (
                                <div className="ml-7 space-y-2">
                                    {folder.items.map((item: any) => (
                                        <button
                                            key={item.id}
                                            onClick={() => setSelected(item)}
                                            className={`w-full text-left px-3 py-2 rounded-lg transition cursor-pointer ${selected?.id === item.id && selected?.name === item.name
                                                ? "bg-green-600"
                                                : "hover:bg-gray-800"
                                                }`}
                                        >
                                            <div className="flex items-center gap-2">
                                                <FileText size={16} />
                                                {item.name.charAt(0).toUpperCase() + item.name.slice(1)}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))


                )}

            </div>


            {/* Content */}

            <div className="flex-1 p-6 overflow-y-auto scrollbar-thumb-gray-600 scrollbar-track-gray-800">


                {!selected ? (

                    <div className="text-gray-500">
                        Select a project
                    </div>

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

                        <div className="mb-10 grid grid-cols-2 gap-5">

                            {
                                selected.imagePrompt.map((prompt: string, index: number) => (

                                    <div key={index} className="text-gray-500">
                                        {prompt}
                                    </div>
                                ))
                            }
                        </div>




                        <div className="grid grid-cols-3 gap-5 mb-10">


                            {selected.images.length ? (

                                selected.images.map(
                                    (img: string, index: number) => (

                                        <img
                                            key={index}
                                            src={img}
                                            alt=""
                                            className="rounded-xl border border-gray-700 object-cover w-full h-52"
                                        />
                                    )

                                )

                            ) : (

                                <div className="text-gray-500">
                                    No images generated.
                                </div>

                            )}

                        </div>



                        {/* Videos */}

                        <h3 className="flex items-center gap-2 text-lg mb-4">
                            <Play size={20} />
                            Videos
                        </h3>


                        <div className="grid grid-cols-2 gap-5">


                            {selected.videos.length ? (

                                selected.videos.map(
                                    (video: string, index: number) => (

                                        <video
                                            key={index}
                                            controls
                                            src={video}
                                            className="rounded-xl border border-gray-700"
                                        />

                                    )
                                )

                            ) : (

                                <div className="text-gray-500">
                                    No videos generated.
                                </div>

                            )}

                        </div>


                    </>

                )}

            </div>

        </div>
    );
}

export default PreviousFlow;