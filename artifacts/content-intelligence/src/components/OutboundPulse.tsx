import { useState, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Search, Loader2, ChevronDown, ChevronUp, CheckSquare, Square, Zap, ExternalLink } from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

interface LeadHandle {
  handle: string;
  url: string;
  title: string;
  snippet: string;
}

interface AuditResult {
  handle: string;
  mockFollowers: string;
  mockAvgLikes: number;
  postFrequency: string;
  aestheticAudit: string;
  pitchAngle: string;
}

interface DiscoverResponse {
  leads: LeadHandle[];
  dork: string;
  source: string;
}

interface AnalyzeResponse {
  results: AuditResult[];
  source: string;
}

// ── API helpers ───────────────────────────────────────────────────────────────

async function discoverLeads(query: string): Promise<DiscoverResponse> {
  const res = await fetch("/api/outbound/discover", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json() as Promise<DiscoverResponse>;
}

async function analyzeLeads(handles: string[]): Promise<AnalyzeResponse> {
  const res = await fetch("/api/outbound/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ handles }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json() as Promise<AnalyzeResponse>;
}

// ── Skeleton rows ─────────────────────────────────────────────────────────────

function SkeletonRow() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "14px 20px",
        borderBottom: "1px solid var(--border)",
      }}
    >
      <div style={{ width: 18, height: 18, borderRadius: 4, background: "var(--border)", flexShrink: 0 }} />
      <div style={{ width: 36, height: 36, borderRadius: "50%", background: "var(--border)", flexShrink: 0 }} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
        <div style={{ height: 11, width: "25%", borderRadius: 4, background: "var(--border)" }} />
        <div style={{ height: 9, width: "55%", borderRadius: 4, background: "var(--border)" }} />
      </div>
      <div style={{ width: 60, height: 11, borderRadius: 4, background: "var(--border)" }} />
    </div>
  );
}

// ── Audit panel (progressive disclosure) ─────────────────────────────────────

function AuditPanel({ audit }: { audit: AuditResult }) {
  return (
    <motion.div
      key="audit"
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.28, ease: "easeOut" }}
      style={{ overflow: "hidden" }}
    >
      <div
        style={{
          margin: "0 20px 12px",
          borderRadius: 14,
          background: "var(--surface-2)",
          border: "1px solid var(--border)",
          padding: "20px 22px",
          display: "flex",
          flexDirection: "column",
          gap: 18,
        }}
      >
        {/* Metrics row */}
        <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
          {[
            { label: "Followers", value: audit.mockFollowers },
            { label: "Avg Likes", value: audit.mockAvgLikes.toLocaleString() },
            { label: "Post Frequency", value: audit.postFrequency },
          ].map((m) => (
            <div key={m.label} style={{ display: "flex", flexDirection: "column", gap: 3 }}>
              <span style={{ fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)" }}>
                {m.label}
              </span>
              <span style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-primary)", fontVariantNumeric: "tabular-nums" }}>
                {m.value}
              </span>
            </div>
          ))}
        </div>

        <div style={{ height: 1, background: "var(--border)" }} />

        {/* Aesthetic audit */}
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
            <span
              style={{
                fontSize: "0.6rem",
                fontWeight: 700,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "var(--text-muted)",
                background: "var(--border)",
                padding: "2px 7px",
                borderRadius: 4,
              }}
            >
              Aesthetic Audit
            </span>
          </div>
          <p style={{ fontSize: "0.82rem", lineHeight: 1.72, color: "var(--text-secondary)" }}>
            {audit.aestheticAudit}
          </p>
        </div>

        {/* Pitch angle */}
        <div
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border-strong)",
            borderRadius: 10,
            padding: "14px 16px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
            <Zap size={11} style={{ color: "var(--accent)" }} />
            <span style={{ fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-muted)" }}>
              Pitch Angle
            </span>
          </div>
          <p style={{ fontSize: "0.84rem", lineHeight: 1.7, color: "var(--text-primary)", fontWeight: 500 }}>
            {audit.pitchAngle}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

// ── Lead row ──────────────────────────────────────────────────────────────────

interface LeadRowProps {
  lead: LeadHandle;
  index: number;
  checked: boolean;
  onToggleCheck: (handle: string) => void;
  audit: AuditResult | null;
  expanded: boolean;
  onToggleExpand: (handle: string) => void;
}

function LeadRow({ lead, index, checked, onToggleCheck, audit, expanded, onToggleExpand }: LeadRowProps) {
  const initial = lead.handle.replace("@", "").charAt(0).toUpperCase();

  return (
    <div style={{ borderBottom: "1px solid var(--border)" }}>
      {/* Main row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
          padding: "14px 20px",
          cursor: "pointer",
          background: checked ? "var(--surface-2)" : "transparent",
          transition: "background 0.15s ease",
        }}
        onMouseEnter={(e) => { if (!checked) (e.currentTarget as HTMLDivElement).style.background = "var(--surface-hover)"; }}
        onMouseLeave={(e) => { if (!checked) (e.currentTarget as HTMLDivElement).style.background = "transparent"; }}
      >
        {/* Checkbox */}
        <button
          onClick={(e) => { e.stopPropagation(); onToggleCheck(lead.handle); }}
          style={{ background: "none", border: "none", padding: 0, cursor: "pointer", color: checked ? "var(--accent)" : "var(--border-strong)", flexShrink: 0, display: "flex" }}
        >
          {checked ? <CheckSquare size={17} strokeWidth={2} /> : <Square size={17} strokeWidth={1.5} />}
        </button>

        {/* Avatar */}
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            background: `hsl(${(index * 67) % 360}, 60%, ${checked ? "55%" : "70%"})`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "0.78rem",
            fontWeight: 700,
            color: "#fff",
            flexShrink: 0,
            transition: "background 0.2s ease",
          }}
        >
          {initial}
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }} onClick={() => onToggleExpand(lead.handle)}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: "0.88rem", fontWeight: 600, color: "var(--text-primary)" }}>
              {lead.handle}
            </span>
            {audit && (
              <span
                style={{
                  fontSize: "0.58rem",
                  fontWeight: 700,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: "var(--green)",
                  background: "var(--green-bg)",
                  padding: "1px 6px",
                  borderRadius: 4,
                }}
              >
                Audited
              </span>
            )}
          </div>
          {lead.snippet && (
            <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "100%" }}>
              {lead.snippet}
            </p>
          )}
        </div>

        {/* Actions */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          <a
            href={lead.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            style={{ display: "flex", color: "var(--text-muted)", padding: 4 }}
            title="Open on Instagram"
          >
            <ExternalLink size={13} />
          </a>

          {audit && (
            <button
              onClick={() => onToggleExpand(lead.handle)}
              style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", display: "flex", padding: 4 }}
            >
              {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          )}
        </div>
      </div>

      {/* Audit panel */}
      <AnimatePresence>
        {expanded && audit && <AuditPanel audit={audit} />}
      </AnimatePresence>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

interface OutboundPulseProps {
  dark: boolean;
}

export function OutboundPulse({ dark: _dark }: OutboundPulseProps) {
  const [query, setQuery] = useState("");
  const [discovering, setDiscovering] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [leads, setLeads] = useState<LeadHandle[]>([]);
  const [audits, setAudits] = useState<Map<string, AuditResult>>(new Map());
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [dork, setDork] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [toast, setToast] = useState({ msg: "", visible: false });

  const showToast = useCallback((msg: string) => {
    setToast({ msg, visible: true });
    setTimeout(() => setToast((t) => ({ ...t, visible: false })), 2800);
  }, []);

  // ── Discover ────────────────────────────────────────────────
  const handleDiscover = useCallback(async () => {
    const q = query.trim();
    if (!q) return;
    setDiscovering(true);
    setError(null);
    setLeads([]);
    setAudits(new Map());
    setSelected(new Set());
    setExpanded(new Set());
    setDork(null);
    setHasSearched(true);

    try {
      const data = await discoverLeads(q);
      setLeads(data.leads);
      setDork(data.dork);
      if (data.leads.length === 0) {
        setError("No Instagram profiles found for this query. Try different keywords.");
      } else {
        showToast(`${data.leads.length} leads discovered · ${data.source === "live" ? "Live" : "Mock"}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Discovery failed. Check API keys.");
    } finally {
      setDiscovering(false);
    }
  }, [query, showToast]);

  // ── Analyze ─────────────────────────────────────────────────
  const handleAnalyze = useCallback(async () => {
    if (selected.size === 0) return;
    setAnalyzing(true);

    try {
      const handles = Array.from(selected);
      const data = await analyzeLeads(handles);
      const newAudits = new Map(audits);
      for (const result of data.results) {
        newAudits.set(result.handle, result);
      }
      setAudits(newAudits);
      // Auto-expand the first newly audited lead
      const firstHandle = data.results[0]?.handle;
      if (firstHandle) {
        setExpanded((prev) => new Set([...prev, firstHandle]));
      }
      showToast(`Deep audit complete · ${data.results.length} profile${data.results.length !== 1 ? "s" : ""}`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Audit failed");
    } finally {
      setAnalyzing(false);
    }
  }, [selected, audits, showToast]);

  const toggleSelect = useCallback((handle: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(handle)) next.delete(handle); else next.add(handle);
      return next;
    });
  }, []);

  const toggleExpand = useCallback((handle: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(handle)) next.delete(handle); else next.add(handle);
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    if (selected.size === leads.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(leads.map((l) => l.handle)));
    }
  }, [selected, leads]);

  const allSelected = leads.length > 0 && selected.size === leads.length;
  const someSelected = selected.size > 0;

  return (
    <div style={{ maxWidth: 960, margin: "0 auto", padding: "32px 24px 80px" }}>

      {/* ── Header ──────────────────────────────────────────── */}
      <div style={{ marginBottom: 28 }}>
        <h1
          style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontWeight: 800,
            fontSize: "1.45rem",
            color: "var(--text-primary)",
            letterSpacing: "-0.03em",
            marginBottom: 6,
          }}
        >
          Outbound Pulse
        </h1>
        <p style={{ fontSize: "0.83rem", color: "var(--text-muted)", lineHeight: 1.6 }}>
          Discover high-intent Instagram leads from natural language. AI-translates your query into a precision search, then runs a deep aesthetic audit on selected profiles.
        </p>
      </div>

      {/* ── Search bar ──────────────────────────────────────── */}
      <div
        style={{
          display: "flex",
          gap: 10,
          marginBottom: 24,
        }}
      >
        <div
          className="cmd-bar"
          style={{ flex: 1, gap: 10 }}
        >
          <Search size={15} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !discovering) void handleDiscover(); }}
            placeholder="e.g. Minimalist furniture brands in Chicago..."
            style={{
              flex: 1,
              border: "none",
              outline: "none",
              background: "transparent",
              fontSize: "0.9rem",
              color: "var(--text-primary)",
              fontFamily: "inherit",
            }}
            disabled={discovering}
          />
        </div>
        <button
          className="btn-accent"
          onClick={() => void handleDiscover()}
          disabled={discovering || !query.trim()}
          style={{ padding: "0 22px", height: 46, borderRadius: 12, fontSize: "0.84rem", flexShrink: 0 }}
        >
          {discovering ? (
            <><Loader2 size={14} className="spin" />Scanning...</>
          ) : (
            <>Discover Leads</>
          )}
        </button>
      </div>

      {/* ── Dork display ──────────────────────────────────────── */}
      {dork && !discovering && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            marginBottom: 16,
            padding: "8px 14px",
            borderRadius: 8,
            background: "var(--surface-2)",
            border: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <span style={{ fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)", flexShrink: 0 }}>
            Dork
          </span>
          <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)", fontFamily: "monospace", wordBreak: "break-all" }}>
            {dork}
          </span>
        </motion.div>
      )}

      {/* ── Error state ────────────────────────────────────────── */}
      {error && (
        <div
          style={{
            padding: "14px 18px",
            borderRadius: 12,
            background: "rgba(220,38,38,0.06)",
            border: "1px solid rgba(220,38,38,0.18)",
            color: "var(--red)",
            fontSize: "0.82rem",
            marginBottom: 16,
          }}
        >
          {error}
        </div>
      )}

      {/* ── Loading skeleton ────────────────────────────────────── */}
      {discovering && (
        <div className="card" style={{ borderRadius: 16, overflow: "hidden" }}>
          <div style={{ padding: "12px 20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 8 }}>
            <Loader2 size={12} className="spin" style={{ color: "var(--text-muted)" }} />
            <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>Translating query with Gemini → searching with Serper...</span>
          </div>
          {[1, 2, 3, 4, 5].map((i) => <SkeletonRow key={i} />)}
        </div>
      )}

      {/* ── Results table ───────────────────────────────────────── */}
      {!discovering && leads.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>

          {/* Batch action bar */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 10,
              padding: "0 2px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <button
                onClick={toggleSelectAll}
                style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, color: "var(--text-muted)", padding: 0 }}
              >
                {allSelected ? <CheckSquare size={15} strokeWidth={2} style={{ color: "var(--accent)" }} /> : <Square size={15} strokeWidth={1.5} />}
                <span style={{ fontSize: "0.72rem", fontWeight: 600 }}>
                  {allSelected ? "Deselect all" : "Select all"}
                </span>
              </button>
              {someSelected && (
                <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                  {selected.size} selected
                </span>
              )}
            </div>

            <button
              className="btn-accent"
              onClick={() => void handleAnalyze()}
              disabled={!someSelected || analyzing}
              style={{ padding: "8px 18px", fontSize: "0.78rem", borderRadius: 9 }}
            >
              {analyzing ? (
                <><Loader2 size={12} className="spin" />Auditing...</>
              ) : (
                <><Zap size={12} />Run Deep Aesthetic Audit</>
              )}
            </button>
          </div>

          {/* Lead list */}
          <div className="card" style={{ borderRadius: 16, overflow: "hidden" }}>
            {/* Table head */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                padding: "10px 20px",
                borderBottom: "1px solid var(--border)",
                background: "var(--surface-2)",
              }}
            >
              <div style={{ width: 17, flexShrink: 0 }} />
              <div style={{ width: 36, flexShrink: 0 }} />
              <span style={{ flex: 1, fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)" }}>
                Profile
              </span>
              <span style={{ fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)", flexShrink: 0, paddingRight: 4 }}>
                Actions
              </span>
            </div>

            {/* Rows */}
            {leads.map((lead, i) => (
              <LeadRow
                key={lead.handle}
                lead={lead}
                index={i}
                checked={selected.has(lead.handle)}
                onToggleCheck={toggleSelect}
                audit={audits.get(lead.handle) ?? null}
                expanded={expanded.has(lead.handle)}
                onToggleExpand={toggleExpand}
              />
            ))}
          </div>

          {/* Source label */}
          <div style={{ textAlign: "center", marginTop: 12 }}>
            <span style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>
              {leads.length} profiles found · Add SERPER_API_KEY2 + GEMINI_API_KEY2 for live results
            </span>
          </div>
        </motion.div>
      )}

      {/* ── Empty / initial state ────────────────────────────────── */}
      {!discovering && !hasSearched && (
        <div
          style={{
            padding: "72px 32px",
            textAlign: "center",
            borderRadius: 20,
            border: "1.5px dashed var(--border-strong)",
          }}
        >
          <p style={{ fontSize: "2.4rem", marginBottom: 16, opacity: 0.3 }}>⌖</p>
          <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: "1rem", color: "var(--text-secondary)", marginBottom: 8 }}>
            Outbound engine ready
          </p>
          <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", maxWidth: 360, margin: "0 auto", lineHeight: 1.7 }}>
            Describe your ideal lead in plain English. Gemini converts it into a precision dork, Serper finds the profiles, and our audit system grades their content for outreach viability.
          </p>
        </div>
      )}

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
    </div>
  );
}
