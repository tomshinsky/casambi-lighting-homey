'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const {subscribeEarly} = require('../lib/ble/notifications');

test('retains Casambi first packet delivered before subscribe RPC resolves', async () => {
  const packet = Buffer.alloc(65, 2);
  const received = [];
  const characteristic = {
    async subscribeToNotifications(callback) {
      // Reproduce the observed SDK ordering, including an early notification.
      await Promise.resolve();
      if (this._callback) this._callback(packet);
      await Promise.resolve();
      this._callback = callback;
    },
  };
  await subscribeEarly(characteristic, data => received.push(data));
  assert.deepEqual(received, [packet]);
  characteristic._callback(Buffer.from([3]));
  assert.equal(received.length, 2);
});

test('failed subscription clears the pre-registered callback and preserves error', async () => {
  const failure = new Error('Subscription failed');
  const characteristic = {async subscribeToNotifications() {throw failure;}};
  await assert.rejects(subscribeEarly(characteristic, () => {}), error => error === failure);
  assert.equal(characteristic._callback, null);
});
