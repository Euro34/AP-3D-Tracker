// import { Point_2D, Point_3D } from "./core/Types";
import { ReferenceObject } from "./core/ReferenceObject";

import { updateStatus } from "./UI/workflow";
// import { updateVideosInfo } from "./UI/sync";

class APTracker {
    uploadedVideos: File[] = [];
    sync: number[] | null = null; // [start1, end1, offsets(start2-start1)]
    referenceObject: ReferenceObject | null = null;

    updateVideos(videos: File[]) {
        this.uploadedVideos = videos;
        if (this.uploadedVideos.length === 2) {
            updateStatus("Upload", "done");
        } else if (this.uploadedVideos.length === 1) {
            updateStatus("Upload", "inprogress");
        } else if (this.uploadedVideos.length === 0) {
            updateStatus("Upload", "");
        }
    }

    updateSync(start1: number, end1: number, start2: number, end2: number) {
        const duration1 = end1 - start1;
        const duration2 = end2 - start2;

        if (duration1 == duration2) {
            this.sync = [start1, end1, start2 - start1];
            updateStatus("Sync", "done");
        } else {
            updateStatus("Sync", "inprogress");
        }
    }

    updateReferenceObject(width: number | null, length: number | null, height: number | null) {
        let nullCount = 0;
        if (Number.isNaN(width)) nullCount++;
        if (Number.isNaN(length)) nullCount++;
        if (Number.isNaN(height)) nullCount++;

        if (nullCount == 0) {
            this.referenceObject = new ReferenceObject(width!, length!, height!);
            updateStatus("RefDim", "done");
        } else {
            this.referenceObject = null;
            if (nullCount != 3) {
                updateStatus("RefDim", "inprogress");
            } else {
                updateStatus("RefDim", "");
            }
        }

        console.log("Updated reference object:", this.referenceObject);
    }
}

export let apTracker = new APTracker();