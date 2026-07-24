import ffmpeg from "fluent-ffmpeg";

ffmpeg.setFfmpegPath(
  "C:/Users/Prasith/ffmpeg-2026-05-18-git-b4d11dffbf-full_build/ffmpeg-2026-05-18-git-b4d11dffbf-full_build/bin/ffmpeg.exe"
);

// NEW: merge one video + one audio into a single scene file
export function mergeAudioVideo(videoPath, audioPath, output) {
  return new Promise((resolve, reject) => {
    ffmpeg()
      .input(videoPath)
      .input(audioPath)
      .outputOptions([
        "-map 0:v:0",
        "-map 1:a:0",
        "-c:v libx264",
        "-preset medium",
        "-crf 18",
        "-c:a aac",
        "-b:a 192k",
        "-shortest",       // stop at the shorter of video/audio
        "-movflags +faststart"
      ])
      .output(output)
      .on("start", cmd => console.log("FFmpeg (scene merge) started:", cmd))
      .on("progress", p => {
        if (p.percent !== undefined) console.log(`Scene merge: ${p.percent.toFixed(2)}%`);
      })
      .on("end", () => {
        console.log("Scene merge completed:", output);
        resolve(output);
      })
      .on("error", (err, stdout, stderr) => {
        console.error(stderr);
        reject(err);
      })
      .run();
  });
}

export function mergeVideos(videoPaths, output) {
  console.log("videoPaths:", videoPaths, "isArray:", Array.isArray(videoPaths));

  return new Promise((resolve, reject) => {
    const command = ffmpeg();
    videoPaths.forEach(video => command.input(video));

    const filter =
      videoPaths.map((_, index) => `[${index}:v][${index}:a]`).join("") +
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
      .on("start", cmd => console.log("FFmpeg (final concat) started:", cmd))
      .on("progress", progress => {
        if (progress.percent !== undefined) console.log(`Merge Progress: ${progress.percent.toFixed(2)}%`);
        if (progress.timemark) console.log("Time:", progress.timemark);
      })
      .on("end", () => {
        console.log("Merge completed");
        resolve(output);
      })
      .on("error", (err, stdout, stderr) => {
        console.error(stderr);
        reject(err);
      })
      .run();
  });
}

export function mergeAudios(audioPaths, output) {
  return new Promise((resolve, reject) => {
    const command = ffmpeg();
    audioPaths.forEach(audio => command.input(audio));

    const filter =
      audioPaths.map((_, i) => `[${i}:a]`).join("") +
      `concat=n=${audioPaths.length}:v=0:a=1[a]`;

    command
      .complexFilter([filter])
      .outputOptions(["-map [a]", "-c:a mp3", "-b:a 192k"])
      .output(output)
      .on("start", cmd => console.log(cmd))
      .on("progress", progress => console.log(progress))
      .on("end", () => {
        console.log("Audio merge completed");
        resolve(output);
      })
      .on("error", (err, stdout, stderr) => {
        console.error(stderr);
        reject(err);
      })
      .run();
  });
}