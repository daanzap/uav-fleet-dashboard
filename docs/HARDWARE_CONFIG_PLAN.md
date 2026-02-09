# Hardware Configuration UI Plan

## 1. Radio
- **Layout**: Single column — list items one under another (H30 → Silvus → RadioNor → Custom).
- **Remove**: GPS Sim option entirely (from schema, UI, and text summary).
- **Custom**: Keep checkbox + text input; value already stored in `radio.custom.value` (JSONB), no new DB column.

## 2. Frequency Band
- **Options**: S-Band, C-Band, L-Band (unchanged).
- **Custom**: Add explicit "Custom" checkbox; when checked, show text input. Store in existing `frequencyBand.custom` (string). Persist and show after save.

## 3. Visual Navigation
- **Change**: From radio (Yes / No / Other) to **3 checkboxes**: Yes, No, Boson.
- **Schema**: `visualNavigation: { yes: boolean, no: boolean, boson: boolean }`. Backward-compat in `normalizeConfig` for old `mode`/`otherValue`/`boson`.
- **Display**: Summary e.g. "Yes, Boson" or "No". No new DB column (still in `hw_config` JSONB).

## 4. GPS
- **Options**: HolyBro, Harden, Arc (x20) [label for existing `arcXL`], Custom.
- **Custom**: Checkbox + text input; value in `gps.custom.value`. Already persisted.

## 5. Database
- **No new columns.** All values live in existing `vehicles.hw_config` (JSONB). Only shape of `visualNavigation` and removal of `radio.gpsSim` in app/schema.

## 6. Files to Touch
- `src/lib/hardwareConfig.js` — schema, normalizeConfig, hardwareConfigToText (and presets if needed).
- `src/components/HardwareConfigModal.jsx` — Radio column layout, remove GPS Sim, Frequency Custom row, Visual 3 checkboxes, GPS label.
- `src/components/HardwareConfigModal.css` — Radio column style.
- `src/lib/hardwareConfig.test.js` — update tests for removed gpsSim and new visual shape.
- `db/12_migrate_hw_config.sql` — optional: remove gpsSim from migration default (for new installs); existing DB already has it, normalizeConfig will ignore.
