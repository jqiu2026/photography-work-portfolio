import { cx } from "./cx.js";
import { Children, cloneElement, isValidElement } from "react";
//#region src/utils/slot.tsx
function mergeRefs(...refs) {
	return (node) => {
		const cleanups = [];
		for (const ref of refs) if (typeof ref === "function") {
			const c = ref(node);
			if (typeof c === "function") cleanups.push(c);
		} else if (ref) ref.current = node;
		return cleanups.length ? () => cleanups.forEach((c) => c()) : void 0;
	};
}
/**
* Renders its only child with the slot's props merged in (class names joined, styles merged, handlers chained, refs
* composed). This is what `asChild` uses, so a component can style a framework link (`next/link`, a router link)
* without the library depending on any router.
*/
function Slot({ children, ref, ...props }) {
	const child = Children.only(children);
	if (!isValidElement(child)) return null;
	const childProps = child.props;
	const merged = {
		...props,
		...childProps
	};
	for (const key of Object.keys(props)) {
		const a = props[key];
		const b = childProps[key];
		if (key === "className") merged.className = cx(a, b);
		else if (key === "style") merged.style = {
			...a,
			...b
		};
		else if (/^on[A-Z]/.test(key) && typeof a === "function" && typeof b === "function") merged[key] = (...args) => {
			b(...args);
			a(...args);
		};
	}
	const childRef = childProps.ref;
	if (ref || childRef) merged.ref = mergeRefs(ref, childRef);
	return cloneElement(child, merged);
}
//#endregion
export { Slot };

//# sourceMappingURL=slot.js.map