import Constants from "expo-constants";

type Extra = {
  canadaFederalApiBase?: string;
  canadaFederalApiKey?: string;
  bcRegistryApiBase?: string;
  bcRegistryApiKey?: string;
  bcRegistryAccountId?: string;
};

const extra = (Constants.expoConfig?.extra ?? {}) as Extra;

export const appConfig = {
  canadaFederalApiBase:
    process.env.EXPO_PUBLIC_CANADA_FEDERAL_API_BASE ??
    extra.canadaFederalApiBase,
  canadaFederalApiKey:
    process.env.EXPO_PUBLIC_CANADA_FEDERAL_API_KEY ??
    extra.canadaFederalApiKey,
  bcRegistryApiBase:
    process.env.EXPO_PUBLIC_BC_REGISTRY_API_BASE ?? extra.bcRegistryApiBase,
  bcRegistryApiKey:
    process.env.EXPO_PUBLIC_BC_REGISTRY_API_KEY ?? extra.bcRegistryApiKey,
  bcRegistryAccountId:
    process.env.EXPO_PUBLIC_BC_REGISTRY_ACCOUNT_ID ??
    extra.bcRegistryAccountId
};
