export class Point3D {
    x: number;
    y: number;
    z: number;

    constructor(x: number, y: number, z: number) {
        this.x = x;
        this.y = y;
        this.z = z;
    }

    toString(): string {
        return `Point3D: x=${this.x}, y=${this.y}, z=${this.z}`;
    }
}

export class Point2D {
    x: number;
    y: number;

    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }

    public static distanceBetween(p1: Point2D, p2: Point2D): number {
        return Math.hypot((p1.x - p2.x), (p1.y - p2.y));
    }

    toString(): string {
        const xStr = this.x === undefined ? 'uninitialized' : String(this.x);
        const yStr = this.y === undefined ? 'uninitialized' : String(this.y);
        return `Point2D: x=${xStr}, y=${yStr}`;
    }
}