/**
 * Unified project configuration for IvyVibing.
 *
 * RULE: never invent token, contract, chain, launch, social, price, exchange,
 * partnership or audit details. Anything unverified stays `null` and renders
 * as "Coming Soon" in the UI.
 */

export type MaybeValue = string | null;

export interface TokenRecordConfig {
  name: MaybeValue;
  ticker: MaybeValue;
  blockchain: MaybeValue;
  contractAddress: MaybeValue;
  totalSupply: MaybeValue;
  taxes: MaybeValue;
  liquidity: MaybeValue;
  launchDate: MaybeValue;
  explorerUrl: MaybeValue;
  auditStatus: MaybeValue;
  exchanges: string[];
  partnerships: string[];
}

export interface SocialLinkConfig {
  id: string;
  label: string;
  url: MaybeValue;
  handle: MaybeValue;
}

export interface FeatureFlags {
  socialSyncEnabled: boolean;
  databaseConnected: boolean;
  authConfigured: boolean;
  instagramOAuthConfigured: boolean;
  tiktokOAuthConfigured: boolean;
  memeMachineUploadsEnabled: boolean;
}

export interface ProjectConfig {
  siteName: string;
  tagline: string;
  description: string;
  mascot: { name: string; titles: string[] };
  token: TokenRecordConfig;
  socials: SocialLinkConfig[];
  features: FeatureFlags;
  syncIntervalHours: number;
  ownerContactEmail: MaybeValue;
}

export const projectConfig: ProjectConfig = {
  siteName: "IvyVibing",
  tagline: "SHORT SPINE. BIG VIBES.",
  description:
    "The official internet clubhouse of Ivy — the Short Spine Queen and Frog Queen — and her community coin, $IVY.",
  mascot: {
    name: "Ivy",
    titles: ["Short Spine Queen", "Frog Queen"],
  },
  token: {
    name: null,
    ticker: "$IVY",
    blockchain: null,
    contractAddress: null,
    totalSupply: null,
    taxes: null,
    liquidity: null,
    launchDate: null,
    explorerUrl: null,
    auditStatus: null,
    exchanges: [],
    partnerships: [],
  },
  socials: [
    { id: "instagram", label: "Instagram", url: null, handle: null },
    { id: "tiktok", label: "TikTok", url: null, handle: null },
    { id: "x", label: "X", url: null, handle: null },
    { id: "telegram", label: "Telegram", url: null, handle: null },
  ],
  features: {
    socialSyncEnabled: false,
    databaseConnected: false,
    authConfigured: false,
    instagramOAuthConfigured: false,
    tiktokOAuthConfigured: false,
    memeMachineUploadsEnabled: false,
  },
  syncIntervalHours: 12,
  ownerContactEmail: null,
};

export const COMING_SOON = "Coming Soon";

export function displayValue(value: MaybeValue): string {
  return value && value.trim().length > 0 ? value : COMING_SOON;
}

export function isConfigured(value: MaybeValue): boolean {
  return Boolean(value && value.trim().length > 0);
}
