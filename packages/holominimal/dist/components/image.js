"use client";
import { cx, flag } from "../utils/cx.js";
import { jsx } from "react/jsx-runtime";
import { useEffect, useRef, useState } from "react";
//#region src/components/image.tsx
var isImageSource = (s) => /^(data:|blob:|https?:|\/|\.)/.test(s);
/**
* An image in a fixed frame with a blur-up placeholder and a fade-in. Lazy and async-decoded by default. Without JS, or if the
* image is already complete when React hydrates, it is shown at once instead of fading.
*/
function Image({ ratio, placeholder, zoom, fit = "cover", frameClassName, className, loading = "lazy", decoding = "async", onLoad, onError, ref, ...rest }) {
	const inner = useRef(null);
	const [state, setState] = useState("idle");
	useEffect(() => {
		const img = inner.current;
		setState(img?.complete && img.naturalWidth > 0 ? "loaded" : img?.complete ? "error" : "loading");
	}, []);
	const style = {
		...ratio ? { aspectRatio: ratio } : null,
		...placeholder ? isImageSource(placeholder) ? { backgroundImage: `url("${placeholder}")` } : { backgroundColor: placeholder } : null
	};
	return /* @__PURE__ */ jsx("span", {
		className: cx("hm-image", frameClassName),
		style,
		"data-state": state,
		"data-zoom": flag(zoom),
		"data-fit": fit,
		children: /* @__PURE__ */ jsx("img", {
			...rest,
			ref: (node) => {
				inner.current = node;
				if (typeof ref === "function") return ref(node);
				if (ref) ref.current = node;
			},
			loading,
			decoding,
			className: cx("hm-image-img", className),
			onLoad: (e) => {
				setState("loaded");
				onLoad?.(e);
			},
			onError: (e) => {
				setState("error");
				onError?.(e);
			}
		})
	});
}
//#endregion
export { Image };

//# sourceMappingURL=image.js.map