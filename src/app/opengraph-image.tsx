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
          background: "linear-gradient(135deg, #1c1a16 0%, #2c2822 60%, #1c1a16 100%)",
          color: "#f7f4ee",
          fontFamily: "Georgia, serif",
        }}
      >
        <div style={{ display: "flex", fontSize: 28, color: "#e4cba3", letterSpacing: 4 }}>
          AMWAY BARAKALDO
        </div>
        <div style={{ display: "flex", fontSize: 64, marginTop: 24, maxWidth: 900, lineHeight: 1.1 }}>
          Productos Premium de Estados Unidos para tu Bienestar
        </div>
        <div style={{ display: "flex", fontSize: 26, marginTop: 32, color: "#b7ae9b" }}>
          Nutrición · Belleza · Hogar · XS Energy
        </div>
      </div>
    ),
    size
  );
}
