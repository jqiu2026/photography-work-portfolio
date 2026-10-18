import { cx } from "../utils/cx.js";
import { jsx, jsxs } from "react/jsx-runtime";
//#region src/components/patterns.tsx
/**
* A filter bar: a search field, selects and toggles in one wrapping row, with an optional trailing slot. Put the
* controls in as children (`Input`, `Select`, `SegmentedControl`, `Button`).
*/
function Toolbar({ end, className, children, ...rest }) {
	return /* @__PURE__ */ jsxs("div", {
		role: "toolbar",
		...rest,
		className: cx("hm-toolbar", className),
		children: [/* @__PURE__ */ jsx("div", {
			className: "hm-toolbar-main",
			children
		}), end ? /* @__PURE__ */ jsx("div", {
			className: "hm-toolbar-end",
			children: end
		}) : null]
	});
}
/** A titled group of settings rows, divided by hairlines. */
function SettingsSection({ title, description, level = 2, className, children, ...rest }) {
	const Heading = `h${level}`;
	return /* @__PURE__ */ jsxs("section", {
		...rest,
		className: cx("hm-settings", className),
		children: [/* @__PURE__ */ jsxs("header", {
			className: "hm-settings-head",
			children: [/* @__PURE__ */ jsx(Heading, {
				className: "hm-settings-title",
				children: title
			}), description ? /* @__PURE__ */ jsx("p", {
				className: "hm-settings-description",
				children: description
			}) : null]
		}), /* @__PURE__ */ jsx("div", {
			className: "hm-settings-rows",
			children
		})]
	});
}
/** One setting: its name and explanation on the left, the control on the right (stacked on phones). */
function SettingsRow({ title, description, control, className, ...rest }) {
	return /* @__PURE__ */ jsxs("div", {
		...rest,
		className: cx("hm-settings-row", className),
		children: [/* @__PURE__ */ jsxs("div", {
			className: "hm-settings-text",
			children: [/* @__PURE__ */ jsx("p", {
				className: "hm-settings-name",
				children: title
			}), description ? /* @__PURE__ */ jsx("p", {
				className: "hm-settings-hint",
				children: description
			}) : null]
		}), /* @__PURE__ */ jsx("div", {
			className: "hm-settings-control",
			children: control
		})]
	});
}
//#endregion
export { SettingsRow, SettingsSection, Toolbar };

//# sourceMappingURL=patterns.js.map