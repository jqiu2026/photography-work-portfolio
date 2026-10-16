import { ImageResponse } from "next/og";

export const alt = "Jerry Qiu · Photography";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** A text card, never a photograph: link previews must not become an unprotected path to the work. */
export default function OgImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: 80,
        background: "#0b0b0d",
        color: "#f2f2f5",
      }}
    >
      <div style={{ fontSize: 28, letterSpacing: 6, textTransform: "uppercase", color: "#ff5a4d" }}>
        Jerry Qiu · Photography
      </div>
      <div style={{ fontSize: 88, lineHeight: 1.05, marginTop: 24 }}>Pictures of people at work.</div>
    </div>,
    size,
  );
}
