import { hasFinePointer, prefersReducedMotion } from "../utils/motion.js";
//#region src/interaction/light.ts
/**
* Pointer light for every lit surface inside a container, with one delegated listener. The light never jumps: the
* pointer position is a target that a frame-rate independent exponential ease (`1 - e^(-dt/tau)`) chases, so the
* spotlight (--hm-mx/--hm-my), each lit surface's local light (--hm-px/--hm-py) and the tilt (--hm-rx/--hm-ry) glide
* to where the pointer is. None of these inherit into a surface's content, so a frame restyles only the elements that
* draw the light. Local positions are derived from the eased point every frame, so scrolling content under a
* still pointer moves the light smoothly too. The loop runs only while something is moving, reads all layout before
* writing, fine pointers only; tilt is skipped under reduced motion and easing is skipped (the light snaps).
*/
function createLightField(container, options = {}) {
	const { selector = "[data-lit], .hm-surface[data-variant=\"holo\"]", tilt = 4, track = true, ease = 110 } = options;
	if (!hasFinePointer()) return () => {};
	let raf = 0;
	let lastTime = 0;
	let seen = false;
	let tx = 0;
	let ty = 0;
	let sx = 0;
	let sy = 0;
	let hovered = null;
	const tilts = /* @__PURE__ */ new Map();
	let targets = null;
	let trackedAt = -Infinity;
	const smoothing = (dt, tau) => tau <= 0 ? 1 : 1 - Math.exp(-dt / tau);
	const frame = (now) => {
		raf = 0;
		const dt = Math.min(64, lastTime ? now - lastTime : 16);
		lastTime = now;
		const snap = prefersReducedMotion(container);
		const k = snap ? 1 : smoothing(dt, ease);
		const kTilt = snap ? 1 : smoothing(dt, ease * 1.4);
		sx += (tx - sx) * k;
		sy += (ty - sy) * k;
		if (Math.abs(tx - sx) < .05) sx = tx;
		if (Math.abs(ty - sy) < .05) sy = ty;
		const target = document.elementFromPoint(tx, ty)?.closest(selector) ?? null;
		const surface = target && container.contains(target) ? target : null;
		const rect = surface?.getBoundingClientRect();
		if (surface !== hovered) {
			if (hovered && tilts.has(hovered)) {
				const t = tilts.get(hovered);
				if (t) {
					t.tx = 0;
					t.ty = 0;
				}
			}
			hovered = surface;
		}
		let moving = sx !== tx || sy !== ty;
		if (track) {
			if (now - trackedAt > 1e3) {
				trackedAt = now;
				targets = container.querySelectorAll(".hm-atmosphere, [data-hm-track]");
			}
			const mx = `${sx.toFixed(1)}px`;
			const my = `${sy.toFixed(1)}px`;
			for (const el of targets ?? []) {
				el.style.setProperty("--hm-mx", mx);
				el.style.setProperty("--hm-my", my);
			}
		}
		if (surface && rect) {
			surface.style.setProperty("--hm-px", `${(sx - rect.left).toFixed(1)}px`);
			surface.style.setProperty("--hm-py", `${(sy - rect.top).toFixed(1)}px`);
			if (tilt && surface.hasAttribute("data-tilt") && !snap) {
				const t = tilts.get(surface) ?? {
					rx: 0,
					ry: 0,
					tx: 0,
					ty: 0
				};
				t.tx = ((sx - rect.left) / rect.width - .5) * 2 * tilt;
				t.ty = ((sy - rect.top) / rect.height - .5) * -2 * tilt;
				tilts.set(surface, t);
			}
		}
		for (const [el, t] of tilts) {
			t.rx += (t.ty - t.rx) * kTilt;
			t.ry += (t.tx - t.ry) * kTilt;
			const settled = Math.abs(t.ty - t.rx) < .01 && Math.abs(t.tx - t.ry) < .01;
			if (settled && t.tx === 0 && t.ty === 0) {
				el.style.removeProperty("--hm-rx");
				el.style.removeProperty("--hm-ry");
				tilts.delete(el);
				continue;
			}
			el.style.setProperty("--hm-rx", `${t.rx.toFixed(2)}deg`);
			el.style.setProperty("--hm-ry", `${t.ry.toFixed(2)}deg`);
			if (!settled) moving = true;
		}
		if (moving) raf = requestAnimationFrame(frame);
		else lastTime = 0;
	};
	const wake = () => {
		if (!raf) raf = requestAnimationFrame(frame);
	};
	const onMove = (e) => {
		tx = e.clientX;
		ty = e.clientY;
		if (!seen) {
			seen = true;
			sx = tx;
			sy = ty;
		}
		wake();
	};
	const onLeave = () => {
		for (const t of tilts.values()) {
			t.tx = 0;
			t.ty = 0;
		}
		hovered = null;
		if (tilts.size) wake();
	};
	const onScroll = () => {
		if (seen) wake();
	};
	container.addEventListener("pointermove", onMove, { passive: true });
	container.addEventListener("pointerleave", onLeave);
	addEventListener("scroll", onScroll, {
		capture: true,
		passive: true
	});
	return () => {
		container.removeEventListener("pointermove", onMove);
		container.removeEventListener("pointerleave", onLeave);
		removeEventListener("scroll", onScroll, { capture: true });
		cancelAnimationFrame(raf);
	};
}
//#endregion
export { createLightField };

//# sourceMappingURL=light.js.map