import { cx } from "../utils/cx.js";
import { jsx } from "react/jsx-runtime";
//#region src/components/primitives.tsx
var space = (s) => s === void 0 ? void 0 : typeof s === "number" ? s === 0 ? "0" : `var(--hm-space-${s})` : s;
function spacing({ p, px, py, m, mx, my }, style, extra = {}) {
	const s = { ...extra };
	if (p !== void 0) s.padding = space(p);
	if (px !== void 0) s.paddingInline = space(px);
	if (py !== void 0) s.paddingBlock = space(py);
	if (m !== void 0) s.margin = space(m);
	if (mx !== void 0) s.marginInline = space(mx);
	if (my !== void 0) s.marginBlock = space(my);
	for (const k of Object.keys(s)) if (s[k] === void 0) delete s[k];
	return {
		...s,
		...style
	};
}
var spacingKeys = [
	"p",
	"px",
	"py",
	"m",
	"mx",
	"my"
];
function split(props) {
	const sp = {};
	const rest = { ...props };
	for (const k of spacingKeys) if (k in rest) {
		sp[k] = rest[k];
		delete rest[k];
	}
	return [sp, rest];
}
/** The plain building block: any element, with spacing shorthands and a radius from the scale. */
function Box({ as: As = "div", radius, className, style, ...props }) {
	const [sp, rest] = split(props);
	return /* @__PURE__ */ jsx(As, {
		...rest,
		className: cx("hm-box", className),
		"data-radius": radius,
		style: spacing(sp, style)
	});
}
/** Children in a column with one gap between them. */
function Stack({ as: As = "div", gap, align, justify, className, style, ...props }) {
	const [sp, rest] = split(props);
	return /* @__PURE__ */ jsx(As, {
		...rest,
		className: cx("hm-stack", className),
		"data-align": align,
		"data-justify": justify,
		style: spacing(sp, style, { "--hm-stack-gap": space(gap) })
	});
}
/** Children in a row that wraps, with one gap between them. */
function Inline({ as: As = "div", gap, align, justify, wrap = true, className, style, ...props }) {
	const [sp, rest] = split(props);
	return /* @__PURE__ */ jsx(As, {
		...rest,
		className: cx("hm-cluster", className),
		"data-align": align,
		"data-justify": justify,
		"data-nowrap": wrap ? void 0 : "",
		style: spacing(sp, style, { "--hm-cluster-gap": space(gap) })
	});
}
/** A responsive grid: fixed `columns`, or auto-fit tracks no narrower than `min`. */
function Grid({ as: As = "div", columns, min, gap, rowGap, className, style, ...props }) {
	const [sp, rest] = split(props);
	const g = space(gap);
	const rg = space(rowGap);
	return /* @__PURE__ */ jsx(As, {
		...rest,
		className: cx("hm-grid", className),
		"data-columns": columns ? "" : void 0,
		style: spacing(sp, style, {
			"--hm-grid-min": min,
			"--hm-grid-cols": columns ? String(columns) : void 0,
			"--hm-grid-gap": g ? rg ? `${rg} ${g}` : g : rg ? `${rg} var(--hm-space-6)` : void 0
		})
	});
}
/** A centered column with a maximum width and side gutters. */
function Container({ as: As = "div", size = "lg", className, style, ...props }) {
	const [sp, rest] = split(props);
	return /* @__PURE__ */ jsx(As, {
		...rest,
		className: cx("hm-container", className),
		"data-size": size,
		style: spacing(sp, style)
	});
}
/** Fills the free space in a flex row or column (or sets a fixed `size`). */
function Spacer({ size, className, style, ...rest }) {
	return /* @__PURE__ */ jsx("span", {
		"aria-hidden": "true",
		...rest,
		className: cx("hm-spacer", className),
		style: size !== void 0 ? {
			flex: "none",
			inlineSize: space(size),
			blockSize: space(size),
			...style
		} : style
	});
}
/** Centers its children on both axes. */
function Center({ as: As = "div", className, style, ...props }) {
	const [sp, rest] = split(props);
	return /* @__PURE__ */ jsx(As, {
		...rest,
		className: cx("hm-center", className),
		style: spacing(sp, style)
	});
}
/** Keeps a box at a fixed ratio, such as `16 / 9`. */
function AspectRatio({ ratio = "16 / 9", className, style, ...rest }) {
	return /* @__PURE__ */ jsx("div", {
		...rest,
		className: cx("hm-aspect", className),
		style: {
			aspectRatio: String(ratio),
			...style
		}
	});
}
/** Content for screen readers only. */
function VisuallyHidden({ as: As = "span", className, ...rest }) {
	return /* @__PURE__ */ jsx(As, {
		...rest,
		className: cx("hm-sr-only", className)
	});
}
/** Text on the type scale and the text-color tokens. A `p` by default. */
function Text({ as: As = "p", size, tone, weight, align, truncate, mono, eyebrow, className, ...rest }) {
	return /* @__PURE__ */ jsx(As, {
		...rest,
		className: cx("hm-text", className),
		"data-size": size,
		"data-tone": tone,
		"data-weight": weight,
		"data-align": align,
		"data-truncate": truncate ? "" : void 0,
		"data-mono": mono ? "" : void 0,
		"data-eyebrow": eyebrow ? "" : void 0
	});
}
var headingSize = {
	1: "3xl",
	2: "2xl",
	3: "xl",
	4: "lg",
	5: "base",
	6: "md"
};
/** A heading: the level sets the element and a default size, which `size` can override. */
function Heading({ level = 2, as, size, weight = "medium", className, ...rest }) {
	const As = as ?? `h${level}`;
	return /* @__PURE__ */ jsx(As, {
		...rest,
		className: cx("hm-text", "hm-heading", className),
		"data-size": size ?? headingSize[level],
		"data-weight": weight
	});
}
//#endregion
export { AspectRatio, Box, Center, Container, Grid, Heading, Inline, Spacer, Stack, Text, VisuallyHidden };

//# sourceMappingURL=primitives.js.map