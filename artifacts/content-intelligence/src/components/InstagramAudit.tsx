import { Lock, Shield, Wifi } from "lucide-react";

interface InstagramAuditProps {
  dark: boolean;
}

export function InstagramAudit({ dark: _dark }: InstagramAuditProps) {
  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: "60px 24px 80px" }}>

      {/* Premium locked card */}
      <div
        style={{
          borderRadius: 24,
          border: "1.5px solid var(--border-strong)",
          background: "var(--surface)",
          overflow: "hidden",
          position: "relative",
        }}
      >
        {/* Frosted overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "repeating-linear-gradient(135deg, transparent, transparent 3px, rgba(128,128,128,0.03) 3px, rgba(128,128,128,0.03) 6px)",
            pointerEvents: "none",
            zIndex: 0,
          }}
        />

        <div style={{ position: "relative", zIndex: 1 }}>
          {/* Top status bar */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "14px 24px",
              borderBottom: "1px solid var(--border)",
              background: "var(--surface-2)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span
                style={{
                  fontSize: "0.6rem",
                  fontWeight: 800,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: "#a78bfa",
                  background: "rgba(139,92,246,0.1)",
                  border: "1px solid rgba(139,92,246,0.2)",
                  padding: "2px 8px",
                  borderRadius: 4,
                }}
              >
                Beta
              </span>
              <span
                style={{
                  fontSize: "0.72rem",
                  fontWeight: 600,
                  color: "var(--text-muted)",
                  letterSpacing: "-0.01em",
                }}
              >
                Instagram Audit
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Lock size={12} style={{ color: "var(--text-muted)" }} />
              <span style={{ fontSize: "0.68rem", color: "var(--text-muted)", fontWeight: 600 }}>
                Proxy Routing Required
              </span>
            </div>
          </div>

          {/* Main locked content */}
          <div
            style={{
              padding: "60px 40px 56px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              textAlign: "center",
              gap: 20,
            }}
          >
            {/* Icon cluster */}
            <div style={{ position: "relative", marginBottom: 8 }}>
              <div
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: 20,
                  background: "var(--surface-2)",
                  border: "1.5px solid var(--border-strong)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Lock size={28} strokeWidth={1.5} style={{ color: "var(--text-muted)", opacity: 0.6 }} />
              </div>
              <div
                style={{
                  position: "absolute",
                  bottom: -6,
                  right: -6,
                  width: 26,
                  height: 26,
                  borderRadius: 8,
                  background: "rgba(139,92,246,0.15)",
                  border: "1px solid rgba(139,92,246,0.25)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Shield size={12} style={{ color: "#a78bfa" }} />
              </div>
            </div>

            <div>
              <h2
                style={{
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  fontWeight: 800,
                  fontSize: "1.35rem",
                  color: "var(--text-primary)",
                  letterSpacing: "-0.03em",
                  marginBottom: 10,
                }}
              >
                Instagram Audit (Beta)
              </h2>
              <p
                style={{
                  fontSize: "0.85rem",
                  color: "var(--text-muted)",
                  lineHeight: 1.7,
                  maxWidth: 440,
                  margin: "0 auto",
                }}
              >
                Full Instagram profile discovery, aesthetic auditing, and AI-generated outreach pitches — currently in private beta.
              </p>
            </div>

            {/* Requirement pills */}
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center", marginTop: 4 }}>
              {[
                { icon: <Wifi size={11} />, label: "Residential Proxy Routing" },
                { icon: <Shield size={11} />, label: "Rate-Limit Bypass Layer" },
                { icon: <Lock size={11} />, label: "Session Cookie Manager" },
              ].map((req) => (
                <div
                  key={req.label}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "6px 12px",
                    borderRadius: 8,
                    background: "var(--surface-2)",
                    border: "1px solid var(--border)",
                    fontSize: "0.72rem",
                    fontWeight: 600,
                    color: "var(--text-muted)",
                  }}
                >
                  <span style={{ opacity: 0.6 }}>{req.icon}</span>
                  {req.label}
                </div>
              ))}
            </div>

            {/* Blurred mock preview */}
            <div
              style={{
                width: "100%",
                maxWidth: 560,
                marginTop: 12,
                borderRadius: 16,
                border: "1px solid var(--border)",
                overflow: "hidden",
                filter: "blur(3px)",
                opacity: 0.35,
                pointerEvents: "none",
                userSelect: "none",
              }}
            >
              {[
                { handle: "@modernluxuryrealty", followers: "44.6K", freq: "3.1x/week" },
                { handle: "@elitemiamirealestate", followers: "18.9K", freq: "2.4x/week" },
                { handle: "@luxehomecollective", followers: "31.2K", freq: "4.2x/week" },
              ].map((row, i) => (
                <div
                  key={row.handle}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 14,
                    padding: "14px 20px",
                    borderBottom: i < 2 ? "1px solid var(--border)" : "none",
                    background: i === 0 ? "var(--surface-2)" : "transparent",
                  }}
                >
                  <div style={{ width: 36, height: 36, borderRadius: "50%", background: `hsl(${i * 80 + 200}, 60%, 65%)` }} />
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: "0.88rem", fontWeight: 600, color: "var(--text-primary)" }}>{row.handle}</p>
                    <p style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>{row.followers} followers · {row.freq}</p>
                  </div>
                  <div
                    style={{
                      fontSize: "0.62rem",
                      fontWeight: 700,
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      color: "var(--green)",
                      background: "var(--green-bg)",
                      padding: "2px 7px",
                      borderRadius: 4,
                    }}
                  >
                    Audited
                  </div>
                </div>
              ))}
            </div>

            <p style={{ fontSize: "0.7rem", color: "var(--text-muted)", opacity: 0.6, marginTop: 4 }}>
              Configure proxy routing to unlock full Instagram lead discovery and aesthetic auditing.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
