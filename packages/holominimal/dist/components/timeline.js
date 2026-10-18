import { cx } from "../utils/cx.js";
import { jsx, jsxs } from "react/jsx-runtime";
//#region src/components/timeline.tsx
/** A vertical sequence of events on a hairline. Server-compatible. */
function Timeline({ className, ...rest }) {
	return /* @__PURE__ */ jsx("ol", {
		...rest,
		className: cx("hm-timeline", className)
	});
}
function TimelineItem({ title, time, description, status = "done", marker, className, children, ...rest }) {
	return /* @__PURE__ */ jsxs("li", {
		...rest,
		className: cx("hm-timeline-item", className),
		"data-status": status,
		"aria-current": status === "current" ? "step" : void 0,
		children: [/* @__PURE__ */ jsx("span", {
			className: "hm-timeline-marker",
			"aria-hidden": "true",
			children: marker
		}), /* @__PURE__ */ jsxs("div", {
			className: "hm-timeline-body",
			children: [
				/* @__PURE__ */ jsx("p", {
					className: "hm-timeline-title",
					children: title
				}),
				time ? /* @__PURE__ */ jsx("span", {
					className: "hm-timeline-time",
					children: time
				}) : null,
				description ? /* @__PURE__ */ jsx("p", {
					className: "hm-timeline-description",
					children: description
				}) : null,
				children
			]
		})]
	});
}
//#endregion
export { Timeline, TimelineItem };

//# sourceMappingURL=timeline.js.map