"use client";
import { cx } from "../utils/cx.js";
import { useInView, useReducedMotion } from "../hooks/index.js";
import { animate, animationVars } from "../animation/presets.js";
import { jsx, jsxs } from "react/jsx-runtime";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
//#region src/components/animate.tsx
/**
* Plays an animation preset on its element, on mount or when a trigger fires:
*
*     <Animate animation="fade-up">Hello</Animate>
*     <Animate animation="pop" trigger="view">Appears when scrolled to</Animate>
*     <Animate animation="wiggle" trigger="hover" as="button">Hover me</Animate>
*
* It renders one element (`as`, a `div` by default). The presets are listed in `animations`. Reduced motion shows the
* resting state.
*/
function Animate({ animation, trigger = "mount", once = true, threshold = .2, play, index, onAnimationDone, as: As = "div", duration, delay, easing, count, direction, distance, step, className, style, ref, onClick, ...rest }) {
	const el = useRef(null);
	const done = useRef(onAnimationDone);
	done.current = onAnimationDone;
	const vars = animationVars({
		duration,
		delay,
		easing,
		count,
		direction,
		distance,
		step
	});
	const setRef = useCallback((node) => {
		el.current = node;
		if (typeof ref === "function") ref(node);
		else if (ref) ref.current = node;
	}, [ref]);
	const restart = useCallback(() => {
		const node = el.current;
		if (!node) return;
		node.removeAttribute("data-hm-play");
		node.removeAttribute("data-hm-pending");
		node.offsetWidth;
		node.setAttribute("data-hm-play", "");
	}, []);
	useLayoutEffect(() => {
		const node = el.current;
		if (trigger !== "view" || !node) return;
		if (typeof IntersectionObserver === "undefined") return;
		node.setAttribute("data-hm-pending", "");
		const io = new IntersectionObserver(([entry]) => {
			if (!entry) return;
			if (entry.isIntersecting) {
				restart();
				if (once) io.disconnect();
			} else if (!once) {
				node.removeAttribute("data-hm-play");
				node.setAttribute("data-hm-pending", "");
			}
		}, { threshold });
		io.observe(node);
		return () => {
			io.disconnect();
			node.removeAttribute("data-hm-pending");
		};
	}, [
		trigger,
		once,
		threshold,
		restart
	]);
	const first = useRef(true);
	useEffect(() => {
		if (trigger !== "manual") return;
		if (first.current) {
			first.current = false;
			if (play === void 0 || play === false) return;
		}
		if (play === false) return;
		restart();
	}, [
		trigger,
		play,
		restart
	]);
	useEffect(() => {
		const node = el.current;
		if (!node) return;
		const end = (e) => {
			if (e.target === node) done.current?.();
		};
		node.addEventListener("animationend", end);
		return () => node.removeEventListener("animationend", end);
	}, []);
	return /* @__PURE__ */ jsx(As, {
		...rest,
		ref: setRef,
		className: cx("hm-animate", className),
		"data-hm-anim": animation,
		"data-hm-trigger": trigger === "mount" ? void 0 : trigger,
		style: {
			...vars,
			...index !== void 0 ? { "--hm-i": index } : null,
			...style
		},
		onClick: (e) => {
			onClick?.(e);
			if (trigger === "click") restart();
		}
	});
}
/**
* Imperative animation: `const [ref, play] = useAnimate<HTMLButtonElement>()` then `play("shake")` (for example when a
* form fails). `play` resolves when the animation ends.
*/
function useAnimate() {
	const ref = useRef(null);
	return [ref, useCallback((name, options) => ref.current ? animate(ref.current, name, options) : Promise.resolve(), [])];
}
/**
* A number that counts up (or down) to its value with an eased ramp. The final value is the accessible name. Reduced
* motion shows the final value. The ramp writes the text directly and commits to React state once, at the end, so a
* count is not a re-render per frame.
*/
function CountUp({ value, duration = 1200, format, locale, whenInView = true, className, ...rest }) {
	const reduced = useReducedMotion();
	const ref = useRef(null);
	const text = useRef(null);
	const from = useRef(0);
	const [shown, setShown] = useState(reduced ? value : 0);
	const [started, setStarted] = useState(!whenInView);
	const fmt = useCallback((n) => typeof format === "function" ? format(n) : new Intl.NumberFormat(locale, format).format(n), [format, locale]);
	const format$ = useRef(fmt);
	format$.current = fmt;
	useEffect(() => {
		if (started) return;
		const node = ref.current;
		if (!node || typeof IntersectionObserver === "undefined") {
			setStarted(true);
			return;
		}
		const io = new IntersectionObserver(([e]) => {
			if (e?.isIntersecting) {
				setStarted(true);
				io.disconnect();
			}
		});
		io.observe(node);
		return () => io.disconnect();
	}, [started]);
	useEffect(() => {
		if (!started) return;
		if (reduced) {
			from.current = value;
			setShown(value);
			return;
		}
		const start = from.current;
		const t0 = performance.now();
		let raf = 0;
		const tick = (now) => {
			const p = Math.min(1, (now - t0) / duration);
			const eased = 1 - (1 - p) ** 4;
			const current = start + (value - start) * eased;
			from.current = current;
			if (text.current) text.current.textContent = format$.current(p < 1 ? current : value);
			if (p < 1) raf = requestAnimationFrame(tick);
			else setShown(value);
		};
		raf = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(raf);
	}, [
		value,
		duration,
		started,
		reduced
	]);
	return /* @__PURE__ */ jsxs("span", {
		...rest,
		ref,
		className: cx("hm-countup", className),
		children: [/* @__PURE__ */ jsx("span", {
			className: "hm-sr-only",
			children: fmt(value)
		}), /* @__PURE__ */ jsx("span", {
			"aria-hidden": "true",
			ref: text,
			children: fmt(Math.abs(shown - value) < .5 && Number.isInteger(value) ? value : shown)
		})]
	});
}
/**
* Types text out a character at a time. The full text is the accessible name; reduced motion shows the first string.
* It pauses while off screen and carries on from where it was when it comes back.
*/
function Typewriter({ text, speed = 55, hold = 1400, loop, cursor = true, className, ...rest }) {
	const lines = Array.isArray(text) ? text : [text];
	const joined = lines.join("\n");
	const reduced = useReducedMotion();
	const [out, setOut] = useState(reduced ? lines[0] ?? "" : "");
	const shouldLoop = loop ?? lines.length > 1;
	const ref = useRef(null);
	const visible = useInView(ref, { threshold: 0 });
	const at = useRef({
		joined,
		line: 0,
		n: 0,
		erasing: false
	});
	if (at.current.joined !== joined) at.current = {
		joined,
		line: 0,
		n: 0,
		erasing: false
	};
	useEffect(() => {
		if (reduced) {
			setOut(lines[0] ?? "");
			return;
		}
		if (!visible) return;
		const s = at.current;
		let timer;
		const step = () => {
			const current = lines[s.line] ?? "";
			if (!s.erasing) {
				s.n += 1;
				setOut(current.slice(0, s.n));
				if (s.n >= current.length) {
					if (!shouldLoop && s.line === lines.length - 1) return;
					s.erasing = true;
					timer = setTimeout(step, hold);
					return;
				}
				timer = setTimeout(step, speed);
			} else {
				s.n -= 1;
				setOut(current.slice(0, Math.max(0, s.n)));
				if (s.n <= 0) {
					s.erasing = false;
					s.line = (s.line + 1) % lines.length;
					timer = setTimeout(step, speed * 4);
					return;
				}
				timer = setTimeout(step, speed / 2);
			}
		};
		const current = lines[s.line] ?? "";
		if (!s.erasing && s.n >= current.length && !shouldLoop && s.line === lines.length - 1) return;
		timer = setTimeout(step, s.erasing && s.n >= current.length ? hold : speed);
		return () => clearTimeout(timer);
	}, [
		joined,
		speed,
		hold,
		shouldLoop,
		reduced,
		visible
	]);
	return /* @__PURE__ */ jsxs("span", {
		...rest,
		ref,
		className: cx("hm-typewriter", className),
		children: [
			/* @__PURE__ */ jsx("span", {
				className: "hm-sr-only",
				children: lines.join(". ")
			}),
			/* @__PURE__ */ jsx("span", {
				"aria-hidden": "true",
				children: out
			}),
			cursor ? /* @__PURE__ */ jsx("span", {
				className: "hm-typewriter-caret",
				"aria-hidden": "true"
			}) : null
		]
	});
}
//#endregion
export { Animate, CountUp, Typewriter, useAnimate };

//# sourceMappingURL=animate.js.map