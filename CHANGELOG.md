# Changelog

## 0.2.0 — P0 test candidate

- Separate protocol/profile logic from Homey device lifecycle and pairing.
- Share one authenticated connection per network and address multiple units.
- Separate verified BLE proxies from mesh-unit metadata.
- Add asynchronous discovery/authorization and offline export import.
- Add optional parent/channel devices with synchronized CCT and power memory.
- Verify peer authentication and receive counters; reject uncertain/stale commands.
- Add bounded recovery, availability Flow triggers and private credential storage.
- Add synthetic tests, CI, compatibility documentation and release preparation.

The preceding 0.1.x personal Flos prototype was a separate application and is not
an automatic device/Flow migration path. No public release has been published.
