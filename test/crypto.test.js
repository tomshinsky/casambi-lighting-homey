'use strict';
const {test} = require('node:test');
const assert = require('node:assert/strict');
const {cmac, encrypt, decrypt} = require('../lib/casambi/encryption');
test('NIST SP 800-38B AES-CMAC vectors', () => {
  const key = Buffer.from('2b7e151628aed2a6abf7158809cf4f3c', 'hex');
  for (const [input, expected] of [
    ['', 'bb1d6929e95937287fa37d129b756746'],
    ['6bc1bee22e409f96e93d7e117393172a', '070a16b46b4d4144f79bdd9dd04a287c'],
    ['6bc1bee22e409f96e93d7e117393172aae2d8a571e03ac9c9eb76fac45af8e5130c81c46a35ce411', 'dfa66747de9ae63030ca32611497c827']
  ]) assert.equal(cmac(key, Buffer.from(input, 'hex')).toString('hex'), expected);
});
test('packet authentication rejects tampering', () => {
  const key = Buffer.alloc(16, 5), nonce = Buffer.alloc(16, 3), data = Buffer.from('010000000411223344', 'hex');
  const packet = encrypt(key, data, nonce);
  assert.deepEqual(decrypt(key, packet, nonce), data.subarray(4));
  packet[4] ^= 1;
  assert.throws(() => decrypt(key, packet, nonce), /MAC/);
});
test('matches pinned Python casambi-bt across multiple counter blocks', () => {
  const key = Buffer.from(Array.from({length: 16}, (_, i) => i));
  const nonce = Buffer.from(Array.from({length: 16}, (_, i) => i + 16));
  const data = Buffer.from(Array.from({length: 61}, (_, i) => i));
  const expected = '00010203034ec865d185b30a10e16757fba5ee2561a6652658a58e1e7360bbfce8d390b921a00df3e5ca962fca57a9bbd7c609b06c612f7b671263779461e42be3222348091587de684a2a4f47';
  assert.equal(encrypt(key, data, nonce).toString('hex'), expected);
});
