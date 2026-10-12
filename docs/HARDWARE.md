# Hardware evidence

Reference hardware: Flos Black Flag Pro (BLACK FLAG V1.2.3, fixture 32148),
Casambi Evolution network, Homey Pro homey7q with firmware 13.5.1.
No network ID, BLE address, key, Homey ID or device registration ID is included here.

P0 was installed as a separate app. The earlier personal BLE prototype was disabled
while testing; it was not uninstalled and its devices were not deleted.
Authorized credentials/profiles were imported from the existing private cache
without contacting Casambi Cloud. Scanning, import and registration were exercised
through real Homey pairing handlers. One parent and two channel devices were created.

| Test | Result |
| --- | --- |
| BLE discovery of reference node | Passed |
| Existing-network offline authorization | Passed |
| ECDH, authenticated session and peer digest | Passed |
| Parent OFF and ON with asymmetric brightness restoration | Passed |
| Channel 1 dim, OFF and remembered-level ON | Passed |
| Channel 2 independent dim | Passed |
| Master dim retaining channel ratio | Passed |
| CCT and synchronization across parent/children | Passed |
| Device-scoped channel and Kelvin Flow actions | Passed |
| Shared BLE reconnect and all three devices available | Passed, 6.781 seconds initially; 6.217 seconds on repeat verification |
| Original observed state restored after control tests | Passed |
| Full Homey reboot recovery | Passed, 71.364 seconds; observed hub offline, then all three devices reauthenticated and available |
| Physical upper/lower mapping | Pending visual observation |
| Actual lamp power interruption | Pending manual test |
| Multiple physical luminaires/proxy failover | Pending additional hardware |
| Fresh JavaScript online bootstrap on cloud service | Contract-tested; live acceptance pending |
| Continuous 24-hour operation / official app coexistence | Pending |

The cloud unit address differed from the connectable BLE proxy address. P0 now
stores these concepts separately and does not infer one from the other. This was
found by hardware testing, not by assuming the inventory schema implied BLE identity.

Automated tests use synthetic profiles, addresses, keys and sessions. They exercise
multiple units and failure modes but cannot certify another manufacturer or firmware.

After the pairing-help update, all twelve hardware checks were repeated successfully,
including both channels, power memory, CCT, Flow, reconnect and original-state
restoration. All three registered devices were available before the repeat test.
