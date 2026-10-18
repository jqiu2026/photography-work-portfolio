import { jsx, jsxs } from "react/jsx-runtime";
import { useId } from "react";
//#region src/icons/animated.tsx
var steps = {
	xs: 12,
	sm: 16,
	md: 20,
	lg: 24,
	xl: 32
};
var RAYS = [
	"M12 2.8v2",
	"M12 19.2v2",
	"M2.8 12h2",
	"M19.2 12h2",
	"M5.5 5.5L6.9 6.9",
	"M17.1 17.1l1.4 1.4",
	"M18.5 5.5l-1.4 1.4",
	"M6.9 17.1l-1.4 1.4"
];
/**
* A sun that becomes a moon. The rays shrink and turn while a second disc slides across the sun and carves a crescent;
* it plays on every change of `moon` and holds still under reduced motion. Decorative: label the button around it.
*/
function SunMoonIcon({ moon = false, mode, size = "1em", strokeWidth = 1.75, className, ...rest }) {
	const id = useId();
	const current = mode ?? (moon ? "moon" : "sun");
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
		"aria-hidden": "true",
		focusable: "false",
		className: className ? `hm-icon hm-sunmoon ${className}` : "hm-icon hm-sunmoon",
		"data-moon": current === "moon" ? "" : void 0,
		"data-mode": current,
		...rest,
		children: [
			/* @__PURE__ */ jsxs("defs", { children: [/* @__PURE__ */ jsxs("mask", {
				id: `${id}-m`,
				children: [
					/* @__PURE__ */ jsx("rect", {
						x: "0",
						y: "0",
						width: "24",
						height: "24",
						fill: "white"
					}),
					/* @__PURE__ */ jsx("circle", {
						className: "hm-sunmoon-bite",
						cx: "14.6",
						cy: "9.4",
						r: "5.2",
						fill: "black"
					}),
					/* @__PURE__ */ jsx("rect", {
						className: "hm-sunmoon-sea",
						x: "0",
						y: "14",
						width: "24",
						height: "10",
						fill: "black"
					})
				]
			}), /* @__PURE__ */ jsx("clipPath", {
				id: `${id}-c`,
				children: /* @__PURE__ */ jsx("circle", {
					cx: "12",
					cy: "12",
					r: "5.2"
				})
			})] }),
			/* @__PURE__ */ jsxs("g", {
				className: "hm-sunmoon-body",
				children: [
					/* @__PURE__ */ jsx("circle", {
						className: "hm-sunmoon-disc",
						cx: "12",
						cy: "12",
						r: "5.2",
						mask: `url(#${id}-m)`
					}),
					/* @__PURE__ */ jsx("g", {
						clipPath: `url(#${id}-c)`,
						children: /* @__PURE__ */ jsx("circle", {
							className: "hm-sunmoon-bite hm-sunmoon-edge",
							cx: "14.6",
							cy: "9.4",
							r: "5.2"
						})
					}),
					/* @__PURE__ */ jsx("g", {
						className: "hm-sunmoon-rays",
						children: RAYS.map((d) => /* @__PURE__ */ jsx("path", { d }, d))
					})
				]
			}),
			/* @__PURE__ */ jsx("path", {
				className: "hm-sunmoon-horizon",
				d: "M4.5 18.5h15"
			})
		]
	});
}
//#endregion
export { SunMoonIcon };

//# sourceMappingURL=animated.js.map