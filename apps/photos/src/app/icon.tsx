import { ImageResponse } from "next/og";

export const size = { width: 512, height: 512 };
export const contentType = "image/png";

/** The app icon (tab, home screen): the initials on the site's black. A mark, never a photograph. */
export default function Icon() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#0b0b0d",
        color: "#f2f2f5",
        fontSize: 230,
        letterSpacing: -8,
        fontWeight: 600,
      }}
    >
      JQ
    </div>,
    size,
  );
}
