import { cx } from "../utils/cx.js";
import { animationVars } from "../animation/presets.js";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import { Children, cloneElement, isValidElement } from "react";
//#region src/components/animation.tsx
/**
* Plays one preset on each child in turn: `<Stagger animation="fade-up" step={60}><Card/><Card/></Stagger>`. It adds
* `data-hm-anim` and an index to each element child (no wrapper), so it works in server components.
*/
function Stagger({ animation = "fade-up", start = 0, children, step, ...options }) {
	const vars = animationVars({
		...options,
		step,
		delay: options.delay ?? (start ? start : void 0)
	});
	let i = 0;
	return /* @__PURE__ */ jsx(Fragment, { children: Children.map(children, (child) => {
		if (!isValidElement(child)) return child;
		const el = child;
		const index = i++;
		return cloneElement(el, {
			"data-hm-anim": animation,
			style: {
				...vars,
				"--hm-i": index,
				...el.props.style
			}
		});
	}) });
}
/**
* Reveals text a word or letter at a time. The full text is the accessible name; the pieces are hidden from assistive
* technology. Server-compatible.
*/
function TextReveal({ text, by = "word", animation = by === "char" ? "letter-in" : "fade-up", as: As = "span", step, className, style, duration, delay, easing, count, direction, distance, ...rest }) {
	const pieces = by === "char" ? Array.from(text) : text.split(/(\s+)/);
	const vars = animationVars({
		duration,
		delay,
		easing,
		count,
		direction,
		distance,
		step: step ?? (by === "char" ? 28 : 70)
	});
	let i = 0;
	return /* @__PURE__ */ jsxs(As, {
		...rest,
		className: cx("hm-text-reveal", className),
		style: {
			...vars,
			...style
		},
		children: [/* @__PURE__ */ jsx("span", {
			className: "hm-sr-only",
			children: text
		}), /* @__PURE__ */ jsx("span", {
			"aria-hidden": "true",
			children: pieces.map((p, k) => /^\s+$/.test(p) ? /* @__PURE__ */ jsx("span", { children: p }, k) : /* @__PURE__ */ jsx("span", {
				className: "hm-text-reveal-piece",
				"data-hm-anim": animation,
				style: { "--hm-i": i++ },
				children: p === " " ? "\xA0" : p
			}, k))
		})]
	});
}
/**
* A row of content that scrolls endlessly (logos, quotes, tags). The content is repeated once for a seamless loop; the
* copy is hidden from assistive technology. Stops under reduced motion. Server-compatible.
*/
function Marquee({ children, duration = 30, reverse, pauseOnHover = true, gap, className, style, ...rest }) {
	return /* @__PURE__ */ jsx("div", {
		...rest,
		className: cx("hm-marquee", className),
		"data-reverse": reverse ? "" : void 0,
		"data-pause": pauseOnHover ? "" : void 0,
		style: {
			"--hm-marquee-duration": `${duration}s`,
			"--hm-marquee-gap": gap,
			...style
		},
		children: /* @__PURE__ */ jsxs("div", {
			className: "hm-marquee-track",
			children: [/* @__PURE__ */ jsx("div", {
				className: "hm-marquee-group",
				children
			}), /* @__PURE__ */ jsx("div", {
				className: "hm-marquee-group",
				"aria-hidden": "true",
				children
			})]
		})
	});
}
//#endregion
export { Marquee, Stagger, TextReveal };

//# sourceMappingURL=animation.js.map