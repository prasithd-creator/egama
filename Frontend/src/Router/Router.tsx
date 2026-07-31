import { createBrowserRouter } from "react-router";
import App from "../App";
import Images from "../pages/UI/Images";
import VideoGenerate from "../pages/UI/VideoGenerate";
import PreviousFlow from "../pages/UI/PreviousFlow";
import Dashboard from "../pages/UI/Dashboard";
import MainDashboard from "../pages/UI/MainDashboard";

const router = createBrowserRouter([
    {
        path: "/",
        element: <App />,
        children: [
            {
                index: true,
                element: <Dashboard />,
            },
            {
                path: "/images",
                element: <Images />,
            },
            {
                path: "/videos",
                element: <VideoGenerate />,
            },
            {
                path: "/previousflow",
                element: <PreviousFlow />,
            }, {
                path: "/previousflow/images",
                element: <Images />,
            }, {
                path: "/maindashboard",
                element: <MainDashboard />,
            }
        ],
    },

    {
        path: "*",
        element: (
            <div className="min-h-screen flex items-center justify-center text-3xl font-bold text-white">
                404 Page Not Found
            </div>
        ),
    },
]);

export default router;