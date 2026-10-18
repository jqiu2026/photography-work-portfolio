import { jsx, jsxs } from "react/jsx-runtime";
import { useId } from "react";
//#region src/icons/icon.tsx
var steps = {
	xs: 12,
	sm: 16,
	md: 20,
	lg: 24,
	xl: 32
};
/**
* Builds an icon component from its drawing. Every Holominimal icon is drawn on a 24-unit grid with round caps and joins
* and `currentColor`, so it takes the color and size of the text around it. Icons are server-compatible.
*/
function createIcon(name, def) {
	const knocked = Boolean(def.cut?.length || def.cutFill?.length);
	const transform = [def.scale ? `translate(12 12) scale(${def.scale}) translate(-12 -12)` : "", def.flipY ? "translate(0 24) scale(1 -1)" : ""].filter(Boolean).join(" ") || void 0;
	function Icon({ size = "1em", strokeWidth = 1.75, title, className, animate, animateOn, ...rest }) {
		const maskId = useId();
		const px = typeof size === "string" && size in steps ? steps[size] : size;
		return /* @__PURE__ */ jsxs("svg", {
			viewBox: "0 0 24 24",
			width: px,
			height: px,
			fill: "none",
			stroke: "currentColor",
			strokeWidth,
			strokeLinecap: "round",
			strokeLinejoin: "round",
			role: title ? "img" : void 0,
			"aria-hidden": title ? void 0 : true,
			focusable: "false",
			className: className ? `hm-icon ${className}` : "hm-icon",
			"data-hm-anim": animate,
			"data-hm-trigger": animate && animateOn && animateOn !== "mount" ? animateOn : void 0,
			...rest,
			children: [
				title ? /* @__PURE__ */ jsx("title", { children: title }) : null,
				knocked ? /* @__PURE__ */ jsxs("mask", {
					id: maskId,
					maskUnits: "userSpaceOnUse",
					x: "0",
					y: "0",
					width: "24",
					height: "24",
					children: [
						/* @__PURE__ */ jsx("rect", {
							width: "24",
							height: "24",
							fill: "white",
							stroke: "none"
						}),
						def.cut?.map((d) => /* @__PURE__ */ jsx("path", {
							d,
							stroke: "black",
							strokeWidth: def.cutWidth ?? 2
						}, d)),
						def.cutFill?.map((d) => /* @__PURE__ */ jsx("path", {
							d,
							fill: "black",
							stroke: "none"
						}, d))
					]
				}) : null,
				/* @__PURE__ */ jsxs("g", {
					transform,
					children: [
						def.faint?.map((d) => /* @__PURE__ */ jsx("path", {
							d,
							opacity: .28
						}, d)),
						def.d.map((d) => /* @__PURE__ */ jsx("path", { d }, d)),
						/* @__PURE__ */ jsx("g", {
							mask: knocked ? `url(#${maskId})` : void 0,
							children: def.solid?.map((d) => /* @__PURE__ */ jsx("path", {
								d,
								fill: "currentColor",
								stroke: "none",
								fillRule: "evenodd"
							}, d))
						})
					]
				})
			]
		});
	}
	Icon.displayName = name;
	return Icon;
}
/** Drawing helpers: shapes as path strings, so an icon is one list of paths. */
var circle = (cx, cy, r) => `M${cx - r} ${cy}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0z`;
var rect = (x, y, w, h, r = 0) => r ? `M${x + r} ${y}h${w - 2 * r}a${r} ${r} 0 0 1 ${r} ${r}v${h - 2 * r}a${r} ${r} 0 0 1 ${-r} ${r}h${-(w - 2 * r)}a${r} ${r} 0 0 1 ${-r} ${-r}v${-(h - 2 * r)}a${r} ${r} 0 0 1 ${r} ${-r}z` : `M${x} ${y}h${w}v${h}h${-w}z`;
//#endregion
export { circle, createIcon, rect };

//# sourceMappingURL=icon.js.map