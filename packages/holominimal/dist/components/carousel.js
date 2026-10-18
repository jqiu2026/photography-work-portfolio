"use client";
import { cx } from "../utils/cx.js";
import { prefersReducedMotion } from "../utils/motion.js";
import { ChevronLeftIcon, ChevronRightIcon } from "../icons/interface.js";
import { jsx, jsxs } from "react/jsx-runtime";
import { Children, useCallback, useEffect, useRef, useState } from "react";
//#region src/components/carousel.tsx
/**
* A scroll-snap carousel: touch and trackpad scrolling are native, buttons and the arrow keys move a slide at a time
* with an eased scroll, and the dots stretch to show where you are. Each child is a slide announced as "N of M".
*/
function Carousel({ children, perView = 1, gap = "1rem", autoplay, dots = true, index: controlled, onIndexChange, className, style, onKeyDown, ...rest }) {
	const slides = Children.toArray(children);
	const count = slides.length;
	const track = useRef(null);
	const [inner, setInner] = useState(0);
	const index = controlled ?? inner;
	const [paused, setPaused] = useState(false);
	const last = Math.max(0, count - perView);
	const goTo = useCallback((to, behavior) => {
		const el = track.current;
		const target = Math.max(0, Math.min(last, to));
		const slide = el?.children[target];
		if (!el || !slide) return;
		el.scrollTo({
			left: slide.offsetLeft - el.offsetLeft,
			behavior: behavior ?? (prefersReducedMotion(el) ? "auto" : "smooth")
		});
	}, [last]);
	useEffect(() => {
		const el = track.current;
		if (!el) return;
		let raf = 0;
		const onScroll = () => {
			if (raf) return;
			raf = requestAnimationFrame(() => {
				raf = 0;
				let best = 0;
				let dist = Number.POSITIVE_INFINITY;
				Array.from(el.children).forEach((c, i) => {
					const d = Math.abs(c.offsetLeft - el.offsetLeft - el.scrollLeft);
					if (d < dist) {
						dist = d;
						best = i;
					}
				});
				best = Math.min(best, last);
				setInner(best);
				if (best !== index) onIndexChange?.(best);
			});
		};
		el.addEventListener("scroll", onScroll, { passive: true });
		return () => {
			el.removeEventListener("scroll", onScroll);
			cancelAnimationFrame(raf);
		};
	}, [
		last,
		index,
		onIndexChange
	]);
	const synced = useRef(index);
	useEffect(() => {
		if (controlled !== void 0 && controlled !== synced.current) goTo(controlled);
		synced.current = index;
	}, [
		controlled,
		index,
		goTo
	]);
	useEffect(() => {
		if (!autoplay || paused || count <= perView) return;
		const el = track.current;
		if (el && prefersReducedMotion(el)) return;
		const t = setInterval(() => goTo(index >= last ? 0 : index + 1), autoplay);
		return () => clearInterval(t);
	}, [
		autoplay,
		paused,
		index,
		last,
		count,
		perView,
		goTo
	]);
	return /* @__PURE__ */ jsxs("section", {
		...rest,
		"aria-roledescription": "carousel",
		className: cx("hm-carousel", className),
		style: {
			"--_per": perView,
			"--_gap": gap,
			...style
		},
		onMouseEnter: () => setPaused(true),
		onMouseLeave: () => setPaused(false),
		onFocus: () => setPaused(true),
		onBlur: () => setPaused(false),
		onKeyDown: (e) => {
			onKeyDown?.(e);
			if (e.defaultPrevented) return;
			if (e.key === "ArrowRight") goTo(index + 1);
			else if (e.key === "ArrowLeft") goTo(index - 1);
			else return;
			e.preventDefault();
		},
		children: [
			/* @__PURE__ */ jsx("div", {
				ref: track,
				className: "hm-carousel-track",
				tabIndex: 0,
				"aria-live": autoplay && !paused ? "off" : "polite",
				children: slides.map((slide, i) => /* @__PURE__ */ jsx("div", {
					role: "group",
					"aria-roledescription": "slide",
					"aria-label": `${i + 1} of ${count}`,
					className: "hm-carousel-slide",
					children: slide
				}, i))
			}),
			/* @__PURE__ */ jsx("button", {
				type: "button",
				className: "hm-carousel-nav",
				"data-side": "prev",
				"aria-label": "Previous slide",
				disabled: index <= 0,
				onClick: () => goTo(index - 1),
				children: /* @__PURE__ */ jsx(ChevronLeftIcon, {
					size: 14,
					strokeWidth: 1.6
				})
			}),
			/* @__PURE__ */ jsx("button", {
				type: "button",
				className: "hm-carousel-nav",
				"data-side": "next",
				"aria-label": "Next slide",
				disabled: index >= last,
				onClick: () => goTo(index + 1),
				children: /* @__PURE__ */ jsx(ChevronRightIcon, {
					size: 14,
					strokeWidth: 1.6
				})
			}),
			dots && count > perView ? /* @__PURE__ */ jsx("div", {
				className: "hm-carousel-dots",
				children: Array.from({ length: last + 1 }, (_, i) => /* @__PURE__ */ jsx("button", {
					type: "button",
					className: "hm-carousel-dot",
					"aria-label": `Go to slide ${i + 1}`,
					"aria-current": i === index ? "true" : void 0,
					onClick: () => goTo(i)
				}, i))
			}) : null
		]
	});
}
//#endregion
export { Carousel };

//# sourceMappingURL=carousel.js.map