# Security and privacy

Normal operation uses local BLE only. There is no telemetry or analytics. One-time
online authorization is optional and explicit; the offline import path makes no
network requests. Setup passwords/tokens are not persisted. Network keys and fixture
profiles are stored in app-private owner-only files, outside the repository.

The implementation checks AES-CMAC, the peer's keyed authentication digest,
authentication type/key ID and increasing receive counters. It does not disable
authentication for unknown firmware. Nonces, keys, packets, device addresses and
upstream HTTP response bodies are excluded from the diagnostic allowlist.

The protocol is reverse engineered and has not received an independent security
audit. The counter direction-bit semantics and all firmware variants are not fully
characterized. Profile metadata and authorized offline exports are trusted setup
inputs, validated for bounds and supported layouts. P0 does not establish the
security of Casambi mesh internals or other implementations.

Homey administrators and compromised hub firmware can access app data. Owner-only
files are not an independent hardware-backed secret store. Protect hub backups and
network exports as credentials; do not attach them to public issues.

Before a public repository is approved, report findings privately to the maintainer.
For a published repository, use GitHub private vulnerability reporting if enabled;
otherwise ask for a private reporting channel without posting exploit details or
secrets. Rotate compromised credentials through the official authorized application.
P0 does not perform key rotation or topology modification itself.
