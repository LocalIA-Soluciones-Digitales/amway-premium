import { ImageResponse } from "next/og";

export const size = { width: 64, height: 64 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#1c1a16",
          borderRadius: 14,
        }}
      >
        <span
          style={{
            fontSize: 34,
            fontFamily: "Georgia, serif",
            color: "#f7f4ee",
          }}
        >
          A<span style={{ color: "#b8905a" }}>.</span>
        </span>
      </div>
    ),
    size
  );
}
