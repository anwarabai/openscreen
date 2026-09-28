import { describe, expect, it } from "vitest";
import { DEFAULT_EDITOR_SETTINGS } from "./store/editorSettings";
import {
	parseStylePresetAppearance,
	parseStylePresetFile,
	serializeStylePresetFile,
} from "./stylePresets";
import { stylePresetAppearanceFromSettings, stylePresetPatch } from "./stylePresetsEditor";

function appearanceJson(overrides: Record<string, unknown> = {}) {
	const appearance = stylePresetAppearanceFromSettings(
		DEFAULT_EDITOR_SETTINGS,
	) as unknown as Record<string, unknown>;
	return { ...appearance, ...overrides };
}

describe("style presets: webcamAspect", () => {
	it("saves and restores a portrait camera box", () => {
		const appearance = parseStylePresetAppearance(appearanceJson({ webcamAspect: 9 / 16 }));
		expect(appearance.webcamAspect).toBe(9 / 16);
		const file = serializeStylePresetFile({ name: "Tall", appearance });
		expect(parseStylePresetFile(JSON.parse(file)).appearance.webcamAspect).toBe(9 / 16);
		expect(stylePresetPatch(appearance)).toMatchObject({ webcamAspect: 9 / 16 });
	});

	it("carries the setting from the editor into a new preset", () => {
		const appearance = stylePresetAppearanceFromSettings({
			...DEFAULT_EDITOR_SETTINGS,
			webcamAspect: 0.75,
		});
		expect(appearance.webcamAspect).toBe(0.75);
	});

	it("reads a preset saved before the box could be shaped as the camera's own proportions", () => {
		const { webcamAspect: _omitted, ...old } = appearanceJson();
		expect(parseStylePresetAppearance(old).webcamAspect).toBeNull();
		// Applying it puts a shaped project back to the camera's own proportions.
		expect(stylePresetPatch(parseStylePresetAppearance(old))).toMatchObject({
			webcamAspect: null,
		});
	});

	it("holds the proportion to its bound and refuses a value that is not a number", () => {
		expect(parseStylePresetAppearance(appearanceJson({ webcamAspect: 5 })).webcamAspect).toBe(2);
		expect(() => parseStylePresetAppearance(appearanceJson({ webcamAspect: "tall" }))).toThrow(
			/webcamAspect/,
		);
	});
});
