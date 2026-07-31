import React from 'react'
import { Outlet, useLocation } from 'react-router-dom';
import SideBar from './Component/SideBar';

function MainConnect() {
const location = useLocation(); 
    return (
        <>
            <div className='flex w-full'>
               {location.pathname === "/" && <SideBar />}
                <Outlet/>
            </div>

        </>

    )
}

export default MainConnect