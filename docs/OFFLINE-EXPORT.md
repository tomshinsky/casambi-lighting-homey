# Authorized offline export

This option is for owners who already obtained credentials and fixture metadata
through authorized setup. It is not a key extraction or commissioning tool. Treat
the file as a password: keep it private and never upload it to the repository.

Required JSON fields:

- `schema`: 1
- `id`: stable opaque network ID, 8–80 letters, digits, underscores or hyphens
- `name`: user-visible network name
- `keyId`: integer 0–255
- `keyHex`: authorized network key, 16 or 32 bytes encoded as hexadecimal
- `proxies`: 1–32 **verified BLE advertisement addresses**, normalized hex
- `units`: supported luminaires, each with `id` (1–255), `name`, `fixture`
- `fixture`: `stateLength` (1–16 bytes), `controls`, and optional model/vendor/type
- each control: `type`, `offset`, `length`, `readonly`, and CCT `min`/`max` in Kelvin

Allowed writable lighting controls: DIMMER, TEMPERATURE, ONOFF. SLIDER fields are
preserved, not exposed. A writable dimmer is required to classify the profile as
lighting. Other control types and ambiguous layouts are rejected.

The BLE proxy address must come from a verified advertisement/authorized setup.
**Do not substitute the unit address from the cloud inventory.** The two can differ.
Unit IDs are mesh destinations; one proxy can communicate with several units.

`test/fixtures.js` contains a synthetic schema example. Its credentials/addresses
are deliberately fictitious and cannot control a real installation. The built-in
online wizard produces this model internally without manual key entry.

To reauthorize a saved network, import a file with the same stable ID. Existing
Homey devices remain valid if unit profiles are unchanged. The app rejects changed
layouts rather than send controls at incorrect bit offsets.
