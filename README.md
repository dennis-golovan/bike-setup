# Bike Setup

Android app for keeping suspension and tire setups per bike and per riding location.

## Stack

Kotlin, Jetpack Compose (Material 3), Room, DataStore, Hilt, Navigation Compose. minSdk 26, targetSdk 36.

## Build

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
