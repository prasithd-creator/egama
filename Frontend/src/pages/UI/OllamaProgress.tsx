interface Props {
    progress: number;
    remaining: number | null;
    elapsed?: number;
    scenes?: number;
    totalScenes?: number;
    characters?: number;
    loading: boolean;
    text: string;
    stage?: 1 | 2; // 1 = generating scenes, 2 = generating image prompts
}

const STAGES = [
    { id: 1, label: "Generate Scenes" },
    { id: 2, label: "Generate Prompts" },
] as const;

const OllamaProgress = ({
    progress,
    remaining,
    elapsed,
    scenes,
    totalScenes,
    characters,
    loading,
    text,
    stage
}: Props) => {

    if (!loading) return null;

    const headingText =
        stage === 1
            ? "Generating Scenes"
            : stage === 2
                ? "Generating Image Prompts"
                : text;

    return (
        <div className="w-full max-w-md mx-auto mt-6 p-5 rounded-2xl bg-black/70 text-white shadow-lg border border-gray-800 absolute z-[1000]">

            {/* Stage Stepper */}
            {stage && (
                <div className="flex items-center mb-5">
                    {STAGES.map((s, idx) => {
                        const isComplete = stage > s.id;
                        const isActive = stage === s.id;

                        return (
                            <div key={s.id} className="flex items-center flex-1 last:flex-none">
                                <div className="flex flex-col items-center gap-1">
                                    <div
                                        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors duration-300 ${isComplete
                                                ? "bg-green-500 border-green-500 text-black"
                                                : isActive
                                                    ? "border-green-400 text-green-400"
                                                    : "border-gray-700 text-gray-600"
                                            }`}
                                    >
                                        {isComplete ? "✓" : s.id}
                                    </div>

                                    <span
                                        className={`text-[10px] whitespace-nowrap ${isActive
                                                ? "text-green-400"
                                                : isComplete
                                                    ? "text-gray-400"
                                                    : "text-gray-600"
                                            }`}
                                    >
                                        {s.label}
                                    </span>
                                </div>

                                {idx < STAGES.length - 1 && (
                                    <div
                                        className={`h-0.5 flex-1 mx-2 mb-4 rounded transition-colors duration-300 ${stage > s.id ? "bg-green-500" : "bg-gray-700"
                                            }`}
                                    />
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            <div className="flex justify-between items-center mb-4">
                <h2 className="text-base font-semibold">
                    {headingText}
                </h2>

                <span className="text-green-400 font-bold text-sm">
                    {progress}%
                </span>
            </div>


            {/* Progress Bar */}
            <div className="w-full h-3 bg-gray-800 rounded-full overflow-hidden">
                <div
                    className="h-full bg-gradient-to-r from-green-800 to-green-500 transition-all duration-500 rounded-full"
                    style={{
                        width: `${progress}%`
                    }}
                />
            </div>


            {/* Scene Counter */}
            <div className="mt-4 flex justify-between items-center bg-gray-900 rounded-xl px-4 py-3">

                <span className="text-gray-400 text-sm">
                    {stage === 1 ? "Scenes Generated" : "Prompts Generated"}
                </span>

                <span className="text-lg font-bold">
                    {scenes ?? 0}/{totalScenes ?? 0}
                </span>

            </div>


            <p className="mt-4 text-center text-xs text-gray-500 animate-pulse">
                {text}
            </p>

        </div>
    );
};


export default OllamaProgress;