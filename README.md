# Casambi Lighting for Homey Pro

An independent community integration for direct, local BLE lighting control.
No gateway, phone, Home Assistant server or cloud service is needed during normal
operation. This project is not affiliated with Casambi Technologies Oy, Flos or Athom.

**Status: P0 test candidate, not a production-certified or published Store app.**
The Homey app name is **Casambi Lighting**; the longer project title is used here.

## What P0 does

- Controls individual dimmable luminaires within an existing Evolution network.
- Provides power, brightness, profile-derived CCT and independent channels.
- Shares one authenticated BLE connection per network across all Homey devices.
- Offers optional separate channel devices, plus a parent for the whole luminaire.
- Confirms commands through actual state notifications, reconciles after reconnect,
  backs off after failures and marks unavailable/stale state explicitly.
- Provides standard lighting Flow cards, channel/Kelvin actions, and availability triggers.

Excluded: RGB/RGBW, groups, scenes, sensors, switches, unrelated relays, blinds,
HVAC, commissioning, firmware updates and topology changes. Their presence in a
profile does not mean P0 supports them. Unsupported profiles are excluded visibly.

## Compatibility

| Hardware or feature | Evidence | Status |
| --- | --- | --- |
| Homey Pro, homey7q, firmware 13.5.1 | Physical test hub | Tested |
| Flos Black Flag Pro, BLACK FLAG V1.2.3, fixture 32148 | BLE auth, state, power, both channels, CCT, Flow | Tested |
| Multiple logical Homey devices sharing one luminaire | Parent and two channel devices on physical hub | Tested |
| Multiple luminaires sharing a network; proxy failover | Synthetic multi-unit protocol/session tests | Implemented; hardware untested |
| Other dimmable/CCT manufacturers | Generic bitfield/profile implementation | Untested; not claimed compatible |
| One-time online authorization | Preceding Python bootstrap on reference network; JS client contract tests | JS wizard needs a fresh live online acceptance test |
| Authorized offline export and existing-network pairing | Physical hub pairing handlers | Tested |
| Homey Pro models exposing SDK v3 BLE, firmware >=12.9 | SDK target; only homey7q physically tested | Untested models |
| Homey Cloud | No local BLE | Unsupported |
| Classic networks, RGB and non-lighting categories | Outside verified P0 | Unsupported |

See [hardware results](docs/HARDWARE.md) and [manual acceptance tests](docs/MANUAL-TESTS.md).
Do not interpret a passing mock test as device or firmware certification.

## Install for development

Use Node.js 22.13+ or 24 and the Homey CLI. After obtaining this source:

```sh
npm ci --ignore-scripts
npm run check
homey app validate --level publish
homey app install --discovery-strategies local
```

Sign in and select your Homey with the CLI first. `install` leaves the application
on the hub; `run` is a temporary developer session. No credentials belong in an
`env.json` or the repository. Normal installation needs no environment secrets.
Do not enable another integration's BLE client for the same network concurrently.
The former personal prototype can remain installed but disabled during P0 testing;
its devices and Flows are not automatically migrated or deleted.

## Pair an existing network

1. In Homey choose Add device → Casambi Lighting → Casambi light.
2. Select a nearby Casambi device or an already saved network. Scanning is bounded
   and cached; no MAC address or key needs to be typed.
3. For a new network, explicitly allow one-time online authorization and enter its
   **network password**, not the Casambi account password. Alternatively choose an
   authorized offline JSON export. The app does not change network sharing settings.
4. Choose whether to offer separate channel devices as well as the parent.
5. Select the supported luminaires/channels to add.

The setup service downloads credentials, inventory and fixture profiles. It is
never called by the runtime connection manager. Passwords and setup-session tokens
are discarded, while only the local-control bundle is retained on the hub.
Administrator-only networks can be invisible to the bootstrap lookup. If setup
fails, do not reset the network: inspect sharing in the official app or use the
[offline export format](docs/OFFLINE-EXPORT.md). Fully local key derivation has not
been demonstrated. An authorized initial export is therefore an explicit prerequisite.

To reauthorize, repeat Add device and authorize/import the same network. Existing
IDs and Flow references are retained when fixture layouts match. A changed fixture
layout is rejected instead of silently reinterpreting controls; remove/re-add the
affected devices after reviewing the new profile.

## Controls and Flow

Power restores remembered nonzero brightness. A master dim command scales channels
proportionally. A child device controls only its channel with standard power/dim
cards. CCT belongs to the entire luminaire, so changing it on a child also updates
the parent and other children. Channel labels are numbered until physically identified;
you can rename the separate devices to Upper/Lower in Homey.

CCT limits come from the fixture profile; unsupported fixtures expose no CCT control.
Native timed transitions have not been verified, so P0 does not expose a fade-duration
option. Identical confirmed-state commands are suppressed. Rapid commands serialize
against the latest confirmed state; unknown outcomes are never automatically replayed.

Standard capability cards handle on/off, brightness, CCT and their supported
triggers/tags. Additional cards set a parent channel or a Kelvin value, and report
availability changes. A command failure rejects the Flow action with an error.

## Troubleshooting

- **Cannot discover:** check BLE range, lamp power and whether another BLE client
  owns the connection. Try scanning again; avoid repeatedly restarting the lamp.
- **Authorization fails:** check the network password/sharing and firmware family.
  The app never falls back to unauthenticated control.
- **Unavailable after a drop:** recovery backs off from 2 to 60 seconds and cycles
  through verified network proxy addresses. It never scans continuously.
- **State becomes stale:** a bounded five-minute connection renewal requests a new
  snapshot by reconnecting; no undocumented poll command is sent. Availability
  Flows may run during that refresh if state has become stale.
- **Reconnect manually:** Device settings → Maintenance → Reconnect network. This
  affects all P0 devices sharing that network, not the Casambi configuration.
- **Official app coexistence:** concurrent single-node BLE use is unverified. Stop
  this Homey application temporarily when direct access from the official app is
  needed, then restart it. No commissioning or unpairing is needed.

Please include versions and sanitized event/phase names in issues. Never attach
network exports, secrets, raw BLE packets or unsanitized Homey logs.

## Development and publication

See [architecture](ARCHITECTURE.md), [contributing](CONTRIBUTING.md),
[security](SECURITY.md), [release checklist](docs/RELEASE.md), and
[changelog](CHANGELOG.md). The protocol layer has no Homey SDK dependency;
Homey-specific pairing, storage, lifecycle and capabilities are separate adapters.
Runtime dependencies: Node built-ins only. ESLint is a pinned development dependency.
CI lints and runs automated tests on Node 22/24; it contains no publication step.

Licensed under Apache-2.0. See [NOTICE](NOTICE) for the adapted `casambi-bt` protocol
work and [licence review](docs/LICENSING.md). No proprietary logos are included.
