/**
 * What the app asks a webcam for, shared by the recorder and the device-settings preview.
 *
 * Without a width and height, Chromium opens every camera at its 640x480 default, whatever
 * the hardware can do, so a 1080p camera was recorded at 640x480 and looked soft once the
 * camera box grew past that (a large picture-in-picture, Full Camera, a 1440p or 4K export).
 * The size is `ideal`, never `exact` or `min`: a camera that cannot reach it opens at the
 * nearest mode it has instead of failing with an OverconstrainedError.
 *
 * The preview must ask for the same size. Chromium shares one capture per camera, and a
 * source already running at 640x480 satisfies a later `ideal: 1920x1080` request as it is,
 * so a preview opened first at the default would pin the recording to 640x480.
 */
export const WEBCAM_TARGET_WIDTH = 1920;
export const WEBCAM_TARGET_HEIGHT = 1080;
export const WEBCAM_TARGET_FRAME_RATE = 30;

export function webcamVideoConstraints(deviceId?: string): MediaTrackConstraints {
	return {
		...(deviceId ? { deviceId: { exact: deviceId } } : {}),
		width: { ideal: WEBCAM_TARGET_WIDTH },
		height: { ideal: WEBCAM_TARGET_HEIGHT },
		frameRate: { ideal: WEBCAM_TARGET_FRAME_RATE, max: WEBCAM_TARGET_FRAME_RATE },
	};
}
