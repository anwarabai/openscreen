// @vitest-environment jsdom
import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useCameraPreviewStream } from "./useCameraPreviewStream";

const stopTrack = vi.fn();
const fakeStream = { getTracks: () => [{ stop: stopTrack }] } as unknown as MediaStream;
const getUserMedia = vi.fn(async () => fakeStream);

describe("useCameraPreviewStream", () => {
	beforeEach(() => {
		Object.defineProperty(global.navigator, "mediaDevices", {
			value: { getUserMedia },
			configurable: true,
		});
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	// The recorder asks for 1080p. Chromium shares one capture per camera, so a preview
	// opened at the 640x480 default first would hold the recording at 640x480 as well.
	it("asks the chosen camera for the recorder's 1080p, not the 640x480 default", async () => {
		const { result } = renderHook(() =>
			useCameraPreviewStream({ enabled: true, deviceId: "cam-1" }),
		);
		await waitFor(() => expect(result.current.stream).toBe(fakeStream));
		expect(getUserMedia).toHaveBeenCalledTimes(1);
		expect(getUserMedia).toHaveBeenCalledWith({
			audio: false,
			video: {
				deviceId: { exact: "cam-1" },
				width: { ideal: 1920 },
				height: { ideal: 1080 },
				frameRate: { ideal: 30, max: 30 },
			},
		});
	});

	it("asks the default camera for 1080p when none is chosen", async () => {
		const { result } = renderHook(() => useCameraPreviewStream({ enabled: true }));
		await waitFor(() => expect(result.current.stream).toBe(fakeStream));
		expect(getUserMedia).toHaveBeenCalledWith({
			audio: false,
			video: {
				width: { ideal: 1920 },
				height: { ideal: 1080 },
				frameRate: { ideal: 30, max: 30 },
			},
		});
	});

	it("opens nothing while disabled", () => {
		renderHook(() => useCameraPreviewStream({ enabled: false, deviceId: "cam-1" }));
		expect(getUserMedia).not.toHaveBeenCalled();
	});
});
