'use strict';
const crypto = require('node:crypto');
function digest(...parts) {const hash = crypto.createHash('sha256'); for (const part of parts) hash.update(part); return hash.digest();}
function exchange(incoming) {
  if (incoming.length !== 65 || incoming[0] !== 2) throw new Error('Invalid peer public key');
  const peer = Buffer.concat([Buffer.from([4]), Buffer.from(incoming.subarray(1, 33)).reverse(), Buffer.from(incoming.subarray(33)).reverse()]);
  const ecdh = crypto.createECDH('prime256v1'), publicKey = ecdh.generateKeys();
  const hash = digest(ecdh.computeSecret(peer).reverse());
  const transportKey = Buffer.from(hash.subarray(0, 16).map((v, i) => v ^ hash[i + 16]));
  const response = Buffer.concat([Buffer.from([2]), Buffer.from(publicKey.subarray(1, 33)).reverse(), Buffer.from(publicKey.subarray(33)).reverse(), Buffer.from([1])]);
  return {transportKey, response, publicKey};
}
function verifyPeer(plain, keyId, key, exchangeResult) {
  if (plain.length !== 34 || plain[0] !== 5 || plain[1] !== keyId) throw new Error('Invalid authentication reply');
  const {response, publicKey, transportKey} = exchangeResult;
  // Both point byte orders occur in reverse-engineered descriptions. Only an
  // exact keyed digest is accepted; no unverified authentication fallback.
  const points = [response.subarray(1, 65), publicKey.subarray(1), publicKey];
  if (!points.some(point => crypto.timingSafeEqual(digest(key, point, transportKey), plain.subarray(2)))) throw new Error('Peer authentication failed');
}
module.exports = {digest, exchange, verifyPeer};
