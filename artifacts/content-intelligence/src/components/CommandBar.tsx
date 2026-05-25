import { useRef, useState } from "react";
import { Loader2, Zap, ChevronRight } from "lucide-react";

const EXAMPLES = [
  "Luxury Real Estate",
  "AI Tools for Creators",
  "Sustainable Fashion",
  "B2B SaaS Marketing",
  "Creator Economy",
  "Personal Finance",
  "Health & Wellness",
  "DTC Brands",
];

interface CommandBarProps {
  onRun: (niche: string) => void;
  loading: boolean;
  initialValue?: string;
}

export function CommandBar({ onRun, loading, initialValue = "" }: CommandBarProps) {
  const [value, setValue] = useState(initialValue);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const ref = useRef<HTMLInputElement>(null);

  const filtered = EXAMPLES.filter(
    (e) => e.toLowerCase().includes(value.toLowerCase()) && e !== value
  ).slice(0, 5);

  const submit = () => {
    if (value.trim() && !loading) {
      onRun(value.trim());
      setShowSuggestions(false);
    }
  };

  return (
    <div style={{ position: "relative", width: "100%" }}>
      {/* Suggestions */}
      {showSuggestions && value && filtered.length > 0 && (
        <div
          className="card"
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            left: 0,
            right: 0,
            zIndex: 100,
            borderRadius: 12,
            overflow: "hidden",
            padding: "4px 0",
          }}
        >
          {filtered.map((ex) => (
            <button
              key={ex}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "9px 16px",
                textAlign: "left",
                background: "transparent",
                border: "none",
                cursor: "pointer",
                fontSize: "0.85rem",
                color: "var(--text-secondary)",
                transition: "background 0.1s ease",
              }}
              onMouseEnter={(e) =>
                ((e.currentTarget as HTMLButtonElement).style.background = "var(--surface-hover)")
              }
              onMouseLeave={(e) =>
                ((e.currentTarget as HTMLButtonElement).style.background = "transparent")
              }
              onMouseDown={() => {
                setValue(ex);
                setShowSuggestions(false);
              }}
            >
              <ChevronRight size={11} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
              <span style={{ color: "var(--text-primary)", fontWeight: 500 }}>{ex}</span>
            </button>
          ))}
        </div>
      )}

      {/* Main bar */}
      <div className="cmd-bar">
        <span
          style={{
            fontSize: "0.62rem",
            fontWeight: 700,
            textTransform: "uppercase" as const,
            letterSpacing: "0.1em",
            color: "var(--text-muted)",
            flexShrink: 0,
          }}
        >
          Niche
        </span>
        <div
          style={{
            width: 1,
            height: 16,
            background: "var(--border)",
            flexShrink: 0,
          }}
        />
        <input
          ref={ref}
          value={value}
          onChange={(e) => { setValue(e.target.value); setShowSuggestions(true); }}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="Enter your target niche..."
          disabled={loading}
          style={{
            flex: 1,
            background: "transparent",
            border: "none",
            outline: "none",
            fontSize: "0.9rem",
            fontWeight: 500,
            color: "var(--text-primary)",
            minWidth: 0,
            fontFamily: "inherit",
          }}
        />
        <button
          onClick={submit}
          disabled={loading || !value.trim()}
          className="btn-accent"
          style={{ minWidth: 148, justifyContent: "center" }}
        >
          {loading ? (
            <><Loader2 size={13} className="spin" />Analyzing...</>
          ) : (
            <><Zap size={13} strokeWidth={2.5} />Run Intelligence</>
          )}
        </button>
      </div>

      {/* Quick chips */}
      {!value && !loading && (
        <div
          style={{
            display: "flex",
            gap: 6,
            marginTop: 10,
            flexWrap: "wrap" as const,
          }}
        >
          {EXAMPLES.slice(0, 4).map((ex) => (
            <button
              key={ex}
              className="btn-ghost"
              style={{ fontSize: "0.75rem" }}
              onClick={() => { setValue(ex); ref.current?.focus(); }}
            >
              {ex}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
