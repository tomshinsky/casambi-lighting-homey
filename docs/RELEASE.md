# Test release preparation

## Current gates

- Local Git repository initialized; protocol, pairing and reliability changes are
  split into descriptive commits. No remote repository has been created.
- Runtime contains no hardcoded credentials or live network/device identifiers.
- Lint, automated tests and Homey `publish` validation pass locally.
- Reference-lamp controls, parent/channel synchronization, Flow actions and BLE
  recovery pass hardware tests. See HARDWARE.md for exact scope.
- Multi-luminaire hardware, fresh live JS online wizard, mobile UI, lamp power loss,
  official-app coexistence and days-long stability remain manual acceptance gates.
- GitHub CI is prepared but has not run remotely. No claim of remote CI success.

## Proposed GitHub release

Repository: `tomshinsky/casambi-lighting-homey` (not yet created).
Title: **Casambi Lighting for Homey Pro**.
Visibility: public only after explicit owner approval.
Initial tag: `v0.2.0-p0-test`, clearly marked prerelease.
Do not publish private exports, old workspace diagnostics, hub identifiers or logs.
Use the sanitized repository archive only. The installed GitHub connector identifies
the intended account; GitHub CLI is not installed in the development environment.

After approval, create the repository, push the reviewed history and run CI before
publishing a prerelease. Keep the installation/compatibility caveats in release notes.
No workflow automatically uploads to the Store or creates a release.

## Homey App Store preparation

The short app name **Casambi Lighting** avoids using Homey/Athom in the app name;
the full project title remains in repository documentation. The manifest targets
local Homey Pro SDK v3, requests BLE only, includes drivers, capability definitions,
Flow cards, pairing and original non-proprietary assets. Store `readme.txt` is kept
separate from the developer README.

`homey app validate --level publish` checks technical requirements, not editorial
approval, trademark suitability, device compatibility or completion of hardware tests.
The included illustrations are draft original artwork. Before Store submission,
review them against current image guidelines and replace driver imagery with an
appropriate authorized product image if required by the reviewer. Add a support
link only after the repository actually exists.

Do not run `homey app publish` without separate owner approval. The documented
process uploads a draft. A first-time app still needs certification before even a
public Test link becomes available; disable immediate public release after approval.
The intended first distribution is a **test release**, never automatic production.

Sources checked during preparation:

- [Publishing and Test releases](https://apps.developer.homey.app/app-store/publishing)
- [Store guidelines](https://apps.developer.homey.app/app-store/guidelines)
- [App manifest](https://apps.developer.homey.app/the-basics/app/manifest)

## Review checklist before asking for publication approval

1. Review README, compatibility matrix, security limits and manual test gaps.
2. Review Git-tracked files and complete Git history for secrets/private identifiers.
3. Verify tests and publish validation after any final changes.
4. Preserve Apache attribution and modification notices.
5. Confirm repository owner/name, public visibility and prerelease scope with owner.
6. Keep Store submission approval separate from GitHub approval.
