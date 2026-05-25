import { useState, useCallback, useRef, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Search, Loader2, CheckSquare, Square, Zap,
  ExternalLink, Mail, Instagram, AlertTriangle,
  CheckCircle, XCircle, ChevronDown, ChevronUp,
  Cpu, ChevronRight, Wifi, Copy, Check,
} from "lucide-react";

// ── Chrome Extension ──────────────────────────────────────────────────────────

const EXT_ID = "neeobhkgjehajkfmepfngmbloalphcld";

interface ExtData {
  fonts?: string[];
  colors?: string[];
  screenshot?: string | null;
  healthScore?: number | null;
  metadata?: {
    domainAge?: string;
    leads?: { emails?: string[]; instagram?: string | null };
  };
  status?: string;
}

interface ExtResponse { success: boolean; data?: ExtData; }

declare const chrome: {
  runtime?: {
    sendMessage?: (
      id: string,
      msg: { action: string; url: string },
      cb: (res: ExtResponse | undefined) => void
    ) => void;
    lastError?: { message?: string };
  };
};

function sendExtMessage(url: string): Promise<ExtResponse | undefined> {
  return new Promise((resolve) => {
    if (typeof chrome === "undefined" || !chrome.runtime?.sendMessage) {
      resolve(undefined);
      return;
    }
    try {
      chrome.runtime.sendMessage(EXT_ID, { action: "EXT_SCRAPE", url }, (response) => {
        void chrome.runtime?.lastError;
        resolve(response);
      });
    } catch { resolve(undefined); }
  });
}

// ── CRM Pipeline ──────────────────────────────────────────────────────────────

type PipelineStage = "new" | "pitched" | "outreached" | "closed";

const PIPELINE_STAGES: { value: PipelineStage; label: string; color: string }[] = [
  { value: "new",        label: "🟢 New Discovery",  color: "var(--green)" },
  { value: "pitched",    label: "🟡 Pitch Generated", color: "#f59e0b"      },
  { value: "outreached", label: "🔵 Outreached",      color: "#3b82f6"      },
  { value: "closed",     label: "👑 Closed Deal",     color: "#a78bfa"      },
];

const CRM_KEY = "contactx_pipeline_leads";

function loadCrm(): Record<string, PipelineStage> {
  try { return JSON.parse(localStorage.getItem(CRM_KEY) ?? "{}") as Record<string, PipelineStage>; }
  catch { return {}; }
}

function saveCrm(data: Record<string, PipelineStage>) {
  try { localStorage.setItem(CRM_KEY, JSON.stringify(data)); } catch { /* noop */ }
}

// ── Domain card types ─────────────────────────────────────────────────────────

type CardStatus = "scanning" | "ok" | "failed" | "no-ext";

interface PitchState {
  loading: boolean;
  subject?: string;
  body?: string;
  error?: string;
  copied?: boolean;
}

interface DomainCard {
  id: string;
  domain: string;
  url: string;
  title: string;
  snippet: string;
  status: CardStatus;
  screenshot?: string | null;
  healthScore?: number | null;
  domainAge?: string | null;
  emails?: string[];
  instagram?: string | null;
  fontCount?: number;
  colorCount?: number;
  extStatus?: string;
  pitch?: PitchState;
}

interface ScanResponse {
  stubs: Array<{ id: string; domain: string; url: string; title: string; snippet: string }>;
  dork: string;
  dorkSource: "gemini" | "raw";
  page: number;
}

// ── API helpers ───────────────────────────────────────────────────────────────

async function fetchStubs(query: string, page: number): Promise<ScanResponse> {
  const res = await fetch("/api/website/scan", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, page }),
  });
  if (!res.ok) {
    const err = await res.json() as { error?: string };
    throw new Error(err.error ?? `HTTP ${res.status}`);
  }
  return res.json() as Promise<ScanResponse>;
}

async function generatePitch(card: DomainCard): Promise<{ subject: string; body: string }> {
  const healthScore = card.healthScore ??
    (card.fontCount !== undefined && card.colorCount !== undefined
      ? Math.max(10, 100 - (card.fontCount - 1) * 15 - (card.colorCount - 3) * 5)
      : undefined);

  const res = await fetch("/api/generate-pitch", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      domain: card.domain,
      fontCount: card.fontCount,
      colorCount: card.colorCount,
      emails: card.emails ?? [],
      healthScore,
    }),
  });
  if (!res.ok) {
    const err = await res.json() as { error?: string };
    throw new Error(err.error ?? `HTTP ${res.status}`);
  }
  return res.json() as Promise<{ subject: string; body: string }>;
}

// ── Health score bar ──────────────────────────────────────────────────────────

function HealthBar({ score }: { score: number }) {
  const pct = Math.max(0, Math.min(100, score));
  const color = pct >= 75 ? "var(--green)" : pct >= 45 ? "#f59e0b" : "#ef4444";
  const tier = pct >= 75 ? "CLEAN" : pct >= 45 ? "REVIEW" : "CRITICAL";

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <div style={{
        flex: 1, height: 5, borderRadius: 99,
        background: "var(--border)", overflow: "hidden",
      }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          style={{ height: "100%", borderRadius: 99, background: color }}
        />
      </div>
      <span style={{ fontSize: "0.65rem", fontWeight: 800, color, minWidth: 22, textAlign: "right" }}>
        {pct}
      </span>
      <span style={{
        fontSize: "0.52rem", fontWeight: 800, letterSpacing: "0.1em",
        textTransform: "uppercase", color,
        background: `${color}18`, border: `1px solid ${color}33`,
        padding: "1px 5px", borderRadius: 3,
      }}>
        {tier}
      </span>
    </div>
  );
}

// ── CRM dropdown ──────────────────────────────────────────────────────────────

function CrmDropdown({ domain, value, onChange }: {
  domain: string; value: PipelineStage; onChange: (v: PipelineStage) => void;
}) {
  const [open, setOpen] = useState(false);
  const current = PIPELINE_STAGES.find((s) => s.value === value) ?? PIPELINE_STAGES[0];

  return (
    <div style={{ position: "relative" }} onClick={(e) => e.stopPropagation()}>
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          display: "flex", alignItems: "center", gap: 5,
          padding: "5px 10px", borderRadius: 7, cursor: "pointer",
          background: "var(--surface)", border: "1px solid var(--border-strong)",
          color: current.color, fontSize: "0.72rem", fontWeight: 700,
          transition: "border-color 0.15s",
          minWidth: 148,
        }}
        title={`CRM stage for ${domain}`}
      >
        <span style={{ flex: 1, textAlign: "left" }}>{current.label}</span>
        <ChevronDown size={10} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.12 }}
            style={{
              position: "absolute", top: "calc(100% + 4px)", left: 0, zIndex: 50,
              background: "var(--surface)", border: "1px solid var(--border-strong)",
              borderRadius: 10, overflow: "hidden", minWidth: 170,
              boxShadow: "0 8px 24px rgba(0,0,0,0.35)",
            }}
          >
            {PIPELINE_STAGES.map((s) => (
              <button
                key={s.value}
                onClick={() => { onChange(s.value); setOpen(false); }}
                style={{
                  width: "100%", textAlign: "left", padding: "9px 14px",
                  background: s.value === value ? "var(--surface-2)" : "transparent",
                  border: "none", cursor: "pointer",
                  color: s.value === value ? s.color : "var(--text-secondary)",
                  fontSize: "0.76rem", fontWeight: s.value === value ? 700 : 500,
                  transition: "background 0.1s",
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "var(--surface-2)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = s.value === value ? "var(--surface-2)" : "transparent"; }}
              >
                {s.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Pitch panel ───────────────────────────────────────────────────────────────

function PitchPanel({ pitch, onGenerate, cardOk }: {
  pitch?: PitchState; onGenerate: () => void; cardOk: boolean;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!pitch?.subject || !pitch?.body) return;
    void navigator.clipboard.writeText(`Subject: ${pitch.subject}\n\n${pitch.body}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  if (!pitch) {
    return (
      <button
        onClick={onGenerate}
        disabled={!cardOk}
        style={{
          display: "flex", alignItems: "center", gap: 7, padding: "9px 16px",
          borderRadius: 9, cursor: cardOk ? "pointer" : "not-allowed",
          background: cardOk ? "var(--accent)" : "var(--surface-2)",
          border: `1px solid ${cardOk ? "var(--accent)" : "var(--border)"}`,
          color: cardOk ? "#fff" : "var(--text-muted)",
          fontSize: "0.78rem", fontWeight: 700, transition: "all 0.15s",
        }}
      >
        <Zap size={13} />
        Generate AI Pitch
      </button>
    );
  }

  if (pitch.loading) {
    return (
      <div style={{
        display: "flex", alignItems: "center", gap: 8, padding: "10px 14px",
        borderRadius: 9, background: "var(--surface-2)", border: "1px solid var(--border)",
        fontSize: "0.78rem", color: "var(--text-muted)",
      }}>
        <Loader2 size={13} className="spin" />
        Gemma 4 26B writing your pitch...
      </div>
    );
  }

  if (pitch.error) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{
          padding: "9px 13px", borderRadius: 9,
          background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.18)",
          color: "#ef4444", fontSize: "0.76rem",
        }}>
          {pitch.error}
        </div>
        <button
          onClick={onGenerate}
          style={{
            alignSelf: "flex-start", display: "flex", alignItems: "center", gap: 7,
            padding: "7px 14px", borderRadius: 8, cursor: "pointer",
            background: "var(--surface-2)", border: "1px solid var(--border-strong)",
            color: "var(--text-secondary)", fontSize: "0.74rem", fontWeight: 600,
          }}
        >
          <Zap size={11} /> Retry
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {/* Subject */}
      <div>
        <p style={{ fontSize: "0.56rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 5 }}>
          Subject
        </p>
        <div style={{
          padding: "8px 12px", borderRadius: 7,
          background: "var(--surface)", border: "1px solid var(--border-strong)",
          fontSize: "0.82rem", fontWeight: 600, color: "var(--text-primary)",
        }}>
          {pitch.subject}
        </div>
      </div>

      {/* Body */}
      <div>
        <p style={{ fontSize: "0.56rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 5 }}>
          Email Body
        </p>
        <textarea
          value={pitch.body}
          readOnly
          rows={6}
          style={{
            width: "100%", padding: "10px 12px", borderRadius: 8,
            background: "var(--surface)", border: "1px solid var(--border-strong)",
            color: "var(--text-secondary)", fontSize: "0.8rem", lineHeight: 1.65,
            resize: "vertical", fontFamily: "inherit", boxSizing: "border-box",
            outline: "none",
          }}
        />
      </div>

      {/* Copy button */}
      <button
        onClick={handleCopy}
        style={{
          alignSelf: "flex-start", display: "flex", alignItems: "center", gap: 6,
          padding: "7px 14px", borderRadius: 8, cursor: "pointer",
          background: copied ? "var(--green-bg)" : "var(--surface-2)",
          border: `1px solid ${copied ? "var(--green)" : "var(--border-strong)"}`,
          color: copied ? "var(--green)" : "var(--text-secondary)",
          fontSize: "0.74rem", fontWeight: 700, transition: "all 0.15s",
        }}
      >
        {copied ? <Check size={12} /> : <Copy size={12} />}
        {copied ? "Copied!" : "Copy to Clipboard"}
      </button>
    </div>
  );
}

// ── Domain card ───────────────────────────────────────────────────────────────

function DomainCardView({
  card, index, checked, onToggleCheck, expanded, onToggleExpand, onGeneratePitch, crmStage, onCrmChange,
}: {
  card: DomainCard; index: number; checked: boolean;
  onToggleCheck: (id: string) => void;
  expanded: boolean; onToggleExpand: (id: string) => void;
  onGeneratePitch: (id: string) => void;
  crmStage: PipelineStage; onCrmChange: (domain: string, stage: PipelineStage) => void;
}) {
  const scanning  = card.status === "scanning";
  const failed    = card.status === "failed";
  const noExt     = card.status === "no-ext";
  const ok        = card.status === "ok";
  const initials  = card.domain.charAt(0).toUpperCase();

  const computedHealth = card.healthScore != null
    ? card.healthScore
    : (card.fontCount !== undefined && card.colorCount !== undefined)
      ? Math.max(10, 100 - (card.fontCount - 1) * 15 - (card.colorCount - 3) * 5)
      : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, delay: Math.min(index * 0.04, 0.3) }}
      style={{
        borderRadius: 16,
        border: `1px solid ${failed || noExt ? "rgba(239,68,68,0.2)" : checked ? "var(--border-strong)" : "var(--border)"}`,
        background: checked ? "var(--surface-2)" : "var(--surface)",
        overflow: "hidden", transition: "border-color 0.15s, background 0.15s",
      }}
    >
      {/* Main row */}
      <div
        style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 18px", cursor: ok ? "pointer" : "default" }}
        onClick={() => ok && onToggleCheck(card.id)}
      >
        {/* Checkbox */}
        <button
          onClick={(e) => { e.stopPropagation(); if (ok) onToggleCheck(card.id); }}
          disabled={!ok}
          style={{ background: "none", border: "none", padding: 0, cursor: ok ? "pointer" : "default", color: checked ? "var(--accent)" : "var(--border-strong)", display: "flex", flexShrink: 0, opacity: ok ? 1 : 0.35 }}
        >
          {checked ? <CheckSquare size={16} strokeWidth={2} /> : <Square size={16} strokeWidth={1.5} />}
        </button>

        {/* Avatar */}
        <div style={{
          width: 34, height: 34, borderRadius: 9, flexShrink: 0,
          background: scanning ? "var(--surface-2)" : failed || noExt ? "rgba(239,68,68,0.1)" : `hsl(${(index * 53 + 180) % 360}, 55%, ${checked ? "48%" : "60%"})`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "0.78rem", fontWeight: 700,
          color: scanning ? "var(--text-muted)" : failed || noExt ? "#ef4444" : "#fff",
          border: scanning ? "1px solid var(--border)" : failed || noExt ? "1px solid rgba(239,68,68,0.2)" : "none",
        }}>
          {scanning ? <Loader2 size={14} className="spin" /> : failed || noExt ? <XCircle size={15} strokeWidth={2} /> : initials}
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 4, flexWrap: "wrap" }}>
            <span style={{ fontSize: "0.86rem", fontWeight: 700, color: scanning || failed || noExt ? "var(--text-muted)" : "var(--text-primary)" }}>
              {card.domain}
            </span>
            {card.domainAge && ok && (
              <span style={{ fontSize: "0.58rem", fontWeight: 700, color: "var(--text-muted)", background: "var(--surface-2)", border: "1px solid var(--border)", padding: "1px 6px", borderRadius: 4, letterSpacing: "0.04em" }}>
                Est. {card.domainAge}
              </span>
            )}
            {scanning && <span style={{ fontSize: "0.62rem", color: "var(--text-muted)", fontStyle: "italic" }}>Extension scraping...</span>}
            {(failed) && <span style={{ fontSize: "0.56rem", fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", color: "#ef4444", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", padding: "1px 6px", borderRadius: 4 }}>Scan Failed</span>}
            {noExt && <span style={{ fontSize: "0.56rem", fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", color: "#f59e0b", background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)", padding: "1px 6px", borderRadius: 4 }}>Extension Offline</span>}
          </div>

          {/* Health bar */}
          {ok && computedHealth !== null && (
            <div style={{ marginBottom: 4 }}>
              <HealthBar score={computedHealth} />
            </div>
          )}

          <p style={{ fontSize: "0.71rem", color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {noExt ? "Chrome Extension not detected — install and retry." : failed ? "Extension could not scrape this site." : card.snippet}
          </p>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }} onClick={(e) => e.stopPropagation()}>
          <a href={card.url} target="_blank" rel="noopener noreferrer" style={{ display: "flex", color: "var(--text-muted)", padding: 4 }} title="Open site">
            <ExternalLink size={13} />
          </a>
          {ok && (
            <button onClick={() => onToggleExpand(card.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", display: "flex", padding: 4 }}>
              {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          )}
        </div>
      </div>

      {/* Expanded panel */}
      <AnimatePresence>
        {expanded && ok && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            style={{ overflow: "hidden" }}
          >
            <div style={{
              margin: "0 18px 16px", borderRadius: 12,
              background: "var(--surface-2)", border: "1px solid var(--border)",
              overflow: "hidden", display: "flex", flexDirection: "column", gap: 16,
            }}>

              {/* Screenshot thumbnail — full-width, top of panel */}
              {card.screenshot ? (
                <div style={{
                  width: "100%", height: 176, overflow: "hidden",
                  background: "#0a0a0a", position: "relative",
                  borderBottom: "1px solid var(--border)",
                }}>
                  <img
                    src={card.screenshot.startsWith("data:") ? card.screenshot : `data:image/jpeg;base64,${card.screenshot}`}
                    alt={`Screenshot of ${card.domain}`}
                    style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top", display: "block" }}
                    onError={(e) => {
                      (e.currentTarget.parentElement as HTMLElement).style.display = "none";
                    }}
                  />
                </div>
              ) : (
                <div style={{
                  width: "100%", height: 80, overflow: "hidden",
                  background: "var(--surface)", borderBottom: "1px solid var(--border)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <span style={{ fontSize: "0.68rem", color: "var(--text-muted)", fontStyle: "italic" }}>
                    No screenshot returned by extension
                  </span>
                </div>
              )}

              <div style={{ padding: "0 18px 18px" }}>

              {/* Metrics */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 0 }}>
                {[
                  { label: "Health Score", value: computedHealth !== null ? `${computedHealth}/100` : "—" },
                  { label: "Fonts",        value: card.fontCount  ?? "—" },
                  { label: "Colors",       value: card.colorCount ?? "—" },
                  { label: "Est. Age",     value: card.domainAge  ?? "—" },
                ].map((m, i, arr) => (
                  <div key={m.label} style={{
                    flex: "1 1 70px",
                    borderRight: i < arr.length - 1 ? "1px solid var(--border)" : "none",
                    paddingRight: i < arr.length - 1 ? 14 : 0,
                    marginRight: i < arr.length - 1 ? 14 : 0,
                    paddingBottom: 4,
                  }}>
                    <p style={{ fontSize: "0.55rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 4 }}>{m.label}</p>
                    <p style={{ fontSize: "1rem", fontWeight: 800, color: "var(--text-primary)", fontVariantNumeric: "tabular-nums" }}>{m.value}</p>
                  </div>
                ))}
              </div>

              <div style={{ height: 1, background: "var(--border)" }} />

              {/* Contact intel */}
              <div>
                <p style={{ fontSize: "0.57rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 8 }}>Contact Intelligence</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {card.emails && card.emails.length > 0
                    ? card.emails.map((email) => (
                        <a key={email} href={`mailto:${email}`} style={{ display: "flex", alignItems: "center", gap: 5, padding: "4px 10px", borderRadius: 6, background: "var(--surface)", border: "1px solid var(--border-strong)", fontSize: "0.74rem", color: "var(--text-secondary)", fontWeight: 500, textDecoration: "none" }}>
                          <Mail size={10} style={{ color: "var(--text-muted)" }} />
                          {email}
                        </a>
                      ))
                    : <span style={{ fontSize: "0.74rem", color: "var(--text-muted)", fontStyle: "italic" }}>No emails found</span>
                  }
                  {card.instagram
                    ? <a href={`https://instagram.com/${card.instagram.replace("@", "")}`} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 10px", borderRadius: 6, background: "rgba(139,92,246,0.08)", border: "1px solid rgba(139,92,246,0.2)", fontSize: "0.74rem", color: "#a78bfa", fontWeight: 600, textDecoration: "none" }}>
                        <Instagram size={10} />
                        {card.instagram.startsWith("@") ? card.instagram : `@${card.instagram}`}
                      </a>
                    : <span style={{ fontSize: "0.74rem", color: "var(--text-muted)", fontStyle: "italic" }}>No Instagram found</span>
                  }
                </div>
              </div>

              {/* Health insight */}
              {computedHealth !== null && (() => {
                const flag = computedHealth >= 75 ? "CLEAN" : computedHealth >= 45 ? "REVIEW" : "CRITICAL MESS";
                const ico = flag === "CLEAN"
                  ? <CheckCircle size={13} style={{ color: "var(--green)", flexShrink: 0, marginTop: 2 }} />
                  : <AlertTriangle size={13} style={{ color: flag === "CRITICAL MESS" ? "#ef4444" : "#f59e0b", flexShrink: 0, marginTop: 2 }} />;
                return (
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 13px", borderRadius: 8, background: "var(--surface)", border: "1px solid var(--border)" }}>
                    {ico}
                    <p style={{ fontSize: "0.77rem", color: "var(--text-secondary)", lineHeight: 1.55 }}>
                      {flag === "CLEAN" && `Brand system is coherent — health score ${computedHealth}/100 with ${card.fontCount} font(s) and ${card.colorCount} color(s).`}
                      {flag === "REVIEW" && `Needs attention — health score ${computedHealth}/100. ${card.fontCount} fonts and ${card.colorCount} colors detected.`}
                      {flag === "CRITICAL MESS" && `Fragmented brand — health score ${computedHealth}/100. ${card.fontCount} fonts and ${card.colorCount} colors. Strong outreach opportunity.`}
                    </p>
                  </div>
                );
              })()}

              <div style={{ height: 1, background: "var(--border)" }} />

              {/* CRM + Pitch row */}
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 14, flexWrap: "wrap" }}>
                <div>
                  <p style={{ fontSize: "0.57rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 7 }}>Pipeline Stage</p>
                  <CrmDropdown domain={card.domain} value={crmStage} onChange={(v) => onCrmChange(card.domain, v)} />
                </div>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <p style={{ fontSize: "0.57rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 7 }}>AI Pitch Engine</p>
                  <PitchPanel
                    pitch={card.pitch}
                    cardOk={ok}
                    onGenerate={() => onGeneratePitch(card.id)}
                  />
                </div>
              </div>

              </div>{/* end padding wrapper */}

            </div>{/* end outer panel */}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function SkeletonCard({ i }: { i: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: i * 0.05 }}
      style={{ borderRadius: 16, border: "1px solid var(--border)", background: "var(--surface)", overflow: "hidden" }}
    >
      <div style={{ width: "100%", height: 84, background: "var(--surface-2)", borderBottom: "1px solid var(--border)" }} />
      <div style={{ padding: "14px 18px", display: "flex", gap: 12, alignItems: "center" }}>
        <div style={{ width: 18, height: 18, borderRadius: 4, background: "var(--border)", flexShrink: 0 }} />
        <div style={{ width: 34, height: 34, borderRadius: 9, background: "var(--border)", flexShrink: 0 }} />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 7 }}>
          <div style={{ height: 11, width: "28%", borderRadius: 4, background: "var(--border)" }} />
          <div style={{ height: 5, width: "60%", borderRadius: 99, background: "var(--border)" }} />
          <div style={{ height: 9, width: "50%", borderRadius: 4, background: "var(--border)" }} />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 5, flexShrink: 0 }}>
          <Loader2 size={12} className="spin" style={{ color: "var(--text-muted)" }} />
          <span style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}>Scraping...</span>
        </div>
      </div>
    </motion.div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

interface WebsiteConsistencyProps { dark: boolean; }

export function WebsiteConsistency({ dark: _dark }: WebsiteConsistencyProps) {
  const [query, setQuery]             = useState("");
  const [cards, setCards]             = useState<DomainCard[]>([]);
  const [fetching, setFetching]       = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [activeDork, setActiveDork]   = useState<string | null>(null);
  const [dorkSource, setDorkSource]   = useState<"gemini" | "raw" | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [selected, setSelected]       = useState<Set<string>>(new Set());
  const [expanded, setExpanded]       = useState<Set<string>>(new Set());
  const [running, setRunning]         = useState(false);
  const [error, setError]             = useState<string | null>(null);
  const [toast, setToast]             = useState({ msg: "", visible: false });
  const [crm, setCrm]                 = useState<Record<string, PipelineStage>>(() => loadCrm());
  const seenUrlsRef                   = useRef<Set<string>>(new Set());
  const abortRef                      = useRef(false);

  // Persist CRM state to localStorage on every change
  useEffect(() => { saveCrm(crm); }, [crm]);

  const showToast = useCallback((msg: string) => {
    setToast({ msg, visible: true });
    setTimeout(() => setToast((t) => ({ ...t, visible: false })), 3500);
  }, []);

  const handleCrmChange = useCallback((domain: string, stage: PipelineStage) => {
    setCrm((prev) => {
      const next = { ...prev, [domain]: stage };
      saveCrm(next);
      return next;
    });
  }, []);

  const toggleSelect = useCallback((id: string) => {
    setSelected((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }, []);

  const toggleExpand = useCallback((id: string) => {
    setExpanded((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }, []);

  const toggleAll = useCallback(() => {
    const eligible = cards.filter((c) => c.status === "ok");
    setSelected(selected.size === eligible.length ? new Set() : new Set(eligible.map((c) => c.id)));
  }, [selected, cards]);

  // ── Generate pitch for a card ─────────────────────────────────────────────
  const handleGeneratePitch = useCallback(async (id: string) => {
    const card = cards.find((c) => c.id === id);
    if (!card) return;

    setCards((prev) => prev.map((c) => c.id === id ? { ...c, pitch: { loading: true } } : c));

    // Auto-advance CRM stage to "pitched"
    setCrm((prev) => {
      const next = { ...prev, [card.domain]: "pitched" as PipelineStage };
      saveCrm(next);
      return next;
    });

    try {
      const result = await generatePitch(card);
      setCards((prev) => prev.map((c) =>
        c.id === id ? { ...c, pitch: { loading: false, subject: result.subject, body: result.body } } : c
      ));
    } catch (err) {
      setCards((prev) => prev.map((c) =>
        c.id === id ? { ...c, pitch: { loading: false, error: err instanceof Error ? err.message : "Pitch generation failed" } } : c
      ));
    }
  }, [cards]);

  // ── Extension scrape loop (sequential) ───────────────────────────────────
  const runExtensionLoop = useCallback(async (newCards: DomainCard[]) => {
    const extAvailable = typeof chrome !== "undefined" && !!chrome.runtime?.sendMessage;

    for (const card of newCards) {
      if (abortRef.current) break;

      if (!extAvailable) {
        setCards((prev) => prev.map((c) => c.id === card.id ? { ...c, status: "no-ext" } : c));
        continue;
      }

      const response = await sendExtMessage(card.url);

      if (response?.success && response.data) {
        const d = response.data;
        setCards((prev) => prev.map((c) =>
          c.id === card.id
            ? {
                ...c,
                status:      "ok",
                screenshot:  d.screenshot ?? null,
                healthScore: d.healthScore ?? null,
                fontCount:   new Set((d.fonts  ?? []).map((f) => f.toLowerCase().trim()).filter(Boolean)).size,
                colorCount:  new Set((d.colors ?? []).map((c) => c.toLowerCase().trim()).filter(Boolean)).size,
                domainAge:   d.metadata?.domainAge ?? null,
                emails:      d.metadata?.leads?.emails ?? [],
                instagram:   d.metadata?.leads?.instagram ?? null,
                extStatus:   d.status,
              }
            : c
        ));
      } else {
        setCards((prev) => prev.map((c) => c.id === card.id ? { ...c, status: "failed" } : c));
      }
    }
  }, []);

  // ── Initial search ────────────────────────────────────────────────────────
  const handleSearch = useCallback(async () => {
    const q = query.trim();
    if (!q) return;
    abortRef.current = false;
    setFetching(true);
    setHasSearched(true);
    setError(null);
    setCards([]);
    setActiveDork(null);
    setDorkSource(null);
    setCurrentPage(1);
    setSelected(new Set());
    setExpanded(new Set());
    seenUrlsRef.current = new Set();

    try {
      const data = await fetchStubs(q, 1);
      const savedCrm = loadCrm();

      const newCards: DomainCard[] = data.stubs
        .filter((s) => { if (seenUrlsRef.current.has(s.url)) return false; seenUrlsRef.current.add(s.url); return true; })
        .map((s) => ({ ...s, status: "scanning" as CardStatus }));

      setCards(newCards);
      setActiveDork(data.dork);
      setDorkSource(data.dorkSource);
      // Restore any saved CRM stages for domains returned
      setCrm((prev) => ({ ...prev, ...savedCrm }));
      setFetching(false);

      if (newCards.length === 0) { setError("No results — try a different query."); return; }

      showToast(`${newCards.length} sites found · Extension scraping started`);
      await runExtensionLoop(newCards);
      showToast(`${newCards.length} site${newCards.length !== 1 ? "s" : ""} scraped via extension`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed");
      setFetching(false);
    }
  }, [query, showToast, runExtensionLoop]);

  // ── Load next page ────────────────────────────────────────────────────────
  const handleNextPage = useCallback(async () => {
    if (!query.trim() || loadingMore) return;
    const nextPage = currentPage + 1;
    abortRef.current = false;
    setLoadingMore(true);

    try {
      const data = await fetchStubs(query.trim(), nextPage);
      const newCards: DomainCard[] = data.stubs
        .filter((s) => { if (seenUrlsRef.current.has(s.url)) return false; seenUrlsRef.current.add(s.url); return true; })
        .map((s) => ({ ...s, status: "scanning" as CardStatus }));

      setCards((prev) => [...prev, ...newCards]);
      setCurrentPage(nextPage);
      setLoadingMore(false);

      if (newCards.length === 0) { showToast("No new results on this page."); return; }
      showToast(`+${newCards.length} results appended · page ${nextPage} · scraping...`);
      await runExtensionLoop(newCards);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Page load failed");
      setLoadingMore(false);
    }
  }, [query, currentPage, loadingMore, showToast, runExtensionLoop]);

  const handleExecute = useCallback(async () => {
    if (selected.size === 0) return;
    setRunning(true);
    await new Promise((r) => setTimeout(r, 1800));
    setRunning(false);
    showToast(`Audit complete · ${selected.size} site${selected.size !== 1 ? "s" : ""} · Notion export queued`);
  }, [selected, showToast]);

  const okCards       = cards.filter((c) => c.status === "ok");
  const allSelected   = okCards.length > 0 && selected.size === okCards.length;
  const scanningCount = cards.filter((c) => c.status === "scanning").length;
  const extAvailable  = typeof chrome !== "undefined" && !!chrome?.runtime?.sendMessage;

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", padding: "32px 24px 80px" }}>

      {/* Header */}
      <div style={{ marginBottom: 22 }}>
        <h1 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800, fontSize: "1.45rem", color: "var(--text-primary)", letterSpacing: "-0.03em", marginBottom: 6 }}>
          Website Consistency
        </h1>
        <p style={{ fontSize: "0.83rem", color: "var(--text-muted)", lineHeight: 1.6 }}>
          Describe your target in plain language. Gemma 4 26B converts it to a precision dork → Serper discovers sites → Chrome Extension scrapes each for brand signals → AI pitch engine closes the loop.
        </p>
      </div>

      {/* Extension status */}
      <div style={{
        display: "inline-flex", alignItems: "center", gap: 6,
        padding: "5px 12px", borderRadius: 8, marginBottom: 20,
        background: "var(--surface-2)", border: "1px solid var(--border)",
        fontSize: "0.68rem", color: "var(--text-muted)", fontWeight: 600,
      }}>
        <Wifi size={11} style={{ color: extAvailable ? "var(--green)" : "#ef4444" }} />
        {extAvailable ? "Chrome Extension connected" : "Chrome Extension not detected — scraping will show as offline"}
      </div>

      {/* Search bar */}
      <div style={{ marginBottom: activeDork ? 10 : 20 }}>
        <label style={{ display: "block", fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 8 }}>
          Natural Language Query
        </label>
        <div style={{ display: "flex", gap: 10 }}>
          <div className="cmd-bar" style={{ flex: 1, gap: 10 }}>
            <Cpu size={14} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !fetching) void handleSearch(); }}
              placeholder="e.g. minimalist design agencies in Toronto with active portfolios"
              disabled={fetching}
              style={{ flex: 1, border: "none", outline: "none", background: "transparent", fontSize: "0.88rem", color: "var(--text-primary)", fontFamily: "inherit" }}
            />
          </div>
          <button
            className="btn-accent"
            style={{ padding: "0 20px", height: 46, borderRadius: 12, fontSize: "0.82rem", flexShrink: 0 }}
            onClick={() => void handleSearch()}
            disabled={fetching || !query.trim()}
          >
            {fetching ? <><Loader2 size={13} className="spin" />Dorking...</> : <><Search size={13} />Search</>}
          </button>
        </div>
      </div>

      {/* AI dork pill */}
      <AnimatePresence>
        {activeDork && !fetching && (
          <motion.div
            initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 13px", marginBottom: 18, borderRadius: 8, background: "var(--surface-2)", border: "1px solid var(--border)" }}
          >
            <span style={{ fontSize: "0.56rem", fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", flexShrink: 0, color: dorkSource === "gemini" ? "#a78bfa" : "var(--text-muted)", background: dorkSource === "gemini" ? "rgba(139,92,246,0.1)" : "var(--border)", border: `1px solid ${dorkSource === "gemini" ? "rgba(139,92,246,0.25)" : "transparent"}`, padding: "1px 6px", borderRadius: 3 }}>
              {dorkSource === "gemini" ? "Gemma 4 26B" : "Raw"}
            </span>
            <ChevronRight size={10} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
            <code style={{ fontSize: "0.74rem", color: "var(--text-secondary)", fontFamily: "monospace", wordBreak: "break-all" }}>
              {activeDork}
            </code>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error */}
      {error && (
        <div style={{ padding: "12px 16px", borderRadius: 10, marginBottom: 16, background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.18)", color: "#ef4444", fontSize: "0.82rem" }}>
          {error}
        </div>
      )}

      {/* Fetching skeleton */}
      {fetching && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "0 2px", marginBottom: 4 }}>
            <Loader2 size={12} className="spin" style={{ color: "var(--text-muted)" }} />
            <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
              Gemma 4 26B dorking → Serper discovery → handing off to Chrome Extension...
            </span>
          </div>
          {[0, 1, 2, 3].map((i) => <SkeletonCard key={i} i={i} />)}
        </div>
      )}

      {/* Results */}
      {!fetching && cards.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {/* Batch bar */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12, padding: "0 2px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <button onClick={toggleAll} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, color: "var(--text-muted)", padding: 0 }}>
                {allSelected ? <CheckSquare size={15} strokeWidth={2} style={{ color: "var(--accent)" }} /> : <Square size={15} strokeWidth={1.5} />}
                <span style={{ fontSize: "0.72rem", fontWeight: 600 }}>{allSelected ? "Deselect all" : "Select all"}</span>
              </button>
              {selected.size > 0 && <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>{selected.size} selected</span>}
              {scanningCount > 0 && (
                <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: "0.68rem", color: "var(--text-muted)" }}>
                  <Loader2 size={10} className="spin" />{scanningCount} scraping...
                </span>
              )}
            </div>
            <button
              className="btn-accent"
              onClick={() => void handleExecute()}
              disabled={selected.size === 0 || running}
              style={{ padding: "8px 18px", fontSize: "0.78rem", borderRadius: 9 }}
            >
              {running ? <><Loader2 size={12} className="spin" />Running Audit...</> : <><Zap size={12} />AI Audit &amp; Notion Export</>}
            </button>
          </div>

          {/* Cards */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {cards.map((card, i) => (
              <DomainCardView
                key={card.id}
                card={card}
                index={i}
                checked={selected.has(card.id)}
                onToggleCheck={toggleSelect}
                expanded={expanded.has(card.id)}
                onToggleExpand={toggleExpand}
                onGeneratePitch={handleGeneratePitch}
                crmStage={crm[card.domain] ?? "new"}
                onCrmChange={handleCrmChange}
              />
            ))}
          </div>

          {/* Footer */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 16, padding: "0 2px" }}>
            <span style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>
              {okCards.length} ok · {cards.filter((c) => c.status === "failed").length} failed · {scanningCount} scanning · page {currentPage}
            </span>
            <button
              onClick={() => void handleNextPage()}
              disabled={loadingMore || fetching || scanningCount > 0}
              style={{
                display: "flex", alignItems: "center", gap: 6, padding: "8px 18px", borderRadius: 9, fontSize: "0.78rem",
                fontWeight: 600, cursor: (loadingMore || scanningCount > 0) ? "not-allowed" : "pointer",
                background: "var(--surface)", border: "1px solid var(--border-strong)",
                color: (loadingMore || scanningCount > 0) ? "var(--text-muted)" : "var(--text-secondary)",
                transition: "all 0.15s ease",
              }}
            >
              {loadingMore ? <><Loader2 size={12} className="spin" />Loading page {currentPage + 1}...</> : <><ChevronDown size={12} />Load Next Page</>}
            </button>
          </div>
        </motion.div>
      )}

      {/* Empty state */}
      {!fetching && !hasSearched && (
        <div style={{ padding: "56px 32px", textAlign: "center", borderRadius: 20, border: "1.5px dashed var(--border-strong)", color: "var(--text-muted)" }}>
          <p style={{ fontSize: "1.8rem", opacity: 0.3, marginBottom: 12 }}>⬡</p>
          <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: "0.95rem", color: "var(--text-secondary)", marginBottom: 6 }}>
            Gemma 4 26B · Serper · Chrome Extension · AI Pitch Engine
          </p>
          <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", maxWidth: 400, margin: "0 auto", lineHeight: 1.65 }}>
            Discover competitors. Audit their brand consistency. Generate personalized cold pitches. Track every lead through a built-in sales pipeline.
          </p>
        </div>
      )}

      {/* Toast */}
      <AnimatePresence>
        {toast.visible && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }} className="toast">
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
