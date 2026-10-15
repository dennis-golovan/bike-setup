# Bike Setup

Keeps suspension and tire setups per bike and per riding location.

- `app/` — native Android app (Kotlin, Compose).
- `web/` — installable web app (PWA) for iPhone and any other phone, published to GitHub Pages.

## Android app

### Stack

Kotlin, Jetpack Compose (Material 3), Room, DataStore, Hilt, Navigation Compose. minSdk 26, targetSdk 36.

### Build

Requires a JDK 17+ (set `org.gradle.java.home` in `~/.gradle/gradle.properties` or `JAVA_HOME`)
and the Android SDK (`sdk.dir` in `local.properties`).

```
./gradlew assembleDebug        # app/build/outputs/apk/debug/app-debug.apk
./gradlew testDebugUnitTest
./gradlew installDebug         # phone connected over USB with USB debugging on
```

## Data

All values are stored in metric units (bar, kg) and converted for display. Every record has a UUID,
`updatedAt` and a soft-delete `deletedAt`, so cloud sync can be added without a data migration.
The Room schema is exported to `app/schemas/` for future migrations.

## Web app (PWA)

React + TypeScript + Vite, IndexedDB via Dexie, offline support via vite-plugin-pwa.
Same data model as the Android app; backups are JSON files that merge by `updatedAt`.

```
cd web
npm ci
npm run dev      # local dev server
npm test         # unit tests (Vitest)
npm run e2e      # end-to-end flow in WebKit (iPhone 13) and Chromium (Pixel 7)
npm run build    # dist/
```

Pushing to `main` deploys `web/dist` to GitHub Pages (`.github/workflows/pages.yml`).
On iPhone: open the link in Safari, then Share -> Add to Home Screen.
