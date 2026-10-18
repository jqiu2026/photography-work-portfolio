"use client";
import { cx } from "../utils/cx.js";
import { jsx, jsxs } from "react/jsx-runtime";
import { createContext, use, useId, useState } from "react";
//#region src/components/radio-group.tsx
var RadioContext = createContext(null);
/**
* A single choice from a few options, on native radio inputs: the browser provides arrow-key movement, a single tab
* stop and form submission. Use `SegmentedControl` for view filters and `Select` for long lists.
*/
function RadioGroup({ legend, hideLegend, value: controlled, defaultValue = "", onValueChange, name, orientation = "vertical", disabled, className, children, ...rest }) {
	const [uncontrolled, setUncontrolled] = useState(defaultValue);
	const value = controlled ?? uncontrolled;
	const auto = useId();
	const select = (v) => {
		if (controlled === void 0) setUncontrolled(v);
		onValueChange?.(v);
	};
	return /* @__PURE__ */ jsx(RadioContext, {
		value: {
			name: name ?? `hm-radio-${auto}`,
			value,
			select,
			disabled
		},
		children: /* @__PURE__ */ jsxs("fieldset", {
			...rest,
			disabled,
			className: cx("hm-radio-group", className),
			"data-orientation": orientation,
			children: [/* @__PURE__ */ jsx("legend", {
				className: cx("hm-radio-legend", hideLegend && "hm-sr-only"),
				children: legend
			}), /* @__PURE__ */ jsx("div", {
				className: "hm-radio-options",
				children
			})]
		})
	});
}
function Radio({ value, label, description, className, onChange, id, ...rest }) {
	const ctx = use(RadioContext);
	if (!ctx) throw new Error("<Radio> must be inside <RadioGroup>");
	const auto = useId();
	const inputId = id ?? `hm-radio-opt-${auto}`;
	const descId = description ? `${inputId}-desc` : void 0;
	return /* @__PURE__ */ jsxs("label", {
		className: cx("hm-radio", className),
		htmlFor: inputId,
		children: [/* @__PURE__ */ jsx("input", {
			...rest,
			id: inputId,
			type: "radio",
			name: ctx.name,
			value,
			className: "hm-radio-input",
			checked: ctx.value === value,
			disabled: rest.disabled ?? ctx.disabled,
			"aria-describedby": descId,
			onChange: (e) => {
				onChange?.(e);
				if (e.target.checked) ctx.select(value);
			}
		}), /* @__PURE__ */ jsxs("span", {
			className: "hm-radio-text",
			children: [/* @__PURE__ */ jsx("span", {
				className: "hm-radio-label",
				children: label
			}), description ? /* @__PURE__ */ jsx("span", {
				id: descId,
				className: "hm-radio-description",
				children: description
			}) : null]
		})]
	});
}
//#endregion
export { Radio, RadioGroup };

//# sourceMappingURL=radio-group.js.map