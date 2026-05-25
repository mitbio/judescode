import { TrendingUp } from "lucide-react";
import type { LiveRadarItem } from "../data/mockData";

interface LiveRadarProps {
  items: LiveRadarItem[];
  loading?: boolean;
}

export function LiveRadar({ items, loading }: LiveRadarProps) {
  return (
    <div className="card card-xl" style={{ borderRadius: 20 }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "16px 20px 14px",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span className="live-dot pulse-dot" />
          <span
            style={{
              fontSize: "0.62rem",
              fontWeight: 700,
              textTransform: "uppercase" as const,
              letterSpacing: "0.1em",
              color: "var(--text-muted)",
            }}
          >
            Live Radar
          </span>
        </div>
        <span style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>7-day ↑</span>
      </div>

      {/* Subheader */}
      <div style={{ padding: "10px 20px 6px" }}>
        <p
          style={{
            fontSize: "0.7rem",
            fontWeight: 600,
            color: "var(--text-muted)",
            letterSpacing: "0.04em",
          }}
        >
          Google Trends
        </p>
      </div>

      {/* Items */}
      <div>
        {loading
          ? Array(6).fill(0).map((_, i) => (
              <div
                key={i}
                style={{
                  padding: "12px 20px",
                  borderBottom: i < 5 ? "1px solid var(--border)" : "none",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
                  <div style={{ height: 12, borderRadius: 4, background: "var(--border)", width: "70%" }} />
                  <div style={{ height: 10, borderRadius: 4, background: "var(--border)", width: "40%" }} />
                </div>
                <div style={{ height: 14, width: 50, borderRadius: 4, background: "var(--border)" }} />
              </div>
            ))
          : items.map((item, i) => (
              <div
                key={item.id}
                style={{
                  padding: "12px 20px",
                  borderBottom: i < items.length - 1 ? "1px solid var(--border)" : "none",
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                  gap: 10,
                  cursor: "pointer",
                  transition: "background 0.15s ease",
                }}
                onMouseEnter={(e) =>
                  ((e.currentTarget as HTMLDivElement).style.background = "var(--surface-hover)")
                }
                onMouseLeave={(e) =>
                  ((e.currentTarget as HTMLDivElement).style.background = "transparent")
                }
              >
                {/* Left */}
                <div style={{ display: "flex", alignItems: "flex-start", gap: 10, minWidth: 0, flex: 1 }}>
                  <span
                    style={{
                      fontSize: "0.65rem",
                      fontWeight: 700,
                      color: "var(--text-muted)",
                      fontVariantNumeric: "tabular-nums",
                      marginTop: 1,
                      flexShrink: 0,
                      width: 16,
                    }}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 4 }}>
                      <p
                        style={{
                          fontSize: "0.8rem",
                          fontWeight: 600,
                          color: "var(--text-primary)",
                          lineHeight: 1.3,
                        }}
                      >
                        {item.topic}
                      </p>
                      {item.hot && (
                        <span
                          style={{
                            fontSize: "0.58rem",
                            fontWeight: 700,
                            textTransform: "uppercase" as const,
                            letterSpacing: "0.06em",
                            color: "#dc2626",
                            background: "rgba(220,38,38,0.08)",
                            border: "1px solid rgba(220,38,38,0.15)",
                            padding: "1px 5px",
                            borderRadius: 4,
                            flexShrink: 0,
                          }}
                        >
                          Hot
                        </span>
                      )}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span className="tag" style={{ fontSize: "0.58rem" }}>{item.category}</span>
                      <span style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>
                        {item.volume} searches
                      </span>
                    </div>
                  </div>
                </div>

                {/* Metric */}
                <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
                  <TrendingUp size={11} strokeWidth={2.5} style={{ color: "var(--green)" }} />
                  <span className="metric-green" style={{ fontSize: "0.8rem" }}>{item.metric}</span>
                </div>
              </div>
            ))}
      </div>
    </div>
  );
}
