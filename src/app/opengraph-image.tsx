import { ImageResponse } from "next/og";

export const runtime = "edge";
export const dynamic = "force-static";
export const alt = "CourseDrop — Study Material Portal";
export const contentType = "image/png";
export const size = {
  width: 1200,
  height: 630,
};

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background:
            "radial-gradient(circle at 20% 20%, #818cf8 0%, #4f46e5 35%, #1e40af 100%)",
          color: "#ffffff",
          padding: "58px 72px",
          fontFamily:
            "Segoe UI, Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Helvetica, Arial",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            width: 400,
            height: 400,
            borderRadius: 9999,
            background: "rgba(255,255,255,0.08)",
            top: -120,
            right: -80,
          }}
        />
        <div
          style={{
            position: "absolute",
            width: 330,
            height: 330,
            borderRadius: 9999,
            background: "rgba(255,255,255,0.06)",
            bottom: -140,
            left: 420,
          }}
        />

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            width: 760,
            zIndex: 2,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 18,
              marginBottom: 22,
            }}
          >
            <div
              style={{
                width: 82,
                height: 82,
                borderRadius: 24,
                border: "2px solid rgba(255,255,255,0.35)",
                background: "rgba(255,255,255,0.14)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 34,
                fontWeight: 800,
                letterSpacing: -1,
              }}
            >
              CD
            </div>
            <span style={{ fontSize: 58, fontWeight: 800, letterSpacing: -1.8 }}>
              CourseDrop
            </span>
          </div>

          <div
            style={{
              fontSize: 62,
              fontWeight: 800,
              lineHeight: 1.08,
              letterSpacing: -1.4,
              maxWidth: 740,
            }}
          >
            Study Material Portal
          </div>

          <div
            style={{
              marginTop: 18,
              fontSize: 30,
              fontWeight: 500,
              lineHeight: 1.25,
              color: "rgba(255,255,255,0.93)",
              maxWidth: 720,
            }}
          >
            Teachers share subject-wise files. Students access instantly.
          </div>

          <div
            style={{
              marginTop: 36,
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            <div
              style={{
                padding: "9px 18px",
                borderRadius: 9999,
                background: "rgba(255,255,255,0.18)",
                border: "1px solid rgba(255,255,255,0.26)",
                fontSize: 22,
                fontWeight: 700,
              }}
            >
              Teacher Uploads
            </div>
            <div
              style={{
                padding: "9px 18px",
                borderRadius: 9999,
                background: "rgba(255,255,255,0.18)",
                border: "1px solid rgba(255,255,255,0.26)",
                fontSize: 22,
                fontWeight: 700,
              }}
            >
              Student Access
            </div>
          </div>
        </div>

        <div
          style={{
            width: 286,
            height: 286,
            borderRadius: 72,
            background: "rgba(255,255,255,0.15)",
            border: "2px solid rgba(255,255,255,0.34)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 2,
          }}
        >
          <div
            style={{
              width: 198,
              height: 198,
              borderRadius: 58,
              background: "rgba(255,255,255,0.92)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#1d4ed8",
              fontSize: 88,
              fontWeight: 800,
              letterSpacing: -2,
            }}
          >
            CD
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}