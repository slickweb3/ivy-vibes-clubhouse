/**
 * Editable content + legal pages.
 *
 * These records are the seed content. Once Lovable Cloud is enabled, the
 * admin dashboard reads and writes the `content_pages` table instead and
 * these act as the fallback.
 */

export interface ContentPage {
  slug: string;
  title: string;
  description: string;
  updatedAt: string | null;
  body: string[];
}

export const legalPages: ContentPage[] = [
  {
    slug: "terms",
    title: "Terms of Use",
    description: "The rules for using the IvyVibing clubhouse website.",
    updatedAt: null,
    body: [
      "This website is a community fan project celebrating Ivy, the Short Spine Queen and Frog Queen, and the $IVY meme coin. It is provided as-is, for entertainment and community purposes.",
      "By using this site you agree that nothing here is an offer, solicitation or recommendation to buy, sell or hold any digital asset.",
      "Community submissions (memes, art, photos) remain the property of their creators. Submitting content grants IvyVibing permission to display it with credit, and the owner may remove any submission at any time.",
      "Imagery of Ivy is owned and approved by her family. Do not reuse it outside this site without their permission.",
      "This page is editable from the admin dashboard and should be reviewed by a qualified legal professional before launch.",
    ],
  },
  {
    slug: "privacy",
    title: "Privacy Policy",
    description: "What IvyVibing does and does not collect.",
    updatedAt: null,
    body: [
      "This site does not require an account to browse and does not sell personal data.",
      "Third-party embeds (video and social) are blocked until you explicitly allow them. Your choice is stored in your browser's local storage only.",
      "The public social feed endpoint serves cached, owner-curated content. It does not contact social platforms when you load a page and does not forward any information about you to them.",
      "If analytics or contact forms are added later, this page will be updated before they go live.",
      "This page is editable from the admin dashboard and should be reviewed by a qualified legal professional before launch.",
    ],
  },
  {
    slug: "disclaimer",
    title: "Risk Disclaimer",
    description: "Important risk information about $IVY.",
    updatedAt: null,
    body: [
      "$IVY is a meme coin. It has no intrinsic value, no utility guarantee, no roadmap commitment and no expectation of financial return.",
      "Nothing on this site is financial, investment, legal or tax advice. Digital assets are volatile and you may lose everything you spend.",
      "Token name, contract address, blockchain, supply, taxes, liquidity, launch date, exchange listings, partnerships and audit status are unverified and displayed as “Coming Soon”. Any third party publishing such details is not authorised by this site.",
      "Scams frequently impersonate meme coin projects. Verify everything against this site's token record before acting.",
      "This page is editable from the admin dashboard and should be reviewed by a qualified legal professional before launch.",
    ],
  },
  {
    slug: "cookies",
    title: "Cookies & Embeds",
    description: "How embeds and storage work on IvyVibing.",
    updatedAt: null,
    body: [
      "IvyVibing sets no advertising or tracking cookies.",
      "One local storage key records whether you allowed third-party embeds. Nothing loads from third parties until you say yes.",
      "To withdraw consent, clear this site's data in your browser and the consent prompt will appear again.",
      "This page is editable from the admin dashboard.",
    ],
  },
];

export function getLegalPage(slug: string): ContentPage | undefined {
  return legalPages.find((p) => p.slug === slug);
}
