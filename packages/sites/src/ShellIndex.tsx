"use client";

import { IndexControl, type IndexRoute } from "@halation/ui/stage";
import NextLink from "next/link";

/** Client wrapper so the index control can use the router's Link (functions cannot cross the server boundary). */
export function ShellIndex({ routes }: { routes: IndexRoute[] }) {
  return <IndexControl title="Index" linkAs={NextLink} routes={routes} />;
}
