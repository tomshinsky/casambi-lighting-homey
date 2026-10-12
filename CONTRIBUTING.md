# Contributing

Use Node 22.13+ or 24. Run `npm ci --ignore-scripts` and `npm run check` before
submitting a patch. Run Homey CLI publish-level validation for manifest, pairing
or asset changes. GitHub CI runs lint/tests but never publishes an app.

Keep protocol code independent of Homey. Add synthetic fixtures for bitfields,
addressing and failure cases; never record live network keys or full packets.
Separate simulation evidence from hardware results. A compatibility report needs
manufacturer, model, fixture type, firmware and the controls actually tested.

Do not add RGB, groups, scenes, sensors, commissioning or firmware updates to P0.
Keep dependencies small. Add a runtime dependency only with a licence review and
clear need. Do not add telemetry, upload diagnostics or initiate runtime cloud calls.

Use small commits describing the behavior changed. Include reproduction steps,
validation and known limitations in pull requests. Preserve upstream attribution
and Apache-2.0 obligations for adapted files. Contributions are accepted under the
project's Apache-2.0 licence unless explicitly agreed otherwise.

Never publish credentials, real network/device addresses, account identifiers,
private exports, raw BLE packets or unredacted logs. See SECURITY.md for reporting.
