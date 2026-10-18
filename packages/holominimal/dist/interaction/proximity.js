import { clamp, hasFinePointer, prefersReducedMotion } from "../utils/motion.js";
//#region src/interaction/proximity.ts
var CURRENT = "[aria-current]:not([aria-current=\"false\"]), [data-active]";
function createProximity(container, options = {}) {
	const { itemSelector = "[data-hm-proximity-item]", axis = "y", reach = 96, range = 300, edge = "start", inset = 24, restBase = .1, restSpread = .3, restFalloff = 3, peak = .92, smoothing = .18, property = "--hm-k", hit = "parent", bounded = false } = options;
	let items = [];
	let cur = [];
	let active = -1;
	let pointer = null;
	let focused = -1;
	let raf = 0;
	let reduce = prefersReducedMotion(container);
	const fine = hasFinePointer();
	const collect = () => {
		const next = Array.from(container.querySelectorAll(itemSelector));
		cur = next.map((el) => {
			const prev = items.indexOf(el);
			return prev >= 0 ? cur[prev] ?? 0 : Number.parseFloat(el.style.getPropertyValue(property)) || 0;
		});
		items = next;
		active = items.findIndex((el) => el.matches(CURRENT));
	};
	const rest = (i) => active < 0 ? restBase + restSpread * .5 : restBase + restSpread * Math.exp(-Math.abs(i - active) / restFalloff);
	const paint = () => {
		let near = 0;
		let centers = null;
		if (pointer && fine && !reduce) {
			const box = container.getBoundingClientRect();
			const cross = axis === "y" ? edge === "end" ? box.right - pointer.x : pointer.x - box.left : edge === "end" ? box.bottom - pointer.y : pointer.y - box.top;
			near = clamp(1 - Math.max(0, cross - inset) / range, 0, 1);
			if (bounded) {
				const mainPos = axis === "y" ? pointer.y : pointer.x;
				const crossPos = axis === "y" ? pointer.x : pointer.y;
				const [mainLo, mainHi] = axis === "y" ? [box.top, box.bottom] : [box.left, box.right];
				const [crossLo, crossHi] = axis === "y" ? [box.left, box.right] : [box.top, box.bottom];
				near = crossPos >= crossLo && crossPos <= crossHi && mainPos >= mainLo - reach && mainPos <= mainHi + reach ? 1 : 0;
			}
			if (near > 0) centers = items.map((el) => {
				const r = (hit === "self" ? el : el.parentElement ?? el).getBoundingClientRect();
				return axis === "y" ? r.top + r.height / 2 : r.left + r.width / 2;
			});
		}
		let moving = false;
		for (let i = 0; i < items.length; i++) {
			let t;
			if (i === active) t = 1;
			else {
				t = rest(i);
				if (centers && pointer) {
					const d = (axis === "y" ? pointer.y : pointer.x) - (centers[i] ?? 0);
					t = Math.max(t, peak * Math.exp(-((d / reach) ** 2)) * near);
				}
				if (i === focused) t = Math.max(t, peak);
				t = Math.min(t, peak);
			}
			const prev = cur[i] ?? 0;
			const v = reduce ? t : prev + (t - prev) * smoothing;
			cur[i] = Math.abs(t - v) < .002 ? t : v;
			if (cur[i] !== t) moving = true;
			items[i]?.style.setProperty(property, (cur[i] ?? 0).toFixed(3));
		}
		raf = moving ? requestAnimationFrame(paint) : 0;
	};
	const kick = () => {
		if (!raf) raf = requestAnimationFrame(paint);
	};
	const onMove = (e) => {
		if (e.pointerType !== "mouse" && e.pointerType !== "pen") return;
		pointer = {
			x: e.clientX,
			y: e.clientY
		};
		kick();
	};
	const onLeave = () => {
		pointer = null;
		kick();
	};
	const onFocusIn = (e) => {
		focused = items.indexOf(e.target);
		kick();
	};
	const onFocusOut = () => {
		focused = -1;
		kick();
	};
	const motionQuery = typeof matchMedia === "function" ? matchMedia("(prefers-reduced-motion: reduce)") : null;
	const onMotionChange = () => {
		reduce = prefersReducedMotion(container);
		kick();
	};
	const observer = typeof MutationObserver === "function" ? new MutationObserver(() => {
		collect();
		reduce = prefersReducedMotion(container);
		kick();
	}) : null;
	collect();
	if (fine) addEventListener("pointermove", onMove, { passive: true });
	document.documentElement.addEventListener("pointerleave", onLeave);
	container.addEventListener("focusin", onFocusIn);
	container.addEventListener("focusout", onFocusOut);
	motionQuery?.addEventListener("change", onMotionChange);
	observer?.observe(container, {
		subtree: true,
		childList: true,
		attributes: true,
		attributeFilter: ["aria-current", "data-active"]
	});
	const wasReduce = reduce;
	reduce = true;
	paint();
	reduce = wasReduce;
	return () => {
		removeEventListener("pointermove", onMove);
		document.documentElement.removeEventListener("pointerleave", onLeave);
		container.removeEventListener("focusin", onFocusIn);
		container.removeEventListener("focusout", onFocusOut);
		motionQuery?.removeEventListener("change", onMotionChange);
		observer?.disconnect();
		cancelAnimationFrame(raf);
	};
}
//#endregion
export { createProximity };

//# sourceMappingURL=proximity.js.map