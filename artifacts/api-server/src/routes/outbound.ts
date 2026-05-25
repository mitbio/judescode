import { Router, type IRouter } from "express";

const router: IRouter = Router();

// ── Types ────────────────────────────────────────────────────────────────────

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

// ── Helpers ──────────────────────────────────────────────────────────────────

function extractHandle(url: string): string | null {
  try {
    const u = new URL(url);
    if (!u.hostname.includes("instagram.com")) return null;
    const parts = u.pathname.replace(/^\//, "").replace(/\/$/, "").split("/");
    const handle = parts[0];
    if (!handle || handle.includes(".") || handle === "p" || handle === "reel" || handle === "explore") return null;
    return `@${handle}`;
  } catch {
    return null;
  }
}

function makeMockAudit(handle: string): AuditResult {
  const followerBases = [2.1, 4.7, 8.3, 12.4, 18.9, 31.2, 44.6, 67.0, 102.3];
  const seed = handle.length % followerBases.length;
  const followers = followerBases[seed];
  const avgLikes = Math.floor(followers * 1000 * (0.04 + (seed % 3) * 0.02));
  const freqs = ["1.8x/week", "2.4x/week", "3.1x/week", "4.2x/week", "5.6x/week", "6.0x/week"];
  const postFrequency = freqs[seed % freqs.length];

  const audits = [
    `The grid lacks a coherent visual language — alternating between high-contrast editorial and casual smartphone snapshots with zero intentionality. Typography is inconsistent: three distinct font treatments in the last twelve posts, none of which reinforce a premium positioning. The color palette is undefined. Warm tones bleed into cold filters without a governing system. This account is communicating effort, not authority. The content strategy is reactive rather than declarative, chasing trends instead of setting them.`,
    `There is a fundamental misalignment between the brand's stated premium positioning and what the grid actually communicates. The imagery hierarchy is reversed — product detail shots compete with lifestyle photography at the same visual weight, eliminating the editorial tension that drives desire. Color temperature shifts across consecutive posts suggest no shoot planning or post-processing system. The account would benefit from a strict 3-color palette discipline and a defined typographic voice. Right now, it reads as capable — not iconic.`,
    `The content rhythm here is all wrong for a premium brand. Posting frequency outpaces content quality, which is the cardinal sin of luxury positioning — scarcity of attention is the asset. The caption strategy leans informational when it should be aspirational. Grid coherence breaks at rows 4-6 where a clear change in photographer or creative direction is visible. The profile is sitting on real potential that is actively being suppressed by inconsistent execution.`,
    `Strong conceptual foundation being undermined by execution inconsistency. The hero images are genuinely compelling — then immediately undercut by low-resolution story reposts that degrade the overall aesthetic perception. From a pure grid architecture standpoint, the alternating cadence is promising but the tonal range is too wide: from near-black editorial to blown-out white in adjacent squares. A tighter exposure discipline and a single post-processing LUT applied consistently would transform this account.`,
    `The fundamental problem is that this account has no singular visual thesis. Every successful premium brand account can be described in one sentence: "dark and cinematic," "sun-drenched and editorial," "minimalist Swiss grid." This account would take a paragraph. The content quality is above average — the curation and sequencing strategy is not. There is a 2-3 post series that lands beautifully, then the visual logic dissolves. Someone with taste is making these images; someone without a system is deciding what to post.`,
  ];

  const pitches = [
    `We noticed your content has the raw material of a category-defining brand — the imagery quality is there, but the visual system isn't doing the strategy justice. We build the editorial framework that makes accounts like yours undeniable: a strict palette, a typography hierarchy, and a posting cadence engineered for desire rather than reach.`,
    `Your brand has an aesthetic point of view — it just isn't being expressed with the consistency that converts browsers into buyers. We specialize in building the invisible architecture behind premium accounts: the color system, the grid logic, the caption voice. One 90-day engagement and your account becomes a reference point in your category.`,
    `We track accounts that are one creative decision away from becoming iconic, and yours made the list. The content ambition is clear; the execution system is the missing layer. We've done this exact transformation for three brands in your space — and the compounding effect on organic reach and DM inquiry rate is measurable within 60 days.`,
    `There's a version of this account that commands the room in any niche it enters. The photography is capable, the following is real, and the product clearly has legs — what's missing is the editorial backbone. We build that backbone: the visual thesis, the content hierarchy, the cadence that makes your audience feel the scarcity of your attention.`,
    `Your account is performing competently when it could be performing definitively. The difference between a good premium brand account and a reference-point account is almost never budget — it's system. We install the system: grid architecture, tone of voice, post-sequencing logic. The result is an account that attracts inbound partnership inquiries rather than chasing them.`,
  ];

  return {
    handle,
    mockFollowers: `${followers.toFixed(1)}K`,
    mockAvgLikes: avgLikes,
    postFrequency,
    aestheticAudit: audits[seed % audits.length],
    pitchAngle: pitches[seed % pitches.length],
  };
}

// ── Route 1: Discover (/api/outbound/discover) ───────────────────────────────

router.post("/outbound/discover", async (req, res): Promise<void> => {
  const { query } = req.body as { query?: string };

  if (!query || typeof query !== "string" || query.trim().length < 3) {
    res.status(400).json({ error: "query is required (min 3 chars)" });
    return;
  }

  const geminiKey = process.env.GEMINI_API_KEY;
  const serperKey = process.env.SERPER_API_KEY;

  // ── Step A: Gemini → Google Dork ─────────────────────────────
  let dork = `site:instagram.com "${query}"`;

  if (geminiKey) {
    try {
      const geminiRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            system_instruction: {
              parts: [{
                text: `You are a search query translator. Convert the user's natural language into a highly optimized Google Dork to find Instagram profiles. Only return the raw dork string. Format: site:instagram.com "keyword1" "keyword2" "location"`,
              }],
            },
            contents: [{ role: "user", parts: [{ text: query }] }],
            generationConfig: { temperature: 0.2, maxOutputTokens: 200 },
          }),
          signal: AbortSignal.timeout(10000),
        }
      );

      if (geminiRes.ok) {
        const data = await geminiRes.json() as {
          candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
        };
        const raw = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? "";
        if (raw.length > 5) {
          dork = raw.replace(/^```[\s\S]*?```$/m, "").trim();
        }
      }
    } catch (err) {
      req.log.warn({ err: err instanceof Error ? err.message : String(err) }, "Gemini dork translation failed — using fallback dork");
    }
  } else {
    req.log.info("GEMINI_API_KEY2 not set — using basic dork");
  }

  req.log.info({ dork, query }, "Using dork");

  // ── Step B: Serper → Search results ──────────────────────────
  if (!serperKey) {
    req.log.info("SERPER_API_KEY2 not set — returning mock leads");
    const mockLeads: LeadHandle[] = [
      { handle: "@modernluxuryrealty", url: "https://instagram.com/modernluxuryrealty", title: "Modern Luxury Realty", snippet: "Curating the finest luxury properties" },
      { handle: "@elitemiamirealestate", url: "https://instagram.com/elitemiamirealestate", title: "Elite Miami Real Estate", snippet: "South Florida's premier luxury brokers" },
      { handle: "@luxehomecollective", url: "https://instagram.com/luxehomecollective", title: "Luxe Home Collective", snippet: "Exceptional properties for discerning buyers" },
      { handle: "@premiumlistings", url: "https://instagram.com/premiumlistings", title: "Premium Listings", snippet: "Off-market luxury real estate" },
      { handle: "@highendrealty", url: "https://instagram.com/highendrealty", title: "High End Realty", snippet: "Where luxury meets lifestyle" },
    ];
    res.json({ leads: mockLeads, dork, source: "mock" });
    return;
  }

  try {
    const serperRes = await fetch("https://google.serper.dev/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-KEY": serperKey,
      },
      body: JSON.stringify({ q: dork, num: 20 }),
      signal: AbortSignal.timeout(12000),
    });

    if (!serperRes.ok) {
      throw new Error(`Serper responded with ${serperRes.status}`);
    }

    const data = await serperRes.json() as {
      organic?: Array<{ link?: string; title?: string; snippet?: string }>;
    };

    const seen = new Set<string>();
    const leads: LeadHandle[] = [];

    for (const result of data.organic ?? []) {
      const url = result.link ?? "";
      const handle = extractHandle(url);
      if (!handle || seen.has(handle)) continue;
      seen.add(handle);
      leads.push({
        handle,
        url,
        title: result.title ?? handle,
        snippet: result.snippet ?? "",
      });
    }

    req.log.info({ count: leads.length, dork }, "Outbound discover complete");
    res.json({ leads, dork, source: "live" });
  } catch (err) {
    req.log.warn({ err: err instanceof Error ? err.message : String(err) }, "Serper outbound search failed");
    res.status(502).json({ error: "Search service unavailable — add SERPER_API_KEY2 to enable live results" });
  }
});

// ── Route 2: Analyze (/api/outbound/analyze) ─────────────────────────────────

router.post("/outbound/analyze", (req, res): void => {
  const { handles } = req.body as { handles?: string[] };

  if (!Array.isArray(handles) || handles.length === 0) {
    res.status(400).json({ error: "handles array is required" });
    return;
  }

  const results: AuditResult[] = handles.slice(0, 10).map(makeMockAudit);
  req.log.info({ count: results.length }, "Outbound analyze complete (mock)");
  res.json({ results, source: "mock" });
});

export default router;
