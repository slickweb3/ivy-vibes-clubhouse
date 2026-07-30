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
  "$IVY is getting ready to hop online. Official links and contract address coming soon.";

export const heroCopy = {
  badge: "Official IvyVibing Project",
  headlineLine1: "SHORT SPINE.",
  headlineLine2: "BIG VIBES.",
  body: "Meet Ivy—the internet's beloved Frog Queen, professional grass roller and undisputed master of doing everything her own way. $IVY is a community meme coin celebrating the dog who proved that being built different is a superpower.",
  mediaLabel: "Add official Ivy photo or hero video here",
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
      mediaLabel: "Add an approved portrait of Ivy",
      heading: "The rotation is a technique",
      body: "Ivy has her own way of getting from A to B, and it works perfectly for her. Her family films it because it is delightful, not because it is unusual.",
    },
    {
      mediaLabel: "Add an approved grass-rolling photo",
      heading: "Grass is a full-body experience",
      body: "Fresh lawn, warm sun, zero hesitation. The Queen inspects, commits and rolls with total confidence.",
    },
    {
      mediaLabel: "Add an approved close-up of Ivy's face",
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
    mediaLabel: "Add the featured approved Ivy video here",
    isFeatured: true,
    videoUrl: null,
    permalink: null,
  },
  {
    id: "tv-frog-1",
    title: "Frog hop compilation",
    category: "Frog Mode",
    caption: "Slot reserved for approved frog-hop footage.",
    mediaLabel: "Add an approved frog-hop clip",
    isFeatured: false,
    videoUrl: null,
    permalink: null,
  },
  {
    id: "tv-frog-2",
    title: "Croak of approval",
    category: "Frog Mode",
    caption: "Slot reserved for approved sound-on footage.",
    mediaLabel: "Add an approved sound-on clip",
    isFeatured: false,
    videoUrl: null,
    permalink: null,
  },
  {
    id: "tv-out-1",
    title: "Garden patrol",
    category: "Outside Adventures",
    caption: "Slot reserved for approved outdoor footage.",
    mediaLabel: "Add an approved outdoor clip",
    isFeatured: false,
    videoUrl: null,
    permalink: null,
  },
  {
    id: "tv-out-2",
    title: "Grass inspection",
    category: "Outside Adventures",
    caption: "Slot reserved for approved grass-rolling footage.",
    mediaLabel: "Add an approved grass-rolling clip",
    isFeatured: false,
    videoUrl: null,
    permalink: null,
  },
  {
    id: "tv-queen-1",
    title: "Royal nap protocol",
    category: "Queen Behaviour",
    caption: "Slot reserved for approved nap footage.",
    mediaLabel: "Add an approved nap clip",
    isFeatured: false,
    videoUrl: null,
    permalink: null,
  },
  {
    id: "tv-classic-1",
    title: "An Ivy classic",
    category: "Ivy Classics",
    caption: "Slot reserved for a community-favourite clip.",
    mediaLabel: "Add an approved classic clip",
    isFeatured: false,
    videoUrl: null,
    permalink: null,
  },
  {
    id: "tv-latest-1",
    title: "Straight from the feed",
    category: "Latest Posts",
    caption: "This shelf fills automatically once official accounts are connected.",
    mediaLabel: "Awaiting connected social accounts",
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
  "The IvyVibing community grows",
  "The Short Spine Queen becomes an internet favourite",
  "$IVY begins its next chapter",
];

export const whyIvy = {
  heading: "More Than a Meme. It's an Ivy Vibe.",
  body: "$IVY is a community-driven celebration of Ivy and the owner who has cared for her, filmed her unforgettable moments and shared her personality with the world. The project is designed to keep Ivy at the centre of everything.",
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
      body: "Creator rewards and specified project proceeds are intended to benefit Ivy and her owners.",
      tone: "lavender" as const,
    },
  ],
  transparencyPanel:
    "Complete allocation, tokenomics and proceeds information will be published before launch. IvyVibing is not a registered charity. Creator rewards and specified project proceeds are intended to benefit Ivy and her owners.",
};

export const tokenRecord = {
  heading: "The Official Frog Queen Token Record",
  warning:
    "Always verify the contract address on this website. Fake $IVY tokens and impersonator accounts may exist.",
};

export const memeMachine = {
  heading: "Ivy Meme Machine",
  body: "Build a royal meme from approved Ivy photographs. No uploads, no free text—only owner-approved images and pre-written captions.",
  note: "Only use photographs approved for community sharing.",
  emptyState: "Approved meme photos coming soon.",
  captions: [
    "Frog Mode Activated",
    "Short Spine Long Legacy",
    "Bow Before the Queen",
    "Built Different",
    "Vibing Is the Utility",
    "Stay Weird",
    "$IVY Energy",
    "Royal Behaviour",
    "Touch Grass With Ivy",
    "Queen of the Rotation",
    "Maximum Frog",
    "The Shape of Greatness",
    "Internet Royalty",
    "Long Live Ivy",
  ],
};

export const ownersCorner = {
  heading: "Behind Every Queen Is a Very Dedicated Human",
  body: "Ivy's online story exists because someone has cared for her, understood her needs and shared her personality with the world. $IVY should always respect the bond at the centre of the project.",
  mediaLabel: "Add approved owner photograph here",
  cards: [
    { title: "A message from Ivy's owner", body: "A personal note will be published here." },
    { title: "A day in Ivy's routine", body: "Ivy's human will share what a normal day looks like." },
    { title: "Behind the scenes", body: "The stories behind the clips everyone already loves." },
    { title: "Project updates", body: "Direct updates from Ivy's human about $IVY." },
    { title: "Transparent proceeds updates", body: "Published once allocation details are finalised." },
    { title: "Approved care updates", body: "Only what Ivy's family chooses to share. No private details." },
  ],
};

export const royalCourt = {
  heading: "The Royal Court",
  body: "Every official IvyVibing channel will be listed here—and only here—once it exists.",
  safety: "Only trust accounts linked directly from IvyVibing's official website.",
  channels: [
    { id: "instagram", label: "Instagram" },
    { id: "tiktok", label: "TikTok" },
    { id: "x", label: "X" },
    { id: "telegram", label: "Telegram" },
    { id: "discord", label: "Discord" },
    { id: "email", label: "Community email" },
    { id: "contact", label: "Contact form" },
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
    question: "What is $IVY?",
    answer:
      "$IVY is a community meme coin inspired by IvyVibing and created to celebrate Ivy, her owner and the community surrounding her.",
  },
  {
    question: "Is the token live?",
    answer:
      "Not yet. The official blockchain, launch date and verified contract address will be published on this website.",
  },
  {
    question: "Where can I find official links?",
    answer:
      "All official social links will be added directly to this website. Treat any other account or contract as unverified until then.",
  },
  {
    question: "Does buying $IVY guarantee a return?",
    answer:
      "No. Meme coins and digital assets are highly speculative and may lose some or all of their value.",
  },
  {
    question: "Does the project support Ivy?",
    answer:
      "The project states that creator rewards and specified proceeds are intended to benefit Ivy and her owners. Detailed allocation information should be published before launch.",
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
      "When Ivy's official accounts are connected, the website retrieves and displays the three most recent approved posts from each platform through a secure server-side synchronization system.",
  },
  {
    question: "Why is a recent post missing?",
    answer:
      "A post may be temporarily unavailable, private, unsupported, awaiting approval or manually hidden by the website administrator.",
  },
];

export const footerDisclaimer =
  "$IVY is a community meme project inspired by IvyVibing. Digital assets and meme coins are highly speculative and may lose all value. Nothing on this website constitutes financial, legal or tax advice. Always verify official links and the contract address before interacting with any token. Instagram, TikTok and other social platforms do not sponsor or endorse this project.";

export const joinTheVibeMessage =
  "Official community links are coming soon. Only trust links published directly on this website.";

export const navLinks = [
  { label: "Meet Ivy", hash: "#meet-ivy" },
  { label: "Ivy TV", hash: "#ivy-tv" },
  { label: "Fresh Posts", hash: "#fresh-posts" },
  { label: "The Lore", hash: "#the-lore" },
  { label: "$IVY", hash: "#token-record" },
  { label: "Meme Machine", hash: "#meme-machine" },
  { label: "FAQ", hash: "#faq" },
];
