//#region src/animation/presets.ts
/**
* The animation presets (`animations.css`), by group. `enter` presets arrive, `attention` presets play once to draw the
* eye, `loop` presets repeat until stopped, `exit` presets leave and stay gone. Names are the values of
* `data-hm-anim`.
*/
var animations = {
	enter: [
		"fade-in",
		"fade-up",
		"fade-down",
		"fade-left",
		"fade-right",
		"slide-up",
		"slide-down",
		"slide-left",
		"slide-right",
		"zoom-in",
		"zoom-out",
		"pop",
		"blur-in",
		"flip-x",
		"flip-y",
		"rotate-in",
		"swing-in",
		"drop",
		"unfold",
		"expand",
		"wipe-up",
		"wipe-down",
		"curtain",
		"spring-up",
		"tilt-in",
		"skew-in",
		"letter-in"
	],
	attention: [
		"pulse",
		"heartbeat",
		"shake",
		"wiggle",
		"bounce",
		"jello",
		"rubber",
		"tada",
		"flash",
		"swing",
		"ping",
		"blink",
		"flip-once",
		"hop",
		"nudge-right",
		"nudge-left",
		"nudge-up",
		"nudge-down",
		"spin-once"
	],
	loop: [
		"float",
		"breathe",
		"glow-pulse",
		"spin",
		"orbit",
		"sway",
		"shimmer-slide",
		"wave-y",
		"rise-fall"
	],
	exit: [
		"fade-out",
		"fade-out-up",
		"fade-out-down",
		"zoom-exit",
		"shrink",
		"blur-out",
		"fall",
		"slide-out-left",
		"slide-out-right"
	]
};
var time = (v) => v === void 0 ? void 0 : typeof v === "number" ? `${v}ms` : v;
/** The custom properties for a set of options, as a style object. Server-safe. */
function animationVars(o = {}) {
	const vars = {
		"--hm-anim-duration": time(o.duration),
		"--hm-anim-delay": time(o.delay),
		"--hm-anim-easing": o.easing,
		"--hm-anim-count": o.count === void 0 ? void 0 : String(o.count),
		"--hm-anim-direction": o.direction,
		"--hm-anim-distance": o.distance,
		"--hm-anim-step": time(o.step)
	};
	const out = {};
	for (const k of Object.keys(vars)) {
		const v = vars[k];
		if (v !== void 0) out[k] = v;
	}
	return out;
}
/**
* Props to spread on any element (server or client) to play a preset:
* `<h1 {...animationAttrs("fade-up", { delay: 120 })}>`. Pass `index` to stagger a list.
*/
function animationAttrs(name, options = {}) {
	const { trigger, index, ...rest } = options;
	const style = animationVars(rest);
	if (index !== void 0) style["--hm-i"] = String(index);
	return {
		"data-hm-anim": name,
		"data-hm-trigger": trigger && trigger !== "mount" ? trigger : void 0,
		style
	};
}
var reduced = (el) => {
	const forced = el.closest("[data-hm-motion]")?.getAttribute("data-hm-motion");
	if (forced === "reduce") return true;
	if (forced === "full") return false;
	return typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
};
/**
* Plays a preset on an element now and resolves when it ends: `await animate(input, "shake")`. Replays if called again.
* Entrance and attention presets clear themselves afterwards so the element rests normally; exit presets stay applied
* (pass `keep: false` to clear them too). Resolves at once under reduced motion. Browser-only.
*/
function animate(el, name, options = {}) {
	const { keep, ...rest } = options;
	const isExit = animations.exit.includes(name);
	const vars = animationVars(rest);
	for (const [k, v] of Object.entries(vars)) el.style.setProperty(k, v);
	el.setAttribute("data-hm-anim", name);
	el.setAttribute("data-hm-trigger", "manual");
	el.removeAttribute("data-hm-play");
	el.removeAttribute("data-hm-pending");
	if (reduced(el)) return Promise.resolve();
	el.offsetWidth;
	el.setAttribute("data-hm-play", "");
	const clear = () => {
		if (isExit && keep !== false) return;
		el.removeAttribute("data-hm-play");
		el.removeAttribute("data-hm-anim");
		el.removeAttribute("data-hm-trigger");
		for (const k of Object.keys(vars)) el.style.removeProperty(k);
	};
	return new Promise((resolve) => {
		const anims = el.getAnimations().filter((a) => a.animationName?.startsWith("hm-a-"));
		if (anims.length === 0) {
			clear();
			resolve();
			return;
		}
		Promise.all(anims.map((a) => a.finished.catch(() => void 0))).then(() => {
			clear();
			resolve();
		});
	});
}
//#endregion
export { animate, animationAttrs, animationVars, animations };

//# sourceMappingURL=presets.js.map