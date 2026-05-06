import { RegistrySource } from "../types";

export const registrySources: RegistrySource[] = [
  {
    id: "ca-federal",
    name: "Corporations Canada Federal Corporation API",
    level: "Federal",
    jurisdiction: "Canada",
    officialUrl:
      "https://ised-isde.canada.ca/site/corporations-canada/en/search-federal-corporation",
    apiStatus: "credential_required",
    note:
      "Official real-time federal corporation data. Requires a Government of Canada API Store account and API key."
  },
  {
    id: "ca-business-registries",
    name: "Canada's Business Registries",
    level: "Federal",
    jurisdiction: "Canada-wide registry locator",
    officialUrl:
      "https://www.canada.ca/en/services/business/research/directoriescanadiancompanies.html",
    apiStatus: "manual",
    note:
      "Government directory for finding businesses by name, business number, or registry ID across federal and provincial sources."
  },
  {
    id: "bc-search",
    name: "BC Registry Search API",
    level: "Province",
    jurisdiction: "British Columbia",
    officialUrl:
      "https://developer.api.bcregistry.gov.bc.ca/en-CA/products/rs/overview/",
    apiStatus: "credential_required",
    note:
      "Official BC registry search API. Requires a BC Registries API key and Account ID."
  },
  {
    id: "bc-business",
    name: "BC Business Registry API",
    level: "Province",
    jurisdiction: "British Columbia",
    officialUrl:
      "https://developer.api.bcregistry.gov.bc.ca/en-CA/products/br/overview/",
    apiStatus: "credential_required",
    note:
      "Official BC business profile API. Requires a BC Registries API key and Account ID."
  },
  {
    id: "statcan-odbus",
    name: "Statistics Canada Open Database of Businesses",
    level: "Federal",
    jurisdiction: "Canada",
    officialUrl:
      "https://www150.statcan.gc.ca/n1/pub/21-26-0003/212600032023001-eng.htm",
    apiStatus: "manual",
    note:
      "Open address and industry dataset sourced from municipal, regional, and provincial open data. It is not a live corporation registry."
  },
  {
    id: "demo-registry",
    name: "Demo Registry Data",
    level: "Federal",
    jurisdiction: "Canada",
    officialUrl:
      "https://www.canada.ca/en/services/business/research/directoriescanadiancompanies.html",
    apiStatus: "manual",
    note:
      "Local demo data used when official API credentials are not configured. Do not rely on it for due diligence."
  }
];
