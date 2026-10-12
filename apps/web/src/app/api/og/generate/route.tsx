import { ImageResponse } from "next/og";

export const runtime = "nodejs";

/** Social share image: title on warm paper. Title is clamped; no external fetches. */
export async function GET(request: Request) {
  const title = (new URL(request.url).searchParams.get("title") || "Jerry Qiu").slice(0, 90);
  return new ImageResponse(
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        width: "100%",
        height: "100%",
        padding: "72px",
        background: "#f5f2ec",
        color: "#1b1a17",
      }}
    >
      <div style={{ fontSize: 28, letterSpacing: 4, textTransform: "uppercase", color: "#66625a" }}>Jerry Qiu</div>
      <div style={{ fontSize: 96, lineHeight: 1.02, letterSpacing: -3, maxWidth: 1000 }}>{title}</div>
      <div style={{ fontSize: 28, color: "#66625a" }}>jerryqiu.com</div>
    </div>,
    { width: 1200, height: 630 },
  );
}
