import { createBrowserRouter } from "react-router";
import App from "../App";
import Images from "../pages/UI/Images";
import VideoGenerate from "../pages/UI/VideoGenerate";

import Dashboard from "../pages/UI/Dashboard";

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
            }
        ],
    },

    {
        path: "*",
        element: (
            <div className="min-h-screen flex items-center justify-center text-3xl font-bold">
                404 Page Not Found
            </div>
        ),
    },
]);

export default router;