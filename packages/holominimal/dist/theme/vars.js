//#region src/theme/vars.ts
/**
* Typed references to the CSS tokens, for inline styles and charts: `style={{ color: vars.color.muted }}`.
* Values live in tokens.css; this only names them, so the two can never disagree about a value.
*/
var v = (name) => `var(--hm-${name})`;
var vars = {
	color: {
		bg: v("bg"),
		surface: v("surface"),
		surfaceRaised: v("surface-raised"),
		surfaceOverlay: v("surface-overlay"),
		surfaceSelected: v("surface-selected"),
		fg: v("fg"),
		fgStrong: v("fg-strong"),
		muted: v("muted"),
		dim: v("dim"),
		faint: v("faint"),
		line: v("line"),
		lineStrong: v("line-strong"),
		lineHover: v("line-hover"),
		accent: v("accent"),
		accentSoft: v("accent-soft"),
		success: v("success"),
		warning: v("warning"),
		danger: v("danger"),
		info: v("info")
	},
	holo: {
		cyan: "hsl(var(--hm-cyan))",
		blue: "hsl(var(--hm-blue))",
		violet: "hsl(var(--hm-violet))",
		magenta: "hsl(var(--hm-magenta))",
		iridescence: v("iridescence")
	},
	space: {
		1: v("space-1"),
		2: v("space-2"),
		3: v("space-3"),
		4: v("space-4"),
		5: v("space-5"),
		6: v("space-6"),
		7: v("space-7"),
		8: v("space-8"),
		9: v("space-9")
	},
	radius: {
		sm: v("radius-sm"),
		md: v("radius-md"),
		lg: v("radius-lg"),
		xl: v("radius-xl"),
		pill: v("radius-pill")
	},
	motion: {
		glide: v("ease-glide"),
		pour: v("ease-pour"),
		fast: v("dur-fast"),
		base: v("dur-base"),
		slow: v("dur-slow"),
		scene: v("dur-scene")
	}
};
//#endregion
export { vars };

//# sourceMappingURL=vars.js.map