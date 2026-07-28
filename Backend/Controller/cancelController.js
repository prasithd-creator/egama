import runningJobs from "../utils/jobManager.js";
import progressStore from "../utils/OllamaProgressStore.js";

export const cancelGeneration = (req, res) => {
    console.log("Cancel endpoint hit");
    console.log(req.body);

    const body = typeof req.body === "string"
        ? JSON.parse(req.body)
        : req.body;

    const jobId = String(body.jobId);

    console.log("Cancelling:", jobId);

    const controller = runningJobs.get(jobId);
    console.log("Stored controller:", controller);

    if (!controller) {
        console.log(`Cancel requested for unknown/finished job: ${jobId}`);
        console.log("Current known job IDs:", [...runningJobs.keys()]);

        return res.status(404).json({
            success: false,
            error: `No running job found for jobId ${jobId}`
        });
    }

    console.log("Stored controller found — aborting:", jobId);

    controller.abort();

    progressStore.set(jobId, {
        progress: 0,
        status: "cancelled",
        error: "Generation cancelled by user"
    });

    return res.json({
        success: true,
        jobId,
        status: "cancelled"
    });
};