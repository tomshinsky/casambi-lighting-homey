'use strict';

async function subscribeEarly(characteristic, callback) {
  // Verified on Homey 13.5.1: the SDK assigns _callback after its subscribe
  // RPC resolves. Casambi's one-shot public key can precede that response.
  // This private SDK field is a compatibility workaround; retest SDK updates.
  characteristic._callback = callback;
  try {
    await characteristic.subscribeToNotifications(callback);
  } catch (error) {
    if (characteristic._callback === callback) characteristic._callback = null;
    throw error;
  }
}
module.exports = {subscribeEarly};
