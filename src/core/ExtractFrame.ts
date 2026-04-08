import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile } from "@ffmpeg/util";

/**
 * Extracts all frame timestamps from a single video file using ffmpeg.wasm.
 * Runs ffmpeg with `-vf fps=...` probe to get frame timestamps via ffprobe-style output.
 */
async function extractFrameTimestamps(
	ffmpeg: FFmpeg,
	file: File
): Promise<number[]> {
	const inputName = `input_${file.name}`;

	await ffmpeg.writeFile(inputName, await fetchFile(file));

	const timestamps: number[] = [];
	const logLines: string[] = [];

	// Capture ffmpeg stderr output
	ffmpeg.on("log", ({ message }) => {
		logLines.push(message);
	});

	// Use showinfo filter to print per-frame pts_time to log
	await ffmpeg.exec([
		"-i", inputName,
		"-vf", "showinfo",
		"-f", "null",
		"-",
	]);

	// Parse "pts_time:<value>" from showinfo output
	for (const line of logLines) {
		const match = line.match(/pts_time:([\d.]+)/);
		if (match) {
			timestamps.push(parseFloat(match[1]));
		}
	}

	await ffmpeg.deleteFile(inputName);

	return timestamps;
}

/**
 * Loads ffmpeg.wasm (single-thread build for GitHub Pages compatibility).
 * Call once and reuse the instance.
 */
async function loadFFmpeg(): Promise<FFmpeg> {
	const ffmpeg = new FFmpeg();

    await ffmpeg.load();

	return ffmpeg;
}

/**
 * Accepts a list of 0–2 video files.
 * Returns [[timestamps_vid1], [timestamps_vid2]], [[timestamps_vid1]], or [].
 */
export async function extractAllFrameTimestamps(files: File[]): Promise<number[][]> {
	if (files.length === 0) {
		return [];
	}

	const ffmpeg = await loadFFmpeg();

	const results: number[][] = [];
	for (const file of files) {
		const timestamps = await extractFrameTimestamps(ffmpeg, file);
		results.push(timestamps);
	}

	return results;
}