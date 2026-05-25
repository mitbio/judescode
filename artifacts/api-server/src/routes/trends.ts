import { Router, type IRouter } from "express";

const router: IRouter = Router();

// Live Google Apps Script deployment — returns cached Google Trends JSON
const LIVE_APPS_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbxqEu1c2nwEufzqqeTj63MTv2es7f7AekcYmgq4amQySSFDZctUEbkBqETevNS-yOqgjg/exec";

const MOCK_TRENDS = [
  { title: "AI-Generated Content Legislation",    snippet: "Governments worldwide are moving to regulate AI-generated content — creators who act first will own the narrative." },
  { title: "Quiet Luxury 2.0 Aesthetic",          snippet: "The second wave of quiet luxury strips everything back further — no logos, no branding, pure materiality." },
  { title: "Micro-Community Monetization",         snippet: "Creators with 10K hyper-loyal followers are out-earning mega influencers through community-first monetization." },
  { title: "Short-Form Video Fatigue",             snippet: "Audience data shows a measurable drop in short-form completion rates — long-form is staging a comeback." },
  { title: "Zero-Click Search Dominance",          snippet: "AI Overviews are intercepting 60%+ of top-funnel queries — content strategy must adapt or be invisible." },
  { title: "B2B Influencer Spend Surge",           snippet: "Enterprise brands are quietly shifting influencer budgets toward niche B2B creators with high-intent audiences." },
  { title: "Personal Brand vs. Company Brand",     snippet: "The founder-led content era is here — personal authority now consistently outperforms branded content in engagement." },
  { title: "Dark Social Attribution",              snippet: "More than half of content shares now happen in private channels — dark social is the biggest blind spot in content analytics." },
  { title: "Newsletter-to-Community Funnel",       snippet: "The highest-performing creators are building newsletters as top-of-funnel for paid community products." },
  { title: "AI Video Avatars Go Mainstream",       snippet: "Synthetic presenter technology has crossed the uncanny valley — production costs for video content are collapsing." },
];

router.get("/trends", async (req, res): Promise<void> => {
  // Use env override if set, otherwise use the hardcoded live URL
  const appsScriptUrl = process.env.APPS_SCRIPT_URL ?? LIVE_APPS_SCRIPT_URL;

  try {
    const response = await fetch(appsScriptUrl, {
      signal: AbortSignal.timeout(8000),
    });

    if (!response.ok) {
      throw new Error(`Apps Script responded with ${response.status}`);
    }

    const data = await response.json() as unknown;

    // Accept either { trends: [...] } or a bare array
    const raw = Array.isArray(data) ? data : (data as Record<string, unknown>).trends;

    if (!Array.isArray(raw) || raw.length === 0) {
      throw new Error("Invalid or empty trends response");
    }

    const trends = (raw as Array<Record<string, string>>).slice(0, 10).map((item) => ({
      title:   String(item.title   ?? item.query   ?? item.keyword ?? "Untitled"),
      snippet: String(item.snippet ?? item.summary ?? item.desc    ?? ""),
    }));

    req.log.info({ count: trends.length }, "Fetched live trends from Apps Script");
    res.json({ trends, source: "live" });
  } catch (err) {
    req.log.warn({ err }, "Apps Script fetch failed — falling back to mock trends");
    res.json({ trends: MOCK_TRENDS, source: "fallback" });
  }
});

export default router;
