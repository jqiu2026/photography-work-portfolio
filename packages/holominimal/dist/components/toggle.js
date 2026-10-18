"use client";
import { cx } from "../utils/cx.js";
import { jsx } from "react/jsx-runtime";
import { createContext, use, useCallback, useState } from "react";
//#region src/components/toggle.tsx
/** A button that stays pressed (bold, mute, favorite). Pressed state is `aria-pressed`. */
function Toggle({ pressed: controlled, defaultPressed = false, onPressedChange, size = "md", className, onClick, ...rest }) {
	const [inner, setInner] = useState(defaultPressed);
	const pressed = controlled ?? inner;
	return /* @__PURE__ */ jsx("button", {
		...rest,
		type: "button",
		"aria-pressed": pressed,
		className: cx("hm-toggle", className),
		"data-size": size,
		onClick: (e) => {
			onClick?.(e);
			if (e.defaultPrevented) return;
			if (controlled === void 0) setInner(!pressed);
			onPressedChange?.(!pressed);
		}
	});
}
var GroupContext = createContext(null);
/**
* Related toggles in one hairline group. `single` behaves like a toolbar choice that can be cleared; `multiple` is for
* independent formatting switches. For a required single choice use `SegmentedControl`.
*/
function ToggleGroup(props) {
	const { type = "single", size = "md", className, ...more } = props;
	const { value: _v, defaultValue: _d, onValueChange: _o, ...rest } = more;
	const multiple = type === "multiple";
	const initial = props.defaultValue;
	const [inner, setInner] = useState(initial === void 0 ? [] : Array.isArray(initial) ? initial : initial ? [initial] : []);
	const controlled = props.value;
	const on = controlled === void 0 ? inner : Array.isArray(controlled) ? controlled : controlled ? [controlled] : [];
	const onValueChange = props.onValueChange;
	const flip = useCallback((v) => {
		const next = multiple ? on.includes(v) ? on.filter((x) => x !== v) : [...on, v] : on.includes(v) ? [] : [v];
		if (controlled === void 0) setInner(next);
		onValueChange?.(multiple ? next : next[0] ?? "");
	}, [
		on,
		multiple,
		controlled,
		onValueChange
	]);
	return /* @__PURE__ */ jsx(GroupContext, {
		value: {
			isOn: (v) => on.includes(v),
			flip,
			size
		},
		children: /* @__PURE__ */ jsx("div", {
			...rest,
			role: "group",
			className: cx("hm-toggle-group", className)
		})
	});
}
function ToggleGroupItem({ value, className, onClick, ...rest }) {
	const ctx = use(GroupContext);
	if (!ctx) throw new Error("<ToggleGroupItem> must be inside <ToggleGroup>");
	return /* @__PURE__ */ jsx("button", {
		...rest,
		type: "button",
		"aria-pressed": ctx.isOn(value),
		className: cx("hm-toggle", className),
		"data-size": ctx.size,
		onClick: (e) => {
			onClick?.(e);
			if (!e.defaultPrevented) ctx.flip(value);
		}
	});
}
//#endregion
export { Toggle, ToggleGroup, ToggleGroupItem };

//# sourceMappingURL=toggle.js.map