"use client";
import { cx } from "../utils/cx.js";
import { Tag } from "./tag.js";
import { jsx, jsxs } from "react/jsx-runtime";
import { useRef, useState } from "react";
//#region src/components/tag-input.tsx
/** Free-form tags: type and press Enter or a comma, paste a list, Backspace removes the last. */
function TagInput({ value: controlled, defaultValue = [], onValueChange, placeholder, validate, separators = [","], max, disabled, className, id, ...rest }) {
	const [inner, setInner] = useState(defaultValue);
	const tags = controlled ?? inner;
	const [text, setText] = useState("");
	const field = useRef(null);
	const commit = (next) => {
		if (controlled === void 0) setInner(next);
		onValueChange?.(next);
	};
	const add = (raw) => {
		const parts = raw.split(new RegExp(`[${separators.map((s) => s.replace(/[\]\\^-]/g, "\\$&")).join("")}\\n]`)).map((t) => t.trim()).filter(Boolean);
		let next = tags;
		for (const t of parts) {
			if (max !== void 0 && next.length >= max) break;
			if (next.includes(t) || validate && !validate(t)) continue;
			next = [...next, t];
		}
		if (next !== tags) commit(next);
		setText("");
	};
	const key = (e) => {
		if (e.key === "Enter" || separators.includes(e.key)) {
			if (text.trim()) {
				e.preventDefault();
				add(text);
			} else if (e.key === "Enter") e.preventDefault();
		} else if (e.key === "Backspace" && !text && tags.length) commit(tags.slice(0, -1));
	};
	const paste = (e) => {
		const t = e.clipboardData.getData("text");
		if (/[,\n]/.test(t)) {
			e.preventDefault();
			add(t);
		}
	};
	return /* @__PURE__ */ jsxs("div", {
		className: cx("hm-tag-input hm-control", className),
		"data-disabled": disabled ? "" : void 0,
		onClick: () => field.current?.focus(),
		children: [tags.map((t) => /* @__PURE__ */ jsx(Tag, {
			onRemove: (e) => {
				e.stopPropagation();
				commit(tags.filter((x) => x !== t));
				field.current?.focus();
			},
			children: t
		}, t)), /* @__PURE__ */ jsx("input", {
			...rest,
			ref: field,
			id,
			type: "text",
			className: "hm-tag-input-field",
			value: text,
			disabled: disabled || max !== void 0 && tags.length >= max,
			placeholder: tags.length ? void 0 : placeholder,
			autoComplete: "off",
			onChange: (e) => setText(e.target.value),
			onKeyDown: key,
			onPaste: paste,
			onBlur: () => text.trim() && add(text)
		})]
	});
}
//#endregion
export { TagInput };

//# sourceMappingURL=tag-input.js.map