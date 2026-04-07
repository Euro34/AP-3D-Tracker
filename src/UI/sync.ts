// import { apTracker } from "../main";

const openSyncEditorBtn = document.getElementById("open-sync-editor") as HTMLButtonElement;
const closeSyncEditorBtn = document.getElementById("close-sync-editor") as HTMLButtonElement;

openSyncEditorBtn.addEventListener("click", () => {
    const syncEditor = document.querySelector(".SyncEditor") as HTMLDivElement;
    syncEditor.classList.add("active");
});

closeSyncEditorBtn.addEventListener("click", () => {
    const syncEditor = document.querySelector(".SyncEditor") as HTMLDivElement;
    syncEditor.classList.remove("active");
});

