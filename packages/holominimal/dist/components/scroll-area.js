"use client";
import { cx } from "../utils/cx.js";
import { createScrollbars } from "../interaction/scrollbar.js";
import { jsx, jsxs } from "react/jsx-runtime";
import { useEffect, useRef } from "react";
//#region src/components/scroll-area.tsx
/**
* A scroll container with slim overlay scrollbars that appear while you scroll or hover, and edge fades that show
* where there is more. Native scrolling is untouched (wheel, touch, keyboard, find in page); the thumbs are drawn
* from the scroll metrics and can be dragged. Give it a height (or `max-height`) in CSS.
*/
function ScrollArea({ orientation = "vertical", fade = true, className, children, ...rest }) {
	const root = useRef(null);
	const viewport = useRef(null);
	useEffect(() => {
		if (!root.current || !viewport.current) return;
		return createScrollbars(root.current, viewport.current);
	}, []);
	return /* @__PURE__ */ jsxs("div", {
		ref: root,
		className: cx("hm-scrollarea", className),
		"data-orientation": orientation,
		"data-fade": fade ? "" : void 0,
		children: [
			/* @__PURE__ */ jsx("div", {
				...rest,
				ref: viewport,
				className: "hm-scroll-viewport",
				tabIndex: 0,
				role: "region",
				children: /* @__PURE__ */ jsx("div", {
					className: "hm-scroll-content",
					children
				})
			}),
			orientation !== "horizontal" ? /* @__PURE__ */ jsx("div", {
				className: "hm-scrollbar",
				"data-scroll-bar": "y",
				"aria-hidden": "true",
				children: /* @__PURE__ */ jsx("div", {
					className: "hm-scroll-thumb",
					"data-scroll-thumb": ""
				})
			}) : null,
			orientation !== "vertical" ? /* @__PURE__ */ jsx("div", {
				className: "hm-scrollbar",
				"data-scroll-bar": "x",
				"aria-hidden": "true",
				children: /* @__PURE__ */ jsx("div", {
					className: "hm-scroll-thumb",
					"data-scroll-thumb": ""
				})
			}) : null
		]
	});
}
//#endregion
export { ScrollArea };

//# sourceMappingURL=scroll-area.js.map