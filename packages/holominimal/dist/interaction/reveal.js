import { prefersReducedMotion } from "../utils/motion.js";
//#region src/interaction/reveal.ts
/**
* Scroll reveals. Elements are only hidden once this runs (`data-hm-reveal="pending"`), so without JS, under reduced
* motion, or before hydration, content is simply visible. Items already in view on start are shown at once.
*/
function createReveal(container, options = {}) {
	const { selector = "[data-hm-reveal]", rootMargin = "0px 0px -8% 0px", once = true } = options;
	const els = Array.from(container.querySelectorAll(selector));
	if (container.matches(selector)) els.unshift(container);
	if (typeof IntersectionObserver !== "function" || prefersReducedMotion(container)) {
		for (const el of els) el.setAttribute("data-hm-reveal", "shown");
		return () => {};
	}
	const io = new IntersectionObserver((entries) => {
		for (const entry of entries) {
			const el = entry.target;
			if (entry.isIntersecting) {
				el.setAttribute("data-hm-reveal", "shown");
				if (once) io.unobserve(el);
			} else if (!once) el.setAttribute("data-hm-reveal", "pending");
		}
	}, { rootMargin });
	const vh = innerHeight;
	for (const el of els) {
		const r = el.getBoundingClientRect();
		if (r.top < vh && r.bottom > 0) el.setAttribute("data-hm-reveal", "shown");
		else {
			el.setAttribute("data-hm-reveal", "pending");
			io.observe(el);
		}
	}
	return () => io.disconnect();
}
//#endregion
export { createReveal };

//# sourceMappingURL=reveal.js.map