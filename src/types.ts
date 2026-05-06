export type RegistryLevel = "Federal" | "Province";

export type RegistrySource = {
  id: string;
  name: string;
  level: RegistryLevel;
  jurisdiction: string;
  officialUrl: string;
  apiStatus: "live" | "credential_required" | "manual";
  note: string;
};

export type RegistryMatch = {
  id: string;
  legalName: string;
  registryId?: string;
  businessNumber?: string;
  status?: string;
  jurisdiction: string;
  source: RegistrySource;
  score?: number;
  registeredAddress?: string;
  websiteUrl?: string;
  updatedAt?: string;
  detailsUrl?: string;
  raw?: unknown;
};

export type CompanyReport = {
  query: string;
  createdAt: string;
  bestMatch?: RegistryMatch;
  matches: RegistryMatch[];
  address?: string;
  websiteUrl?: string;
  confidence: "high" | "medium" | "low";
  summary: string[];
  sourceLinks: { label: string; url: string }[];
};

export type SearchHistoryItem = {
  id: string;
  query: string;
  createdAt: string;
  matchName?: string;
  registryId?: string;
};
