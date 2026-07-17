import progressStore from "../../utils/OllamaProgressStore.js";


export const getProgress = (req, res) => {

    const data =
        progressStore.get(req.params.id);


    if (!data) {

        return res.status(404).json({
            error: "Job not found"
        });

    }


    res.json(data);

};