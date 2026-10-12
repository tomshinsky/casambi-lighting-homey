# First-time setup

P0 connects to an existing Casambi Evolution network. There is no separate Bluetooth
activation step or luminaire PIN in Homey. Commission new lights using the official
Casambi app first. Keep an existing working network; do not reset or unpair its lights.

## 1. Prepare the network in Casambi

1. Power the light. Enable Bluetooth on your phone and grant the Casambi app access.
2. Add a new light to an Evolution network, or open its existing network. Verify
   on/off and dimming in Casambi before continuing.
3. For the P0 online wizard, an administrator opens **More → Network setup → Sharing
   settings**. Menu labels can vary between app versions.
4. Use **Password protected** sharing. In password management, create a password
   with **User** access for lighting control. Save and allow the app to synchronize
   with Casambi while online. Do not make the network **Open**.
5. Retain your administrator credentials privately. The P0 wizard does not implement
   email/password login to **Administrator only** networks. If sharing must remain
   unchanged, use an authorized offline export instead.

Official references: [first use](https://docs.casambi.com/casambi-app/user-guide/first-time-use/),
[sharing modes](https://support.casambi.com/support/solutions/articles/12000017044),
and [adding a user](https://docs.casambi.com/casambi-app/frequently-asked-questions/more-tab-faq/how-can-i-add-users-to-my-password-protected-evolution-network/).

## 2. Add the light in Homey

1. Keep the light powered within Bluetooth range of Homey Pro. Close the Casambi
   phone app during pairing and disable any competing BLE integration for this network.
2. In Homey, choose **Add device → Casambi Lighting → Casambi light**.
3. Select the discovered device. Enter the **network User password** created above.
   No email address, email account password or Bluetooth PIN is required.
4. Allow one-time contact with Casambi and select **Continue**. Homey needs internet
   access for this online authorization step.
5. Optionally enable separate channel devices, then select the lights/channels to
   add. The wizard excludes unsupported profiles and reports them.
6. Wait for the device to become available, then test on/off and dimming. For a
   multi-channel light, identify Channel 1/2 visually and rename them in Homey.
   Colour temperature is shared by all channels of the same luminaire.

A **saved network** needs neither a password nor cloud consent; these fields are
disabled. Alternatively, choose **Import and continue** with an authorized
[JSON export](OFFLINE-EXPORT.md). This is P0's technical interchange format, not a
claim that the official Casambi app provides a one-click export in this format.

## What is stored

The password field is masked and cleared after submission. Passwords are not written
to settings or logs. Homey retains local-control keys and fixture profiles so it can
reauthenticate after restarting. Normal operation uses local BLE. Treat an export
as a credential because it contains network keys.

If discovery fails, check power, range and competing BLE connections, then select
**Scan again**. If authorization fails, check the network type, sharing and password;
do not reset the light or publish keys in a support request.

## P0 acceptance limits

Offline import and lighting control have been tested on the reference Homey and
Flos light. Fresh online authorization through this JavaScript wizard and its mobile
UI still require live acceptance testing. Contract tests do not replace that test.
This guide does not guarantee compatibility with every fixture, firmware or access
role. See [hardware evidence](HARDWARE.md) for the exact tested scope.
