import { cx } from "../utils/cx.js";
import { jsx } from "react/jsx-runtime";
//#region src/theme/theme.tsx
/** Named accent hues from the holographic palette. Any hue in degrees works too. */
var accents = {
	cyan: 188,
	blue: 210,
	violet: 268,
	magenta: 322,
	green: 150,
	amber: 38
};
var hue = (a) => typeof a === "number" ? (a % 360 + 360) % 360 : accents[a];
/**
* Converts a theme config into the inline style that applies it. Pure and server-safe: use it on any element, or
* through the `Theme` component.
*/
function themeStyle(config = {}) {
	const style = {};
	if (config.accent !== void 0) style["--hm-accent-h"] = String(hue(config.accent));
	if (config.light !== void 0) style["--hm-light"] = String(Math.max(0, Math.min(1.5, config.light)));
	if (config.radius !== void 0) {
		const r = Math.max(0, config.radius);
		for (const [k, px] of [
			["sm", 6],
			["md", 8],
			["lg", 10],
			["xl", 12]
		]) style[`--hm-radius-${k}`] = `${Math.round(px * r * 10) / 10}px`;
	}
	if (config.vars) Object.assign(style, config.vars);
	return style;
}
/** The data attributes a theme config sets (color scheme, surface treatment and motion preference). */
function themeAttributes(config = {}) {
	return {
		"data-hm-scheme": config.scheme,
		"data-hm-surface": config.surface && config.surface !== "holo" ? config.surface : void 0,
		"data-hm-atmosphere": config.atmosphere && config.atmosphere !== "full" ? config.atmosphere : void 0,
		"data-hm-motion": config.motion && config.motion !== "system" ? config.motion : void 0
	};
}
/**
* Scopes Holominimal tokens to a subtree, optionally overriding them. Server-compatible: no hooks, no browser APIs.
* Nest themes to restyle a region (a different accent for one section, matte surfaces inside a table).
*/
function Theme({ theme, as: As = "div", base = true, className, style, children, ...rest }) {
	return /* @__PURE__ */ jsx(As, {
		...themeAttributes(theme),
		...rest,
		className: cx("hm-theme", base && "hm-root", className),
		style: {
			...themeStyle(theme),
			...style
		},
		children
	});
}
//#endregion
export { Theme, accents, themeAttributes, themeStyle };

//# sourceMappingURL=theme.js.map