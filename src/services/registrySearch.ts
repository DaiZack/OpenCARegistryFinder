import { registrySources } from "../data/registrySources";
import { CompanyReport, RegistryMatch } from "../types";
import { appConfig } from "./config";

const federalSource = registrySources.find((source) => source.id === "ca-federal")!;
const canadaRegistriesSource = registrySources.find(
  (source) => source.id === "ca-business-registries"
)!;
const bcSearchSource = registrySources.find((source) => source.id === "bc-search")!;
const statCanSource = registrySources.find((source) => source.id === "statcan-odbus")!;
const demoSource = registrySources.find((source) => source.id === "demo-registry")!;

type ApiResult = Record<string, unknown>;

function text(value: unknown): string | undefined {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : undefined;
}

function firstText(...values: unknown[]): string | undefined {
  for (const value of values) {
    const clean = text(value);
    if (clean) return clean;
  }
  return undefined;
}

function buildRegisteredAddress(result: ApiResult): string | undefined {
  const direct = firstText(
    result.registeredAddress,
    result.registeredOfficeAddress,
    result.address
  );
  if (direct) return direct;

  const office = result.registeredOffice as ApiResult | undefined;
  const parts = [
    firstText(office?.streetAddress, office?.addressLine1, result.addressLine1),
    firstText(office?.city, result.city),
    firstText(office?.province, result.province, result.region),
    firstText(office?.postalCode, result.postalCode)
  ].filter(Boolean);

  return parts.length > 0 ? parts.join(", ") : undefined;
}

function normalizeFederalResult(result: ApiResult, index: number): RegistryMatch {
  const registryId = firstText(
    result.corporationNumber,
    result.corporateNumber,
    result.registryId,
    result.id
  );
  const legalName =
    firstText(result.corporateName, result.name, result.legalName) ??
    `Federal corporation ${registryId ?? index + 1}`;

  return {
    id: `federal-${registryId ?? index}`,
    legalName,
    registryId,
    businessNumber: firstText(result.businessNumber, result.bn),
    status: firstText(result.status, result.corporationStatus),
    jurisdiction: firstText(result.jurisdiction, result.province) ?? "Canada",
    source: federalSource,
    registeredAddress: buildRegisteredAddress(result),
    websiteUrl: firstText(result.website, result.websiteUrl, result.url),
    updatedAt: firstText(result.updatedAt, result.lastModified),
    detailsUrl: registryId
      ? `${federalSource.officialUrl}?corpNum=${encodeURIComponent(registryId)}`
      : federalSource.officialUrl,
    score: typeof result.score === "number" ? result.score : undefined,
    raw: result
  };
}

function normalizeBcResult(result: ApiResult, index: number): RegistryMatch {
  const registryId = firstText(
    result.identifier,
    result.businessIdentifier,
    result.registryId,
    result.id
  );
  const legalName =
    firstText(result.name, result.legalName, result.businessName) ??
    `BC business ${registryId ?? index + 1}`;

  return {
    id: `bc-${registryId ?? index}`,
    legalName,
    registryId,
    status: firstText(result.status, result.state),
    jurisdiction: "British Columbia",
    source: bcSearchSource,
    registeredAddress: buildRegisteredAddress(result),
    websiteUrl: firstText(result.website, result.websiteUrl, result.url),
    detailsUrl: bcSearchSource.officialUrl,
    score: typeof result.score === "number" ? result.score : undefined,
    raw: result
  };
}

async function getJson(url: string, headers: Record<string, string>) {
  const response = await fetch(url, { headers });
  if (!response.ok) {
    throw new Error(`Registry request failed: ${response.status}`);
  }
  return response.json();
}

function pickResults(payload: unknown): ApiResult[] {
  if (Array.isArray(payload)) return payload as ApiResult[];
  if (!payload || typeof payload !== "object") return [];

  const record = payload as ApiResult;
  const possibleArrays = [
    record.results,
    record.items,
    record.corporations,
    record.businesses,
    record.data
  ];
  const found = possibleArrays.find(Array.isArray);
  return found ? (found as ApiResult[]) : [record];
}

async function searchFederal(query: string): Promise<RegistryMatch[]> {
  if (!appConfig.canadaFederalApiBase || !appConfig.canadaFederalApiKey) {
    return [];
  }

  const url = `${appConfig.canadaFederalApiBase.replace(
    /\/$/,
    ""
  )}/corporations?search=${encodeURIComponent(query)}`;
  const payload = await getJson(url, {
    Accept: "application/json",
    "x-api-key": appConfig.canadaFederalApiKey
  });

  return pickResults(payload).map(normalizeFederalResult);
}

async function searchBritishColumbia(query: string): Promise<RegistryMatch[]> {
  if (
    !appConfig.bcRegistryApiBase ||
    !appConfig.bcRegistryApiKey ||
    !appConfig.bcRegistryAccountId
  ) {
    return [];
  }

  const url = `${appConfig.bcRegistryApiBase.replace(
    /\/$/,
    ""
  )}/search/businesses?query=${encodeURIComponent(query)}`;
  const payload = await getJson(url, {
    Accept: "application/json",
    "x-apikey": appConfig.bcRegistryApiKey,
    "Account-Id": appConfig.bcRegistryAccountId
  });

  return pickResults(payload).map(normalizeBcResult);
}

function fallbackMatches(query: string): RegistryMatch[] {
  const encoded = encodeURIComponent(query);
  const normalized = query.toLowerCase();

  const demoMatches: RegistryMatch[] = [
    {
      id: "demo-shopify",
      legalName: "Shopify Inc.",
      registryId: "426160-7",
      businessNumber: "847871746",
      status: "Active",
      jurisdiction: "Canada",
      source: demoSource,
      registeredAddress: "151 O'Connor Street, Ground Floor, Ottawa, ON K2P 2L8",
      websiteUrl: "https://www.shopify.com",
      detailsUrl: `${federalSource.officialUrl}?corpNum=4261607`,
      score: 0.96
    },
    {
      id: "demo-rbc",
      legalName: "Royal Bank of Canada",
      registryId: "BANK-003",
      businessNumber: "105248165",
      status: "Active",
      jurisdiction: "Canada",
      source: demoSource,
      registeredAddress: "200 Bay Street, Toronto, ON M5J 2J5",
      websiteUrl: "https://www.rbc.com",
      detailsUrl: canadaRegistriesSource.officialUrl,
      score: 0.9
    },
    {
      id: "demo-telus",
      legalName: "TELUS Corporation",
      registryId: "BC0123456",
      businessNumber: "870634776",
      status: "Active",
      jurisdiction: "British Columbia",
      source: demoSource,
      registeredAddress: "510 West Georgia Street, Vancouver, BC V6B 0M3",
      websiteUrl: "https://www.telus.com",
      detailsUrl: bcSearchSource.officialUrl,
      score: 0.88
    }
  ].filter((match) => {
    const haystack = [
      match.legalName,
      match.registryId,
      match.businessNumber,
      match.jurisdiction
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return haystack.includes(normalized);
  });

  if (demoMatches.length > 0) {
    return demoMatches;
  }

  return [
    {
      id: "demo-generic",
      legalName: `${query} Demo Corporation`,
      registryId: "DEMO-000001",
      businessNumber: "100000001",
      status: "Demo only",
      jurisdiction: "Canada",
      source: demoSource,
      registeredAddress: "100 Wellington Street, Ottawa, ON K1A 0A9",
      websiteUrl: "https://www.canada.ca",
      detailsUrl: `${federalSource.officialUrl}?corpName=${encoded}`,
      score: 0.5
    },
    {
      id: "fallback-canada-registries",
      legalName: query,
      jurisdiction: "Canada-wide",
      source: canadaRegistriesSource,
      detailsUrl: canadaRegistriesSource.officialUrl,
      status: "Search official source",
      score: 0.35
    }
  ];
}

function buildReport(query: string, matches: RegistryMatch[]): CompanyReport {
  const bestMatch = matches[0];
  const address = bestMatch?.registeredAddress;
  const websiteUrl = bestMatch?.websiteUrl;
  const hasLiveData = matches.some((match) => match.raw);
  const hasDemoData = matches.some((match) => match.source.id === "demo-registry");

  const sourceLinks = [
    ...matches
      .slice(0, 4)
      .map((match) => ({
        label: `${match.source.name}${match.registryId ? ` #${match.registryId}` : ""}`,
        url: match.detailsUrl ?? match.source.officialUrl
      })),
    {
      label: "Statistics Canada Open Database of Businesses",
      url: statCanSource.officialUrl
    }
  ];

  const summary = [
    hasDemoData
      ? "Demo data is being shown because official API credentials are not configured."
      : "Live registry data was returned by a configured API.",
    bestMatch?.registryId
      ? `Registry ID found: ${bestMatch.registryId}.`
      : "No registry ID was returned by a configured live API.",
    address
      ? `Registered address found from ${bestMatch?.source.name}.`
      : "No registered address was returned by a configured live API. Use the attached official registry links to confirm the address before relying on it.",
    websiteUrl
      ? "A company website URL was returned by the source record."
      : "No company website URL was asserted because official registry/open data sources often do not include websites."
  ];

  return {
    query,
    createdAt: new Date().toISOString(),
    bestMatch,
    matches,
    address,
    websiteUrl,
    confidence: hasDemoData
      ? "low"
      : hasLiveData && bestMatch?.registryId
        ? "high"
        : hasLiveData
          ? "medium"
          : "low",
    summary,
    sourceLinks
  };
}

export async function searchCompany(query: string): Promise<CompanyReport> {
  const cleanQuery = query.trim();
  if (!cleanQuery) {
    throw new Error("Enter a company name, business number, or registry ID.");
  }

  const settled = await Promise.allSettled([
    searchFederal(cleanQuery),
    searchBritishColumbia(cleanQuery)
  ]);
  const liveMatches = settled.flatMap((result) =>
    result.status === "fulfilled" ? result.value : []
  );
  const matches = liveMatches.length > 0 ? liveMatches : fallbackMatches(cleanQuery);

  return buildReport(cleanQuery, matches);
}
