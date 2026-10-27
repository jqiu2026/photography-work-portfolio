"use server";

import { allow } from "@/lib/public-action";
import { type Weather, fetchWeather } from "@/lib/weather-source";

/** One lookup per call, limited per visitor, so the page cannot be used to hammer the weather service. */
export async function lookupWeather(icao: string): Promise<Weather | { error: string }> {
  if (!(await allow("weather", 30, 600))) return { error: "Too many lookups. Wait a few minutes, or paste a report." };
  return fetchWeather(icao);
}
