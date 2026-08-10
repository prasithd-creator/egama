import { useState, useEffect, useContext } from "react"
import { useNavigate } from "react-router-dom";
import { Link, Loader2, X, ArrowRight, ShieldCheck, ArrowUpRight } from "lucide-react";
import { toast } from "react-toastify";
import axios from "axios";
import { AppContext } from "../../../Context/createContent";

interface UrlCardProps {
    onSuccess: (data: any) => void;
    onLoading: (loading: boolean) => void;
}

function UrlCard({ onSuccess, onLoading }: UrlCardProps) {
    const [loading, setLoading] = useState<boolean>(false);
    const [url, setUrl] = useState<string>(() => {
        const data = localStorage.getItem("responseData");
        if (!data) return "";

        try {
            return JSON.parse(data).metadata.url || "";
        } catch (e) {
            return "";
        }
    });
    const [submittedUrl, setSubmittedUrl] = useState("");
    const [responseData, setResponseData] = useState(null);
    const context = useContext(AppContext);
    const BackendUrl = context?.BackendUrl as string;



    //handle the submit 
    const handleSubmit = async () => {
        if (!url.trim()) return toast.warning("Please paste a URL");

        try {
            setLoading(true);
            onLoading(true);
            setSubmittedUrl(url);
            const res = await axios.post(
                `${BackendUrl}/api/firecrawl`,
                { url }
            );

            if (res.data.success) {
                const data = res.data.data;

                setResponseData(data);
                onSuccess(data);
                console.log(data);
            } else {
                toast.error(res.data.message);
            }
        } catch (error) {
            console.log(error);
            toast.error((error as Error).message);
        } finally {
            setLoading(false);
            onLoading(false);
            // navigate("/images", { state: responseData });
        }
    };

    return (
        <>
            <section className="ml-6 mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-5 md:p-6 shadow-[0_8px_30px_rgba(0,0,0,0.25)] backdrop-blur-sm max-w-3xl">
                <div className="mb-5">
                    <div className="flex items-center gap-3">
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[image:var(--gradient-glow)] text-sm font-bold text-white shadow-lg shadow-green-500/20">01</span>
                        <div>
                            <h2 className="text-base md:text-lg font-semibold tracking-tight text-white">Enter Product URL</h2>
                            <p className="text-sm text-gray-400">Paste any product page link. We'll extract the content automatically.</p>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col gap-3 md:flex-row">
                    <div className="group flex w-full items-center gap-3 rounded-xl border border-white/10 bg-[#0b1120]/80 px-4 transition-all duration-200 focus-within:border-green-500/60 focus-within:bg-[#0b1120] focus-within:ring-4 focus-within:ring-green-500/10 hover:border-white/20">
                        <Link size={20} className="shrink-0 text-gray-500 transition-colors group-focus-within:text-green-400" />

                        <input type="url"
                            placeholder="https://example.com/product..."
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            className="min-w-0 flex-1 bg-transparent py-3.5 text-sm text-white placeholder:text-gray-600 outline-none" />
                        {url && (
                            <a href={url} target="_blank" rel="noopener noreferrer" className="shrink-0 text-gray-500 transition-colors hover:text-green-400" title="Open URL">
                                <ArrowUpRight size={17} />
                            </a>
                        )}
                        {url && (
                            <button type="button" onClick={() => setUrl("")} className="text-gray-500 transition-colors hover:text-red-500 cursor-pointer">
                                <X size={17} />
                            </button>
                        )}
                    </div>

                    <button onClick={handleSubmit} disabled={loading || !url} className="flex items-center justify-center gap-2 rounded-xl bg-[image:var(--gradient-glow)] px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-green-500/10 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-green-500/20 active:translate-y-0 disabled:pointer-events-none disabled:opacity-40 md:w-auto whitespace-nowrap cursor-pointer">
                        {loading ? (
                            <>
                                <Loader2 size={18} className="animate-spin" />
                                Processing...
                            </>
                        ) : (
                            <>
                                Submit URL
                                <ArrowRight size={18} className="shrink-0" />
                            </>
                        )}
                    </button>
                </div>

                <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
                    <ShieldCheck size={14} className="text-green-500/70" />
                    <span>Your URL is processed securely.</span>
                </div>
            </section>
        </>
    )
}

export default UrlCard