import { describe, expect, it } from "vitest";
import { resizeWebcamBox, webcamResizeHandles } from "./webcamBoxResize";

// A 16:9 camera at 25% of a 720 px tall preview: long side 180 px.
const box169 = { width: 180, height: 101.25 };
const REF = 720;

describe("webcamResizeHandles", () => {
	it("puts handles only on the sides a corner-snapped camera can grow from", () => {
		expect(webcamResizeHandles("bottom-left")).toEqual(["n", "e", "ne"]);
		expect(webcamResizeHandles("top-right")).toEqual(["s", "w", "sw"]);
	});

	it("gives a camera centred on an axis handles on both of its sides", () => {
		expect(webcamResizeHandles("bottom")).toEqual(["n", "w", "e", "nw", "ne"]);
		expect(webcamResizeHandles("right")).toEqual(["n", "s", "w", "nw", "sw"]);
	});
});

describe("resizeWebcamBox", () => {
	it("scales from a corner and keeps the proportions", () => {
		// 10% out along the diagonal: the long side goes from 180 to 198, 27.5% of 720.
		const patch = resizeWebcamBox({
			handle: "ne",
			anchor: "bottom-left",
			box: box169,
			referenceDim: REF,
			delta: { dx: 18, dy: -10.125 },
			shape: "rectangle",
		});
		expect(patch).toEqual({ webcamSizePreset: 28 });
		expect(patch).not.toHaveProperty("webcamAspect");
	});

	it("shrinks from a corner dragged inwards", () => {
		const patch = resizeWebcamBox({
			handle: "ne",
			anchor: "bottom-left",
			box: box169,
			referenceDim: REF,
			delta: { dx: -36, dy: 20.25 },
			shape: "rectangle",
		});
		expect(patch.webcamSizePreset).toBe(20);
	});

	it("narrows a landscape camera into a 9:16 portrait from its side edge", () => {
		// The height stays 101.25 px; the width follows the pointer to 101.25 * 9/16.
		const patch = resizeWebcamBox({
			handle: "e",
			anchor: "bottom-left",
			box: box169,
			referenceDim: REF,
			delta: { dx: 101.25 * (9 / 16) - 180, dy: 0 },
			shape: "rectangle",
		});
		expect(patch.webcamAspect).toBeCloseTo(9 / 16, 3);
		// The long side is now the height, 101.25 px: 14.06% of 720, held to the 15 minimum.
		expect(patch.webcamSizePreset).toBe(15);
		expect(patch).not.toHaveProperty("webcamMaskShape");
	});

	it("holds the proportions to 1:2 and 2:1", () => {
		const narrow = resizeWebcamBox({
			handle: "w",
			anchor: "bottom-right",
			box: box169,
			referenceDim: REF,
			delta: { dx: 400, dy: 0 },
			shape: "rectangle",
		});
		expect(narrow.webcamAspect).toBe(0.5);
		const wide = resizeWebcamBox({
			handle: "n",
			anchor: "bottom-right",
			box: box169,
			referenceDim: REF,
			delta: { dx: 0, dy: 90 },
			shape: "rectangle",
		});
		expect(wide.webcamAspect).toBe(2);
	});

	it("grows a camera centred on the axis by twice the pointer's travel", () => {
		// Anchored bottom-centre, the right edge moves 10 px and the left edge 10 px with it.
		const patch = resizeWebcamBox({
			handle: "e",
			anchor: "bottom",
			box: { width: 100, height: 100 },
			referenceDim: REF,
			delta: { dx: 10, dy: 0 },
			shape: "rectangle",
		});
		expect(patch.webcamAspect).toBe(1.2);
	});

	it("turns a square camera into a shaped rectangle when an edge is dragged", () => {
		const patch = resizeWebcamBox({
			handle: "n",
			anchor: "bottom-left",
			box: { width: 180, height: 180 },
			referenceDim: REF,
			delta: { dx: 0, dy: -90 },
			shape: "square",
		});
		expect(patch).toEqual({
			webcamSizePreset: 38,
			webcamAspect: 0.667,
			webcamMaskShape: "rectangle",
		});
	});

	it("keeps the size inside the slider's 15 to 50 range", () => {
		const big = resizeWebcamBox({
			handle: "ne",
			anchor: "bottom-left",
			box: box169,
			referenceDim: REF,
			delta: { dx: 2000, dy: -2000 },
			shape: "rectangle",
		});
		expect(big.webcamSizePreset).toBe(50);
		const small = resizeWebcamBox({
			handle: "ne",
			anchor: "bottom-left",
			box: box169,
			referenceDim: REF,
			delta: { dx: -170, dy: 95 },
			shape: "rectangle",
		});
		expect(small.webcamSizePreset).toBe(15);
	});
});
