import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile } from "@ffmpeg/util";

// Singleton instance to avoid reloading FFmpeg multiple times
let ffmpegInstance: FFmpeg | null = null;

// Cache to store results: Key is "filename-size", Value is timestamp array
class TimestampCache {
    private cache = new Map<string, number[]>();
    private readonly maxEntries: number;

    constructor(maxEntries = 10) {
        this.maxEntries = maxEntries;
    }

    get(key: string): number[] | undefined {
        if (!this.cache.has(key)) return undefined;

        // Refresh the item: delete and re-insert so it's "newest"
        const value = this.cache.get(key)!;
        this.cache.delete(key);
        this.cache.set(key, value);
        return value;
    }

    set(key: string, value: number[]): void {
        // If key exists, delete it first to update its position
        if (this.cache.has(key)) {
            this.cache.delete(key);
        } else if (this.cache.size >= this.maxEntries) {
            // Map maintains insertion order, so the first key is the oldest
            const oldestKey = this.cache.keys().next().value;
            if (oldestKey !== undefined) {
                this.cache.delete(oldestKey);
            }
        }
        this.cache.set(key, value);
    }
}

// Initialize with a reasonable limit (e.g., 20 videos)
const timestampCache = new TimestampCache(20);

async function getFFmpeg(): Promise<FFmpeg> {
    if (ffmpegInstance) return ffmpegInstance;
    
    ffmpegInstance = new FFmpeg();
    await ffmpegInstance.load();
    return ffmpegInstance;
}

async function extractFrameTimestamps(ffmpeg: FFmpeg, file: File): Promise<number[]> {
    // Generate a semi-unique key for the cache
    const cacheKey = `${file.name}-${file.size}`;
    if (timestampCache.get(cacheKey)) {
        return timestampCache.get(cacheKey)!;
    }

    const inputName = `input_${file.name}`;
    await ffmpeg.writeFile(inputName, await fetchFile(file));

    const timestamps: number[] = [];
    
    // Use a scoped log listener to avoid mixing logs from different files
    const logHandler = ({ message }: { message: string }) => {
        const match = message.match(/pts_time:([\d.]+)/);
        if (match) {
            timestamps.push(parseFloat(match[1]));
        }
    };

    ffmpeg.on("log", logHandler);

    await ffmpeg.exec([
        "-i", inputName,
        "-vf", "showinfo",
        "-f", "null",
        "-",
    ]);

    // Cleanup: remove listener and delete virtual file
    ffmpeg.off("log", logHandler);
    await ffmpeg.deleteFile(inputName);

    // Save to cache
    timestampCache.set(cacheKey, timestamps);
    return timestamps;
}

export async function extractAllFrameTimestamps(files: File[]): Promise<number[][]> {
    if (files.length === 0) return [];

    const ffmpeg = await getFFmpeg();
    const results: number[][] = [];

    for (const file of files) {
        const timestamps = await extractFrameTimestamps(ffmpeg, file);
        results.push(timestamps);
    }

    return results;
}