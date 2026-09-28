import { useEffect, useRef, useState } from "react";
import { webcamVideoConstraints } from "@/lib/webcamCaptureConstraints";

export interface CameraPreviewStreamOptions {
	enabled: boolean;
	deviceId?: string;
}

/**
 * Opens a live getUserMedia video stream for a webcam preview — separate
 * from the recorder's own capture stream (useScreenRecorder keeps that in a
 * private ref), so this is safe to mount anywhere that just wants to *show*
 * the camera is working, not record it.
 *
 * It still asks for the recorder's size: Chromium shares one capture per camera,
 * so a preview opened at the 640x480 default would pin the recording to it too.
 */
export function useCameraPreviewStream({ enabled, deviceId }: CameraPreviewStreamOptions) {
	const [stream, setStream] = useState<MediaStream | null>(null);
	const [error, setError] = useState<string | null>(null);
	const streamRef = useRef<MediaStream | null>(null);

	useEffect(() => {
		if (!enabled) {
			streamRef.current?.getTracks().forEach((track) => track.stop());
			streamRef.current = null;
			setStream(null);
			setError(null);
			return;
		}

		let cancelled = false;
		navigator.mediaDevices
			.getUserMedia({
				video: webcamVideoConstraints(deviceId),
				audio: false,
			})
			.then((s) => {
				if (cancelled) {
					s.getTracks().forEach((track) => track.stop());
					return;
				}
				streamRef.current = s;
				setStream(s);
				setError(null);
			})
			.catch((err) => {
				if (cancelled) return;
				setStream(null);
				setError(err instanceof Error ? err.message : String(err));
			});

		return () => {
			cancelled = true;
			streamRef.current?.getTracks().forEach((track) => track.stop());
			streamRef.current = null;
		};
	}, [enabled, deviceId]);

	return { stream, error };
}
