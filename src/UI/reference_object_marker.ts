import {Point_2D} from '../core/Types'
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// import { apTracker } from '../main';

document.getElementById("open-refObjMarker")!.addEventListener("click", () => {
    document.querySelector(".RefObjMarker")!.classList.add("active");
    document.getElementById("loading-screen")!.classList.add("show");
});

document.getElementById("close-refObjMarker")!.addEventListener("click", () => {
    document.querySelector(".RefObjMarker")!.classList.remove("active");
    document.getElementById("loading-screen")!.classList.remove("show");
});

// Color handler
function cornerColor(index: number): { r: number, g: number, b: number } {
	const r = ((index & 1) * 200) + 50;
	const g = (((index >> 1) & 1) * 200) + 50;
	const b = (((index >> 2) & 1) * 200) + 50;
	return { r, g, b };
}

function cornerCss(index: number, alpha = 0.50): string {
	const { r, g, b } = cornerColor(index);
	return `rgba(${r},${g},${b},${alpha})`;
}

function cornerThreeColor(index: number): THREE.Color {
	const { r, g, b } = cornerColor(index);
	return new THREE.Color(r / 255, g / 255, b / 255);
}

class VideoState {
    file: File = new File([], '');
	frameTimestamps: number[] = [];
	marks: Array<Point_2D | null> = Array(8).fill(null);
	startFrame = 0;
	endFrame = 0;

    get hasVideo(): boolean {
		return this.file.name !== '';
	}

    updateVideo(file: File, timestamps: number[], startFrame = 0, endFrame = 0) {
		this.file = file;
		this.frameTimestamps = timestamps;
		this.startFrame = startFrame;
		this.endFrame = endFrame ?? Math.max(0, timestamps.length - 1);
	}

    reset() {
		this.file = new File([], '');
		this.frameTimestamps = [];
		this.marks = Array(8).fill(null);
		this.startFrame = 0;
		this.endFrame = 0;
	}

    getPoints(): Array<Point_2D | null> {
		return [...this.marks];
	}

	setMark(cornerIndex: number, point: Point_2D): void {
		this.marks[cornerIndex] = point;
	}

	removeMark(cornerIndex: number): void {
		this.marks[cornerIndex] = null;
	}

	markedCount(): number {
		return this.marks.filter(Boolean).length;
	}
}

// Handle video and marking
class RefMarkerVideo {

}

class Ref3DWidget {
	private renderer: THREE.WebGLRenderer;
	private controls: OrbitControls | null = null;
	private animationFrameId: number | null = null;
 
	private W = 0;
	private H = 0;

	// // Current dimensions
	private boxW = 0.001;
	private boxL = 0.001;
	private boxH = 0.001;
	private selectedCorner = 0;
 
	constructor() {
        const container = document.getElementById('ref-3d-widget')!;
        this.W = container.clientWidth;
        this.H = container.clientHeight;

		this.renderer = new THREE.WebGLRenderer({ antialias: true });
		this.renderer.setSize(this.W, this.H);
		container.appendChild(this.renderer.domElement);

		new ResizeObserver(() => {
			const w = container.clientWidth;
			const h = container.clientHeight;
			this.renderer!.setSize(w, h);
		}).observe(container);

		this.render();
	}

    cornerPosition(index: number, w: number, l: number, h: number): THREE.Vector3 {
        const x = (index & 1) === 0 ? 0 : w;
        const y = ((index >> 1) & 1) === 0 ? 0 : l;
        const z = ((index >> 2) & 1) === 0 ? 0 : h;
        return new THREE.Vector3(x, y, z);
    }
 
	setDimensions(w: number, l: number, h: number): void {
		this.boxW = w
		this.boxL = l
		this.boxH = h
		this.render();
	}
 
	setSelectedCorner(index: number): void {
		this.selectedCorner = index;
		this.render();
	}
 
	private render(): void {
		const width  = this.boxW  > 0 ? this.boxW  : 0;
		const length = this.boxL  > 0 ? this.boxL  : 0;
		const height = this.boxH  > 0 ? this.boxH  : 0;
 
		if (this.animationFrameId !== null) {
			cancelAnimationFrame(this.animationFrameId);
			this.animationFrameId = null;
		}
 
		if (this.controls !== null) {
			this.controls.dispose();
			this.controls = null;
		}
 
		const maxDim = Math.max(width, length, height, 1);
 
		const scene = new THREE.Scene();
		scene.background = new THREE.Color(0x1a1a2e);
 
		const camera = new THREE.PerspectiveCamera(30, this.W / this.H, 0.1, 1000);
		camera.up.set(0, 0, 1);
		camera.position.set(maxDim * 2, -maxDim * 3, maxDim * 2);
		camera.lookAt(width / 2, length / 2, height / 2);
 
		this.controls = new OrbitControls(camera, this.renderer.domElement);
		this.controls.target.set(width / 2, length / 2, height / 2);
		camera.up.set(0, 0, 1);
		this.controls.update();
 
		const boxGeo = new THREE.BoxGeometry(
			Math.max(Math.abs(width),  0.001),
			Math.max(Math.abs(length), 0.001),
			Math.max(Math.abs(height), 0.001),
		);
		const boxMat = new THREE.MeshPhongMaterial({
			color: 0x4fc3f7,
			opacity: 0.18,
			transparent: true,
		});
		const box = new THREE.Mesh(boxGeo, boxMat);
		box.position.set(width / 2, length / 2, height / 2);
		scene.add(box);
 
		const wireframe = new THREE.LineSegments(
			new THREE.EdgesGeometry(boxGeo),
			new THREE.LineBasicMaterial({ color: 0xffffff, opacity: 0.5, transparent: true }),
		);
		wireframe.position.copy(box.position);
		scene.add(wireframe);
 
		const arrowLength = maxDim * 0.8;
		const headLength  = arrowLength * 0.2;
		const headWidth   = arrowLength * 0.15;
		const arrowDefs: [THREE.Vector3, number][] = [
			[new THREE.Vector3(1, 0, 0), 0xff4444],
			[new THREE.Vector3(0, 1, 0), 0x44ff44],
			[new THREE.Vector3(0, 0, 1), 0x4444ff],
		];
		for (const [dir, color] of arrowDefs) {
			scene.add(new THREE.ArrowHelper(
				dir,
				new THREE.Vector3(0, 0, 0),
				arrowLength,
				color,
				headLength,
				headWidth,
			));
		}
 
		const sphereR = maxDim * 0.06;
		for (let i = 0; i < 8; i++) {
			const pos = this.cornerPosition(i, width, length, height);
			const isSelected = i === this.selectedCorner;
			const radius = isSelected ? sphereR * 1.6 : sphereR;
 
			const geo = new THREE.SphereGeometry(radius, 14, 14);
			const mat = new THREE.MeshPhongMaterial({
				color: cornerThreeColor(i),
				shininess: 60,
			});
			const mesh = new THREE.Mesh(geo, mat);
			mesh.position.copy(pos);
			scene.add(mesh);
		}
 
		scene.add(new THREE.AmbientLight(0xffffff, 0.5));
		const dirLight = new THREE.DirectionalLight(0xffffff, 1);
		dirLight.position.set(maxDim * 3, maxDim * 3, maxDim * 3);
		scene.add(dirLight);
 
		const animate = () => {
			this.animationFrameId = requestAnimationFrame(animate);
			this.controls!.update();
			this.renderer.render(scene, camera);
		};
		animate();
	}
}

class RefObjMarker {
	private fileCache = new Map<string, File>();

	private videoA = new VideoState();
	private videoB = new VideoState();

	private activeVideo: 'a' | 'b' = 'a';
	private selectedCorner = 0;

    private widget: Ref3DWidget | null = null;
	private corner_btn: NodeListOf<HTMLButtonElement>;
	private vid_a_btn: HTMLButtonElement;
	private vid_b_btn: HTMLButtonElement;

    constructor() {
		setTimeout(() => {this.widget = new Ref3DWidget();}, 200);

		this.corner_btn = document.querySelectorAll<HTMLButtonElement>(".corner-btn")
		this.corner_btn.forEach(btn => {
			btn.addEventListener('click', () => {
				const idx = parseInt(btn.dataset.corner ?? '-1', 10);
				this.selectCorner(idx);
			});
		});
		this.vid_a_btn = document.getElementById("vid-btn-a") as HTMLButtonElement;
		this.vid_b_btn = document.getElementById("vid-btn-b") as HTMLButtonElement;
		this.vid_a_btn.addEventListener('click', () => this.selectVideo('a'));
		this.vid_b_btn.addEventListener('click', () => this.selectVideo('b'));
	}

	updateVideo(files: File[], frameTimestamps: number[][], trimStates: number[] | null[]) {
		const incoming = new Map<string, { file: File; timestamps: number[] }>();
		files.forEach((f, i) => {
			incoming.set(f.name, { file: f, timestamps: frameTimestamps[i] ?? [] });
		});
	}

	updateBoxDimensions(width: number | null, length: number | null, height: number | null) {
        this.widget!.setDimensions(width ?? 0, length ?? 0, height ?? 0);
    }

	private selectCorner(index: number): void {
		this.corner_btn.forEach(btn => {btn.classList.remove("selected")});
		this.corner_btn[index].classList.add("selected");

		this.selectedCorner = index;
		this.widget!.setSelectedCorner(index);
		// this.refVideo.selectedCorner = index;
	}

	private selectVideo(video: 'a' | 'b'): void {
		this.activeVideo = video;
		if (video === 'a') {
			this.vid_a_btn.classList.add("active");
			this.vid_b_btn.classList.remove("active");
		} else {
			this.vid_b_btn.classList.add("active");
			this.vid_a_btn.classList.remove("active");
		}
	}
}

export let refObjMarker = new RefObjMarker();