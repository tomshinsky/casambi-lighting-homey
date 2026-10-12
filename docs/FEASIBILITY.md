# Feasibility gate

The mandatory direct-control gate was passed on a Flos Black Flag Pro using
Casambi Evolution and Homey Pro (homey7q, firmware 13.5.1). Direct BLE authentication,
state notifications, independent channels, CCT, OFF/ON and BLE reconnection were
hardware verified in the preceding private prototype. No gateway was involved.

The first one-shot notification was lost because Homey assigns its callback after
the subscription RPC. Pre-registering the same callback fixed five consecutive
trials. This private SDK workaround is isolated and remains a compatibility risk.

Network-scoped keys and fixture profiles are needed, not just a Bluetooth address.
Authorized one-time bootstrap through the network-password API worked; completely
local credential derivation has not been demonstrated. P0 therefore offers explicit
one-time online authorization or an authorized offline network export. Normal
operation never calls an HTTP client. Existing administrator-only networks may not
be discoverable through the bootstrap endpoint; the app never changes sharing.

A Casambi unit is addressed within a network. One authenticated proxy can receive
state records for multiple unit IDs; P0 must share one connection and serialize
commands per network, rather than open a connection per Homey device. Real
multi-luminaire and proxy failover testing needs additional hardware.

## Sources and coverage

- [casambi-bt](https://github.com/lkempf/casambi-bt): Apache-2.0; the pinned main
  implementation has TODOs for peer-digest and counter checks and incomplete
  Classic support. It does not establish universal firmware compatibility.
- [casambi-bt-hass](https://github.com/lkempf/casambi-bt-hass): examined as integration
  context, no source copied; depends on the same reverse-engineered transport.
- [aiocasambi](https://github.com/hellqvio86/aiocasambi): cloud/gateway route, outside
  the local runtime objective; no source copied.
- [Homey notification discussion](https://community.homey.app/t/ble-characteristic-subscribetonotifications-method-not-working/147958): similar symptoms are not proof of the cause on this hardware.
- [Homey BLE SDK](https://apps-sdk-v3.developer.homey.app/ManagerBLE.html).

Apache-2.0 is retained for this derivative, including its notice and patent terms.
An MIT-only label would not remove obligations for the adapted Apache code.
No Python libraries or their transitive dependencies ship in the Homey app.
