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

Create `.env` in the project root:

```sh
EXPO_PUBLIC_CANADA_FEDERAL_API_BASE=https://your-federal-api-base
EXPO_PUBLIC_CANADA_FEDERAL_API_KEY=your_government_of_canada_api_store_key
EXPO_PUBLIC_BC_REGISTRY_API_BASE=https://your-bc-registry-api-base
EXPO_PUBLIC_BC_REGISTRY_API_KEY=your_bc_api_key
EXPO_PUBLIC_BC_REGISTRY_ACCOUNT_ID=your_bc_account_id
```

The adapter layer is in `src/services/registrySearch.ts`. If your issued API paths differ, update `searchFederal` and `searchBritishColumbia` there.

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
