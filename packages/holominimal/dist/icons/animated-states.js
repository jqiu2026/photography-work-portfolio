import { jsx, jsxs } from "react/jsx-runtime";
//#region src/icons/animated-states.tsx
var steps = {
	xs: 12,
	sm: 16,
	md: 20,
	lg: 24,
	xl: 32
};
function Svg({ name, size = "1em", strokeWidth = 1.75, title, className, children, data, ...rest }) {
	const px = typeof size === "string" && size in steps ? steps[size] : size;
	return /* @__PURE__ */ jsxs("svg", {
		viewBox: "0 0 24 24",
		width: px,
		height: px,
		fill: "none",
		stroke: "currentColor",
		strokeWidth,
		strokeLinecap: "round",
		strokeLinejoin: "round",
		role: title ? "img" : void 0,
		"aria-hidden": title ? void 0 : true,
		focusable: "false",
		className: className ? `hm-icon hm-ai hm-ai-${name} ${className}` : `hm-icon hm-ai hm-ai-${name}`,
		...data,
		...rest,
		children: [title ? /* @__PURE__ */ jsx("title", { children: title }) : null, children]
	});
}
var flag = (on) => on ? "" : void 0;
/** Three lines that turn into a cross. */
function MenuCloseIcon({ open = false, ...p }) {
	return /* @__PURE__ */ jsxs(Svg, {
		name: "menu",
		data: { "data-open": flag(open) },
		...p,
		children: [
			/* @__PURE__ */ jsx("path", {
				className: "hm-ai-top",
				d: "M4 7h16"
			}),
			/* @__PURE__ */ jsx("path", {
				className: "hm-ai-mid",
				d: "M4 12h16"
			}),
			/* @__PURE__ */ jsx("path", {
				className: "hm-ai-bot",
				d: "M4 17h16"
			})
		]
	});
}
/** A plus that turns into a cross (a quarter turn with a spring). */
function PlusCloseIcon({ open = false, ...p }) {
	return /* @__PURE__ */ jsx(Svg, {
		name: "plus",
		data: { "data-open": flag(open) },
		...p,
		children: /* @__PURE__ */ jsxs("g", {
			className: "hm-ai-turn",
			children: [/* @__PURE__ */ jsx("path", { d: "M12 5v14" }), /* @__PURE__ */ jsx("path", { d: "M5 12h14" })]
		})
	});
}
/** A chevron that turns over: `down` points down when closed and up when open; `right` points right, then down. */
function ChevronToggleIcon({ open = false, direction = "down", ...p }) {
	return /* @__PURE__ */ jsx(Svg, {
		name: "chevron",
		data: {
			"data-open": flag(open),
			"data-direction": direction
		},
		...p,
		children: /* @__PURE__ */ jsx("path", {
			className: "hm-ai-turn",
			d: "M7 10l5 5 5-5"
		})
	});
}
/** A play triangle that becomes two pause bars (the shapes morph in browsers that animate path data). */
function PlayPauseIcon({ playing = false, ...p }) {
	return /* @__PURE__ */ jsxs(Svg, {
		name: "playpause",
		data: { "data-playing": flag(playing) },
		...p,
		children: [/* @__PURE__ */ jsx("path", {
			className: "hm-ai-l",
			d: "M7.5 5.5L12 8.2V15.8L7.5 18.5Z",
			fill: "currentColor"
		}), /* @__PURE__ */ jsx("path", {
			className: "hm-ai-r",
			d: "M12 8.2L17.5 12L17.5 12L12 15.8Z",
			fill: "currentColor"
		})]
	});
}
/** A circle and a check that draw themselves when `active` turns on. */
function SuccessIcon({ active = true, ...p }) {
	return /* @__PURE__ */ jsxs(Svg, {
		name: "draw",
		data: { "data-active": flag(active) },
		...p,
		children: [/* @__PURE__ */ jsx("circle", {
			className: "hm-ai-ring",
			cx: "12",
			cy: "12",
			r: "9",
			pathLength: 1
		}), /* @__PURE__ */ jsx("path", {
			className: "hm-ai-mark",
			d: "M7.8 12.4l2.9 2.9 5.5-6",
			pathLength: 1
		})]
	});
}
/** A circle and a cross that draw themselves, then shake. */
function ErrorIcon({ active = true, ...p }) {
	return /* @__PURE__ */ jsxs(Svg, {
		name: "draw",
		data: {
			"data-active": flag(active),
			"data-shake": ""
		},
		...p,
		children: [
			/* @__PURE__ */ jsx("circle", {
				className: "hm-ai-ring",
				cx: "12",
				cy: "12",
				r: "9",
				pathLength: 1
			}),
			/* @__PURE__ */ jsx("path", {
				className: "hm-ai-mark",
				d: "M9 9l6 6",
				pathLength: 1
			}),
			/* @__PURE__ */ jsx("path", {
				className: "hm-ai-mark hm-ai-mark-2",
				d: "M15 9l-6 6",
				pathLength: 1
			})
		]
	});
}
/** A heart that fills and pops when `liked`. */
function LikeIcon({ liked = false, ...p }) {
	const d = "M12 19.8s-7.3-4.4-7.3-9.8A4.2 4.2 0 0 1 12 7.4 4.2 4.2 0 0 1 19.3 10c0 5.4-7.3 9.8-7.3 9.8z";
	return /* @__PURE__ */ jsxs(Svg, {
		name: "like",
		data: { "data-active": flag(liked) },
		...p,
		children: [/* @__PURE__ */ jsx("path", {
			className: "hm-ai-fill",
			d,
			fill: "currentColor"
		}), /* @__PURE__ */ jsx("path", { d })]
	});
}
/** A star that fills and pops when `active`. */
function StarToggleIcon({ active = false, ...p }) {
	const d = "M12 3.8l2.5 5.2 5.7.8-4.1 4 1 5.700L12 16.800l-5.100 2.700 1-5.700-4.100-4 5.700-.8z";
	return /* @__PURE__ */ jsxs(Svg, {
		name: "like",
		data: { "data-active": flag(active) },
		...p,
		children: [/* @__PURE__ */ jsx("path", {
			className: "hm-ai-fill",
			d,
			fill: "currentColor"
		}), /* @__PURE__ */ jsx("path", { d })]
	});
}
/** A bell that swings while `ringing`. */
function BellRingIcon({ ringing = false, ...p }) {
	return /* @__PURE__ */ jsx(Svg, {
		name: "bell",
		data: { "data-ringing": flag(ringing) },
		...p,
		children: /* @__PURE__ */ jsxs("g", {
			className: "hm-ai-swing",
			children: [/* @__PURE__ */ jsx("path", { d: "M6 16.5V11a6 6 0 0 1 12 0v5.5l1.500 2h-15z" }), /* @__PURE__ */ jsx("path", {
				className: "hm-ai-clapper",
				d: "M10 20.800a2 2 0 0 0 4 0"
			})]
		})
	});
}
/** Two sheets that become a check when `copied`. */
function CopyCheckIcon({ copied = false, ...p }) {
	return /* @__PURE__ */ jsxs(Svg, {
		name: "copy",
		data: { "data-active": flag(copied) },
		...p,
		children: [/* @__PURE__ */ jsxs("g", {
			className: "hm-ai-sheets",
			children: [/* @__PURE__ */ jsx("path", { d: "M15 8.500V6.500A1.500 1.500 0 0 0 13.500 5h-7A1.500 1.500 0 0 0 5 6.500v7A1.500 1.500 0 0 0 6.500 15H8.500" }), /* @__PURE__ */ jsx("rect", {
				x: "9",
				y: "9",
				width: "10",
				height: "10",
				rx: "2"
			})]
		}), /* @__PURE__ */ jsx("path", {
			className: "hm-ai-mark",
			d: "M6.600 13.200l3.800 3.800 7.200-8.600",
			pathLength: 1
		})]
	});
}
/** A speaker with sound waves; muting retracts the waves and draws a cross. `level` is 0 to 2 waves. */
function VolumeToggleIcon({ muted = false, level = 2, ...p }) {
	return /* @__PURE__ */ jsxs(Svg, {
		name: "volume",
		data: {
			"data-muted": flag(muted),
			"data-level": String(level)
		},
		...p,
		children: [
			/* @__PURE__ */ jsx("path", { d: "M4.500 9.500h3L12 6v12l-4.500-3.500h-3z" }),
			/* @__PURE__ */ jsx("path", {
				className: "hm-ai-wave hm-ai-wave-1",
				d: "M15.200 9.600a3.500 3.500 0 0 1 0 4.800",
				pathLength: 1
			}),
			/* @__PURE__ */ jsx("path", {
				className: "hm-ai-wave hm-ai-wave-2",
				d: "M17.900 7a7 7 0 0 1 0 10",
				pathLength: 1
			}),
			/* @__PURE__ */ jsx("path", {
				className: "hm-ai-cross",
				d: "M15.500 9.500l5 5",
				pathLength: 1
			}),
			/* @__PURE__ */ jsx("path", {
				className: "hm-ai-cross hm-ai-cross-2",
				d: "M20.500 9.500l-5 5",
				pathLength: 1
			})
		]
	});
}
/** An eye that closes with a slash drawn across it when `hidden`. */
function EyeToggleIcon({ hidden = false, ...p }) {
	return /* @__PURE__ */ jsxs(Svg, {
		name: "eye",
		data: { "data-hidden": flag(hidden) },
		...p,
		children: [
			/* @__PURE__ */ jsx("path", { d: "M2.500 12s3.500-6.500 9.500-6.500S21.500 12 21.500 12 18 18.500 12 18.500 2.500 12 2.500 12z" }),
			/* @__PURE__ */ jsx("circle", {
				className: "hm-ai-pupil",
				cx: "12",
				cy: "12",
				r: "2.800"
			}),
			/* @__PURE__ */ jsx("path", {
				className: "hm-ai-slash",
				d: "M4.500 4.500l15 15",
				pathLength: 1
			})
		]
	});
}
/** A padlock whose shackle lifts and swings open when `locked` is false. */
function LockToggleIcon({ locked = true, ...p }) {
	return /* @__PURE__ */ jsxs(Svg, {
		name: "lock",
		data: { "data-locked": flag(locked) },
		...p,
		children: [
			/* @__PURE__ */ jsx("rect", {
				x: "5",
				y: "11",
				width: "14",
				height: "9.500",
				rx: "2.200"
			}),
			/* @__PURE__ */ jsx("path", {
				className: "hm-ai-shackle",
				d: "M8 11V8a4 4 0 0 1 8 0v3"
			}),
			/* @__PURE__ */ jsx("path", { d: "M12 15v2" })
		]
	});
}
/** Three dots that bounce in turn. A loader. */
function DotsLoaderIcon(p) {
	return /* @__PURE__ */ jsxs(Svg, {
		name: "dots",
		...p,
		children: [
			/* @__PURE__ */ jsx("circle", {
				cx: "5",
				cy: "12",
				r: "1.900",
				fill: "currentColor",
				stroke: "none"
			}),
			/* @__PURE__ */ jsx("circle", {
				cx: "12",
				cy: "12",
				r: "1.900",
				fill: "currentColor",
				stroke: "none"
			}),
			/* @__PURE__ */ jsx("circle", {
				cx: "19",
				cy: "12",
				r: "1.900",
				fill: "currentColor",
				stroke: "none"
			})
		]
	});
}
/** Four bars that rise and fall like an equalizer. A loader, or "now playing". */
function BarsLoaderIcon(p) {
	return /* @__PURE__ */ jsxs(Svg, {
		name: "bars",
		...p,
		children: [
			/* @__PURE__ */ jsx("path", { d: "M5 6v12" }),
			/* @__PURE__ */ jsx("path", { d: "M9.700 6v12" }),
			/* @__PURE__ */ jsx("path", { d: "M14.300 6v12" }),
			/* @__PURE__ */ jsx("path", { d: "M19 6v12" })
		]
	});
}
/** A ring with a travelling arc. A loader. */
function RingLoaderIcon(p) {
	return /* @__PURE__ */ jsxs(Svg, {
		name: "ring",
		...p,
		children: [/* @__PURE__ */ jsx("circle", {
			cx: "12",
			cy: "12",
			r: "8.500",
			opacity: ".22"
		}), /* @__PURE__ */ jsx("path", {
			className: "hm-ai-arc",
			d: "M12 3.500a8.500 8.500 0 0 1 8.500 8.500"
		})]
	});
}
/** A dot with rings that ripple outward. A loader, or a live indicator. */
function PulseLoaderIcon(p) {
	return /* @__PURE__ */ jsxs(Svg, {
		name: "pulse",
		...p,
		children: [
			/* @__PURE__ */ jsx("circle", {
				cx: "12",
				cy: "12",
				r: "2.600",
				fill: "currentColor",
				stroke: "none"
			}),
			/* @__PURE__ */ jsx("circle", {
				className: "hm-ai-ripple",
				cx: "12",
				cy: "12",
				r: "5"
			}),
			/* @__PURE__ */ jsx("circle", {
				className: "hm-ai-ripple hm-ai-ripple-2",
				cx: "12",
				cy: "12",
				r: "5"
			})
		]
	});
}
/** A dot orbiting a center. A loader. */
function OrbitLoaderIcon(p) {
	return /* @__PURE__ */ jsxs(Svg, {
		name: "orbit",
		...p,
		children: [
			/* @__PURE__ */ jsx("circle", {
				cx: "12",
				cy: "12",
				r: "8",
				opacity: ".22"
			}),
			/* @__PURE__ */ jsx("circle", {
				cx: "12",
				cy: "12",
				r: "2",
				fill: "currentColor",
				stroke: "none"
			}),
			/* @__PURE__ */ jsx("g", {
				className: "hm-ai-orbit",
				children: /* @__PURE__ */ jsx("circle", {
					cx: "12",
					cy: "4",
					r: "1.800",
					fill: "currentColor",
					stroke: "none"
				})
			})
		]
	});
}
/** Signal bars that climb in turn. A loader, or a connection meter. */
function SignalLoaderIcon(p) {
	return /* @__PURE__ */ jsxs(Svg, {
		name: "signal",
		...p,
		children: [
			/* @__PURE__ */ jsx("path", { d: "M5 19v-3" }),
			/* @__PURE__ */ jsx("path", { d: "M10 19v-7" }),
			/* @__PURE__ */ jsx("path", { d: "M15 19V8" }),
			/* @__PURE__ */ jsx("path", { d: "M20 19V4.500" })
		]
	});
}
//#endregion
export { BarsLoaderIcon, BellRingIcon, ChevronToggleIcon, CopyCheckIcon, DotsLoaderIcon, ErrorIcon, EyeToggleIcon, LikeIcon, LockToggleIcon, MenuCloseIcon, OrbitLoaderIcon, PlayPauseIcon, PlusCloseIcon, PulseLoaderIcon, RingLoaderIcon, SignalLoaderIcon, StarToggleIcon, SuccessIcon, VolumeToggleIcon };

//# sourceMappingURL=animated-states.js.map