export interface TrendPoint { day: string; value: number; news?: number; }

export interface LiveRadarItem {
  id: string;
  topic: string;
  metric: string;
  volume: string;
  category: string;
  hot?: boolean;
}

export interface ContentIdea {
  id: string;
  hook: string;
  angle: string;
  visualDirection: string;
  format: string;
  trendScore: number;
  tags: string[];
}

export interface InspirationImage {
  id: string;
  url: string;
  alt: string;
  height: "tall" | "short" | "medium";
}

// ─── Live Radar (6 items) ────────────────────────────────────
export const liveRadarItems: LiveRadarItem[] = [
  { id: "1", topic: "AI-Generated Content Legislation",   metric: "+73.5%", volume: "2.1M",  category: "AI & Policy",      hot: true  },
  { id: "2", topic: "Quiet Luxury 2.0 Aesthetic",         metric: "+41.2%", volume: "980K",  category: "Lifestyle",         hot: false },
  { id: "3", topic: "Micro-Community Monetization",       metric: "+28.7%", volume: "560K",  category: "Creator Economy",   hot: false },
  { id: "4", topic: "Short-Form Video Fatigue",           metric: "+19.4%", volume: "740K",  category: "Media",             hot: false },
  { id: "5", topic: "Zero-Click Search Dominance",        metric: "+33.1%", volume: "410K",  category: "SEO",               hot: false },
  { id: "6", topic: "B2B Influencer Spend Surge",         metric: "+52.0%", volume: "320K",  category: "Marketing",         hot: true  },
];

export const extraRadarSets: LiveRadarItem[][] = [
  [
    { id: "1", topic: "AI Video Avatars Go Mainstream",       metric: "+88.4%", volume: "1.8M",  category: "AI & Video",     hot: true  },
    { id: "2", topic: "Long-Form Content Renaissance",        metric: "+44.1%", volume: "870K",  category: "Content",        hot: false },
    { id: "3", topic: "Dark Social Attribution",              metric: "+31.6%", volume: "490K",  category: "Analytics",      hot: false },
    { id: "4", topic: "Newsletter-to-Community Funnel",       metric: "+22.8%", volume: "615K",  category: "Growth",         hot: false },
    { id: "5", topic: "Personal Brand vs. Company Brand",     metric: "+29.3%", volume: "380K",  category: "Branding",       hot: false },
    { id: "6", topic: "Micro-SaaS Marketing Wave",           metric: "+61.7%", volume: "295K",  category: "SaaS",           hot: true  },
  ],
  [
    { id: "1", topic: "Creator-Led Product Launches",         metric: "+55.2%", volume: "1.3M",  category: "Creator Economy",hot: true  },
    { id: "2", topic: "Privacy-First Marketing Shift",        metric: "+38.9%", volume: "720K",  category: "MarTech",        hot: false },
    { id: "3", topic: "Owned Audience > Social Followers",   metric: "+26.5%", volume: "530K",  category: "Strategy",       hot: false },
    { id: "4", topic: "Search-to-Content Gap Analysis",       metric: "+17.8%", volume: "440K",  category: "SEO",            hot: false },
    { id: "5", topic: "AI Image in Ad Creative",              metric: "+42.3%", volume: "360K",  category: "Advertising",    hot: false },
    { id: "6", topic: "Podcast Renaissance for B2B",          metric: "+67.1%", volume: "275K",  category: "Audio",          hot: true  },
  ],
];

// ─── Inspiration images ──────────────────────────────────────
export const IMAGE_SETS: InspirationImage[][] = [
  [
    { id: "1", url: "https://images.unsplash.com/photo-1486325212027-8081e485255e?w=700&q=80&auto=format&fit=crop", alt: "Minimal architecture", height: "tall" },
    { id: "2", url: "https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=700&q=80&auto=format&fit=crop", alt: "Minimal interior",     height: "short" },
    { id: "3", url: "https://images.unsplash.com/photo-1519710164239-da123dc03ef4?w=700&q=80&auto=format&fit=crop", alt: "Design workspace",     height: "medium" },
    { id: "4", url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=700&q=80&auto=format&fit=crop", alt: "Minimalist portrait",  height: "short" },
  ],
  [
    { id: "5", url: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=700&q=80&auto=format&fit=crop", alt: "Modern house",         height: "medium" },
    { id: "6", url: "https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?w=700&q=80&auto=format&fit=crop", alt: "Minimal room",         height: "tall" },
    { id: "7", url: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=700&q=80&auto=format&fit=crop", alt: "Analytics setup",      height: "short" },
    { id: "8", url: "https://images.unsplash.com/photo-1499951360447-b19be8fe80f5?w=700&q=80&auto=format&fit=crop", alt: "Clean workspace",      height: "short" },
  ],
  [
    { id: "9",  url: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=700&q=80&auto=format&fit=crop",   alt: "Geometry architecture", height: "tall" },
    { id: "10", url: "https://images.unsplash.com/photo-1526045612212-70caf35c14df?w=700&q=80&auto=format&fit=crop",alt: "Minimalist design",    height: "short" },
    { id: "11", url: "https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=700&q=80&auto=format&fit=crop",alt: "Interior light",       height: "medium" },
    { id: "12", url: "https://images.unsplash.com/photo-1508345228704-935cc84bf5e2?w=700&q=80&auto=format&fit=crop",alt: "Creative space",       height: "short" },
  ],
];

// ─── Content ideas ────────────────────────────────────────────
const hooksPool = [
  "The {niche} space is dying — here's what's actually replacing it.",
  "Nobody in {niche} is talking about this 2026 shift. Yet.",
  "Stop making {niche} content for the algorithm. Do this instead.",
  "The hidden psychology behind why {niche} content goes viral in 2026.",
  "I studied 500 top {niche} creators. They all do one thing differently.",
  "Your {niche} content is invisible. Here's the data-backed fix.",
  "The {niche} trend that's 3 months from exploding. Get in now.",
  "Why 'authentic' {niche} content is the new sales pitch — and it works.",
  "The contrarian {niche} take that's gaining 10× more reach this quarter.",
  "What the top 1% of {niche} creators know that you don't.",
];

const anglesPool = [
  "Contrarian breakdown: Most creators in this space focus on surface-level content. Lead with the counterintuitive angle — data shows audiences reward takes that challenge assumptions. Use the trending news cycle as your entry point.",
  "Pattern interrupt: The trend data shows saturation at the obvious angle. Go deeper — explore the systemic cause behind the surface trend. Position yourself as a first-principles thinker, not a reactor.",
  "Authority transfer: Borrow credibility from the data surge. Open with the specific statistic, then bridge to your unique interpretation. Audiences are primed for this topic — give them the synthesis nobody else is offering.",
  "Timing play: This trend has 6–8 weeks before mainstream saturation. Strike now with a definitive piece. Be the reference source — aim for depth that makes future creators cite your work.",
  "Framework angle: Turn the trend into a repeatable system. Package this insight as a methodology audiences can apply immediately to their own context.",
];

const visualsPool = [
  "Minimal text-on-texture. Single bold stat centered in frame. Muted palette — beige, cream, slate. No stock photos. High-contrast typography. 35mm film aesthetic.",
  "Split-screen: left side = old way, right side = new way. Clean infographic style. Clear visual hierarchy — readable in 2 seconds. No clutter.",
  "Talking head with lower-third data overlay. Soft directional lighting, cinematic depth of field. Subtle motion graphics in background.",
  "Text-based reel: kinetic typography, each word timed to the beat. Monochrome base with a single accent color on the key data point.",
  "B-roll montage with text overlays. Slow motion, high contrast. No talking. Let visuals breathe. Captions carry the narrative weight.",
];

const formatsPool = ["Short-Form Video", "Long-Form Essay", "Twitter Thread", "Newsletter Lead", "Podcast Hook", "Instagram Carousel", "LinkedIn Post", "YouTube Script"];
const tagSets = [
  ["#trending", "#creator", "#viral"],
  ["#content", "#strategy", "#growth"],
  ["#ai", "#marketing", "#2026"],
  ["#niche", "#authority", "#monetize"],
  ["#insights", "#data", "#engagement"],
];

let counter = 0;
export const resetCounter = () => { counter = 0; };

export const generateIdeas = (niche: string, count = 2): ContentIdea[] => {
  const ideas: ContentIdea[] = [];
  for (let i = 0; i < count; i++) {
    counter++;
    const hook = hooksPool[(counter - 1) % hooksPool.length].replace(/{niche}/g, niche || "your niche");
    ideas.push({
      id: String(counter).padStart(2, "0"),
      hook,
      angle: anglesPool[(counter - 1) % anglesPool.length],
      visualDirection: visualsPool[(counter - 1) % visualsPool.length],
      format: formatsPool[Math.floor(Math.random() * formatsPool.length)],
      trendScore: 65 + Math.floor(Math.random() * 30),
      tags: tagSets[(counter - 1) % tagSets.length],
    });
  }
  return ideas;
};
