import { describe, expect, it } from "vitest";
import { computeCompositeLayout } from "./compositeLayout";

// A 1080p frame and a 16:9 camera at 40%: the camera's long side is 40% of 1080, 432 px.
function pip(webcamAspect: number | null, overrides: Record<string, unknown> = {}) {
	return computeCompositeLayout({
		canvasSize: { width: 1920, height: 1080 },
		screenSize: { width: 3024, height: 1964 },
		webcamSize: { width: 1920, height: 1080 },
		layoutPreset: "picture-in-picture",
		webcamSizePreset: 40,
		webcamAnchor: "bottom-left",
		webcamMaskShape: "rectangle",
		webcamAspect,
		...overrides,
	})?.webcamRect;
}

describe("computeCompositeLayout with webcamAspect", () => {
	it("keeps the camera's own proportions when no aspect is set", () => {
		expect(pip(null)).toMatchObject({ width: 432, height: 243 });
	});

	it("lays a 9:16 portrait box out with the same long side", () => {
		expect(pip(9 / 16)).toMatchObject({ width: 243, height: 432 });
	});

	it("lays any proportion out inside the same long side", () => {
		expect(pip(0.75)).toMatchObject({ width: 324, height: 432 });
		expect(pip(1)).toMatchObject({ width: 432, height: 432 });
		expect(pip(2)).toMatchObject({ width: 432, height: 216 });
	});

	it("holds a stored proportion to 1:2 and 2:1", () => {
		expect(pip(0.1)).toMatchObject({ width: 216, height: 432 });
		expect(pip(9)).toMatchObject({ width: 432, height: 216 });
	});

	it("keeps the camera snapped to its anchor whatever its shape", () => {
		const portrait = pip(9 / 16);
		const own = pip(null);
		// Bottom-left: same left margin, same bottom edge.
		expect(portrait?.x).toBe(own?.x);
		expect((portrait?.y ?? 0) + (portrait?.height ?? 0)).toBe((own?.y ?? 0) + (own?.height ?? 0));
	});

	it("leaves a square camera square", () => {
		expect(pip(9 / 16, { webcamMaskShape: "square" })).toMatchObject({ width: 243, height: 243 });
	});

	it("ignores the aspect in the block layouts, which size the camera off the screen", () => {
		const shaped = computeCompositeLayout({
			canvasSize: { width: 1920, height: 1080 },
			screenSize: { width: 3024, height: 1964 },
			webcamSize: { width: 1920, height: 1080 },
			layoutPreset: "dual-frame",
			webcamAspect: 9 / 16,
		});
		const plain = computeCompositeLayout({
			canvasSize: { width: 1920, height: 1080 },
			screenSize: { width: 3024, height: 1964 },
			webcamSize: { width: 1920, height: 1080 },
			layoutPreset: "dual-frame",
		});
		expect(shaped?.webcamRect).toEqual(plain?.webcamRect);
	});
});
