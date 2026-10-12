"use client";

import { motionValue, useReducedMotion, type MotionValue } from "motion/react";
import { createContext, useContext } from "react";

/** True when the visitor asked for reduced motion. Components must render a complete static state. */
export function useCalm(): boolean {
  return useReducedMotion() ?? false;
}

const SceneContext = createContext<MotionValue<number> | null>(null);
export const SceneProvider = SceneContext.Provider;
const still = motionValue(1);

/** Scroll progress (0 to 1) of the nearest PinnedScene. Returns 1 (final state) when there is no scene or motion is reduced. */
export function useSceneProgress(): MotionValue<number> {
  return useContext(SceneContext) ?? still;
}
