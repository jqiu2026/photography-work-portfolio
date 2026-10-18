"use client";
import { cx } from "../utils/cx.js";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import { useMemo, useState } from "react";
//#region src/components/bar-chart.tsx
/**
* The studio revenue chart: thin gray bars that grow in once; the bar under the pointer (or keyboard focus) turns
* white and its value replaces the caption (announced politely). One tab stop; arrows move between bars.
*/
function BarChart({ data, title, caption, format, locale, height, empty = "No data for this period.", className, style, ...rest }) {
	const [active, setActive] = useState(null);
	const [focusIndex, setFocusIndex] = useState(Math.max(0, data.length - 1));
	const fmt = useMemo(() => new Intl.NumberFormat(locale, format), [locale, format]);
	const max = Math.max(1, ...data.map((d) => d.value));
	const shown = active === null ? null : data[active];
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
		e.currentTarget.querySelectorAll(".hm-bar")[to]?.focus();
	};
	return /* @__PURE__ */ jsxs("figure", {
		...rest,
		className: cx("hm-bar-chart", className),
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
		}), hasData ? /* @__PURE__ */ jsxs(Fragment, { children: [/* @__PURE__ */ jsx("div", {
			className: "hm-bars",
			role: "group",
			onPointerLeave: () => setActive(null),
			onKeyDown: onKey,
			children: data.map((d, i) => /* @__PURE__ */ jsx("button", {
				type: "button",
				className: "hm-bar",
				tabIndex: i === focusIndex ? 0 : -1,
				"data-on": active === i ? "" : void 0,
				style: {
					"--h": `${Math.max(2, d.value / max * 100)}%`,
					"--hm-i": i
				},
				"aria-label": `${d.label}: ${fmt.format(d.value)}`,
				onPointerEnter: () => setActive(i),
				onFocus: () => {
					setFocusIndex(i);
					setActive(i);
				},
				onBlur: () => setActive(null)
			}, d.label))
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
export { BarChart };

//# sourceMappingURL=bar-chart.js.map