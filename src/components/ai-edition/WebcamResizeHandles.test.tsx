// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { WebcamResizeHandles } from "./WebcamResizeHandles";

beforeAll(() => {
	// jsdom has no pointer capture.
	HTMLElement.prototype.setPointerCapture = vi.fn();
	HTMLElement.prototype.releasePointerCapture = vi.fn();
});

function mount(anchor: "bottom-left" | "bottom" = "bottom-left") {
	const onResize = vi.fn();
	const onResizeEnd = vi.fn();
	render(
		<WebcamResizeHandles
			style={{ position: "absolute" }}
			anchor={anchor}
			shape="rectangle"
			box={{ width: 180, height: 101.25 }}
			referenceDim={720}
			onResize={onResize}
			onResizeEnd={onResizeEnd}
		/>,
	);
	return { onResize, onResizeEnd };
}

function drag(handle: string, from: [number, number], to: [number, number]) {
	const el = screen.getByTestId(`webcam-handle-${handle}`);
	fireEvent.pointerDown(el, { pointerId: 1, clientX: from[0], clientY: from[1] });
	fireEvent.pointerMove(el, { pointerId: 1, clientX: to[0], clientY: to[1] });
	fireEvent.pointerUp(el, { pointerId: 1, clientX: to[0], clientY: to[1] });
}

describe("WebcamResizeHandles", () => {
	it("shows handles only on the sides the camera can grow from", () => {
		mount("bottom-left");
		expect(screen.getAllByTestId(/^webcam-handle-/).map((el) => el.dataset.handle)).toEqual([
			"n",
			"e",
			"ne",
		]);
	});

	it("reshapes the camera into a portrait box from its side edge", () => {
		const { onResize, onResizeEnd } = mount();
		drag("e", [500, 300], [500 + 101.25 * (9 / 16) - 180, 300]);
		const patch = onResize.mock.lastCall?.[0];
		expect(patch.webcamAspect).toBeCloseTo(9 / 16, 3);
		expect(onResizeEnd).toHaveBeenCalledTimes(1);
	});

	it("resizes the camera from a corner without changing its shape", () => {
		const { onResize } = mount();
		drag("ne", [500, 300], [518, 289.875]);
		expect(onResize.mock.lastCall?.[0]).toEqual({ webcamSizePreset: 28 });
	});
});
