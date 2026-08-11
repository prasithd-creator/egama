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
            <section className="w-full max-w-3xl mx-auto px-3 sm:px-4 md:px-6 lg:px-0">
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5 md:p-6 shadow-[0_8px_30px_rgba(0,0,0,0.25)] backdrop-blur-sm h-full">

                    {/* Header */}
                    <div className="mb-5 sm:mb-6">
                        <div className="flex items-start gap-3">
                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[image:var(--gradient-glow)] text-sm font-bold text-white shadow-lg shadow-green-500/20">
                                01
                            </span>

                            <div className="min-w-0">
                                <h2 className="text-sm font-semibold tracking-tight text-white sm:text-base md:text-lg">
                                    Enter Product URL
                                </h2>

                                <p className="text-xs leading-relaxed text-gray-400 sm:text-sm italic">
                                    Paste any product page link. We'll extract the content automatically.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* URL Input + Submit */}
                    <div className="flex w-full flex-col gap-3 sm:gap-4 lg:flex-row">

                        {/* URL Input */}
                        <div className="group flex min-h-[50px] w-full min-w-0 items-center gap-2 rounded-xl border border-white/10 bg-[#0b1120]/80 px-3 transition-all duration-200 hover:border-white/20 focus-within:border-green-500/60 focus-within:bg-[#0b1120] focus-within:ring-4 focus-within:ring-green-500/10 sm:gap-3 sm:px-4 not-last:">

                            <Link
                                size={18}
                                className="shrink-0 text-gray-500 transition-colors group-focus-within:text-green-400 sm:h-5 sm:w-5"
                            />

                            <input
                                type="url"
                                placeholder="https://example.com/product..."
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                className="min-w-0 flex-1 bg-transparent py-3 text-xs text-white outline-none placeholder:text-gray-600 sm:py-3.5 sm:text-sm"
                            />

                            {/* Open URL */}
                            {url && (
                                <a
                                    href={url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="shrink-0 cursor-pointer text-gray-500 transition-colors hover:text-green-400"
                                    title="Open URL"
                                >
                                    <ArrowUpRight size={16} className="sm:h-[17px] sm:w-[17px]" />
                                </a>
                            )}

                            {/* Clear URL */}
                            {url && (
                                <button
                                    type="button"
                                    onClick={() => setUrl("")}
                                    className="shrink-0 cursor-pointer text-gray-500 transition-colors hover:text-red-500"
                                    aria-label="Clear URL"
                                >
                                    <X size={16} className="sm:h-[17px] sm:w-[17px]" />
                                </button>
                            )}
                        </div>

                        {/* Submit Button */}
                        <button
                            onClick={handleSubmit}
                            disabled={loading || !url}
                            className="flex min-h-[50px] w-full shrink-0 cursor-pointer items-center justify-center gap-2 rounded-xl bg-[image:var(--gradient-glow)] px-5 py-3 text-sm font-semibold whitespace-nowrap text-white shadow-lg shadow-green-500/10 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-green-500/20 active:translate-y-0 disabled:pointer-events-none disabled:opacity-40 sm:px-7 md:w-auto"
                        >
                            {loading ? (
                                <>
                                    <Loader2 size={18} className="animate-spin" />
                                    <span>Processing...</span>
                                </>
                            ) : (
                                <>
                                    <span>Submit URL</span>
                                    <ArrowRight size={18} className="shrink-0" />
                                </>
                            )}
                        </button>
                    </div>

                    {/* Security Message */}
                    <div className="mt-3 flex items-start gap-2 text-[11px] text-gray-500 sm:items-center sm:text-xs">
                        <ShieldCheck
                            size={14}
                            className="mt-0.5 shrink-0 text-green-500/70 sm:mt-0"
                        />
                        <span>Your URL is processed securely.</span>
                    </div>
                </div>
            </section>
        </>
    )
}

export default UrlCard