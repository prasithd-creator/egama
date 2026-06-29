import React from 'react'
import { Outlet } from 'react-router-dom';
import { AppContextProvider } from './Context/createContent';
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function App() {
  return (
    <>
      <AppContextProvider>
        <Outlet />
        <ToastContainer />
      </AppContextProvider>
    </>
  )
}

export default App