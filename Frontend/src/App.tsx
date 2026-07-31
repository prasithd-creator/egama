import React from 'react'
import { AppContextProvider } from './Context/createContent';
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import MainConnect from './MainConnect';

function App() {
  return (
    <>
      <AppContextProvider>
        <MainConnect />
        <ToastContainer />
      </AppContextProvider>
    </>
  )
}

export default App