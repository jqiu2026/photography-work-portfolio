import { cx } from "../utils/cx.js";
import { CloseIcon } from "../icons/interface.js";
import { jsx, jsxs } from "react/jsx-runtime";
//#region src/components/tag.tsx
/** A removable label or filter chip. Unlike `Badge` it can be dismissed. */
function Tag({ tone = "neutral", onRemove, removeLabel = "Remove", className, children, ...rest }) {
	return /* @__PURE__ */ jsxs("span", {
		...rest,
		className: cx("hm-tag", className),
		"data-tone": tone,
		children: [children, onRemove ? /* @__PURE__ */ jsx("button", {
			type: "button",
			className: "hm-tag-remove",
			"aria-label": `${removeLabel} ${typeof children === "string" ? children : ""}`.trim(),
			onClick: onRemove,
			children: /* @__PURE__ */ jsx(CloseIcon, {
				size: 10,
				strokeWidth: 1.8
			})
		}) : null]
	});
}
//#endregion
export { Tag };

//# sourceMappingURL=tag.js.map