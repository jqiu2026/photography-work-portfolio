"use client";
import { cx } from "../utils/cx.js";
import { chartPath, scalePoints } from "../utils/chart.js";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import { useId, useMemo, useState } from "react";
//#region src/components/line-chart.tsx
var W = 600;
var H = 120;
/**
* A line (or area) chart in the studio's chart language: a hairline grid, the line drawing itself in once, and a marker
* that glides between points as the pointer or keyboard focus moves. One tab stop; arrows move between points, and
* each point is announced as "label: value".
*/
function LineChart({ data, title, caption, format, locale, height, area = true, curve = "smooth", empty = "No data for this period.", className, style, ...rest }) {
	const [active, setActive] = useState(null);
	const [focusIndex, setFocusIndex] = useState(Math.max(0, data.length - 1));
	const fmt = useMemo(() => new Intl.NumberFormat(locale, format), [locale, format]);
	const gradient = useId();
	const points = useMemo(() => scalePoints(data.map((d) => d.value), W, H, 6, 0), [data]);
	const line = useMemo(() => chartPath(points, curve === "smooth"), [points, curve]);
	const fill = `${line}L${W} ${H}L0 ${H}Z`;
	const shown = active === null ? null : data[active];
	const marker = points[active ?? focusIndex];
	const hasData = data.some((d) => d.value > 0);
	const onKey = (e) => {
		const n = data.length;
		const keys = {
			ArrowRight: focusIndex + 1,
			ArrowLeft: focusIndex - 1,
			Home: 0,
			End: n - 1
		};
		if (!(e.key in keys)) return;
		e.preventDefault();
		const to = Math.max(0, Math.min(n - 1, keys[e.key] ?? 0));
		setFocusIndex(to);
		setActive(to);
		e.currentTarget.querySelectorAll(".hm-line-hit")[to]?.focus();
	};
	return /* @__PURE__ */ jsxs("figure", {
		...rest,
		className: cx("hm-line-chart", className),
		style: {
			...style,
			"--_h": height
		},
		children: [/* @__PURE__ */ jsxs("figcaption", {
			className: "hm-bar-chart-head",
			children: [/* @__PURE__ */ jsx("span", {
				className: "hm-bar-chart-title",
				children: title
			}), /* @__PURE__ */ jsx("span", {
				className: "hm-bar-chart-caption",
				"aria-live": "polite",
				children: shown ? `${shown.label} · ${fmt.format(shown.value)}` : caption
			})]
		}), hasData ? /* @__PURE__ */ jsxs(Fragment, { children: [/* @__PURE__ */ jsxs("div", {
			className: "hm-line-plot",
			children: [
				/* @__PURE__ */ jsxs("svg", {
					viewBox: `0 0 ${W} ${H}`,
					preserveAspectRatio: "none",
					"aria-hidden": "true",
					children: [
						/* @__PURE__ */ jsx("defs", { children: /* @__PURE__ */ jsxs("linearGradient", {
							id: gradient,
							x1: "0",
							y1: "0",
							x2: "0",
							y2: "1",
							children: [/* @__PURE__ */ jsx("stop", {
								offset: "0",
								stopColor: "var(--hm-accent)",
								stopOpacity: "0.28"
							}), /* @__PURE__ */ jsx("stop", {
								offset: "1",
								stopColor: "var(--hm-accent)",
								stopOpacity: "0"
							})]
						}) }),
						[
							.25,
							.5,
							.75
						].map((g) => /* @__PURE__ */ jsx("path", {
							className: "hm-line-grid",
							d: `M0 ${g * H}H${W}`
						}, g)),
						/* @__PURE__ */ jsxs("g", {
							className: "hm-line-reveal",
							children: [area ? /* @__PURE__ */ jsx("path", {
								className: "hm-line-area",
								d: fill,
								fill: `url(#${gradient})`
							}) : null, /* @__PURE__ */ jsx("path", {
								className: "hm-line-stroke",
								d: line
							})]
						})
					]
				}),
				marker ? /* @__PURE__ */ jsxs(Fragment, { children: [/* @__PURE__ */ jsx("span", {
					className: "hm-line-rule",
					"data-on": active !== null ? "" : void 0,
					style: { left: `${marker[0] / W * 100}%` }
				}), /* @__PURE__ */ jsx("span", {
					className: "hm-line-dot",
					"data-on": active !== null ? "" : void 0,
					style: {
						left: `${marker[0] / W * 100}%`,
						top: `${marker[1] / H * 100}%`
					}
				})] }) : null,
				/* @__PURE__ */ jsx("div", {
					className: "hm-line-hits",
					role: "group",
					"aria-label": typeof title === "string" ? title : void 0,
					onPointerLeave: () => setActive(null),
					onKeyDown: onKey,
					children: data.map((d, i) => /* @__PURE__ */ jsx("button", {
						type: "button",
						className: "hm-line-hit",
						tabIndex: i === focusIndex ? 0 : -1,
						"aria-label": `${d.label}: ${fmt.format(d.value)}`,
						onPointerEnter: () => setActive(i),
						onFocus: () => {
							setFocusIndex(i);
							setActive(i);
						},
						onBlur: () => setActive(null)
					}, d.label))
				})
			]
		}), /* @__PURE__ */ jsxs("div", {
			className: "hm-bar-axis",
			"aria-hidden": "true",
			children: [/* @__PURE__ */ jsx("span", { children: data[0]?.label }), /* @__PURE__ */ jsx("span", { children: data[data.length - 1]?.label })]
		})] }) : /* @__PURE__ */ jsx("p", {
			className: "hm-empty",
			children: empty
		})]
	});
}
//#endregion
export { LineChart };

//# sourceMappingURL=line-chart.js.map