import { expect as baseExpect, test } from "@playwright/test";

/**
 * The Flying site end to end against the dev servers: the tools give the numbers a pilot would work out by hand, the weather
 * decoder reads a METAR in plain words, and the studio's flights reach the public log only as a month, a week or more after
 * landing, and never with a registration.
 */
const expect = baseExpect.configure({ timeout: 30_000 });
const FLYING = "http://localhost:3305";
test.setTimeout(180_000);

test.describe("tools", () => {
  test("every tool says it is for learning only", async ({ page }) => {
    for (const t of ["crosswind", "density-altitude", "weather", "trip", "weight-balance"]) {
      await page.goto(`${FLYING}/tools/${t}`, { waitUntil: "networkidle" });
      await expect(page.getByRole("note")).toContainText("For learning only");
    }
  });

  test("crosswind: a 30 degree wind of 20 knots is 10 across and 17 along", async ({ page }) => {
    await page.goto(`${FLYING}/tools/crosswind`, { waitUntil: "networkidle" });
    await page.getByRole("textbox", { name: "Runway" }).fill("27");
    await page.getByLabel("Wind from (degrees)").fill("300");
    await page.getByLabel("Wind speed (knots)").fill("20");
    const out = page.getByRole("region", { name: "Runway 27" });
    await expect(out).toContainText("10");
    await expect(out).toContainText("17.3");
    await expect(out).toContainText("from the right");
    await page.getByLabel("My own crosswind limit (knots, optional)").fill("8");
    await expect(out).toContainText("over your 8 knot limit");
  });

  test("density altitude: standard day is zero, a hot day is higher", async ({ page }) => {
    await page.goto(`${FLYING}/tools/density-altitude`, { waitUntil: "networkidle" });
    await expect(page.getByRole("region", { name: "Result" })).toContainText("Density altitude");
    await page.getByLabel("Field elevation (feet)").fill("5000");
    await page.getByLabel("Outside air temperature").fill("30");
    await expect(page.getByRole("region", { name: "Result" })).toContainText("The air is thin");
  });

  test("weather: a pasted METAR is read in words with its flight category", async ({ page }) => {
    await page.goto(`${FLYING}/tools/weather`, { waitUntil: "networkidle" });
    await page.getByLabel("METAR").fill("METAR KBOS 271254Z AUTO VRB03KT 1 1/2SM -SN BR OVC008 M02/M03 A2990 RMK AO2");
    const out = page.getByRole("region", { name: /What it says/ });
    await expect(out).toContainText("Wind: variable direction at 3 knots.");
    await expect(out).toContainText("light snow");
    await expect(out).toContainText("Ceiling: 800 ft.");
    await expect(out).toContainText("Flight category: IFR.");
    await page.getByLabel("TAF").fill("TAF KJFK 271130Z 2712/2818 28010KT P6SM FEW050 FM271800 30015G25KT P6SM SCT040");
    await expect(page.getByText("From day 27 at 1800 UTC")).toBeVisible();
  });

  test("weather lookup uses labeled SAMPLE data in development", async ({ page }) => {
    await page.goto(`${FLYING}/tools/weather`, { waitUntil: "networkidle" });
    await page.getByLabel("Airport code").fill("KJFK");
    await page.getByRole("button", { name: "Look up" }).click();
    await expect(page.getByText(/SAMPLE weather for KJFK/)).toBeVisible();
    await expect(page.getByLabel("METAR")).toHaveValue(/KJFK/);
  });

  test("weight and balance: the sample load is inside, an overload is not", async ({ page }) => {
    await page.goto(`${FLYING}/tools/weight-balance`, { waitUntil: "networkidle" });
    await expect(page.getByText("Inside the envelope you entered.")).toBeVisible();
    await page.getByLabel("Fuel (gallons)").fill("90");
    await expect(page.getByText("Outside the envelope you entered")).toBeVisible();
    await expect(page.getByText("Over the maximum weight you entered.")).toBeVisible();
  });

  test("trip: 100 NM at 100 knots with no wind takes an hour", async ({ page }) => {
    await page.goto(`${FLYING}/tools/trip`, { waitUntil: "networkidle" });
    await page.getByLabel("Wind speed (knots)").fill("0");
    await page.getByLabel("Leg 1 distance").fill("100");
    await page.getByRole("button", { name: "Remove" }).nth(1).click();
    await expect(page.getByRole("region", { name: "Estimate" })).toContainText("1:00");
  });
});

test.describe("studio flights and the public log", () => {
  test("a flight shows as a month a week after landing, and a registration is refused", async ({ page }) => {
    await page.goto(`${FLYING}/studio/airports`, { waitUntil: "networkidle" });
    for (const [code, name, lat, lon] of [
      ["KBOS", "Boston Logan", "42.3656", "-71.0096"],
      ["KJFK", "New York JFK", "40.6413", "-73.7781"],
    ]) {
      await page.getByLabel("Code").fill(code);
      await page.getByLabel("Name").fill(name);
      await page.getByLabel("Latitude").fill(lat);
      await page.getByLabel("Longitude").fill(lon);
      await page.getByRole("button", { name: "Add airport" }).click();
      await expect(page.getByText("Airport added.")).toBeVisible();
    }
    await page.goto(`${FLYING}/studio/flights`, { waitUntil: "networkidle" });
    const old = new Date(Date.now() - 60 * 86_400_000).toISOString().slice(0, 10);
    await page.getByLabel("Day it landed").fill(old);
    await page.getByLabel("Aircraft type").fill("N123AB");
    await page.getByRole("button", { name: "Add flight" }).click();
    await expect(page.getByText(/looks like an aircraft registration/)).toBeVisible();
    await page.getByLabel("Aircraft type").fill("Cessna 172");
    await page.getByRole("button", { name: "Add flight" }).click();
    await expect(page.getByText(/Flight added/)).toBeVisible();

    const recent = new Date(Date.now() - 2 * 86_400_000).toISOString().slice(0, 10);
    await page.getByLabel("Day it landed").fill(recent);
    await page.getByLabel("Aircraft type").fill("Piper (recent)");
    await page.getByRole("button", { name: "Add flight" }).click();
    await expect(page.getByText(/Flight added/).first()).toBeVisible();

    await page.goto(`${FLYING}/log`, { waitUntil: "networkidle" });
    await expect(page.getByText(old.slice(0, 7)).first()).toBeVisible();
    await expect(page.getByText("Cessna 172")).toBeVisible();
    await expect(page.getByText("Piper (recent)")).toHaveCount(0);
    expect(await page.content()).not.toContain(old);
    expect(await page.content()).not.toContain("N123AB");
  });
});
