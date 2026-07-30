/**
 * ivy vibing — single source of truth.
 *
 * RULE: never invent a contract address, blockchain, supply, launch date,
 * tokenomics, price, market cap, exchange, social profile, partnership,
 * audit or milestone date. Anything unverified stays `null` and the UI
 * renders "Coming Soon".
 */

export type Maybe = string | null;

export interface SocialFeedConfig {
  instagramEnabled: boolean;
  tiktokEnabled: boolean;
  postsPerPlatform: number;
  syncIntervalHours: number;
}

export interface ProjectSocials {
  instagram: Maybe;
  tiktok: Maybe;
  x: Maybe;
  telegram: Maybe;
}

export interface ProjectConfig {
  projectName: string;
  ticker: string;
  tagline: string;
  /** Launch venue, e.g. pump.fun. Null until the owner confirms it. */
  launchPlatform: Maybe;
  launchPlatformUrl: Maybe;
  blockchain: Maybe;
  contractAddress: Maybe;
  explorerBaseUrl: Maybe;
  launchDate: Maybe;
  tokenSupply: Maybe;
  tokenomicsUrl: Maybe;
  tokenRecordUpdatedAt: Maybe;
  socials: ProjectSocials;
  socialFeed: SocialFeedConfig;
}

export const projectConfig: ProjectConfig = {
  projectName: "ivy vibing",
  ticker: "$IVY",
  tagline: "Short Spine. Big Vibes.",
  // Planned launch venue. The mint/contract address stays null until it exists.
  launchPlatform: "pump.fun",
  launchPlatformUrl: "https://pump.fun",
  blockchain: "Solana",
  contractAddress: null,
  explorerBaseUrl: "https://solscan.io/token",
  launchDate: null,
  // pump.fun standard fixed supply.
  tokenSupply: "1,000,000,000 $IVY",
  tokenomicsUrl: null,
  tokenRecordUpdatedAt: null,
  socials: {
    instagram: "https://www.instagram.com/frogqueenivy/",
    tiktok: "https://www.tiktok.com/@ivyvibing",
    x: "https://x.com/ivyvibing",
    telegram: "https://t.me/frogqueenivy",
  },
  socialFeed: {
    instagramEnabled: false,
    tiktokEnabled: false,
    postsPerPlatform: 3,
    syncIntervalHours: 12,
  },
};

export const COMING_SOON = "Coming Soon";

export function isSet(value: Maybe): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export function displayValue(value: Maybe): string {
  return isSet(value) ? value : COMING_SOON;
}

/** A contract is only "live" when both the address and the chain are set. */
export function hasVerifiedContract(config: ProjectConfig = projectConfig): boolean {
  return isSet(config.contractAddress) && isSet(config.blockchain);
}

export function shortenAddress(address: Maybe): string {
  if (!isSet(address) || address.length < 12) return COMING_SOON;
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

export function explorerUrl(config: ProjectConfig = projectConfig): string | null {
  if (!hasVerifiedContract(config) || !isSet(config.explorerBaseUrl)) return null;
  return `${config.explorerBaseUrl.replace(/\/$/, "")}/${config.contractAddress}`;
}

/** Any official community link published on this site. */
export function officialLinks(config: ProjectConfig = projectConfig) {
  return Object.entries(config.socials)
    .filter(([, url]) => isSet(url))
    .map(([key, url]) => ({ key, url: url as string }));
}
