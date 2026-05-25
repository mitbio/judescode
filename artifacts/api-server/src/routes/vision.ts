import { Router, type IRouter } from "express";

const router: IRouter = Router();

// Curated fallback images used when SERPER_API_KEY is not set
const FALLBACK_IMAGES = [
  { url: "https://images.unsplash.com/photo-1486325212027-8081e485255e?w=700&q=80&auto=format&fit=crop", alt: "Minimal architecture" },
  { url: "https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=700&q=80&auto=format&fit=crop", alt: "Minimal interior"    },
  { url: "https://images.unsplash.com/photo-1519710164239-da123dc03ef4?w=700&q=80&auto=format&fit=crop", alt: "Design workspace"    },
  { url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=700&q=80&auto=format&fit=crop", alt: "Minimalist portrait" },
  { url: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=700&q=80&auto=format&fit=crop", alt: "Modern house"        },
  { url: "https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?w=700&q=80&auto=format&fit=crop", alt: "Minimal room"        },
];

interface SerperImageResult {
  imageUrl?: string;
  title?: string;
  thumbnailUrl?: string;
}

router.post("/vision", async (req, res): Promise<void> => {
  const { niche } = req.body as { niche?: string };

  if (!niche || typeof niche !== "string") {
    res.status(400).json({ error: "niche is required" });
    return;
  }

  const apiKey = process.env.SERPER_API_KEY;

  if (!apiKey) {
    req.log.info("SERPER_API_KEY not set — returning fallback images");
    res.json({ images: FALLBACK_IMAGES, source: "fallback" });
    return;
  }

  try {
    const response = await fetch("https://google.serper.dev/images", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-KEY": apiKey,
      },
      body: JSON.stringify({ q: `${niche} site:are.na`, num: 10 }),
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      throw new Error(`Serper responded with ${response.status}`);
    }

    const data = await response.json() as { images?: SerperImageResult[] };
    const images = (data.images ?? [])
      .filter((img) => img.imageUrl)
      .slice(0, 8)
      .map((img) => ({
        url: img.imageUrl!,
        alt: img.title ?? niche,
      }));

    if (images.length === 0) {
      throw new Error("No images in Serper response");
    }

    req.log.info({ count: images.length, niche }, "Fetched vision images from Serper");
    res.json({ images, source: "live" });
  } catch (err) {
    req.log.warn({ err }, "Serper fetch failed — falling back to stock images");
    res.json({ images: FALLBACK_IMAGES, source: "fallback" });
  }
});

export default router;
