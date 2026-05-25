import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, RefreshCw, Share2, Sparkles } from "lucide-react";
import type { ContentIdea } from "../data/mockData";

interface VectorCardProps {
  idea: ContentIdea;
  onReroll?: (id: string) => void;
  onPushNotion?: (id: string) => void;
  onGenerateVisual?: (id: string) => void;
  animDelay?: number;
}

export function VectorCard({
  idea,
  onReroll,
  onPushNotion,
  onGenerateVisual,
  animDelay = 0,
}: VectorCardProps) {
  const [open, setOpen] = useState(false);
  const [rerolling, setRerolling] = useState(false);
  const [notionDone, setNotionDone] = useState(false);

  const handleReroll = (e: React.MouseEvent) => {
    e.stopPropagation();
    setRerolling(true);
    setTimeout(() => { setRerolling(false); onReroll?.(idea.id); }, 650);
  };

  const handleNotion = (e: React.MouseEvent) => {
    e.stopPropagation();
    setNotionDone(true);
    onPushNotion?.(idea.id);
    setTimeout(() => setNotionDone(false), 2500);
  };

  const handleVisual = (e: React.MouseEvent) => {
    e.stopPropagation();
    onGenerateVisual?.(idea.id);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: animDelay / 1000 }}
      className="card card-xl card-lift"
      style={{ borderRadius: 20, overflow: "hidden", cursor: "pointer" }}
      onClick={() => setOpen((p) => !p)}
    >
      {/* ── Default (always-visible) row ──────────────────── */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: 14,
          padding: "20px 22px",
        }}
      >
        {/* ID badge */}
        <div
          style={{
            width: 30,
            height: 30,
            borderRadius: 8,
            background: "var(--text-primary)",
            color: "var(--bg)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "0.65rem",
            fontWeight: 700,
            flexShrink: 0,
            marginTop: 2,
          }}
        >
          {idea.id}
        </div>

        {/* Main content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Tag + score row */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 8,
              flexWrap: "wrap" as const,
            }}
          >
            <span className="tag">{idea.format}</span>
            <span
              style={{
                fontSize: "0.68rem",
                fontWeight: 700,
                color: idea.trendScore >= 85 ? "var(--green)" : "var(--text-muted)",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {idea.trendScore}
              <span style={{ fontWeight: 400, color: "var(--text-muted)" }}>/100</span>
            </span>
          </div>

          {/* Hook — the hero line */}
          <p
            style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: "0.95rem",
              fontWeight: 700,
              color: "var(--text-primary)",
              lineHeight: 1.45,
              letterSpacing: "-0.01em",
            }}
          >
            {idea.hook}
          </p>

          {/* Action row — always visible */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginTop: 14,
              flexWrap: "wrap" as const,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="btn-accent"
              onClick={handleVisual}
              style={{ fontSize: "0.78rem", padding: "0.42rem 1rem" }}
            >
              <Sparkles size={12} strokeWidth={2.5} />
              🎨 Generate Visual
            </button>
          </div>
        </div>

        {/* Chevron */}
        <motion.div
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.22, ease: "easeInOut" }}
          style={{ flexShrink: 0, marginTop: 4, color: "var(--text-muted)" }}
        >
          <ChevronDown size={16} strokeWidth={2} />
        </motion.div>
      </div>

      {/* ── Expanded body ──────────────────────────────────── */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
            style={{ overflow: "hidden" }}
          >
            <div
              style={{
                padding: "0 22px 22px 22px",
                borderTop: "1px solid var(--border)",
                paddingTop: 18,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Two-col grid */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 20,
                  marginBottom: 18,
                }}
              >
                {/* Narrative */}
                <div>
                  <p
                    style={{
                      fontSize: "0.62rem",
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "0.1em",
                      color: "var(--text-muted)",
                      marginBottom: 8,
                    }}
                  >
                    ◈ The Narrative
                  </p>
                  <p
                    style={{
                      fontSize: "0.82rem",
                      color: "var(--text-secondary)",
                      lineHeight: 1.72,
                    }}
                  >
                    {idea.angle}
                  </p>
                </div>

                {/* Visual direction */}
                <div>
                  <p
                    style={{
                      fontSize: "0.62rem",
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "0.1em",
                      color: "var(--text-muted)",
                      marginBottom: 8,
                    }}
                  >
                    ✦ Visual Direction
                  </p>
                  <p
                    style={{
                      fontSize: "0.82rem",
                      fontStyle: "italic",
                      color: "var(--text-secondary)",
                      lineHeight: 1.72,
                    }}
                  >
                    {idea.visualDirection}
                  </p>
                </div>
              </div>

              {/* Tags */}
              <div
                style={{
                  display: "flex",
                  gap: 6,
                  flexWrap: "wrap" as const,
                  marginBottom: 16,
                }}
              >
                {idea.tags.map((t) => (
                  <span key={t} className="tag">{t}</span>
                ))}
              </div>

              <div style={{ height: 1, background: "var(--border)", marginBottom: 14 }} />

              {/* Secondary actions */}
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" as const }}>
                <button className="btn-ghost" onClick={handleReroll}>
                  <RefreshCw size={11} strokeWidth={2} className={rerolling ? "spin" : ""} />
                  {rerolling ? "Rerolling..." : "Reroll Hook"}
                </button>
                <button className="btn-ghost" onClick={handleNotion}>
                  <Share2 size={11} strokeWidth={2} />
                  {notionDone ? "Synced ✓" : "Push to Notion"}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
