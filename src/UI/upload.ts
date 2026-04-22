import { apTracker } from "../main";


class Upload {
    private uploadedVideos: File[] = [];

    private uploadArea = document.getElementById("upload-area") as HTMLDivElement;
    private previewGrid = document.getElementById("preview-grid") as HTMLDivElement;
    private fileInput = document.getElementById("video-upload") as HTMLInputElement;

    constructor() {
        this.uploadArea.addEventListener("click", () => this.fileInput.click());

        // File picker selection
        this.fileInput.addEventListener("change", () => {
            if (this.fileInput.files) this.handleNewFiles(Array.from(this.fileInput.files));
            // Reset so the same file can be re-selected after removal
            this.fileInput.value = "";
        });

        // Drag and drop
        this.uploadArea.addEventListener("dragover", (e) => {
            e.preventDefault();
            this.uploadArea.classList.add("drag-over");
        });
        this.uploadArea.addEventListener("dragleave", () => {
            this.uploadArea.classList.remove("drag-over");
        });
        this.uploadArea.addEventListener("drop", (e) => {
            e.preventDefault();
            this.uploadArea.classList.remove("drag-over");
            if (e.dataTransfer?.files) this.handleNewFiles(Array.from(e.dataTransfer.files));
        });
    }


    // Only accept video files, only fill up to 2 total
    private handleNewFiles(newFiles: File[]): void {
        const videoFiles = newFiles.filter((f) => f.type.startsWith("video/"));
        const slots = 2 - this.uploadedVideos.length;
        this.uploadedVideos.push(...videoFiles.slice(0, slots));
        apTracker.updateVideos(this.uploadedVideos);
        this.render();
    }

    // Revoke the object URL to free memory
    private removeFile(index: number): void {
        const card = this.previewGrid.children[index] as HTMLElement;
        const video = card.querySelector("video");
        if (video?.src) URL.revokeObjectURL(video.src);

        this.uploadedVideos.splice(index, 1);
        apTracker.updateVideos(this.uploadedVideos);
        this.render();
    }

    private render(): void {
        const count = this.uploadedVideos.length;

        this.uploadArea.classList.toggle("hidden", count === 2);
        this.fileInput.classList.toggle("hidden", count === 2);
        this.previewGrid.classList.toggle("hidden", count === 0);

        if (count === 0) {
            this.uploadArea.querySelector("p")!.textContent ="Click or drag and drop to upload videos";
        } else if (count === 1) {
            this.uploadArea.querySelector("p")!.textContent = "Click or drag and drop to upload the second video";
        }

        // Clear existing thumbnails
        this.previewGrid.innerHTML = "";

        // Render one card per file
        this.uploadedVideos.forEach((file, index) => {
            const objectURL = URL.createObjectURL(file);

            const card = document.createElement("div");
            card.className = "preview-card";

            const video = document.createElement("video");
            video.src = objectURL;
            video.muted = true;

            video.currentTime = 0.01;
            video.load();
            const filename = document.createElement("div");
            filename.className = "filename";
            filename.textContent = file.name;

            const removeBtn = document.createElement("button");
            removeBtn.className = "remove-btn";
            removeBtn.title = "Remove";
            removeBtn.textContent = "✕";
            removeBtn.addEventListener("click", () => this.removeFile(index));

            card.append(video, filename, removeBtn);
            this.previewGrid.appendChild(card);
        });
    }

    public imported(file: File[]) {
        this.uploadedVideos = file;
        this.render();
    }
}

export let upload = new Upload();