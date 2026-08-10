import React from 'react'
import { Outlet, useLocation } from 'react-router-dom';
import SideBar from './Component/SideBar';

function MainConnect() {
    const location = useLocation();
    const showSidebar = location.pathname === "/";
    return (
        <>
            <div className='flex w-full'>
                <aside>
                    {showSidebar && <SideBar />}
                </aside>
                <main
                    className={
                        showSidebar
                            ? "ml-60 min-h-screen overflow-y-auto mx-auto w-full"
                            : "min-h-screen overflow-y-auto w-full"
                    }
                >
                    <Outlet />
                </main>
            </div>

        </>

    )
}

export default MainConnect