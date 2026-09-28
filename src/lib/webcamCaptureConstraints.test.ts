import { describe, expect, it } from "vitest";
import {
	WEBCAM_TARGET_FRAME_RATE,
	WEBCAM_TARGET_HEIGHT,
	WEBCAM_TARGET_WIDTH,
	webcamVideoConstraints,
} from "./webcamCaptureConstraints";

describe("webcamVideoConstraints", () => {
	it("asks for 1080p at 30 fps instead of Chromium's 640x480 default", () => {
		expect(WEBCAM_TARGET_WIDTH).toBe(1920);
		expect(WEBCAM_TARGET_HEIGHT).toBe(1080);
		expect(WEBCAM_TARGET_FRAME_RATE).toBe(30);
		expect(webcamVideoConstraints()).toEqual({
			width: { ideal: 1920 },
			height: { ideal: 1080 },
			frameRate: { ideal: 30, max: 30 },
		});
	});

	it("pins the chosen camera exactly", () => {
		expect(webcamVideoConstraints("cam-1")).toEqual({
			deviceId: { exact: "cam-1" },
			width: { ideal: 1920 },
			height: { ideal: 1080 },
			frameRate: { ideal: 30, max: 30 },
		});
	});

	it("leaves the device open when none is chosen", () => {
		expect(webcamVideoConstraints()).not.toHaveProperty("deviceId");
		expect(webcamVideoConstraints("")).not.toHaveProperty("deviceId");
	});

	it("never makes the size a hard requirement, so a smaller camera still opens", () => {
		const { width, height } = webcamVideoConstraints("cam-1");
		for (const size of [width, height]) {
			expect(size).not.toHaveProperty("exact");
			expect(size).not.toHaveProperty("min");
			expect(size).not.toHaveProperty("max");
		}
	});
});
