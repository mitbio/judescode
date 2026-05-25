import { Router, type IRouter } from "express";

const router: IRouter = Router();

// ── Types ─────────────────────────────────────────────────────────────────────

interface SerperOrganic {
  link?: string;
  title?: string;
  snippet?: string;
}

export interface DomainStub {
  id: string;
  domain: string;
  url: string;
  title: string;
  snippet: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

// ── Gemma 4 26B Dork Generator ────────────────────────────────────────────────

const PLATFORM_EXCLUSIONS = [
  "-site:youtube.com", "-site:facebook.com", "-site:twitter.com", "-site:x.com",
  "-site:instagram.com", "-site:linkedin.com", "-site:reddit.com", "-site:wikipedia.org",
  "-site:yelp.com", "-site:amazon.com", "-site:pinterest.com", "-site:tiktok.com",
  "-site:clutch.co", "-site:designrush.com", "-site:upwork.com", "-site:fiverr.com",
  "-site:trustpilot.com", "-site:angieslist.com", "-site:bark.com",
].join(" ");

async function callGeminiModel(model: string, prompt: string, apiKey: string, timeoutMs: number): Promise<string> {
  const systemText = `You are a Google search expert. Convert the user's natural language query into a short, targeted Google search string that finds REAL business websites.

Rules:
- Use quoted exact phrases for the niche e.g. "branding agency" or "design studio"
- Add inurl:contact OR inurl:portfolio to target business pages
- Include city/country if the user mentioned one
- Output ONLY a JSON object on one line: {"dork": "YOUR_SEARCH_STRING_HERE"}
- Keep "dork" value under 100 characters — do NOT add -site: exclusions, those are handled separately
- No explanation, no markdown, no code block — raw JSON only`;

  const userText = `Convert this to a Google dork (short search string, no -site: exclusions): ${prompt}`;

  const isGemma = model.startsWith("gemma");
  const body = isGemma
    ? {
        contents: [{ role: "user", parts: [{ text: `${systemText}\n\n${userText}` }] }],
        generationConfig: { temperature: 0.1, maxOutputTokens: 200 },
      }
    : {
        system_instruction: { parts: [{ text: systemText }] },
        contents: [{ role: "user", parts: [{ text: userText }] }],
        generationConfig: { temperature: 0.1, maxOutputTokens: 200 },
      };

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(timeoutMs),
    }
  );

  if (!response.ok) {
    const errData = await response.json().catch(() => ({})) as { error?: { code?: number } };
    throw new Error(`Model ${model} responded ${response.status} (${errData?.error?.code ?? "?"})`);
  }

  const data = await response.json() as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
}

async function generateDork(
  query: string,
  apiKey: string,
  logger: { info: (o: object, m: string) => void; warn: (o: object, m: string) => void }
): Promise<string> {
  const models: Array<{ name: string; timeout: number }> = [
    { name: "gemma-4-26b-a4b-it", timeout: 40000 },
    { name: "gemini-2.0-flash",   timeout: 10000 },
  ];

  let lastErr = "";
  for (const { name, timeout } of models) {
    try {
      logger.info({ model: name, query }, `Trying dork generation with ${name}`);
      const rawText = await callGeminiModel(name, query, apiKey, timeout);
      logger.info({ model: name, rawLen: rawText.length, preview: rawText.slice(0, 120) }, `${name} responded`);

      // Strip Gemma 4 chain-of-thought: <think> blocks + markdown bullets
      const stripped = rawText
        .replace(/<think>[\s\S]*?<\/think>/gi, "")
        .replace(/\*[\s\S]*?\n/g, "")
        .trim();

      // Take the last JSON object (reasoning may produce partial JSON earlier)
      const allMatches = [...stripped.matchAll(/\{[\s\S]*?\}/g)];
      const lastMatch = allMatches[allMatches.length - 1];

      if (lastMatch) {
        const parsed = JSON.parse(lastMatch[0]) as { dork?: string };
        if (parsed.dork && typeof parsed.dork === "string" && parsed.dork.trim().length > 5) {
          let dork = parsed.dork.trim();
          if (!dork.includes("-site:youtube.com")) {
            dork = `${dork} ${PLATFORM_EXCLUSIONS}`;
          }
          logger.info({ model: name, dork }, `Dork extracted via ${name}`);
          return dork;
        }
      }
      throw new Error(`No valid JSON dork in ${name} response`);
    } catch (err) {
      lastErr = String(err);
      logger.warn({ model: name, err: lastErr }, `${name} failed — trying next model`);
    }
  }

  throw new Error(`All models failed: ${lastErr}`);
}

// ── Route: POST /api/website/scan ─────────────────────────────────────────────
// Returns Serper URL stubs only. All scraping is handled in the browser via
// the local Chrome Extension (ID: neeobhkgjehajkfmepfngmbloalphcld).

router.post("/website/scan", async (req, res): Promise<void> => {
  const { query, page } = req.body as { query?: string; page?: number };

  if (!query || typeof query !== "string" || query.trim().length < 3) {
    res.status(400).json({ error: "query is required (min 3 chars)" });
    return;
  }

  const serperKey = process.env.SERPER_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY_2;

  if (!serperKey) {
    res.status(503).json({ error: "SERPER_API_KEY not configured" });
    return;
  }

  const currentPage = typeof page === "number" && page >= 1 ? Math.floor(page) : 1;

  // ── Step 1: Gemma 4 26B dork generation ──────────────────────────────────
  let dork = query.trim().replace(/[^\w\s:."/\-*()]/g, "");
  let dorkSource: "gemini" | "raw" = "raw";

  if (geminiKey) {
    try {
      dork = await generateDork(query.trim(), geminiKey, req.log);
      dorkSource = "gemini";
    } catch (err) {
      req.log.warn({ err: String(err) }, "Dork generation failed — using sanitised raw query");
    }
  }

  // ── Step 2: Serper discovery ──────────────────────────────────────────────
  // Strip -site: operators before sending (free plan rejects long queries).
  // Platform filtering is done via post-filter on returned URLs.
  const BLOCKED_DOMAINS = new Set([
    "youtube.com", "facebook.com", "twitter.com", "x.com", "instagram.com",
    "linkedin.com", "reddit.com", "wikipedia.org", "yelp.com", "amazon.com",
    "pinterest.com", "tiktok.com", "clutch.co", "designrush.com", "upwork.com",
    "fiverr.com", "trustpilot.com", "angieslist.com", "bark.com",
    "thumbtack.com", "houzz.com", "sortlist.com", "goodfirms.co",
  ]);

  const serperQuery = dork
    .replace(/-site:\S+/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();

  let stubs: DomainStub[] = [];
  try {
    const body: Record<string, unknown> = { q: serperQuery, num: 10 };
    if (currentPage > 1) body.page = currentPage;

    req.log.info({ serperQuery, page: currentPage }, "Serper search");

    const serperRes = await fetch("https://google.serper.dev/search", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-API-KEY": serperKey },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(12000),
    });
    if (!serperRes.ok) throw new Error(`Serper ${serperRes.status}`);
    const data = await serperRes.json() as { organic?: SerperOrganic[] };

    stubs = (data.organic ?? [])
      .filter((r) => {
        if (!r.link) return false;
        try {
          const host = new URL(r.link).hostname.replace(/^www\./, "");
          return !BLOCKED_DOMAINS.has(host);
        } catch { return false; }
      })
      .slice(0, 10)
      .map((r, i) => {
        const url = r.link ?? "";
        return {
          id: `${currentPage}-${i + 1}`,
          domain: extractDomain(url),
          url,
          title: r.title ?? extractDomain(url),
          snippet: r.snippet ?? "",
        };
      });

    req.log.info({ count: stubs.length, page: currentPage }, "Serper stubs ready — scraping delegated to browser extension");
  } catch (err) {
    req.log.warn({ err: String(err) }, "Serper discovery failed");
    res.status(502).json({ error: "Serper search failed — check your API key" });
    return;
  }

  res.json({ stubs, dork, dorkSource, page: currentPage });
});

export default router;
