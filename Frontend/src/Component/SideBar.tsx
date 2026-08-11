import React from 'react'
import { NavLink, useLocation } from "react-router-dom";
import logo from "../../src/assets/egama_logo.png";

function SideBar() {
    const location = useLocation();

    const features = [
        {
            name: "Previous Flow",
            path: "/previousflow",
            icon: "flowchart",
        },
        {
            path: "/images",
            name: "Images",
            icon: "image",
        }
    ]
    return (
        <>
            {/* Logo */}
            <div className="fixed left-0 top-0 h-screen flex flex-col items-stretch gap-3 lg:w-60 w-fit  bg-gray-900/40 border-1 border-gray-800">
                <div className="flex items-center gap-3 py-4 px-2">
                    <img
                        src={logo}
                        alt="Logo"
                        className="w-16 object-contain"
                    />

                    <div className='hidden lg:block'>
                        <h1 className="text-white text-xl font-bold">
                            Egama AI
                        </h1>

                        <p className="text-gray-400 text-sm">
                            Workflow Dashboard
                        </p>
                    </div>
                </div>


                {/* <button onClick={() => navigate("/previousflow")} className="bg-gray-700 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition duration-300 cursor-pointer">Previous Flow</button> */}
                <div className='px-2 gap-2 flex flex-col'>
                    {
                        features.map((feature, index) => (
                            <NavLink
                                key={index}
                                state={{ from: location.pathname }}
                                to={feature.path || ""}
                                className="w-full"
                            >
                                {({ isActive }) => (
                                    <div
                                        className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition duration-300 ${isActive
                                            ? "bg-green-600 text-white"
                                            : "bg-gray-800 text-white hover:bg-gray-700 hover:shadow-[0_2px_10px_var(--primary)]/50"
                                            }`}
                                    >
                                        <span className="hidden lg:block">{feature.name}</span>
                                        <span className="material-symbols-outlined">
                                            {feature.icon}
                                        </span>
                                    </div>
                                )}
                            </NavLink>
                        ))
                    }
                </div>
            </div >
        </>
    )
}

export default SideBar