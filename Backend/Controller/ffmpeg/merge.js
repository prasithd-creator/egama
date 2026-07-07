import ffmpeg from "fluent-ffmpeg";

// Windows FFmpeg path
ffmpeg.setFfmpegPath(
  "C:/Users/Prasith/ffmpeg-2026-05-18-git-b4d11dffbf-full_build/ffmpeg-2026-05-18-git-b4d11dffbf-full_build/bin/ffmpeg.exe"
);

export function mergeVideos(videoPaths, output) {

  console.log("videoPaths:", videoPaths);
  console.log("isArray:", Array.isArray(videoPaths));
  return new Promise((resolve, reject) => {

    const command = ffmpeg();

    videoPaths.forEach(video => {
      command.input(video);
    });


    const inputs = videoPaths
      .map((_, index) => `[${index}:v][${index}:a]`)
      .join("");

    const audioInputs = videoPaths
      .map((_, index) => `[${index}:a]`)
      .join("");


    const filter = videoPaths
      .map((_, index) => `[${index}:v][${index}:a]`)
      .join("") +
      `concat=n=${videoPaths.length}:v=1:a=1[v][a]`;


    command
      .complexFilter([filter])

      .outputOptions([
        "-map [v]",
        "-map [a]",
        "-c:v libx264",
        "-preset medium",
        "-crf 18",
        "-c:a aac",
        "-b:a 192k",
        "-movflags +faststart"
      ])

      .output(output)

      .on("start", cmd => {
        console.log("FFmpeg started:");
        console.log(cmd);
      })

      .on("progress", (progress) => {
        if (progress.percent !== undefined) {
          console.log(
            `Merge Progress: ${progress.percent.toFixed(2)}%`
          );
        }

        if (progress.timemark) {
          console.log("Time:", progress.timemark);
        }
      })

      .on("end", () => {
        console.log("Merge completed");
        resolve(output);
      })

      .on("error", (err, stdout, stderr) => {
        console.log(stderr);
        reject(err);
      })

      .run();
  });
}