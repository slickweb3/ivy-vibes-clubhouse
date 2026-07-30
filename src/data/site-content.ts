/**
 * Editable seed content for the public site.
 *
 * These records mirror the Supabase tables (`content_blocks`, `faq_entries`,
 * `timeline_chapters`, `gallery_items`, `ivy_tv_items`, `meme_captions`) and
 * act as the fallback whenever the database has not been populated yet.
 *
 * Nothing here invents a fact about Ivy, the token or any social account.
 */

export const announcement =
  "$ivy is getting ready to hop online. Official links and contract address coming soon.";

export const heroCopy = {
  badge: "Official ivy vibing Project",
  headlineLine1: "SHORT SPINE.",
  headlineLine2: "BIG VIBES.",
  body: "Meet Ivy—the internet's beloved Frog Queen, professional grass roller and undisputed master of doing everything her own way. $ivy is a community meme coin celebrating the dog who proved that being built different is a superpower.",
  mediaLabel: "Official Ivy portrait",
  stickers: ["Frog Mode", "Certified Queen", "Built Different", "Main Character", "Internet Royalty"],
};

export const meetIvy = {
  heading: "Built Different. Loved Everywhere.",
  body: "Ivy lives life in a shape entirely her own. Her compact body means she sometimes moves through the world differently, but Ivy has never let that interfere with having fun. Whether she is rotating, rolling through the grass, hopping like a frog or staring directly into the camera, Ivy turns ordinary moments into internet history.",
  cards: [
    {
      title: "Frog Queen",
      body: "For the legendary hops, croaks and unmistakable Ivy movement.",
      tone: "frog" as const,
    },
    {
      title: "Grass-Rolling Professional",
      body: "No lawn is safe when the Queen arrives.",
      tone: "leaf" as const,
    },
    {
      title: "Certified Internet Icon",
      body: "A one-of-one personality with a worldwide community.",
      tone: "lavender" as const,
    },
  ],
  editorial: [
    {
      mediaLabel: "Ivy portrait",
      heading: "The rotation is a technique",
      body: "Ivy has her own way of getting from A to B, and it works perfectly for her. Her family films it because it is delightful, not because it is unusual.",
    },
    {
      mediaLabel: "Grass-rolling Ivy moment",
      heading: "Grass is a full-body experience",
      body: "Fresh lawn, warm sun, zero hesitation. The Queen inspects, commits and rolls with total confidence.",
    },
    {
      mediaLabel: "Ivy close-up",
      heading: "Direct eye contact, every time",
      body: "Ivy knows exactly where the camera is. That stare has ended more arguments than any comment section ever could.",
    },
  ],
};

export const freshPosts = {
  heading: "Fresh From the Frog Queen",
  body: "The newest hops, rolls and royal behaviour—delivered directly from Ivy's official pages.",
  loading: "Checking in with the Queen…",
  empty: "The Queen is preparing her next appearance.",
};

export const ivyTv = {
  heading: "Welcome to Ivy TV",
  subtitle: "Frog hops, royal naps, grass rolls and pure Ivy behaviour.",
  loading: "Summoning the Frog Queen…",
  categories: [
    "All",
    "Frog Mode",
    "Outside Adventures",
    "Queen Behaviour",
    "Ivy Classics",
    "Latest Posts",
  ] as const,
};

export type IvyTvCategory = (typeof ivyTv.categories)[number];

export interface IvyTvItem {
  id: string;
  title: string;
  category: Exclude<IvyTvCategory, "All">;
  caption: string;
  mediaLabel: string;
  isFeatured: boolean;
  /** null until an owner-approved video is uploaded and linked. */
  videoUrl: string | null;
  permalink: string | null;
}

export const ivyTvItems: IvyTvItem[] = [
  {
    id: "tv-featured",
    title: "The featured Ivy episode",
    category: "Queen Behaviour",
    caption: "Reserved for the owner's chosen headline clip.",
    mediaLabel: "Featured Ivy video",
    isFeatured: true,
    videoUrl: null,
    permalink: null,
  },
  {
    id: "tv-frog-1",
    title: "Frog hop compilation",
    category: "Frog Mode",
    caption: "Slot reserved for approved frog-hop footage.",
    mediaLabel: "Frog-hop Ivy clip",
    isFeatured: false,
    videoUrl: null,
    permalink: null,
  },
  {
    id: "tv-frog-2",
    title: "Croak of approval",
    category: "Frog Mode",
    caption: "Slot reserved for approved sound-on footage.",
    mediaLabel: "Sound-on Ivy clip",
    isFeatured: false,
    videoUrl: null,
    permalink: null,
  },
  {
    id: "tv-out-1",
    title: "Garden patrol",
    category: "Outside Adventures",
    caption: "Slot reserved for approved outdoor footage.",
    mediaLabel: "Outdoor Ivy clip",
    isFeatured: false,
    videoUrl: null,
    permalink: null,
  },
  {
    id: "tv-out-2",
    title: "Grass inspection",
    category: "Outside Adventures",
    caption: "Slot reserved for approved grass-rolling footage.",
    mediaLabel: "Grass-rolling Ivy clip",
    isFeatured: false,
    videoUrl: null,
    permalink: null,
  },
  {
    id: "tv-queen-1",
    title: "Royal nap protocol",
    category: "Queen Behaviour",
    caption: "Slot reserved for approved nap footage.",
    mediaLabel: "Nap-time Ivy clip",
    isFeatured: false,
    videoUrl: null,
    permalink: null,
  },
  {
    id: "tv-classic-1",
    title: "An Ivy classic",
    category: "Ivy Classics",
    caption: "Slot reserved for a community-favourite clip.",
    mediaLabel: "Classic Ivy clip",
    isFeatured: false,
    videoUrl: null,
    permalink: null,
  },
  {
    id: "tv-latest-1",
    title: "Straight from the feed",
    category: "Latest Posts",
    caption: "This shelf fills automatically once official accounts are connected.",
    mediaLabel: "Official Ivy clip",
    isFeatured: false,
    videoUrl: null,
    permalink: null,
  },
];

export const hallOfFameCaptions = [
  "An absolute unit of royalty.",
  "Frog mode activated.",
  "Built like a legend.",
  "No neck. No problem.",
  "Queen of the rotation.",
  "Grass inspection in progress.",
  "Main-character energy.",
  "The shape of greatness.",
  "Tiny spine. Massive presence.",
  "She came. She saw. She rotated.",
  "Royal business only.",
  "Vibing at maximum capacity.",
];

export const loreChapters = [
  "Ivy enters the world built completely different",
  "The Frog Queen personality emerges",
  "Ivy's unusual movement captures the internet",
  "Grass rolling becomes a royal tradition",
  "The ivy vibing community grows",
  "The Short Spine Queen becomes an internet favourite",
  "$ivy begins its next chapter",
];

export const whyIvy = {
  heading: "More Than a Meme. It's an Ivy Vibe.",
  body: "$ivy is a community-driven celebration of Ivy and the owner who has cared for her, filmed her unforgettable moments and shared her personality with the world. The project is designed to keep Ivy at the centre of everything.",
  cards: [
    {
      title: "Officially Ivy",
      body: "Built around the real dog, her real story and owner-approved content.",
      tone: "frog" as const,
    },
    {
      title: "Community Powered",
      body: "For the people who have laughed, commented, shared and fallen in love with Ivy.",
      tone: "pink" as const,
    },
    {
      title: "Transparent",
      body: "Official contract, allocation and launch information will be published here before release.",
      tone: "yellow" as const,
    },
    {
      title: "Made to Support the Queen",
      body: "Creator rewards and specified project proceeds are intended to benefit Ivy and her owner.",
      tone: "lavender" as const,
    },
  ],
  transparencyPanel:
    "Complete allocation, tokenomics and proceeds information will be published before launch. ivy vibing is not a registered charity. Creator rewards and specified project proceeds are intended to benefit Ivy and her owner.",
};

export const tokenRecord = {
  heading: "The Official Frog Queen Token Record",
  warning:
    "Always verify the contract address on this website. Fake $ivy tokens and impersonator accounts may exist.",
  planHeading: "Planned launch & tokenomics",
  planNote:
    "$ivy will launch on pump.fun on Solana as a standard fair launch. These are the pump.fun defaults, published in advance. The mint address and launch date appear here the moment they exist.",
  plan: [
    {
      title: "Fair launch on pump.fun",
      body: "No presale, no private round, no team allocation. Everyone buys on the same bonding curve from block one.",
      tone: "frog" as const,
    },
    {
      title: "1,000,000,000 $ivy",
      body: "The standard pump.fun fixed supply. No minting after launch — the mint authority is revoked by the platform.",
      tone: "yellow" as const,
    },
    {
      title: "0% buy & sell tax",
      body: "pump.fun tokens have no transfer tax. Only Solana network fees and the platform's standard trading fee apply.",
      tone: "lavender" as const,
    },
    {
      title: "Liquidity burned at graduation",
      body: "When the bonding curve completes, liquidity moves on-chain and the LP tokens are burned by the platform.",
      tone: "pink" as const,
    },
  ],
  purposeHeading: "Creator rewards go to Ivy",
  purposeBody:
    "pump.fun pays creator rewards from trading activity to the coin's creator wallet. For $ivy those rewards are intended for Ivy and her owner — her care, her comfort and her ongoing adventures. That is the ultimate purpose of this project.",
  purposeDisclaimer:
    "ivy vibing is not a registered charity. Creator rewards and specified project proceeds are intended to benefit Ivy and her owner. Full allocation and proceeds details will be published before launch.",
};

export const ownerCorner = {
  heading: "Behind Every Queen Is a Very Dedicated Human",
  body: "Ivy's online story exists because someone has cared for her, understood her needs and shared her personality with the world. $ivy should always respect the bond at the centre of the project.",
  mediaLabel: "Ivy and her human",
  cards: [
    { title: "Ivy comes first", body: "Her care, comfort and routine always outrank anything happening on-chain." },
    { title: "Only official content", body: "Every clip and photo on this site is an official Instagram or TikTok post, hosted by the platform." },
    { title: "Creator rewards", body: "pump.fun creator rewards from $ivy trading are intended for Ivy and her owner." },
    { title: "No private details", body: "Nothing about Ivy's household, location or medical records is published here." },
    { title: "Transparent proceeds", body: "Full allocation and proceeds information will be published before launch." },
    { title: "Community, not charity", body: "ivy vibing is not a registered charity — it is a community meme project built around Ivy." },
  ],
};


export const royalCourt = {
  heading: "The Royal Court",
  body: "Every official ivy vibing channel is listed here—and only here.",
  safety: "Only trust accounts linked directly from ivy vibing's official website.",
  channels: [
    { id: "instagram", label: "Instagram" },
    { id: "tiktok", label: "TikTok" },
    { id: "x", label: "X" },
    { id: "telegram", label: "Telegram" },
  ],
  gallery:
    "A moderated community gallery is planned. There is no upload form yet—submissions will open once moderation is in place.",
};

export interface FaqEntry {
  question: string;
  answer: string;
}

export const faqEntries: FaqEntry[] = [
  {
    question: "What is $ivy?",
    answer:
      "$ivy is a community meme coin inspired by ivy vibing and created to celebrate Ivy, her owner and the community surrounding her.",
  },
  {
    question: "Is the token live?",
    answer:
      "Not yet. $ivy will launch on pump.fun on Solana with the standard pump.fun fair-launch setup. The launch date and the verified mint address will be published on this website — until they appear here, nothing is live.",
  },
  {
    question: "Where can I find official links?",
    answer:
      "Ivy's official Instagram, TikTok, X and Telegram links are published on this website. Treat any other account or contract as unverified.",
  },
  {
    question: "Does buying $ivy guarantee a return?",
    answer:
      "No. Meme coins and digital assets are highly speculative and may lose some or all of their value.",
  },
  {
    question: "Does the project support Ivy?",
    answer:
      "The project states that creator rewards and specified proceeds are intended to benefit Ivy and her owner. Detailed allocation information should be published before launch.",
  },
  {
    question: "Is short spine syndrome a dog breed?",
    answer: "No. It is a condition, not a breed.",
  },
  {
    question: "Can I use Ivy's photographs?",
    answer: "Only media specifically approved for community use may be reused.",
  },
  {
    question: "Are the Instagram and TikTok posts updated automatically?",
    answer:
      "No. The website uses manually curated official Instagram and TikTok post embeds. New posts are added by URL, and the original media and captions stay hosted by the platforms.",
  },
  {
    question: "Why is a recent post missing?",
    answer:
      "A post may be temporarily unavailable, private, unsupported, awaiting approval or manually hidden by the website administrator.",
  },
];

export const footerDisclaimer =
  "$ivy is a community meme project inspired by ivy vibing. Digital assets and meme coins are highly speculative and may lose all value. Nothing on this website constitutes financial, legal or tax advice. Always verify official links and the contract address before interacting with any token. Instagram, TikTok and other social platforms do not sponsor or endorse this project.";

export const joinTheVibeMessage =
  "Ivy's official channels are listed below. Only trust links published directly on this website.";

export const navLinks = [
  { label: "Meet Ivy", hash: "#meet-ivy" },
  { label: "Fresh Posts", hash: "#fresh-posts" },
  { label: "The Lore", hash: "#the-lore" },
  { label: "$ivy", hash: "#token-record" },
  { label: "Chart", hash: "#live-chart" },
  { label: "FAQ", hash: "#faq" },
];
