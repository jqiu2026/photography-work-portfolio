"use client";
import { cx } from "../utils/cx.js";
import { jsx, jsxs } from "react/jsx-runtime";
import { useState } from "react";
//#region src/components/avatar.tsx
var initials = (name) => name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase()).join("");
/** Hue (0-359) derived from the name, so each fallback has its own stable tint. */
var hueOf = (name) => {
	let h = 0;
	for (const c of name) h = (h * 31 + c.charCodeAt(0)) % 360;
	return h;
};
/**
* A photo with an initials fallback (shown while loading, and if the image fails). The fallback is tinted from the
* name, so a list of people is distinguishable at a glance.
*/
function Avatar({ src, name, size = "md", shape = "circle", status, className, style, ...rest }) {
	const [failed, setFailed] = useState(false);
	const [loaded, setLoaded] = useState(false);
	return /* @__PURE__ */ jsxs("span", {
		...rest,
		className: cx("hm-avatar", className),
		"data-size": size,
		"data-shape": shape,
		style: {
			"--_h": hueOf(name),
			...style
		},
		role: "img",
		"aria-label": name,
		children: [
			/* @__PURE__ */ jsx("span", {
				className: "hm-avatar-fallback",
				"aria-hidden": "true",
				children: initials(name)
			}),
			src && !failed ? /* @__PURE__ */ jsx("img", {
				className: "hm-avatar-img",
				src,
				alt: "",
				"data-loaded": loaded ? "" : void 0,
				onLoad: () => setLoaded(true),
				onError: () => setFailed(true)
			}) : null,
			status ? /* @__PURE__ */ jsx("span", {
				className: "hm-avatar-status",
				"data-status": status
			}) : null
		]
	});
}
/** Overlapping avatars with a "+N" overflow chip. */
function AvatarGroup({ max, total, className, children, ...rest }) {
	const items = Array.isArray(children) ? children : children ? [children] : [];
	const shown = max === void 0 ? items : items.slice(0, max);
	const extra = (total ?? items.length) - shown.length;
	return /* @__PURE__ */ jsxs("div", {
		...rest,
		className: cx("hm-avatar-group", className),
		role: "group",
		children: [shown, extra > 0 ? /* @__PURE__ */ jsx("span", {
			className: "hm-avatar hm-avatar-more",
			"data-size": "md",
			"data-shape": "circle",
			role: "img",
			"aria-label": `${extra} more`,
			children: /* @__PURE__ */ jsxs("span", {
				className: "hm-avatar-fallback",
				"aria-hidden": "true",
				children: ["+", extra]
			})
		}) : null]
	});
}
//#endregion
export { Avatar, AvatarGroup };

//# sourceMappingURL=avatar.js.map