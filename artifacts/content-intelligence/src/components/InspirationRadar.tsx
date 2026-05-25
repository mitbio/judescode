import { RefreshCw } from "lucide-react";

export interface VisionImage {
  url: string;
  alt: string;
}

interface InspirationRadarProps {
  images: VisionImage[];
  loading?: boolean;
  niche?: string;
  onRefresh?: () => void;
  source?: string;
}

export function InspirationRadar({ images, loading, niche, onRefresh, source }: InspirationRadarProps) {
  const left = images.filter((_, i) => i % 2 === 0);
  const right = images.filter((_, i) => i % 2 !== 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10, height: "100%" }}>
      {/* Header */}
      <div
        className="card"
        style={{
          borderRadius: 16,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 16px",
          flexShrink: 0,
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
            Vision Radar
          </span>
          {niche && <span className="tag" style={{ marginLeft: 2 }}>{niche}</span>}
          {source === "live" && (
            <span className="tag" style={{ color: "var(--green)", borderColor: "var(--green)", background: "var(--green-bg)" }}>
              Are.na
            </span>
          )}
        </div>
        {onRefresh && (
          <button
            className="icon-btn"
            onClick={onRefresh}
            disabled={loading}
            title="Refresh"
            style={{ width: 28, height: 28 }}
          >
            <RefreshCw size={12} strokeWidth={2} className={loading ? "spin" : ""} />
          </button>
        )}
      </div>

      {/* Image masonry */}
      <div
        className="card"
        style={{
          borderRadius: 18,
          flex: 1,
          padding: 10,
          overflow: "hidden",
          minHeight: 0,
        }}
      >
        {loading ? (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 8,
              height: "100%",
            }}
          >
            {[2.2, 1, 1, 1.5].map((flex, i) => (
              <div
                key={i}
                style={{
                  flex,
                  borderRadius: 10,
                  background: "var(--border)",
                  minHeight: 80,
                  animation: "pulse-dot 1.5s ease-in-out infinite",
                }}
              />
            ))}
          </div>
        ) : images.length === 0 ? (
          <div
            style={{
              height: "100%",
              display: "flex",
              flexDirection: "column" as const,
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              color: "var(--text-muted)",
            }}
          >
            <p style={{ fontSize: "1.5rem", opacity: 0.3 }}>✦</p>
            <p style={{ fontSize: "0.75rem" }}>Run to load vision</p>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 8,
              height: "100%",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {left.map((img, i) => (
                <ImageTile key={img.url + i} img={img} flex={i === 0 ? 2.2 : 1} />
              ))}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {right.map((img, i) => (
                <ImageTile key={img.url + i} img={img} flex={i === 0 ? 1 : 1.5} />
              ))}
            </div>
          </div>
        )}
      </div>

      <p
        style={{
          textAlign: "center",
          fontSize: "0.65rem",
          color: "var(--text-muted)",
          flexShrink: 0,
        }}
      >
        {source === "live" ? "Live from Are.na · Serper Image Search" : "AI-curated visual reference"}
      </p>
    </div>
  );
}

function ImageTile({ img, flex }: { img: VisionImage; flex: number }) {
  return (
    <div style={{ flex, overflow: "hidden", borderRadius: 10, minHeight: 80 }}>
      <img
        src={img.url}
        alt={img.alt}
        loading="lazy"
        className="insp-img"
        style={{ height: "100%", width: "100%", minHeight: 80, objectFit: "cover" }}
        onError={(e) => {
          (e.target as HTMLImageElement).src =
            `https://placehold.co/400x300/f0f0f0/aaaaaa?text=${encodeURIComponent(img.alt.slice(0, 20))}`;
        }}
      />
    </div>
  );
}
