import { describe, expect, it } from "vitest";
import type { AxcutAsset, AxcutClip, AxcutDocument } from "@/lib/ai-edition/schema";
import { axcutSchemaVersion } from "@/lib/ai-edition/schema";
import { buildSceneDescription } from "./sceneDescription";

// One 1080p clip with a 1920x1080 camera, laid out picture-in-picture.
function sceneWith(legacyEditor: Record<string, unknown>) {
	const asset: AxcutAsset = {
		id: "a",
		kind: "video",
		label: "a",
		originalPath: "/a.mp4",
		video: { codec: "h264", width: 1920, height: 1080, fps: 30 },
		cameraTrack: {
			sourcePath: "/a-webcam.webm",
			startMs: 0,
			offsetMs: 0,
			visible: true,
			width: 1920,
			height: 1080,
		},
	} as AxcutAsset;
	const clip: AxcutClip = {
		id: "c1",
		assetId: "a",
		sourceStartSec: 0,
		sourceEndSec: 1,
		timelineStartSec: 0,
		timelineEndSec: 1,
		wordRefs: [],
		origin: "system",
		reason: "",
	} as AxcutClip;
	const createdAt = "2024-01-01T00:00:00.000Z";
	const doc = {
		schemaVersion: axcutSchemaVersion,
		project: { id: "p1", title: "Test", createdAt, updatedAt: createdAt, primaryAssetId: "a" },
		assets: [asset],
		transcript: null,
		transcripts: [],
		timeline: {
			clips: [clip],
			gaps: [],
			trimRanges: [],
			muteRanges: [],
			speedRanges: [],
			captionRanges: [],
		},
		annotations: [],
		zoomRanges: [],
		audioTracks: [],
		legacyEditor: { aspectRatio: "16:9", webcamSizePreset: 40, ...legacyEditor },
	} as AxcutDocument;
	return buildSceneDescription(doc);
}

function pixelAspect(scene: ReturnType<typeof buildSceneDescription>) {
	const rect = scene.layout.webcamRect;
	if (!rect) throw new Error("no webcam rect");
	return (rect.width * scene.output.width) / (rect.height * scene.output.height);
}

describe("buildSceneDescription: the shaped camera box reaches the compositor", () => {
	it("sends the camera's own 16:9 when no proportion is set", () => {
		expect(pixelAspect(sceneWith({}))).toBeCloseTo(16 / 9, 2);
	});

	it("sends a 9:16 box for the portrait shape", () => {
		expect(pixelAspect(sceneWith({ webcamAspect: 9 / 16 }))).toBeCloseTo(9 / 16, 2);
	});

	it("sends a custom proportion as it is", () => {
		expect(pixelAspect(sceneWith({ webcamAspect: 0.75 }))).toBeCloseTo(0.75, 2);
	});
});
