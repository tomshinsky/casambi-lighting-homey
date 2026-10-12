'use strict';
// Casambi wire layout derived from lkempf/casambi-bt (Apache-2.0).
const crypto = require('node:crypto');
function xor(a, b) { return Buffer.from(a.map((v, i) => v ^ b[i])); }
function aes(key, block) {
  const cipher = crypto.createCipheriv('aes-128-ecb', key, null);
  cipher.setAutoPadding(false);
  return Buffer.concat([cipher.update(block), cipher.final()]);
}
function double(block) {
  const out = Buffer.alloc(16);
  for (let i = 0; i < 16; i++) out[i] = ((block[i] << 1) | ((block[i + 1] || 0) >> 7)) & 255;
  if (block[0] & 128) out[15] ^= 0x87;
  return out;
}
function cmac(key, data) {
  const k1 = double(aes(key, Buffer.alloc(16))), k2 = double(k1);
  const blocks = Math.max(1, Math.ceil(data.length / 16));
  let previous = Buffer.alloc(16);
  for (let i = 0; i < blocks - 1; i++) previous = aes(key, xor(previous, data.subarray(i * 16, i * 16 + 16)));
  let last = Buffer.alloc(16), tail = data.subarray((blocks - 1) * 16);
  tail.copy(last);
  if (tail.length === 16) last = xor(last, k1);
  else { last[tail.length] = 128; last = xor(last, k2); }
  return aes(key, xor(previous, last));
}
function stream(key, data, nonce) {
  if (nonce.length !== 16) throw new Error('Invalid nonce length');
  const out = Buffer.alloc(data.length), counter = Buffer.from(nonce);
  for (let start = 0; start < data.length; start += 16) {
    counter.writeUInt32LE(start / 16, 12);
    xor(data.subarray(start, start + 16), aes(key, counter)).copy(out, start);
  }
  return out;
}
function encrypt(key, packet, nonce) {
  const encrypted = Buffer.concat([packet.subarray(0, 4), stream(key, packet.subarray(4), nonce)]);
  return Buffer.concat([encrypted, cmac(key, encrypted)]);
}
function decrypt(key, packet, nonce) {
  if (packet.length < 21) throw new Error('Short authenticated packet');
  const body = packet.subarray(0, -16);
  if (!crypto.timingSafeEqual(cmac(key, body), packet.subarray(-16))) throw new Error('Invalid packet MAC');
  return stream(key, body.subarray(4), nonce);
}
module.exports = {cmac, stream, encrypt, decrypt};
