import { Folder, FileText, Image as ImageIcon, Play } from "lucide-react";
import { useState, useEffect } from "react";
import axios from "axios";





function PreviousFlow() {
    const [data, setData] = useState<any[]>([]);
    const [selected, setSelected] = useState<any>(null);
    const [loading, setLoading] = useState(false);


    useEffect(() => {

        const fetchProjects = async () => {

            try {

                const response = await axios.get(
                    "http://localhost:5000/api/previous-projects"
                );

                const projects = response.data.data.map((project: any, index: number) => ({

                    id: index + 1,

                    name: project.category,

                    items: project.topics.map((topic: any, topicIndex: number) => ({

                        id: topicIndex + 1,

                        name: topic.name,

                        images: topic.image_prompts
                            .filter((img: any) => img.image_url)
                            .map((img: any) => img.image_url),

                        videos: topic.video_prompts || []

                    }))

                }));


                setData(projects);

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

            <div className="w-72 border-r border-gray-800 p-5 overflow-y-auto">

                <h2 className="text-xl font-semibold mb-6">
                    Previous Projects
                </h2>

                {loading ? (

                    <div className="text-gray-400">
                        Loading projects...
                    </div>

                ) : data.length === 0 ? (

                    <div className="text-gray-500">
                        No projects found.
                    </div>

                ) : (

                    data.map(folder => (

                        <div key={folder.id} className="mb-5">

                            <div className="flex items-center gap-2 text-yellow-400 font-semibold mb-2">
                                <Folder size={18} />
                                {folder.name}
                            </div>


                            <div className="ml-7 space-y-2">

                                {folder.items.map((item: any) => (

                                    <button
                                        key={item.id}
                                        onClick={() => setSelected(item)}
                                        className={`w-full text-left px-3 py-2 rounded-lg transition cursor-pointer ${selected?.id === item.id
                                            ? "bg-green-600"
                                            : "hover:bg-gray-800"
                                            }`}
                                    >

                                        <div className="flex items-center gap-2">
                                            <FileText size={16} />
                                            {item.name}
                                        </div>

                                    </button>

                                ))}

                            </div>

                        </div>

                    ))

                )}

            </div>


            {/* Content */}

            <div className="flex-1 p-6 overflow-y-auto">


                {!selected ? (

                    <div className="text-gray-500">
                        Select a project
                    </div>

                ) : (

                    <>

                        <h2 className="text-2xl font-semibold mb-6">
                            {selected.name}
                        </h2>


                        {/* Images */}

                        <h3 className="flex items-center gap-2 text-lg mb-4">
                            <ImageIcon size={20} />
                            Images
                        </h3>


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