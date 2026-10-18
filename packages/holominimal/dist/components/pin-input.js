"use client";
import { cx } from "../utils/cx.js";
import { jsx } from "react/jsx-runtime";
import { useId, useRef, useState } from "react";
//#region src/components/pin-input.tsx
/** A one-time-code field of separate boxes: typing advances, Backspace goes back, arrows move, paste fills them all. */
function PinInput({ length = 6, value: controlled, defaultValue = "", onValueChange, onComplete, type = "numeric", mask, disabled, invalid, className, ...rest }) {
	const [inner, setInner] = useState(defaultValue.slice(0, length));
	const value = (controlled ?? inner).slice(0, length);
	const boxes = useRef([]);
	const base = useId();
	const allowed = (c) => type === "numeric" ? /^[0-9]$/.test(c) : /^[a-zA-Z0-9]$/.test(c);
	const set = (next) => {
		if (controlled === void 0) setInner(next);
		onValueChange?.(next);
		if (next.length === length) onComplete?.(next);
	};
	const focus = (i) => boxes.current[Math.max(0, Math.min(length - 1, i))]?.focus();
	const put = (i, chars) => {
		const clean = Array.from(chars).filter(allowed);
		if (!clean.length) return;
		const arr = value.padEnd(length, " ").split("");
		let at = i;
		for (const c of clean) {
			if (at >= length) break;
			arr[at++] = c;
		}
		set(arr.join("").replace(/ +$/, "").replace(/ /g, ""));
		focus(Math.min(at, length - 1));
	};
	const key = (i) => (e) => {
		if (e.key === "Backspace") {
			e.preventDefault();
			const chars = value.split("");
			if (chars[i]) {
				chars.splice(i, 1);
				set(chars.join(""));
			} else if (i > 0) {
				chars.splice(i - 1, 1);
				set(chars.join(""));
				focus(i - 1);
			}
		} else if (e.key === "Delete") {
			e.preventDefault();
			const chars = value.split("");
			chars.splice(i, 1);
			set(chars.join(""));
		} else if (e.key === "ArrowLeft") {
			e.preventDefault();
			focus(i - 1);
		} else if (e.key === "ArrowRight") {
			e.preventDefault();
			focus(i + 1);
		} else if (e.key === "Home") {
			e.preventDefault();
			focus(0);
		} else if (e.key === "End") {
			e.preventDefault();
			focus(length - 1);
		}
	};
	const paste = (i) => (e) => {
		e.preventDefault();
		put(i, e.clipboardData.getData("text"));
	};
	return /* @__PURE__ */ jsx("div", {
		...rest,
		role: "group",
		className: cx("hm-pin", className),
		"data-invalid": invalid ? "" : void 0,
		children: Array.from({ length }, (_, i) => /* @__PURE__ */ jsx("input", {
			ref: (el) => {
				boxes.current[i] = el;
			},
			id: `${base}-${i}`,
			className: "hm-pin-box hm-control",
			type: mask ? "password" : "text",
			inputMode: type === "numeric" ? "numeric" : "text",
			autoComplete: i === 0 ? "one-time-code" : "off",
			"aria-label": `${rest["aria-label"]}, digit ${i + 1} of ${length}`,
			"aria-invalid": invalid || void 0,
			maxLength: 2,
			disabled,
			value: value[i] ?? "",
			onChange: (e) => {
				const v = e.target.value;
				put(i, v.length > 1 ? v.replace(value[i] ?? "", "").slice(-1) || v.slice(-1) : v);
			},
			onKeyDown: key(i),
			onPaste: paste(i),
			onFocus: (e) => e.currentTarget.select()
		}, i))
	});
}
//#endregion
export { PinInput };

//# sourceMappingURL=pin-input.js.map