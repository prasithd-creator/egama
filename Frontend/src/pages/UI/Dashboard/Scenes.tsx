import React from 'react'
import { Link, Loader2, X, ArrowRight, ShieldCheck, ArrowUpRight } from "lucide-react";


function Scenes() {

    return (
        <>
            <section className="w-full max-w-3xl mx-auto">
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5 md:p-6 shadow-[0_8px_30px_rgba(0,0,0,0.25)] backdrop-blur-sm h-full">

                    {/* Header */}
                    <div className="mb-5 sm:mb-6">
                        <div className="flex items-start gap-3">
                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[image:var(--gradient-glow)] text-sm font-bold text-white shadow-lg shadow-green-500/20">
                                03
                            </span>

                            <div className="min-w-0">
                                <h2 className="text-sm font-semibold tracking-tight text-white sm:text-base md:text-lg">
                                    Select the Scenes
                                </h2>

                                <p className="text-xs leading-relaxed text-gray-400 sm:text-sm italic">
                                    Select the scenes you want to generate
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* URL Input + Submit */}
                    <div className="flex w-full flex-col gap-3 sm:gap-4 lg:flex-row">

                        
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

export default Scenes