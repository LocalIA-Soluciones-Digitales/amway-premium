import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OgImage() {
  const logo = await readFile(path.join(process.cwd(), "public/brand/logo-mark.png"));
  const logoSrc = `data:image/png;base64,${logo.toString("base64")}`;

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
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <div
            style={{
              display: "flex",
              width: 88,
              height: 88,
              borderRadius: 44,
              background: "#f7f4ee",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={logoSrc} width={68} height={68} alt="" />
          </div>
          <div style={{ display: "flex", fontSize: 28, color: "#e4cba3", letterSpacing: 4 }}>
            AMWAY BARAKALDO
          </div>
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
