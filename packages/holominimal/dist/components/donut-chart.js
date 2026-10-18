"use client";
import { cx } from "../utils/cx.js";
import { donutSegments } from "../utils/chart.js";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import { useMemo, useState } from "react";
//#region src/components/donut-chart.tsx
/**
* A donut with a legend. Each slice and legend row is a button: hovering or focusing either highlights both and puts
* its label, value and share in the middle. Series colors come from the `--hm-series-*` tokens.
*/
function DonutChart({ data, title, center, format, locale, empty = "No data.", className, ...rest }) {
	const [active, setActive] = useState(null);
	const fmt = useMemo(() => new Intl.NumberFormat(locale, format), [locale, format]);
	const pct = useMemo(() => new Intl.NumberFormat(locale, {
		style: "percent",
		maximumFractionDigits: 0
	}), [locale]);
	const segs = useMemo(() => donutSegments(data.map((d) => d.value), 1.2), [data]);
	const total = data.reduce((s, d) => s + Math.max(0, d.value), 0);
	const on = active === null ? null : data[active];
	return /* @__PURE__ */ jsxs("figure", {
		...rest,
		className: cx("hm-donut", className),
		children: [/* @__PURE__ */ jsx("figcaption", {
			className: "hm-bar-chart-title",
			children: title
		}), total > 0 ? /* @__PURE__ */ jsxs("div", {
			className: "hm-donut-body",
			children: [/* @__PURE__ */ jsxs("div", {
				className: "hm-donut-ring",
				onPointerLeave: () => setActive(null),
				children: [/* @__PURE__ */ jsxs("svg", {
					viewBox: "0 0 36 36",
					"aria-hidden": "true",
					children: [/* @__PURE__ */ jsx("circle", {
						className: "hm-donut-track",
						cx: "18",
						cy: "18",
						r: "14.5"
					}), segs.map((s, i) => /* @__PURE__ */ jsx("circle", {
						className: "hm-donut-seg",
						cx: "18",
						cy: "18",
						r: "14.5",
						pathLength: 100,
						strokeDasharray: `${s.length} ${100 - s.length}`,
						strokeDashoffset: -s.start,
						"data-on": active === i ? "" : void 0,
						"data-dim": active !== null && active !== i ? "" : void 0,
						style: {
							"--_c": `var(--hm-series-${i % 6 + 1})`,
							"--hm-i": i
						}
					}, data[i]?.label))]
				}), /* @__PURE__ */ jsx("div", {
					className: "hm-donut-center",
					"aria-live": "polite",
					children: on ? /* @__PURE__ */ jsxs(Fragment, { children: [/* @__PURE__ */ jsx("span", {
						className: "hm-donut-value",
						children: pct.format((on.value || 0) / total)
					}), /* @__PURE__ */ jsx("span", {
						className: "hm-donut-label",
						children: on.label
					})] }) : /* @__PURE__ */ jsxs(Fragment, { children: [/* @__PURE__ */ jsx("span", {
						className: "hm-donut-value",
						children: center ?? fmt.format(total)
					}), /* @__PURE__ */ jsx("span", {
						className: "hm-donut-label",
						children: "Total"
					})] })
				})]
			}), /* @__PURE__ */ jsx("ul", {
				className: "hm-donut-legend",
				children: data.map((d, i) => /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsxs("button", {
					type: "button",
					className: "hm-donut-item",
					"data-on": active === i ? "" : void 0,
					style: { "--_c": `var(--hm-series-${i % 6 + 1})` },
					onPointerEnter: () => setActive(i),
					onPointerLeave: () => setActive(null),
					onFocus: () => setActive(i),
					onBlur: () => setActive(null),
					children: [
						/* @__PURE__ */ jsx("span", {
							className: "hm-donut-swatch",
							"aria-hidden": "true"
						}),
						/* @__PURE__ */ jsx("span", {
							className: "hm-donut-name",
							children: d.label
						}),
						/* @__PURE__ */ jsx("span", {
							className: "hm-donut-amount",
							children: fmt.format(d.value)
						}),
						/* @__PURE__ */ jsx("span", {
							className: "hm-donut-pct",
							children: pct.format(d.value / total)
						})
					]
				}) }, d.label))
			})]
		}) : /* @__PURE__ */ jsx("p", {
			className: "hm-empty",
			children: empty
		})]
	});
}
//#endregion
export { DonutChart };

//# sourceMappingURL=donut-chart.js.map