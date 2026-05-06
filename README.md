<img width="1080" height="5138" alt="demo" src="https://github.com/user-attachments/assets/32a26966-435e-4de5-bc12-b6546f2ec343" />
# Canada Registry Finder

Mobile-first Expo app for searching Canadian business registry information and producing a source-linked report. The app is set up for Android because Android allows free local testing with APKs; public Google Play distribution has a one-time developer registration fee, while iOS public distribution requires an Apple Developer Program membership.

## What It Does

- Starts from a single search bar for company name, business number, or registry ID.
- Searches configured Government of Canada and provincial registry APIs.
- Builds a report with registry ID, jurisdiction, status, business number, registered address, company website when returned by a trusted source, possible matches, and official source links.
- Keeps the last 20 searches on device so users can reopen prior reports quickly.
- Uses local demo records when live API credentials are not configured, and labels those reports as demo-only.

## Official Data Sources

Canada does not provide one open, unauthenticated nationwide business registry API. Registry data is split between federal and provincial/territorial systems.

- Federal: Corporations Canada Federal Corporation API via the Government of Canada API Store. It provides real-time federal corporation data, but requires an API Store account and key.
- Canada-wide locator: Canada's business registries on Canada.ca links users to federal and provincial searches.
- British Columbia: BC Registry Search API and Business Registry API require a BC Registries API key and Account ID.
- Addresses: Use the registered office address returned by official registry APIs when available. Statistics Canada's Open Database of Businesses is included as a reliable open-data reference for business address enrichment, but it is not a live corporate registry.
- Website URLs: Only show a company website when returned by an official registry record or a trusted enrichment source you add. The app intentionally does not guess websites from a web search.

## Configure Live APIs

The app runs with demo data by default. To use live registry APIs, create `.env` in the project root:

```sh
EXPO_PUBLIC_CANADA_FEDERAL_API_BASE=https://your-federal-api-base
EXPO_PUBLIC_CANADA_FEDERAL_API_KEY=your_government_of_canada_api_store_key
EXPO_PUBLIC_BC_REGISTRY_API_BASE=https://your-bc-registry-api-base
EXPO_PUBLIC_BC_REGISTRY_API_KEY=your_bc_api_key
EXPO_PUBLIC_BC_REGISTRY_ACCOUNT_ID=your_bc_account_id
```

The adapter layer is in `src/services/registrySearch.ts`. If your issued API paths differ, update `searchFederal` and `searchBritishColumbia` there.

### How To Get Federal Corporation API Values

Use these variables for Corporations Canada / ISED:

```sh
EXPO_PUBLIC_CANADA_FEDERAL_API_BASE=
EXPO_PUBLIC_CANADA_FEDERAL_API_KEY=
```

Steps:

1. Go to the ISED API Catalogue Federal Corporation API documentation: https://api.ised-isde.canada.ca/en/docs?api=corporations
2. Create an account or log in.
3. Subscribe to the Public Plan. The public documentation currently lists a 60 hits per minute limit.
4. Copy the API subscription key issued by the API Catalogue.
5. Set `EXPO_PUBLIC_CANADA_FEDERAL_API_KEY` to that subscription key.
6. Set `EXPO_PUBLIC_CANADA_FEDERAL_API_BASE` to the base URL shown in the API Catalogue / OpenAPI specification for the Federal Corporation API.

Corporations Canada notes that the Federal Corporation API provides real-time data for federal corporations and requires an existing corporation number or 9-digit business number for some endpoints. It does not cover provincially or territorially incorporated businesses.

### How To Get BC Registry API Values

Use these variables for BC Registry Search and Business Registry APIs:

```sh
EXPO_PUBLIC_BC_REGISTRY_API_BASE=
EXPO_PUBLIC_BC_REGISTRY_API_KEY=
EXPO_PUBLIC_BC_REGISTRY_ACCOUNT_ID=
```

BC base URLs:

```sh
# Sandbox
EXPO_PUBLIC_BC_REGISTRY_API_BASE=https://sandbox.api.connect.gov.bc.ca

# Production
EXPO_PUBLIC_BC_REGISTRY_API_BASE=https://api.connect.gov.bc.ca
```

Steps:

1. Review the BC API overview pages:
   - Registry Search API: https://developer.api.bcregistry.gov.bc.ca/en-CA/products/rs/overview/
   - Business Registry API: https://developer.api.bcregistry.gov.bc.ca/en-CA/products/br/overview/
   - Account setup: https://developer.api.bcregistry.gov.bc.ca/en-CA/products/get-started/account-setup
2. Create a BC Registries and Online Services account. BC API services are intended for Premium accounts with a supported payment method.
3. For sandbox access, download and sign the API Terms of Use, then email `bcregistries@gov.bc.ca`.
4. Use the subject `Request for Service BC Connect API sandbox keys`.
5. Include your BC Registries account number, company account administrator name, and administrator email.
6. After approval, your Account Administrator can find the API key in the BC Registries account dashboard under Account Information / Developer Tools.
7. Set `EXPO_PUBLIC_BC_REGISTRY_API_KEY` to that gateway API key.
8. Set `EXPO_PUBLIC_BC_REGISTRY_ACCOUNT_ID` to the BC Registries / Service BC Connect account number associated with the key.
9. After sandbox testing, request production keys from `bcregistries@gov.bc.ca` with the subject `Request for Service BC Connect API Production keys`.

BC documentation states that Registry Search and Business Registry API requests require both a BC Registries issued API key and an Account ID. Some BC registry transactions may have fees in production.

### Open Source Safety Notes

- Do not commit `.env`.
- Do not put real API keys in `app.json`, screenshots, issues, or pull requests.
- Expo `EXPO_PUBLIC_*` variables are embedded in client builds. For a public production app, put registry credentials behind your own backend proxy instead of shipping keys in the mobile app.
- Keep demo data enabled for contributors who do not have government API credentials.

## Run Locally

Use Node.js 20.19 or newer. This project is on Expo SDK 54, which targets React Native 0.81, React 19.1, and the current Expo Go SDK 54 app. Node 16 is not supported for this SDK.

For Android development:

```sh
npm install
npm run start
```

Install the current Expo Go app on an Android phone, scan the QR code, and test the app on device.

If Expo asks you to log in, you can either log in with a valid Expo account or avoid account-gated flows by running the local server directly:

```sh
npx expo start --localhost --port 8081 --clear
```

If port `8081` is already used, stop the other Expo terminal with `Ctrl+C`, or choose another port when Expo prompts you.

For browser testing:

```sh
npm install
npm run web -- --localhost --port 8081
```

Open `http://localhost:8081` in the browser. Use `npm run web` for browser testing. If you run plain `npm run start` and open the Metro URL in a browser, Expo may return native runtime JSON instead of the web UI.

Compatibility checks:

```sh
npx expo-doctor
npm run lint
```

The app includes demo records for quick testing without government API credentials:

- `Shopify`
- `RBC`
- `TELUS`

Searches that do not match those names return a generic demo corporation and official registry links.

## Build A Free Android APK For Testing

Expo Application Services can build a preview APK that you can install directly on Android devices.

```sh
npm install -g eas-cli
eas login
eas init
eas build --platform android --profile preview
```

Download the APK from the EAS build page and install it on your Android phone. This is suitable for private/free testing, not public store listing.

## Publish As A Free App

Google Play lets you set the app price to free, but Google Play developer registration itself is not free. For a public store release:

1. Create a Google Play Developer account.
2. Replace the placeholder package name in `app.json` with your own reverse-domain ID.
3. Replace the placeholder icons in `assets/`.
4. Run `eas build --platform android --profile production` to create an Android App Bundle.
5. In Google Play Console, create the app, set pricing to free, complete content rating, privacy policy, data safety, and target audience forms.
6. Upload the `.aab`, test through internal testing, then promote to production.

For a truly no-store-cost option, distribute the preview APK directly from your website or GitHub Releases and keep the app free. Users must allow installing apps from unknown sources on Android.

<img width="1080" height="5138" alt="demo" src="https://github.com/user-attachments/assets/cc3e0087-6ddc-4e5e-8a46-7de8019a09ff" />

