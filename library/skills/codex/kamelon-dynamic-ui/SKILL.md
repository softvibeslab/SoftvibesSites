---
name: kamelon-dynamic-ui
description: Build or migrate Android Kamelon module UIs to a local layout.json contract. Use when working on mobility-kamelon-library, mobility-nosales-kamelon-library, NoSales Kamelon, inventory Kamelon, or any feature that should move Kotlin-wired Compose state/actions/lists/dialogs into declarative JSON bindings without implementing a remote endpoint.
---

# Kamelon Dynamic UI

## Purpose

Use this skill to convert a feature UI from Kotlin-wired Compose state/actions into a local `layout.json` contract that drives components, bindings, datasources, actions, and dialogs through Kamelon Runtime.

Default scope: local assets only. Do not implement endpoint/remote layout loading unless the user explicitly asks; document it as backlog when relevant.

## Workflow

1. Inspect the current feature Activity, `KamelonComposeRenderer`, `layout.json`, and `schema.sql`.
2. Identify what is hardcoded in Kotlin:
   - `KamelonRenderState(values/lists)`
   - manual list loading
   - `onValueChange` branches
   - `onAction`/`handleKamelonAction`
   - feature-specific dialogs
   - output mapping or persistence calls
3. Move UI concerns into `layout.json`:
   - `state.values`
   - `state.lists`
   - `actions`
   - `dialogs`
   - component-level `bindKey`, `requiredWhen`, `visibleWhen`
4. Keep Android host responsibilities in Kotlin:
   - Activity lifecycle and navigation
   - permissions/native providers
   - location/date/runtime values
   - final typed output contracts
   - feature startup rules not yet declarative, such as existing-record checks
5. Extend `mobility-kamelon-library` only when the runtime lacks a generic capability.
6. Avoid duplicate persistence. If the host already persists after receiving a typed output, keep `layout.json` actions as `finish` actions and let the host bridge persist.
7. Compile the libraries and host app before finalizing.

## File Map

Typical files:

- `mobility-kamelon-library/kamelon-runtime/src/main/java/com/mobilityapps/kamelon/runtime/KamelonLayoutManifest.kt`
- `mobility-kamelon-library/kamelon-runtime/src/main/java/com/mobilityapps/kamelon/runtime/KamelonManifestParser.kt`
- `mobility-kamelon-library/kamelon-runtime/src/main/java/com/mobilityapps/kamelon/runtime/KamelonComposeRenderer.kt`
- `mobility-kamelon-library/kamelon-runtime/src/main/java/com/mobilityapps/kamelon/runtime/KamelonModuleScreen.kt`
- `mobility-nosales-kamelon-library/nosales-kamelon-sdk/src/main/assets/modules/{moduleId}/layout.json`
- `mobility-nosales-kamelon-library/nosales-kamelon-sdk/src/main/assets/modules/{moduleId}/schema.sql`
- Feature Activity, for example `NoSalesKamelonActivity.kt`

Read `references/layout-json.md` when authoring or reviewing the default `layout.json` contract.

## Runtime Pattern

Prefer a reusable runtime shell:

```kotlin
KamelonModuleScreen(
    manifest = manifest,
    input = inputBundle,
    databaseRepository = dynamicRepository,
    runtimeServices = KamelonRuntimeServices(values = { buildRuntimeValues() }),
    onFinish = { result -> finishWithKamelonResult(input, result) },
    modifier = modifier
)
```

The feature Activity should not manually construct:

```kotlin
KamelonRenderState(
    values = mapOf(...),
    lists = mapOf(...)
)
```

unless the request is a small compatibility fix and not a dynamic UI migration.

## Data Rules

Use `schema.sql` for database contracts and `layout.json` for UI and binding rules.

For list components:

- `layout.json` declares the list id and datasource.
- `schema.sql` declares the datasource SQL.
- `DynamicDatabaseRepository` executes the datasource.
- `KamelonModuleScreen` maps rows to `KamelonOption`.

Do not let Kamelon Runtime know SQLite details beyond the generic `DynamicDatabaseRepository` interface.

## Validation

Use the Android CLI/build flow available in the workspace. Typical commands:

```bash
python3 -m json.tool path/to/layout.json >/tmp/layout.json
/path/to/gradlew -p /path/to/mobility-database-library clean assembleDebug publishToMavenLocal
/path/to/gradlew -p /path/to/mobility-kamelon-library clean assembleDebug
/path/to/gradlew -p /path/to/mobility-nosales-kamelon-library clean assembleDebug
/path/to/ANDROID_AJOVER_SALESAPP/gradlew -p /path/to/ANDROID_AJOVER_SALESAPP clean :app:assembleDebug
```

If a module lacks its own `gradlew`, use the host wrapper with `-p`.

Report:

- which modules compiled
- APK/AAR paths generated
- warnings that matter
- anything intentionally left as backlog

## Backlog Guidance

For future endpoint or remote layout loading, record the idea but keep it outside the local manifest migration unless explicitly requested. A future `KamelonLayoutProvider` can prioritize:

```text
1. local override
2. remote/cache validated layout
3. packaged assets fallback
```

Always require validation, compatibility versioning, and fallback before rendering remote layouts.
