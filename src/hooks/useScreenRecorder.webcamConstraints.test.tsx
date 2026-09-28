// @vitest-environment jsdom
import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/contexts/I18nContext", () => ({
	useScopedT: () => (key: string) => key,
}));

vi.mock("sonner", () => ({
	toast: { error: vi.fn(), success: vi.fn(), info: vi.fn(), warning: vi.fn() },
}));

import { useScreenRecorder } from "./useScreenRecorder";

type ElectronAPI = Window["electronAPI"];
type RecordingPrefs = Awaited<ReturnType<ElectronAPI["getRecordingPrefs"]>>;

const SOURCE = { id: "screen:0:0", name: "Screen 1", display_id: "1", thumbnail: "" };

function prefsWithCamera(camDeviceId: string | null): RecordingPrefs {
	return {
		micEnabled: false,
		micDeviceId: null,
		micDeviceName: null,
		camEnabled: true,
		camDeviceId,
		camDeviceName: camDeviceId ? "Camera" : null,
		systemAudioEnabled: false,
		cursorCaptureMode: "editable-overlay",
		hideDesktopIcons: false,
		autoZoomEnabled: true,
	};
}

function fakeCameraStream(deviceId: string): MediaStream {
	const track = {
		kind: "video",
		label: "Camera",
		onended: null,
		stop: vi.fn(),
		getSettings: () => ({ deviceId }),
	};
	return {
		getTracks: () => [track],
		getVideoTracks: () => [track],
	} as unknown as MediaStream;
}

const getUserMedia = vi.fn(async (constraints: MediaStreamConstraints) => {
	const video = constraints.video as MediaTrackConstraints;
	const deviceId = (video.deviceId as ConstrainDOMStringParameters | undefined)?.exact;
	return fakeCameraStream(typeof deviceId === "string" ? deviceId : "default");
});

function mountWith(prefs: RecordingPrefs) {
	window.electronAPI = {
		getRecordingPrefs: vi.fn(async () => prefs),
		onRecordingPrefsChanged: vi.fn(() => vi.fn()),
		getPlatform: vi.fn(() => "darwin"),
		getSelectedSource: vi.fn(async () => SOURCE),
	} as unknown as ElectronAPI;
	return renderHook(() => useScreenRecorder());
}

function cameraCalls() {
	return getUserMedia.mock.calls
		.map(([constraints]) => constraints)
		.filter((constraints) => constraints.video);
}

describe("useScreenRecorder webcam capture size", () => {
	beforeEach(() => {
		Object.defineProperty(global.navigator, "mediaDevices", {
			value: { getUserMedia },
			configurable: true,
		});
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	// Without a size Chromium opens every camera at 640x480, so a 1080p camera was
	// recorded at 640x480 and looked soft once the camera box grew past that.
	it("asks the saved camera for 1080p", async () => {
		mountWith(prefsWithCamera("cam-1"));
		await waitFor(() => expect(cameraCalls()).toHaveLength(1));
		expect(cameraCalls()[0]).toEqual({
			audio: false,
			video: {
				deviceId: { exact: "cam-1" },
				width: { ideal: 1920 },
				height: { ideal: 1080 },
				frameRate: { ideal: 30, max: 30 },
			},
		});
	});

	it("asks the default camera for 1080p when none is saved", async () => {
		mountWith(prefsWithCamera(null));
		await waitFor(() => expect(cameraCalls()).toHaveLength(1));
		expect(cameraCalls()[0]).toEqual({
			audio: false,
			video: {
				width: { ideal: 1920 },
				height: { ideal: 1080 },
				frameRate: { ideal: 30, max: 30 },
			},
		});
	});
});
