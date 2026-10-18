//#region src/utils/motion.ts
/**
* Whether motion should be reduced for an element: the OS preference, unless the nearest theme forces
* `data-hm-motion="full"`, or forced on by `data-hm-motion="reduce"`. Browser-only; call it inside effects.
*/
function prefersReducedMotion(el) {
	const forced = el?.closest("[data-hm-motion]")?.getAttribute("data-hm-motion");
	if (forced === "reduce") return true;
	if (forced === "full") return false;
	return typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
}
/** A mouse or trackpad (hover-capable, precise). Touch screens get conventional, non-magnifying behavior. */
function hasFinePointer() {
	return typeof matchMedia === "function" && matchMedia("(hover: hover) and (pointer: fine)").matches;
}
var clamp = (v, lo, hi) => v < lo ? lo : v > hi ? hi : v;
//#endregion
export { clamp, hasFinePointer, prefersReducedMotion };

//# sourceMappingURL=motion.js.map