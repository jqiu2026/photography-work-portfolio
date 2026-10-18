"use client";
import { cx } from "../utils/cx.js";
import { jsx, jsxs } from "react/jsx-runtime";
import { useId, useState } from "react";
//#region src/components/rating.tsx
var STAR = "M8 1.7l1.85 4.05 4.45.5-3.3 3.05.9 4.4L8 11.5l-3.9 2.2.9-4.4L1.7 6.25l4.45-.5z";
/**
* A star rating on native radio inputs, so arrow keys, a single tab stop and form posting come for free. Hovering
* previews the rating and the stars fill with a small spring. `readOnly` shows any value, including halves.
*/
function Rating({ value: controlled, defaultValue = 0, onValueChange, max = 5, readOnly, size = "md", className, ...rest }) {
	const [inner, setInner] = useState(defaultValue);
	const value = controlled ?? inner;
	const [hover, setHover] = useState(null);
	const name = useId();
	const shown = hover ?? value;
	if (readOnly) return /* @__PURE__ */ jsx("div", {
		...rest,
		role: "img",
		"aria-label": `${rest["aria-label"]}: ${value} out of ${max}`,
		className: cx("hm-rating", className),
		"data-size": size,
		"data-readonly": "",
		children: Array.from({ length: max }, (_, i) => {
			const fill = Math.max(0, Math.min(1, value - i));
			return /* @__PURE__ */ jsx("span", {
				className: "hm-star",
				style: { "--_fill": `${fill * 100}%` },
				children: /* @__PURE__ */ jsx(Star, {})
			}, i);
		})
	});
	return /* @__PURE__ */ jsx("div", {
		...rest,
		role: "radiogroup",
		className: cx("hm-rating", className),
		"data-size": size,
		onPointerLeave: () => setHover(null),
		children: Array.from({ length: max }, (_, i) => {
			const n = i + 1;
			return /* @__PURE__ */ jsxs("label", {
				className: "hm-star",
				"data-on": n <= shown ? "" : void 0,
				style: { "--_fill": n <= shown ? "100%" : "0%" },
				onPointerEnter: () => setHover(n),
				children: [/* @__PURE__ */ jsx("input", {
					className: "hm-rating-input",
					type: "radio",
					name,
					value: n,
					checked: Math.round(value) === n,
					"aria-label": `${n} ${n === 1 ? "star" : "stars"}`,
					onChange: () => {
						if (controlled === void 0) setInner(n);
						onValueChange?.(n);
					}
				}), /* @__PURE__ */ jsx(Star, {})]
			}, n);
		})
	});
}
function Star() {
	return /* @__PURE__ */ jsxs("svg", {
		viewBox: "0 0 16 16",
		"aria-hidden": "true",
		children: [/* @__PURE__ */ jsx("path", {
			className: "hm-star-back",
			d: STAR
		}), /* @__PURE__ */ jsx("path", {
			className: "hm-star-front",
			d: STAR
		})]
	});
}
//#endregion
export { Rating };

//# sourceMappingURL=rating.js.map