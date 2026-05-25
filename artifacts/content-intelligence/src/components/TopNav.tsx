import { Sun, Moon, Zap } from "lucide-react";
import type { AppTab } from "../App";

interface TopNavProps {
  dark: boolean;
  onToggleDark: () => void;
  niche: string;
  activeTab: AppTab;
  onTabChange: (tab: AppTab) => void;
}

const TABS: { id: AppTab; label: string; dot?: string }[] = [
  { id: "intelligence", label: "Content Intelligence" },
  { id: "website", label: "Website Consistency" },
  { id: "instagram", label: "Instagram Audit", dot: "beta" },
];

export function TopNav({ dark, onToggleDark, niche, activeTab, onTabChange }: TopNavProps) {
  return (
    <nav className="top-nav px-6 py-0 flex items-center justify-between" style={{ height: 52 }}>
      {/* Logo */}
      <div className="flex items-center gap-2.5" style={{ minWidth: 140 }}>
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center"
          style={{ background: "var(--text-primary)" }}
        >
          <Zap size={13} style={{ color: "var(--bg)" }} strokeWidth={2.5} />
        </div>
        <span className="font-bold text-sm tracking-tight" style={{ color: "var(--text-primary)" }}>
          Content OS
        </span>
      </div>

      {/* Center tabs */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 2,
          background: "var(--surface-2)",
          border: "1px solid var(--border)",
          borderRadius: 10,
          padding: "3px",
        }}
      >
        {TABS.map((t) => {
          const active = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => onTabChange(t.id)}
              style={{
                padding: "5px 14px",
                borderRadius: 7,
                border: "none",
                background: active ? "var(--surface)" : "transparent",
                boxShadow: active ? "var(--shadow-sm)" : "none",
                color: active ? "var(--text-primary)" : "var(--text-muted)",
                fontWeight: active ? 600 : 500,
                fontSize: "0.78rem",
                cursor: "pointer",
                transition: "all 0.18s ease",
                whiteSpace: "nowrap",
                letterSpacing: "-0.01em",
                display: "flex",
                alignItems: "center",
                gap: 5,
              }}
            >
              {t.dot === "beta" && (
                <span
                  style={{
                    fontSize: "0.5rem",
                    fontWeight: 800,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    color: active ? "var(--accent)" : "var(--text-muted)",
                    background: active ? "rgba(139,92,246,0.12)" : "var(--border)",
                    padding: "1px 5px",
                    borderRadius: 3,
                    transition: "all 0.18s ease",
                  }}
                >
                  BETA
                </span>
              )}
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-2" style={{ minWidth: 140, justifyContent: "flex-end" }}>
        {activeTab === "intelligence" && niche && (
          <div className="hidden sm:flex items-center gap-2">
            <span className="live-dot pulse-dot" />
            <span
              className="text-xs font-semibold truncate"
              style={{ color: "var(--text-secondary)", maxWidth: 140 }}
            >
              {niche}
            </span>
          </div>
        )}

        <button
          onClick={onToggleDark}
          className="icon-btn"
          title={dark ? "Switch to light mode" : "Switch to dark mode"}
        >
          {dark ? <Sun size={15} strokeWidth={2} /> : <Moon size={15} strokeWidth={2} />}
        </button>

        <div
          className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg"
          style={{ border: "1px solid var(--border)", background: "var(--surface)" }}
        >
          <div
            className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold"
            style={{ background: "var(--text-primary)", color: "var(--bg)" }}
          >
            U
          </div>
          <span className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
            AI Strategist
          </span>
        </div>
      </div>
    </nav>
  );
}
