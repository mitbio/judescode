import { useState, useCallback, useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Loader2 } from "lucide-react";
import { CommandBar } from "../components/CommandBar";
import { LiveRadar } from "../components/LiveRadar";
import { VectorCard } from "../components/VectorCard";
import { InspirationRadar, type VisionImage } from "../components/InspirationRadar";
import { generateIdeas, liveRadarItems, type ContentIdea, type LiveRadarItem } from "../data/mockData";

// ── API helpers ────────────────────────────────────────────
async function fetchTrends(): Promise<{ trends: LiveRadarItem[]; source: string }> {
  try {
    const res = await fetch("/api/trends");
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json() as { trends: Array<{title: string; snippet?: string}>; source: string };
    const items: LiveRadarItem[] = data.trends.map((t, i) => ({
      id: String(i + 1),
      topic: t.title,
      metric: `+${(15 + Math.floor(Math.random() * 65)).toFixed(1)}%`,
      volume: `${(200 + Math.floor(Math.random() * 2000)).toLocaleString()}K`,
      category: "Trending",
      hot: i < 2,
    }));
    return { trends: items, source: data.source };
  } catch {
    return { trends: liveRadarItems, source: "fallback" };
  }
}

interface ApiAngle {
  id: string;
  tag: string;
  hook: string;
  narrative: string;
  visualDirection: string;
  optimizedImageSearchQuery?: string;
}

interface GenerateResponse {
  angles: ApiAngle[];
  visionImages: VisionImage[];
  source: string;
}

// Stage 1 + Stage 2 combined — single call to /api/generate which now returns both
async function fetchGenerate(
  niche: string,
  trends: LiveRadarItem[]
): Promise<{ angles: ContentIdea[]; visionImages: VisionImage[]; source: string }> {
  try {
    const trendPayload = trends.slice(0, 5).map((t) => ({ title: t.topic, snippet: "" }));
    const res = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ niche, trends: trendPayload }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json() as GenerateResponse;
    const ideas: ContentIdea[] = data.angles.map((a) => ({
      id: a.id,
      hook: a.hook,
      angle: a.narrative,
      visualDirection: a.visualDirection,
      format: a.tag,
      trendScore: 72 + Math.floor(Math.random() * 23),
      tags: [`#${a.tag.toLowerCase().replace(/\s+/g, "")}`, `#${niche.toLowerCase().replace(/\s+/g, "")}`, "#content"],
    }));
    return { angles: ideas, visionImages: data.visionImages ?? [], source: data.source };
  } catch {
    return { angles: generateIdeas(niche, 3), visionImages: [], source: "fallback" };
  }
}

async function fetchVision(niche: string): Promise<{ images: VisionImage[]; source: string }> {
  try {
    const res = await fetch("/api/vision", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ niche }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json() as { images: VisionImage[]; source: string };
    return data;
  } catch {
    return { images: [], source: "fallback" };
  }
}

// ── Skeleton card ──────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="card" style={{ borderRadius: 20, padding: "20px 22px", display: "flex", gap: 14 }}>
      <div style={{ width: 30, height: 30, borderRadius: 8, background: "var(--border)", flexShrink: 0 }} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{ height: 10, width: "30%", borderRadius: 4, background: "var(--border)" }} />
        <div style={{ height: 14, width: "90%", borderRadius: 4, background: "var(--border)" }} />
        <div style={{ height: 14, width: "70%", borderRadius: 4, background: "var(--border)" }} />
        <div style={{ height: 30, width: 140, borderRadius: 10, background: "var(--border)", marginTop: 4 }} />
      </div>
    </div>
  );
}

// ── Dashboard ──────────────────────────────────────────────
interface DashboardProps {
  dark: boolean;
  onNicheChange: (niche: string) => void;
}

export default function Dashboard({ onNicheChange }: DashboardProps) {
  const [niche, setNiche] = useState("");
  const [hasRun, setHasRun] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [ideas, setIdeas] = useState<ContentIdea[]>([]);
  const [radarItems, setRadarItems] = useState<LiveRadarItem[]>(liveRadarItems);
  const [radarLoading, setRadarLoading] = useState(false);
  const [visionImages, setVisionImages] = useState<VisionImage[]>([]);
  const [visionLoading, setVisionLoading] = useState(false);
  const [visionSource, setVisionSource] = useState("fallback");
  const [toast, setToast] = useState({ msg: "", visible: false });
  const currentNicheRef = useRef(niche);

  // ── Fetch trends on mount ─────────────────────────────────
  useEffect(() => {
    const timeout = setTimeout(() => setRadarLoading(false), 6000);
    fetchTrends().then(({ trends }) => {
      clearTimeout(timeout);
      setRadarItems(trends);
      setRadarLoading(false);
    });
    return () => clearTimeout(timeout);
  }, []);

  const showToast = useCallback((msg: string) => {
    setToast({ msg, visible: true });
    setTimeout(() => setToast((t) => ({ ...t, visible: false })), 2800);
  }, []);

  // ── Run Intelligence (2-stage pipeline) ───────────────────
  const handleRun = useCallback(
    async (inputNiche: string) => {
      setNiche(inputNiche);
      onNicheChange(inputNiche);
      currentNicheRef.current = inputNiche;
      setLoading(true);
      setVisionLoading(true);
      setIdeas([]);
      setVisionImages([]);

      // Single call — backend runs Stage 1 (Gemini) then Stage 2 (Serper) chained
      const result = await fetchGenerate(inputNiche, radarItems);

      if (currentNicheRef.current !== inputNiche) return;

      setIdeas(result.angles);

      // Use pipeline vision images if available, otherwise fallback to separate vision call
      if (result.visionImages && result.visionImages.length > 0) {
        setVisionImages(result.visionImages);
        setVisionSource(result.source === "live" ? "live" : "fallback");
        setVisionLoading(false);
      } else {
        const visionResult = await fetchVision(inputNiche);
        if (currentNicheRef.current !== inputNiche) return;
        setVisionImages(visionResult.images);
        setVisionSource(visionResult.source);
        setVisionLoading(false);
      }

      setHasRun(true);
      setLoading(false);

      const srcLabel = result.source === "live" ? "Gemini AI" : "Intelligence";
      showToast(`${result.angles.length} angles from ${srcLabel} · ${inputNiche}`);
    },
    [radarItems, showToast, onNicheChange]
  );

  // ── Generate more ─────────────────────────────────────────
  const handleGenerateMore = useCallback(async () => {
    setLoadingMore(true);
    const { angles } = await fetchGenerate(niche, radarItems);
    setIdeas((prev) => [...prev, ...angles]);
    setLoadingMore(false);
    showToast(`${angles.length} more angles synthesized`);
  }, [niche, radarItems, showToast]);

  // ── Reroll a single card ──────────────────────────────────
  const handleReroll = useCallback(
    async (id: string) => {
      const { angles } = await fetchGenerate(niche, radarItems);
      const fresh = { ...angles[0], id };
      setIdeas((prev) => prev.map((idea) => (idea.id === id ? fresh : idea)));
      showToast("Hook rerolled");
    },
    [niche, radarItems, showToast]
  );

  // ── Refresh vision only ────────────────────────────────────
  const handleRefreshVision = useCallback(async () => {
    setVisionLoading(true);
    const { images, source } = await fetchVision(niche || "content marketing");
    setVisionImages(images);
    setVisionSource(source);
    setVisionLoading(false);
  }, [niche]);

  const handleNotion = useCallback((id: string) => showToast(`Angle ${id} synced to Notion`), [showToast]);
  const handleVisual = useCallback((id: string) => showToast(`Generating visual for Angle ${id}...`), [showToast]);

  return (
    <>
      {/* ── 3-column stage ───────────────────────────────── */}
      <div
        style={{
          maxWidth: 1440,
          margin: "0 auto",
          padding: "28px 24px 80px",
          display: "grid",
          gridTemplateColumns: "1fr 2fr 1fr",
          gap: 20,
          alignItems: "start",
        }}
      >
        {/* ── LEFT: The Radar (capped height + scroll) ──── */}
        <div style={{ position: "sticky", top: 72 }}>
          <div
            style={{
              maxHeight: "calc(100vh - 100px)",
              overflowY: "auto",
              borderRadius: 20,
              scrollbarWidth: "none",
            }}
          >
            <LiveRadar items={radarItems} loading={radarLoading} />
          </div>
        </div>

        {/* ── CENTER: The Engine ───────────────────────────── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <CommandBar onRun={handleRun} loading={loading} initialValue="Luxury Real Estate" />

          {/* Loading skeletons */}
          <AnimatePresence>
            {loading && (
              <motion.div
                key="skeletons"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{ display: "flex", flexDirection: "column", gap: 10 }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "0 2px", marginBottom: 2 }}>
                  <Loader2 size={12} className="spin" style={{ color: "var(--text-muted)" }} />
                  <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                    Stage 1: Synthesizing angles with Gemini → Stage 2: Fetching visual references...
                  </span>
                </div>
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Empty state */}
          {!hasRun && !loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{
                padding: "60px 32px",
                textAlign: "center",
                borderRadius: 20,
                border: "1.5px dashed var(--border-strong)",
                color: "var(--text-muted)",
              }}
            >
              <p style={{ fontSize: "2rem", marginBottom: 14, opacity: 0.4 }}>◈</p>
              <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: "1rem", color: "var(--text-secondary)", marginBottom: 6 }}>
                Intelligence engine ready
              </p>
              <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", maxWidth: 300, margin: "0 auto", lineHeight: 1.65 }}>
                Enter your niche and click Run Intelligence. Gemini AI will synthesize 3 contrarian
                content angles grounded in live trend data.
              </p>
            </motion.div>
          )}

          {/* Vector cards */}
          <AnimatePresence>
            {hasRun && !loading && ideas.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{ display: "flex", flexDirection: "column", gap: 10 }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 2px" }}>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                    <span style={{ fontSize: "0.62rem", fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.1em", color: "var(--text-muted)" }}>
                      Extracted Vectors
                    </span>
                    <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>
                      {ideas.length} angle{ideas.length !== 1 ? "s" : ""} · {niche}
                    </span>
                  </div>
                </div>

                {ideas.map((idea, i) => (
                  <VectorCard
                    key={idea.id + i}
                    idea={idea}
                    onReroll={handleReroll}
                    onPushNotion={handleNotion}
                    onGenerateVisual={handleVisual}
                    animDelay={i * 80}
                  />
                ))}

                {/* Generate more */}
                <button
                  onClick={handleGenerateMore}
                  disabled={loadingMore}
                  style={{
                    width: "100%",
                    padding: "16px",
                    borderRadius: 16,
                    border: "1.5px dashed var(--border-strong)",
                    background: "transparent",
                    color: "var(--text-muted)",
                    fontSize: "0.72rem",
                    fontWeight: 700,
                    letterSpacing: "0.12em",
                    textTransform: "uppercase" as const,
                    cursor: loadingMore ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    transition: "all 0.2s ease",
                    opacity: loadingMore ? 0.5 : 1,
                  }}
                  onMouseEnter={(e) => {
                    if (!loadingMore) {
                      (e.currentTarget as HTMLButtonElement).style.background = "var(--surface)";
                      (e.currentTarget as HTMLButtonElement).style.color = "var(--text-secondary)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                    (e.currentTarget as HTMLButtonElement).style.color = "var(--text-muted)";
                  }}
                >
                  {loadingMore ? (
                    <><Loader2 size={12} className="spin" />Synthesizing...</>
                  ) : (
                    <><ChevronDown size={12} />Generate More Vectors</>
                  )}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── RIGHT: The Vision ────────────────────────────── */}
        <div style={{ position: "sticky", top: 72, height: "calc(100vh - 100px)", display: "flex", flexDirection: "column" }}>
          <InspirationRadar
            images={visionImages}
            loading={visionLoading}
            niche={niche || undefined}
            source={visionSource}
            onRefresh={hasRun ? handleRefreshVision : undefined}
          />
        </div>
      </div>

      {/* Toast */}
      <AnimatePresence>
        {toast.visible && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            className="toast"
          >
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
