# v0.2.0-p0-test — prerelease notes

Independent local Casambi lighting for Homey Pro. P0 provides authenticated BLE
control, profile-based dimming/CCT, optional channel devices, shared network
connections, state confirmation, reconnection and Flow integration.

The Flos Black Flag Pro is the only physically tested luminaire. Multi-unit routing
and additional fixture layouts have automated coverage but need community hardware
testing. Classic, RGB/RGBW, groups/scenes, sensors/switches, commissioning and firmware
updates are not supported. One-time authorized bootstrap or a private offline export
is required; normal operation uses no cloud service or gateway.

This is a test candidate. Review the README, compatibility matrix and manual tests
before installation. The notification workaround uses a private Homey SDK field.
Please report compatibility with versions and sanitized events only; never upload
keys, network exports, live identifiers or raw diagnostic archives.

Fresh online authorization through the JavaScript wizard and the mobile pairing UI
remain unverified on live hardware. The reference installation used an authorized
offline import. Additional acceptance gaps include lamp power interruption, multiple
physical luminaires, official-app coexistence and a 24-hour soak. Start with the
[first-time setup guide](https://github.com/tomshinsky/casambi-lighting-homey/blob/main/docs/SETUP.md) and do not treat this prerelease as Store-certified.
