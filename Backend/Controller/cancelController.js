import runningJobs from "../utils/jobManager.js";
import progressStore from "../utils/OllamaProgressStore.js";

export const cancelGeneration = (req, res) => {
    console.log("Cancel endpoint hit");
    console.log(req.body);

    const body = typeof req.body === "string"
        ? JSON.parse(req.body)
        : req.body;

    const { jobId } = body;

    console.log("Cancelling:", jobId);

    const controller = runningJobs.get(jobId);

    if (controller) {
        controller.abort();

        progressStore.set(jobId, {
            progress: 0,
            status: "cancelled"
        });

        runningJobs.delete(jobId);
    }

    return res.json({
        success: true
    });
};