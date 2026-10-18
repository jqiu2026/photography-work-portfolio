"use client";
import { createProximity } from "./proximity.js";
import { createLightField } from "./light.js";
import { createReveal } from "./reveal.js";
import { createIndicator } from "./indicator.js";
import { createSwipe } from "./swipe.js";
import { useEffect } from "react";
//#region src/interaction/hooks.ts
/**
* React bindings for the interaction engines. Options are read once per mount; pass a `key` (or change a primitive in
* `deps`) to rebuild. The engines never set React state, so pointer movement causes no re-renders.
*/
function useProximity(ref, options, deps = []) {
	useEffect(() => {
		if (!ref.current) return;
		return createProximity(ref.current, options);
	}, deps);
}
function useLightField(ref, options, deps = []) {
	useEffect(() => {
		if (!ref.current) return;
		return createLightField(ref.current, options);
	}, deps);
}
function useReveal(ref, options, deps = []) {
	useEffect(() => {
		if (!ref.current) return;
		return createReveal(ref.current, options);
	}, deps);
}
function useSwipe(ref, options, deps = []) {
	useEffect(() => {
		if (!ref.current) return;
		return createSwipe(ref.current, options);
	}, deps);
}
function useIndicator(ref, options, deps = []) {
	useEffect(() => {
		if (!ref.current) return;
		return createIndicator(ref.current, options);
	}, deps);
}
//#endregion
export { useIndicator, useLightField, useProximity, useReveal, useSwipe };

//# sourceMappingURL=hooks.js.map