import { describe, expect, it } from "vitest";
import { embedUrl, isAudioOnly, validEmbedId } from "../src/lib/embed";
import { LEVEL, duration, usd } from "../src/lib/format";
import { TTL, makeSession, readSession } from "../src/lib/session-token";
import { safeKeyName } from "../src/lib/safe-name";

describe("embeds", () => {
  it("builds provider URLs only for valid ids", () => {
    expect(embedUrl("youtube", "dQw4w9WgXcQ")).toBe(
      "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?autoplay=1&rel=0",
    );
    expect(embedUrl("soundcloud", "123456")).toContain("w.soundcloud.com/player/?url=");
    expect(embedUrl("bandcamp", "42424242")).toContain("bandcamp.com/EmbedPlayer/album=42424242");
    expect(embedUrl("spotify", "4uLU6hMCjMI75M1A2tKUQC")).toBe(
      "https://open.spotify.com/embed/track/4uLU6hMCjMI75M1A2tKUQC",
    );
  });
  it("refuses an id or provider that could change the URL", () => {
    for (const bad of ["../x", "a b", "x?y=1", "<script>", "", "a".repeat(40)])
      expect(embedUrl("youtube", bad)).toBeNull();
    expect(embedUrl("vimeo", "12345678")).toBeNull();
    expect(validEmbedId("youtube", "dQw4w9WgXcQ")).toBe(true);
  });
  it("only YouTube is treated as video", () => {
    expect(isAudioOnly("youtube")).toBe(false);
    expect(isAudioOnly("spotify")).toBe(true);
  });
});

describe("format", () => {
  it("durations", () => {
    expect(duration(360)).toBe("6 min");
    expect(duration(3900)).toBe("1 h 5 min");
    expect(duration(null)).toBe("");
    expect(duration(30)).toBe("30 s");
  });
  it("money and levels", () => {
    expect(usd(1250)).toBe("$12.50");
    expect(LEVEL.easy).toBe("Easy");
  });
});

describe("buyer session cookie", () => {
  const id = "11111111-2222-3333-4444-555555555555";
  it("round-trips and expires", () => {
    const now = Date.now();
    const v = makeSession(id, now);
    expect(readSession(v, now + 1000)).toBe(id);
    expect(readSession(v, now + (TTL + 10) * 1000)).toBeNull();
  });
  it("rejects a changed id, a changed expiry and junk", () => {
    const v = makeSession(id);
    const [, exp, sig] = v.split(".");
    expect(readSession(`99999999-2222-3333-4444-555555555555.${exp}.${sig}`)).toBeNull();
    expect(readSession(`${id}.${Number(exp) + 99999}.${sig}`)).toBeNull();
    expect(readSession("nope")).toBeNull();
    expect(readSession(undefined)).toBeNull();
  });
});

describe("storage key names", () => {
  it("strips paths and odd characters", () => {
    expect(safeKeyName("../../etc/passwd")).toBe("passwd");
    expect(safeKeyName("My Score (final).pdf")).toBe("My-Score-final-.pdf");
    expect(safeKeyName("   ")).toBe("file");
  });
});
