// Resize handles on the picture-in-picture camera in the preview. A sibling of the webcam
// slot rather than a child: the slot clips to the camera's rect, and a handle sits half
// outside it. The layer itself lets the pointer through, so moving the camera by its middle
// still reaches the slot's drag underneath; only the handles take the pointer.
//
// What a drag does to the settings is `resizeWebcamBox`; this only feeds it the pointer's
// travel and the box as it stood when the drag began.

import type { CSSProperties, PointerEvent as ReactPointerEvent } from "react";
import { useState } from "react";
import type { WebcamAnchor } from "@/lib/projectDefaults";
import {
	resizeWebcamBox,
	type WebcamBoxResizePatch,
	type WebcamResizeHandle,
	webcamResizeHandles,
} from "@/lib/webcamBoxResize";
import styles from "./NewEditorShell.module.css";

interface WebcamResizeHandlesProps {
	/** Positions the layer exactly over the camera, like the slot's own style. */
	style: CSSProperties;
	anchor: WebcamAnchor;
	shape: "rectangle" | "square";
	/** The camera's size and the frame's short side, in the preview's CSS pixels, now. */
	box: { width: number; height: number };
	referenceDim: number;
	onResize: (patch: WebcamBoxResizePatch) => void;
	onResizeEnd: () => void;
}

export function WebcamResizeHandles(props: WebcamResizeHandlesProps) {
	const [active, setActive] = useState<WebcamResizeHandle | null>(null);

	const begin = (handle: WebcamResizeHandle, event: ReactPointerEvent<HTMLDivElement>) => {
		event.preventDefault();
		event.stopPropagation();
		const target = event.currentTarget;
		target.setPointerCapture(event.pointerId);
		const start = { x: event.clientX, y: event.clientY };
		// Frozen at the start: the box re-lays out under the pointer on every move.
		const { anchor, shape, box, referenceDim } = props;
		setActive(handle);

		const move = (e: PointerEvent) => {
			props.onResize(
				resizeWebcamBox({
					handle,
					anchor,
					box,
					referenceDim,
					delta: { dx: e.clientX - start.x, dy: e.clientY - start.y },
					shape,
				}),
			);
		};
		const end = () => {
			target.removeEventListener("pointermove", move);
			target.removeEventListener("pointerup", end);
			target.removeEventListener("pointercancel", end);
			try {
				target.releasePointerCapture(event.pointerId);
			} catch {
				// pointer already released
			}
			setActive(null);
			props.onResizeEnd();
		};
		target.addEventListener("pointermove", move);
		target.addEventListener("pointerup", end);
		target.addEventListener("pointercancel", end);
	};

	return (
		<div
			className={styles.webcamHandles}
			style={props.style}
			data-active={active ? "true" : undefined}
			// Pointer-only: the camera's size and shape are in the Camera layout pane for everyone.
			aria-hidden="true"
		>
			{webcamResizeHandles(props.anchor).map((handle) => (
				<div
					key={handle}
					className={styles.webcamHandle}
					data-handle={handle}
					data-testid={`webcam-handle-${handle}`}
					onPointerDown={(event) => begin(handle, event)}
				/>
			))}
		</div>
	);
}
