import React from 'react'
import { useState, useEffect } from 'react'
import { toast } from 'react-toastify'

interface Props {
    data: any;
    onResponse: (data: any) => void;
    loading: boolean;
}
function ResponseData({ data, onResponse, loading }: Props) {
    console.log(data);
    const [isDownloading, setIsDownloading] = useState(false);
    const [referenceImg, setReferenceImg] = useState<any>([]);
    const [selectedImages, setSelectedImages] = useState<string[]>([]);
    //handle the submit
    const handleSomething = () => {
        const newValue = !isDownloading;
        setIsDownloading(newValue);
        toast.info("Downloading...");
        onResponse(newValue);
    };

    useEffect(() => {
        if (!data?.markdown) return;

        const imageRegex = /!\[.*?\]\((https?:\/\/.*?)\)/g;

        const SKIP_HINTS = ["icon", "ico", "icons", "logo", "flags", "logos", "favicon", "sprite", "button", "btn", "arrow", "chevron", "menu", "hamburger", "close", "search", "filter", "sort", "background", "bg", "banner", "hero-bg", "pattern", "texture", "gradient", "overlay", "mask", "placeholder", "dummy", "default", "fallback", "blank", "loading", "loader", "spinner", "skeleton", "facebook", "instagram", "twitter", "x-logo", "linkedin", "youtube", "tiktok", "pinterest", "snapchat", "whatsapp", "telegram", "discord", "visa", "mastercard", "paypal", "amex", "americanexpress", "applepay", "googlepay", "gpay", "paytm", "upi", "payment", "star", "stars", "rating", "review", "reviews", "offer", "offers", "sale", "discount", "coupon", "promo", "promotion", "deal", "divider", "shape", "illustration", "vector", "graphic", "emoji", "sticker", "avatar", "profile", "user", "team", "brand", "brands", "thumbnail", "thumb", "cover", "header", "warranty", "footer", "nav", "navbar", "template_en", "breadcrumb", "bullet", "dot", "pixel", "tracking", "analytics", "cxservices", "awards"];

        const productImages = [...data.markdown.matchAll(imageRegex)]
            .map(match => match[1])
            .filter(url => {
                const lower = url.toLowerCase();

                // Skip common non-product image formats
                if (lower.endsWith(".svg")) return false;

                // Skip common UI/branding assets
                if (SKIP_HINTS.some(hint => lower.includes(hint))) return false;

                return true;
            });

        console.log(productImages);

        setReferenceImg(productImages);
    }, [data?.markdown]);


    //select the images
    const handleSelectImage = (image: string) => {
        console.log(image);
        setSelectedImages((prev) => {
            // Unselect if already selected
            if (prev.includes(image)) {
                return prev.filter((img) => img !== image);
            }

            // Allow only 2 selections
            if (prev.length >= 2) {
                return [prev[1], image];
            }

            return [...prev, image];
        });
    };
    return (
        <>

            <div className="mt-6 mr-6 flex max-w-3xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] shadow-[0_8px_30px_rgba(0,0,0,0.25)] backdrop-blur-sm">

                {/* Header */}
                <div className="flex items-center gap-3 px-5 py-4">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[image:var(--gradient-glow)] text-sm font-bold text-white shadow-lg shadow-green-500/20">
                        02
                    </span>

                    <div>
                        <h2 className="text-base font-semibold tracking-tight text-white md:text-lg">
                            Reference Images
                        </h2>
                        <p className="text-sm text-gray-400">
                            Select Reference Images
                        </p>
                    </div>
                </div>

                {/* Images */}
                {
                    !loading && data &&
                        ((Array.isArray(data) && data.length > 0) || (!Array.isArray(data) && Object.keys(data).length > 0)
                        ) ? (
                        <div className="flex gap-3 overflow-x-auto px-4 pb-4 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-gray-600">
                            {referenceImg.map((img: any, index: number) => {
                                const selected = selectedImages.includes(img);
                                return (
                                    <div
                                        key={index}
                                        onClick={() => handleSelectImage(img)}
                                        className={`group relative h-[120px] w-[136px] shrink-0 cursor-pointer overflow-hidden rounded-xl bg-gray-800 shadow-md ring-1 ring-white/10 transition-all duration-300 hover:ring-white/20 hover:shadow-xl ${selected
                                            ? "border-blue-500"
                                            : "border-transparent hover:border-gray-400"
                                            }`}
                                    >
                                        <img
                                            src={img}
                                            alt={`Reference ${index + 1}`}
                                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                                        />

                                        {/* Hover overlay */}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

                                        {/* Image number */}
                                        <span className="absolute bottom-2 left-2 rounded-md bg-black/60 px-2 py-1 text-xs font-medium text-white backdrop-blur-md">
                                            {index + 1}
                                        </span>

                                        {selected && (
                                            <div className="absolute top-2 right-2 bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">
                                                ✓
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    ) : (
                        /* Empty state */
                        <div className="mx-4 mb-4 flex h-[120px] items-center justify-center rounded-xl border border-dashed border-white/10 bg-white/[0.02]">
                            {loading ? (
                                <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-600 border-t-white border-r-white" />
                            ) : (
                                <span className="text-sm text-gray-500">
                                    No Reference Images Found
                                </span>
                            )}
                        </div>
                    )}
            </div>


        </>
    )
}

export default ResponseData