import { describe, expect, it } from "vitest";
import { type AxcutDocument, axcutSchemaVersion } from "../schema";
import { getEditorSettings, patchEditorSettings } from "./editorSettings";

function docWith(legacyEditor: Record<string, unknown> | null): AxcutDocument {
	const createdAt = "2024-01-01T00:00:00.000Z";
	return {
		schemaVersion: axcutSchemaVersion,
		project: { id: "p1", title: "Test", createdAt, updatedAt: createdAt },
		assets: [],
		transcript: null,
		transcripts: [],
		timeline: {
			clips: [],
			gaps: [],
			trimRanges: [],
			muteRanges: [],
			speedRanges: [],
			captionRanges: [],
		},
		annotations: [],
		zoomRanges: [],
		audioTracks: [],
		legacyEditor,
	} as AxcutDocument;
}

describe("editor settings: webcamAspect", () => {
	it("follows the camera's own proportions in a project that never set one", () => {
		expect(getEditorSettings(docWith(null)).webcamAspect).toBeNull();
		expect(getEditorSettings(docWith({ webcamMaskShape: "rectangle" })).webcamAspect).toBeNull();
	});

	it("reads a stored proportion", () => {
		expect(getEditorSettings(docWith({ webcamAspect: 0.5625 })).webcamAspect).toBe(0.5625);
	});

	it("holds a stored proportion to 1:2 and 2:1", () => {
		expect(getEditorSettings(docWith({ webcamAspect: 0.2 })).webcamAspect).toBe(0.5);
		expect(getEditorSettings(docWith({ webcamAspect: 10 })).webcamAspect).toBe(2);
	});

	it("reads anything but a finite number as the camera's own proportions", () => {
		for (const bad of ["tall", Number.NaN, true, {}]) {
			expect(getEditorSettings(docWith({ webcamAspect: bad })).webcamAspect).toBeNull();
		}
	});

	it("gives a square camera no proportion, whatever is stored", () => {
		const settings = getEditorSettings(
			docWith({ webcamMaskShape: "square", webcamAspect: 0.5625 }),
		);
		expect(settings.webcamMaskShape).toBe("square");
		expect(settings.webcamAspect).toBeNull();
	});

	it("stores a proportion and clears it back to the camera's own", () => {
		const shaped = patchEditorSettings(docWith(null), { webcamAspect: 0.75 });
		expect(getEditorSettings(shaped).webcamAspect).toBe(0.75);
		const cleared = patchEditorSettings(shaped, { webcamAspect: null });
		expect(getEditorSettings(cleared).webcamAspect).toBeNull();
		// A patch that leaves it out leaves it alone.
		const untouched = patchEditorSettings(shaped, { webcamSizePreset: 30 });
		expect(getEditorSettings(untouched).webcamAspect).toBe(0.75);
	});
});
