import { Point2D } from "./Types";

export class VideoState {
    public file: File = new File([], '');
    public frameTimestamps: number[] = [];
    public refObjMarks: (Point2D | null)[] = Array(8).fill(null);
    public targObjMarks: (Point2D | null)[] = [];
    public startFrame = 0;
    public endFrame = 0;
    private refCurrentTime = 0;

    public onChange: (() => void) | null = null;

    get hasVideo(): boolean { return this.file.size > 0; }
    get startTime(): number { return this.frameTimestamps[this.startFrame] ?? 0; }
    get endTime(): number { return this.frameTimestamps[this.endFrame] ?? 0; }
    get currentTime(): number { return this.refCurrentTime; }
    get duration(): number { return this.endTime - this.startTime; }

    set currentTime(time: number) { this.refCurrentTime = Math.min(Math.max(time, this.startTime), this.endTime); }

    public updateVideo(file: File, timestamps: number[] | null = null, currentTime : number | null = null, refObjMarks: (Point2D | null)[] = Array(8).fill(null), targetObjMarks: (Point2D | null)[] = []) {
        this.file = file;
        this.frameTimestamps = timestamps ?? [];
        this.currentTime = currentTime ?? this.startTime;
        this.refObjMarks = refObjMarks;
        this.targObjMarks = targetObjMarks;
    }

    public updateTimestamps(timestamps: number[]) {
        this.frameTimestamps = timestamps;
        this.startFrame = 0;
        this.endFrame = timestamps.length > 0 ? timestamps.length - 1 : 0;
        this.currentTime = Math.min(Math.max(this.currentTime, this.startTime), this.endTime);
    }

    public updateTrim(startFrame: number, endFrame: number) {
        this.startFrame = startFrame;
        this.endFrame = endFrame;
        this.currentTime = Math.min(Math.max(this.currentTime, this.startTime), this.endTime);
    }

    public reset() {
        this.file = new File([], '');
        this.frameTimestamps = [];
        this.refObjMarks = Array(8).fill(null);
        this.targObjMarks = Array(8).fill(null);
        this.startFrame = 0;
        this.endFrame = 0;
    }

    public toString(): string {
        return `VideoState: file = ${this.file.name}\nframes=${this.frameTimestamps.length}\nstartFrame=${this.startFrame}\nendFrame=${this.endFrame}\ncurrentTime=${this.currentTime}\nrefObjMarks=${this.refObjMarks.map(m => m ? m.toString() : 'null').join(', ')}\ntargObjMarks=${this.targObjMarks.map(m => m ? m.toString() : 'null').join(', ')}`;
    }
}