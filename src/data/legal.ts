/**
 * Draft legal + policy pages.
 *
 * Every page is an editable template. They mirror the `legal_pages` table and
 * are clearly labelled as drafts requiring professional review.
 */

export interface LegalSection {
  heading: string;
  paragraphs: string[];
}

export interface LegalPage {
  slug: string;
  title: string;
  summary: string;
  needsLegalReview: boolean;
  sections: LegalSection[];
}

const NO_CLAIMS =
  "Token name, blockchain, contract address, supply, tokenomics, launch date, exchange listings, partnerships and audit status are unverified and displayed as “Coming Soon” on this website.";

export const legalPages: LegalPage[] = [
  {
    slug: "terms",
    title: "Terms of Use",
    summary: "The rules for using the ivy vibing website.",
    needsLegalReview: true,
    sections: [
      {
        heading: "About this website",
        paragraphs: [
          "ivy vibing is the website for $ivy, a community meme project inspired by Ivy, affectionately known as the Short Spine Queen and Frog Queen. The site is provided for entertainment, community and information purposes.",
          "By using this website you accept these terms. If you do not accept them, please do not use the site.",
        ],
      },
      {
        heading: "No offer and no advice",
        paragraphs: [
          "Nothing on this website is an offer, solicitation, recommendation or advice to buy, sell or hold any digital asset.",
          NO_CLAIMS,
        ],
      },
      {
        heading: "Accuracy and availability",
        paragraphs: [
          "Content may be updated, corrected or removed at any time. The website may be unavailable during maintenance.",
          "Values shown as “Coming Soon” are not yet confirmed. Do not act on information that is not published here.",
        ],
      },
      {
        heading: "Intellectual property",
        paragraphs: [
          "Photographs and videos of Ivy belong to Ivy's family and are used with permission. See the Media Usage Policy for what may be reused.",
          "The ivy vibing name, wordmark, illustrations and site design may not be used to imply endorsement of another project.",
        ],
      },
      {
        heading: "Third-party platforms",
        paragraphs: [
          "Instagram, TikTok and other social platforms do not sponsor, endorse or administer this project. Their trademarks belong to their respective owners.",
        ],
      },
      {
        heading: "Limitation of liability",
        paragraphs: [
          "To the fullest extent permitted by law, the project team is not liable for any loss arising from use of this website or from any digital asset transaction.",
        ],
      },
    ],
  },
  {
    slug: "privacy",
    title: "Privacy Policy",
    summary: "What ivy vibing does and does not collect.",
    needsLegalReview: true,
    sections: [
      {
        heading: "What we collect",
        paragraphs: [
          "You do not need an account to browse this website. We do not sell personal data.",
          "Standard server logs may record technical request information such as IP address, user agent and requested page for security and reliability purposes.",
        ],
      },
      {
        heading: "Cookies and embeds",
        paragraphs: [
          "Only strictly necessary storage is used by default. Optional third-party embeds (for example social video players) are blocked until you explicitly allow them in Cookie Settings.",
          "Your consent choice is stored in your browser's local storage and can be changed at any time.",
        ],
      },
      {
        heading: "The social feed",
        paragraphs: [
          "The public social feed endpoint serves cached, owner-approved records from this project's own database. Loading a page does not contact Instagram or TikTok and does not send them information about you.",
        ],
      },
      {
        heading: "Administrator accounts",
        paragraphs: [
          "Administrator sign-in is handled by the project's authentication provider. Only an email address and authentication metadata are stored for those accounts.",
        ],
      },
      {
        heading: "Changes",
        paragraphs: [
          "If analytics, newsletters or contact forms are added later, this page will be updated before those features go live.",
        ],
      },
    ],
  },
  {
    slug: "cookies",
    title: "Cookie Policy",
    summary: "How optional cookies and third-party embeds are handled.",
    needsLegalReview: true,
    sections: [
      {
        heading: "Strictly necessary",
        paragraphs: [
          "A small amount of browser storage is used to remember your cookie choice and basic interface preferences. This cannot be switched off because the site cannot function correctly without it.",
        ],
      },
      {
        heading: "Optional third-party embeds",
        paragraphs: [
          "Social embeds may set cookies belonging to Instagram or TikTok. Official post embeds load automatically unless you switch them off in Cookie Settings.",
          "If you switch them off, you will see a branded card with a link to the original post instead.",
        ],
      },
      {
        heading: "Analytics",
        paragraphs: [
          "No analytics or advertising cookies are used at this time. If that changes, this page will be updated and consent will be requested first.",
        ],
      },
      {
        heading: "Changing your choice",
        paragraphs: [
          "Open Cookie Settings from the footer of any page to allow or block optional embeds at any time.",
        ],
      },
    ],
  },
  {
    slug: "risk-disclosure",
    title: "Risk Disclosure",
    summary: "Important risk information about $ivy.",
    needsLegalReview: true,
    sections: [
      {
        heading: "Meme coins are speculative",
        paragraphs: [
          "$ivy is a meme project. Digital assets and meme coins are highly speculative and may lose some or all of their value.",
          "Never spend more than you can afford to lose entirely.",
        ],
      },
      {
        heading: "Nothing here is advice",
        paragraphs: [
          "Nothing on this website constitutes financial, investment, legal or tax advice. Consider seeking independent professional advice.",
        ],
      },
      {
        heading: "No confirmed token details yet",
        paragraphs: [
          NO_CLAIMS,
          "There is no purchase mechanism on this website and no Buy button will be shown until a verified contract address, blockchain and launch are published here.",
        ],
      },
      {
        heading: "Impersonation risk",
        paragraphs: [
          "Fake $ivy tokens, copycat websites and impersonator social accounts may exist. Always verify the contract address and links directly on this website before interacting with anything.",
        ],
      },
      {
        heading: "Proceeds",
        paragraphs: [
          "ivy vibing is not a registered charity. Creator rewards and specified project proceeds are intended to benefit Ivy and her owner. Complete allocation, tokenomics and proceeds information will be published before launch.",
        ],
      },
    ],
  },
  {
    slug: "media-usage",
    title: "Media Usage Policy",
    summary: "How Ivy's photographs and videos may be used.",
    needsLegalReview: true,
    sections: [
      {
        heading: "Ownership",
        paragraphs: [
          "All photographs and videos of Ivy belong to Ivy's family. They appear on this website with permission.",
        ],
      },
      {
        heading: "What may be reused",
        paragraphs: [
          "Only media specifically marked as approved for community use may be reused, and only with credit to Ivy's official accounts.",
          "Approved media may not be used for paid advertising, merchandise, unrelated tokens or anything implying endorsement.",
        ],
      },
      {
        heading: "What may not be reused",
        paragraphs: [
          "Anything not explicitly marked as approved for community use is off limits, including screenshots and re-uploads of social posts.",
          "Do not generate artificial or altered images of Ivy, and do not present another dog as Ivy.",
        ],
      },
      {
        heading: "Respectful use",
        paragraphs: [
          "Ivy's condition is never the joke. Humour should be about her personality, expressions, sounds, reactions and adventures.",
        ],
      },
      {
        heading: "Takedown",
        paragraphs: [
          "Ivy's family may request removal of any use of her likeness at any time, and such requests will be honoured.",
        ],
      },
    ],
  },
  {
    slug: "community-guidelines",
    title: "Community Guidelines",
    summary: "How the ivy vibing community treats Ivy and each other.",
    needsLegalReview: false,
    sections: [
      {
        heading: "Respect the Queen",
        paragraphs: [
          "Ivy's condition is never the punchline. Celebrate her personality, her hops, her rolls and her expressions.",
          "Do not offer unsolicited medical opinions about Ivy or criticise her care.",
        ],
      },
      {
        heading: "Respect each other",
        paragraphs: [
          "No harassment, hate speech, threats or targeted abuse. Disagree kindly or move on.",
          "Respect Ivy's family's privacy. Do not share or speculate about private details.",
        ],
      },
      {
        heading: "No financial pressure",
        paragraphs: [
          "Do not post price predictions, urgency tactics, guaranteed-return claims or unverified contract addresses.",
          "Report impersonator accounts and fake tokens rather than engaging with them.",
        ],
      },
      {
        heading: "Content standards",
        paragraphs: [
          "Use only approved media. Credit creators when sharing community art.",
          "Keep it safe for work and safe for a dog-loving audience of all ages.",
        ],
      },
      {
        heading: "Enforcement",
        paragraphs: [
          "Community spaces will be moderated once they open. Repeated breaches may result in removal.",
        ],
      },
    ],
  },
  {
    slug: "accessibility",
    title: "Accessibility Statement",
    summary: "Our commitment to an accessible clubhouse.",
    needsLegalReview: false,
    sections: [
      {
        heading: "Our target",
        paragraphs: [
          "ivy vibing aims to meet WCAG 2.1 Level AA. Accessibility is treated as a build requirement, not an afterthought.",
        ],
      },
      {
        heading: "What is in place",
        paragraphs: [
          "A skip link, semantic landmarks and a single main region on every page.",
          "Visible keyboard focus, focus-trapped dialogs, Escape to close, and focus returned to the trigger.",
          "Touch targets of at least 44 by 44 pixels, text alternatives for every media placeholder, and status information that never relies on colour alone.",
          "Full support for reduced-motion preferences: decorative animation is disabled and no body text moves continuously.",
        ],
      },
      {
        heading: "Media",
        paragraphs: [
          "Video embeds never autoplay with sound. Official captions remain inside the Instagram or TikTok embed where the platform provides them.",
        ],
      },
      {
        heading: "Known limitations",
        paragraphs: [
          "Curated public embeds are labelled with their official platform source. Any future direct-upload media will receive reviewed alternative text before publication.",
        ],
      },
      {
        heading: "Feedback",
        paragraphs: [
          "A contact route for accessibility feedback will be published once an official community email exists. Until then it is shown as “Coming Soon”.",
        ],
      },
    ],
  },
];

export function getLegalPage(slug: string): LegalPage | undefined {
  return legalPages.find((page) => page.slug === slug);
}

export const footerLegalLinks = [
  { to: "/terms", label: "Terms" },
  { to: "/privacy", label: "Privacy Policy" },
  { to: "/risk-disclosure", label: "Risk Disclosure" },
  { to: "/media-usage", label: "Media Usage Policy" },
  { to: "/community-guidelines", label: "Community Guidelines" },
  { to: "/accessibility", label: "Accessibility Statement" },
] as const;
