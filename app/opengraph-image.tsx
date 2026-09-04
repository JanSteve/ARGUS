import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Verdikt by Soulvai Technologies — India's First Multi-Agent Legal AI";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#101826",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "80px",
          border: "2px solid rgba(173, 138, 70, 0.4)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "4px",
              border: "2px solid #AD8A46",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#AD8A46",
              fontSize: "28px",
              fontWeight: 600,
            }}
          >
            V
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span
              style={{
                color: "#EEEAE0",
                fontSize: "24px",
                letterSpacing: "0.08em",
                fontWeight: 600,
              }}
            >
              VERDIKT
            </span>
            <span
              style={{
                color: "#56606E",
                fontSize: "14px",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
              }}
            >
              Soulvai Technologies
            </span>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <h1
            style={{
              color: "#EEEAE0",
              fontSize: "64px",
              lineHeight: 1.1,
              fontWeight: 500,
              margin: 0,
            }}
          >
            Every Indian law.
            <br />A dedicated agent.
          </h1>
          <p
            style={{
              color: "#56606E",
              fontSize: "24px",
              maxWidth: "850px",
              lineHeight: 1.4,
              margin: 0,
            }}
          >
            India’s first multi-agent legal AI platform with 12 specialist agents
            orchestrated into one unified intelligence system.
          </p>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderTop: "1px solid rgba(86, 96, 110, 0.3)",
            paddingTop: "24px",
          }}
        >
          <span style={{ color: "#AD8A46", fontSize: "16px", fontWeight: 600 }}>
            soulvai.ai
          </span>
          <span style={{ color: "#45735F", fontSize: "16px", fontWeight: 500 }}>
            ● Actively trained on Supreme Court & High Court jurisprudence
          </span>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
