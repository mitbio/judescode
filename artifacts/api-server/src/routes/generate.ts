import { Router, type IRouter } from "express";

const router: IRouter = Router();

interface TrendItem { title: string; snippet?: string; }

interface ContentAngle {
  id: string;
  tag: string;
  hook: string;
  narrative: string;
  visualDirection: string;
  optimizedImageSearchQuery?: string;
}

interface VisionImage {
  url: string;
  alt: string;
}

const MOCK_ANGLES: ContentAngle[] = [
  {
    id: "01",
    tag: "CONTRARIAN",
    hook: "The content calendar is dead — brands still using one lose ground every quarter.",
    narrative: "Most marketing teams treat content as a production line, optimizing for volume over resonance. Reactive, context-aware content consistently outperforms scheduled evergreen in share rate. The calendar is a crutch that replaced strategy.",
    visualDirection: "Stark black-and-white split frame. One side shows a crossed-out calendar, the other a fluid wave form. No typography.",
    optimizedImageSearchQuery: "editorial black white minimal design contrast split composition",
  },
  {
    id: "02",
    tag: "INSIDER",
    hook: "Your audience knows what they want — they just need you to confirm it before buying.",
    narrative: "High-converting content validates desire that already exists. The best brands build mirrors, not billboards — reflecting the audience's worldview back with precision. That is the conversion mechanism.",
    visualDirection: "Warm editorial photography. Close-up of a person reading, soft over-the-shoulder angle. Depth of field blurs the device, keeps the face sharp.",
    optimizedImageSearchQuery: "warm editorial photography over shoulder reading lifestyle minimal",
  },
  {
    id: "03",
    tag: "TIMING PLAY",
    hook: "The window to own this topic is 6 weeks. Then every major brand joins the conversation.",
    narrative: "Trend adoption follows a predictable S-curve and we are at the inflection point where early movers capture the majority of organic reach. The brands who publish a definitive piece now become the citation source. Everyone who follows will link back to them.",
    visualDirection: "Countdown typography with large serif numbers and editorial texture. Minimal palette: off-white, deep navy, single red accent. No imagery.",
    optimizedImageSearchQuery: "countdown serif typography editorial texture off-white navy minimal",
  },
];

function buildPrompt(niche: string, trends: TrendItem[]): string {
  const t = trends.slice(0, 3).map((x, i) => `${i + 1}. ${x.title}`).join("; ");
  return `Creative Director task. Niche: "${niche}". Top trends: ${t}.

Generate 3 content marketing angles as a JSON array. Keep each field SHORT.

Return ONLY valid JSON. No markdown. No prose outside the JSON.

[
  {
    "id": "01",
    "tag": "CONTRARIAN",
    "hook": "One punchy sentence under 15 words. No bold markers.",
    "narrative": "Exactly 2 sentences of strategic explanation.",
    "visualDirection": "Exactly 1 sentence describing the visual style.",
    "optimizedImageSearchQuery": "5-8 word image search string that visually matches the concept and visual direction. No quotes."
  },
  { "id": "02", "tag": "INSIDER", "hook": "...", "narrative": "...", "visualDirection": "...", "optimizedImageSearchQuery": "..." },
  { "id": "03", "tag": "TIMING PLAY", "hook": "...", "narrative": "...", "visualDirection": "...", "optimizedImageSearchQuery": "..." }
]

Tags allowed: CONTRARIAN, INSIDER, TIMING PLAY, PATTERN INTERRUPT, FRAMEWORK`;
}

function extractJson(raw: string): ContentAngle[] {
  let cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/i, "").trim();
  const start = cleaned.indexOf("[");
  const end = cleaned.lastIndexOf("]");
  if (start !== -1 && end !== -1 && end > start) {
    cleaned = cleaned.slice(start, end + 1);
  }
  cleaned = cleaned.replace(/\*\*/g, "").replace(/\*/g, "");
  const parsed = JSON.parse(cleaned) as unknown;
  if (!Array.isArray(parsed)) throw new Error("Response is not an array");
  return (parsed as ContentAngle[]).slice(0, 3);
}

async function fetchSerperImages(query: string, apiKey: string): Promise<VisionImage[]> {
  try {
    const response = await fetch("https://google.serper.dev/images", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-KEY": apiKey,
      },
      body: JSON.stringify({ q: query, num: 8 }),
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) return [];
    const data = await response.json() as { images?: Array<{ imageUrl?: string; title?: string }> };
    return (data.images ?? [])
      .filter((img) => img.imageUrl)
      .slice(0, 8)
      .map((img) => ({ url: img.imageUrl!, alt: img.title ?? query }));
  } catch {
    return [];
  }
}

router.post("/generate", async (req, res): Promise<void> => {
  const { niche, trends } = req.body as { niche?: string; trends?: TrendItem[] };

  if (!niche || typeof niche !== "string") {
    res.status(400).json({ error: "niche is required" });
    return;
  }

  const geminiKey = process.env.GEMINI_API_KEY;
  const serperKey = process.env.SERPER_API_KEY;

  if (!geminiKey) {
    req.log.info("GEMINI_API_KEY not set — returning mock angles");
    res.json({ angles: MOCK_ANGLES, visionImages: [], source: "mock" });
    return;
  }

  const trendsList: TrendItem[] = Array.isArray(trends) ? trends : [];
  const prompt = buildPrompt(niche, trendsList);

  const models = ["gemini-2.5-flash", "gemini-2.0-flash-lite", "gemini-2.0-flash"];

  for (const model of models) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 4096,
              responseMimeType: "application/json",
            },
          }),
          signal: AbortSignal.timeout(25000),
        }
      );

      if (response.status === 429) {
        req.log.warn({ model }, "Rate limited — trying next model");
        continue;
      }

      if (!response.ok) {
        const errBody = await response.text();
        throw new Error(`Gemini ${model} responded with ${response.status}: ${errBody.slice(0, 200)}`);
      }

      const data = await response.json() as {
        candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
      };

      const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
      if (!rawText) throw new Error("Empty response from Gemini");

      const angles = extractJson(rawText);
      req.log.info({ count: angles.length, niche, model }, "Stage 1 complete — generated content angles");

      // ── Stage 2: Use optimized query from first angle to fetch Serper images ──
      let visionImages: VisionImage[] = [];
      if (serperKey) {
        const firstQuery = angles[0]?.optimizedImageSearchQuery;
        const searchQuery = firstQuery && firstQuery.trim().length > 3
          ? firstQuery.trim()
          : `${niche} editorial visual aesthetic`;
        req.log.info({ searchQuery }, "Stage 2 — fetching Serper images");
        visionImages = await fetchSerperImages(searchQuery, serperKey);
        req.log.info({ count: visionImages.length }, "Stage 2 complete — vision images fetched");
      }

      res.json({ angles, visionImages, source: "live" });
      return;

    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("429") || msg.includes("RESOURCE_EXHAUSTED")) {
        req.log.warn({ model }, "Rate limited — trying next model");
        continue;
      }
      req.log.warn({ err: msg.slice(0, 200), model }, "Gemini model failed");
      continue;
    }
  }

  req.log.warn({ niche }, "All Gemini models failed — returning mock angles");
  res.json({ angles: MOCK_ANGLES, visionImages: [], source: "fallback" });
});

export default router;
