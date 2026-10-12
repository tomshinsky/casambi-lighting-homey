# Manual acceptance tests

Record app, Homey and luminaire firmware versions. Do not record network identifiers
or credentials in public results. Use a reference state and restore it after tests.

## Lamp power interruption — pending

1. Confirm parent/channel devices are available and note actual levels/CCT.
2. Interrupt only the reference lamp's power using its normal safe power control.
3. Verify Homey marks all representations unavailable and does not report success
   for a lighting command while the lamp is absent.
4. Restore power. Allow bounded backoff (up to 60 seconds plus BLE setup).
5. Verify a fresh actual state is shown, including the lamp's own power-on defaults.
   Do not demand that Homey overwrite those defaults during reconciliation.

## Physical upper/lower mapping — pending

Set one channel to a visibly different level, identify the affected light and
rename its Homey channel device Upper or Lower. Repeat for the other channel and
restore both levels. Do not infer direction from protocol channel order alone.

## Official Casambi app coexistence — pending

Observe whether the official app can control the network while Homey is connected.
If a single node permits only one BLE client, stop the Homey app for the phone test.
Change power/brightness/CCT, close the phone connection, restart the Homey app and
verify fresh state reconciliation. Never reset/unpair the network as a workaround.

## Multiple physical luminaires/proxy failover — pending additional hardware

Authorize a network with at least two supported lights and two verified proxies.
Control unit A while asserting B is unchanged. Exercise concurrent actions and
external state notifications. Power off the active proxy, leaving another powered;
verify failover addresses the same logical units and reconciles their actual state.

## Online wizard and UI — pending fresh network acceptance

Use a test network password, opt into setup, confirm the unsupported-profile notice
and select lights. Ensure no address/key entry is required. Test wrong password,
network failure, cancellation, retries and file import in the Homey mobile UI.
The JS service is contract-tested; a fresh live cloud authorization is not claimed.

## Long-duration and reboot

Observe 24 hours, including bounded snapshot renewals and availability Flows.
Check resource use, connection overlap, unexpected brightness changes and external
control. Reboot the hub and verify credentials survive and fresh state returns.
The current automated hardware reboot result is recorded separately; days-long
operation remains unverified.
