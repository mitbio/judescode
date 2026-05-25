import { Router, type IRouter } from "express";

const router: IRouter = Router();

async function callGemma(prompt: string, apiKey: string): Promise<string> {
  const systemText = `You are an elite B2B sales copywriter for Contact-X, a design automation and brand optimization agency.

Your job is to write a high-converting cold outreach email to a website owner based on a real automated brand audit of their site. The audit has already been run — the metrics you receive are factual, not estimated.

WRITING RULES:
- Total email length: under 150 words (hard limit — count carefully)
- Do NOT use their name — address it generically to the team or owner
- Open immediately with the audit data as the hook — lead with the numbers in the first sentence
- Make the health score, font count, and color count feel like a specific discovery they didn't know about
- Frame Contact-X as having already done the analysis and being ready to deliver a free visual mockup fix
- Tone: sharp, confident, peer-level — not salesy, not generic, not flattering
- NO filler openers: never use "I hope this email finds you well", "I came across your website", "reaching out because", or any variation
- NO vague CTAs: end with a specific, low-friction ask (e.g. "Worth 15 minutes this week?")
- The subject line must be specific to their domain and hint at the audit finding — not generic

OUTPUT FORMAT:
Return ONLY a raw JSON object on a single line with exactly two keys:
{"subject": "...", "body": "..."}

No markdown, no code fences, no explanation, no preamble — just the JSON object.`;

  const body = {
    contents: [{ role: "user", parts: [{ text: `${systemText}\n\n${prompt}` }] }],
    generationConfig: { temperature: 0.7, maxOutputTokens: 400 },
  };

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemma-4-26b-a4b-it:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(70000),
    }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { error?: { message?: string } };
    throw new Error(`Gemma responded ${res.status}: ${err?.error?.message ?? "unknown"}`);
  }

  const data = await res.json() as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
}

router.post("/generate-pitch", async (req, res): Promise<void> => {
  const { domain, fontCount, colorCount, emails, healthScore } = req.body as {
    domain?: string;
    fontCount?: number;
    colorCount?: number;
    emails?: string[];
    healthScore?: number;
  };

  if (!domain) {
    res.status(400).json({ error: "domain is required" });
    return;
  }

  const apiKey = process.env.GEMINI_API_KEY_2;
  if (!apiKey) {
    res.status(503).json({ error: "GEMINI_API_KEY_2 not configured" });
    return;
  }

  const prompt = `Write a cold pitch email for this prospect:
- Domain: ${domain}
- Health Score: ${healthScore ?? "unknown"}/100
- Fonts detected: ${fontCount ?? "unknown"}
- Colors detected: ${colorCount ?? "unknown"}
- Emails found: ${emails && emails.length > 0 ? emails.join(", ") : "none found"}

Use their specific numbers as the hook. Keep it under 150 words. Return only: {"subject": "...", "body": "..."}`;

  try {
    const rawText = await callGemma(prompt, apiKey);
    req.log.info({ domain, rawLen: rawText.length }, "Gemma pitch raw response");

    // Strip chain-of-thought: <think> blocks, markdown, bullets
    const stripped = rawText
      .replace(/<think>[\s\S]*?<\/think>/gi, "")
      .replace(/```[\s\S]*?```/g, "")
      .trim();

    // Extract last JSON object
    const allMatches = [...stripped.matchAll(/\{[\s\S]*?\}/g)];
    const lastMatch = allMatches[allMatches.length - 1];

    if (!lastMatch) throw new Error("No JSON found in Gemma response");

    const parsed = JSON.parse(lastMatch[0]) as { subject?: string; body?: string };
    if (!parsed.subject || !parsed.body) throw new Error("Missing subject or body in JSON");

    res.json({ subject: parsed.subject.trim(), body: parsed.body.trim() });
  } catch (err) {
    req.log.error({ err: String(err), domain }, "Pitch generation failed");
    res.status(500).json({ error: String(err) });
  }
});

export default router;
