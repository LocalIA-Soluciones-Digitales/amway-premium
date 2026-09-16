import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: 80,
          background: "linear-gradient(135deg, #05060a 0%, #101826 60%, #05060a 100%)",
          color: "#f7f7f5",
          fontFamily: "Georgia, serif",
        }}
      >
        <div style={{ display: "flex", fontSize: 28, color: "#35d0a1", letterSpacing: 4 }}>
          AMWAY BARAKALDO
        </div>
        <div style={{ display: "flex", fontSize: 64, marginTop: 24, maxWidth: 900, lineHeight: 1.1 }}>
          Productos Premium de Estados Unidos para tu Bienestar
        </div>
        <div style={{ display: "flex", fontSize: 26, marginTop: 32, color: "#8b8fa3" }}>
          Nutrición · Belleza · Hogar · XS Energy
        </div>
      </div>
    ),
    size
  );
}
