import { clampToBound, type WebcamAnchor, webcamAnchorFractions } from "@/lib/projectDefaults";

/**
 * The resize handles on the picture-in-picture camera, and what dragging one does to the two
 * settings that size it: `webcamSizePreset` (its long side, in percent of the frame's short
 * side) and `webcamAspect` (its width over height).
 *
 * The camera stays snapped to its anchor, so a side pinned against the frame has no handle:
 * a camera in the bottom-left corner grows up and to the right, from the top edge, the right
 * edge and the top-right corner. An anchor centred on an axis grows both ways at once, so a
 * drag there moves each side by the pointer's distance and the box grows by twice it.
 *
 * A corner keeps the proportions and changes the size. An edge changes the proportions: the
 * dragged dimension follows the pointer, the other one stays, and a square camera becomes a
 * shaped rectangle.
 */
export type WebcamResizeHandle = "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw";

export interface WebcamBoxResizePatch {
	webcamSizePreset: number;
	webcamAspect?: number;
	webcamMaskShape?: "rectangle";
}

interface AxisFreedom {
	/** Sides that can move on this axis: -1 the start side (left/top), +1 the end side. */
	sides: Array<-1 | 1>;
	/** 2 when the anchor centres the camera on this axis, so both sides move at once. */
	growth: 1 | 2;
}

function axisFreedom(anchorFraction: number): AxisFreedom {
	if (anchorFraction === 0) return { sides: [1], growth: 1 };
	if (anchorFraction === 1) return { sides: [-1], growth: 1 };
	return { sides: [-1, 1], growth: 2 };
}

const HORIZONTAL: Record<-1 | 1, "w" | "e"> = { [-1]: "w", 1: "e" };
const VERTICAL: Record<-1 | 1, "n" | "s"> = { [-1]: "n", 1: "s" };

/** The handles a camera at this anchor shows: edges and corners on its free sides only. */
export function webcamResizeHandles(anchor: WebcamAnchor): WebcamResizeHandle[] {
	const [fx, fy] = webcamAnchorFractions(anchor);
	const x = axisFreedom(fx).sides.map((s) => HORIZONTAL[s]);
	const y = axisFreedom(fy).sides.map((s) => VERTICAL[s]);
	const corners = y.flatMap((v) => x.map((h) => `${v}${h}` as WebcamResizeHandle));
	return [...y, ...x, ...corners];
}

function handleAxes(handle: WebcamResizeHandle): { x: -1 | 0 | 1; y: -1 | 0 | 1 } {
	return {
		x: handle.includes("e") ? 1 : handle.includes("w") ? -1 : 0,
		y: handle.includes("s") ? 1 : handle.includes("n") ? -1 : 0,
	};
}

/**
 * The settings a handle drag asks for.
 *
 * `box` is the camera's size and `referenceDim` the frame's short side, both in the same units
 * as `delta`, the pointer's travel since the drag began (the preview's CSS pixels). Measured
 * from the box at the start of the drag, so the result does not drift over a long drag.
 */
export function resizeWebcamBox(params: {
	handle: WebcamResizeHandle;
	anchor: WebcamAnchor;
	box: { width: number; height: number };
	referenceDim: number;
	delta: { dx: number; dy: number };
	shape: "rectangle" | "square";
}): WebcamBoxResizePatch {
	const { handle, anchor, box, referenceDim, delta, shape } = params;
	const [fx, fy] = webcamAnchorFractions(anchor);
	const gx = axisFreedom(fx).growth;
	const gy = axisFreedom(fy).growth;
	const axes = handleAxes(handle);
	// How much each dimension would grow if it followed the pointer.
	const growW = axes.x * delta.dx * gx;
	const growH = axes.y * delta.dy * gy;

	const sizeFor = (longSide: number) =>
		Math.round(clampToBound((longSide / referenceDim) * 100, "webcamSizePreset"));

	if (axes.x !== 0 && axes.y !== 0) {
		// A corner scales along the box's own diagonal: the projection of the travel onto it, so
		// the proportions hold and the drag reads the same whichever way it leans.
		const scale = 1 + (growW * box.width + growH * box.height) / (box.width ** 2 + box.height ** 2);
		return { webcamSizePreset: sizeFor(Math.max(box.width, box.height) * scale) };
	}

	let width = axes.x !== 0 ? box.width + growW : box.width;
	let height = axes.y !== 0 ? box.height + growH : box.height;
	width = Math.max(1, width);
	height = Math.max(1, height);
	const aspect = clampToBound(width / height, "webcamAspect");
	// The dimension that did not move is kept, and the dragged one is held to the bound.
	if (axes.x !== 0) width = height * aspect;
	else height = width / aspect;
	const longSide = Math.max(width, height);
	return {
		webcamSizePreset: sizeFor(longSide),
		webcamAspect: Math.round(aspect * 1000) / 1000,
		...(shape === "square" ? { webcamMaskShape: "rectangle" as const } : {}),
	};
}
