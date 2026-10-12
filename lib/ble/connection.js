'use strict';
const {digest, exchange, verifyPeer} = require('../casambi/authentication');
const {decodeStates, operation} = require('../casambi/protocol');
const {encrypt, decrypt} = require('../casambi/encryption');
const {subscribeEarly} = require('./notifications');
const AUTH = 'c9ffde48ca5a0001ab838f519b482f77';
const normalize = value => String(value).replace(/[-:]/g, '').toLowerCase();
const deadline = async (promise, milliseconds, phase) => {
  let timer;
  try { return await Promise.race([promise, new Promise((_, reject) => {timer = setTimeout(() => reject(new Error(`Timeout: ${phase}`)), milliseconds);})]); }
  finally {clearTimeout(timer);}
};
class Session {
  constructor(ble, keyId, key, log, address) {
    this.address = address; this.ble = ble; this.keyId = keyId; this.key = key; this.log = log;
    this.queue = []; this.pending = null; this.notifications = 0; this.phase = 'idle';
  }
  notify(data) {
    if (this.closed) return;
    const packet = Buffer.from(data);
    // Never log packet bodies, nonces, keys or authentication digests.
    if (this.pending) { const resolve = this.pending; this.pending = null; resolve(packet); }
    else if (this.queue.length < 128) this.queue.push(packet);
    else this.disconnected = true;
  }
  async next() {
    if (this.closed || this.disconnected) throw new Error('Disconnected');
    if (this.queue.length) return this.queue.shift();
    try {return await deadline(new Promise((resolve, reject) => {this.pending = resolve; this.rejectPending = reject;}), 8000, this.phase);}
    finally {this.pending = null; this.rejectPending = null;}
  }
  async connect() {
    this.phase = 'discovery';
    const adv = await deadline(this.ble.find(this.address), 15000, this.phase);
    if (normalize(adv.address) !== this.address) throw new Error('Unexpected peripheral');
    this.phase = 'connect';
    const connection = adv.connect();
    connection.then(peripheral => {if (this.closed) peripheral.disconnect().catch(() => {});}, () => {});
    this.peripheral = await deadline(connection, 12000, this.phase);
    if (this.closed) throw new Error('Session closed');
    this.peripheral.on('disconnect', () => {this.disconnected = true; this.rejectPending?.(new Error('Disconnected')); this.log('disconnected');});
    this.log('connected');
    this.phase = 'gatt';
    const services = await deadline(this.peripheral.discoverServices(), 8000, this.phase);
    for (const service of services) {
      if (normalize(service.uuid) !== '0000fe4d00001000800000805f9b34fb') continue;
      const characteristics = await deadline(service.discoverCharacteristics(), 5000, 'characteristics');
      for (const char of characteristics) if (normalize(char.uuid) === AUTH) this.characteristic = char;
    }
    if (!this.characteristic) throw new Error('Missing authentication characteristic');
    this.phase = 'read_header';
    const header = await deadline(this.characteristic.read(), 5000, this.phase);
    if (header.length !== 23 || header[0] !== 1 || ![10, 11, 43].includes(header[1])) throw new Error('Unsupported handshake');
    this.nonce = Buffer.from(header.subarray(7, 23));
    this.log('header', {version: header[1], protocolMtu: header[2]});
    this.phase = 'subscribe';
    await deadline(subscribeEarly(this.characteristic, data => this.notify(data)), 5000, this.phase);
    this.log('notification_subscription_complete');
    this.phase = 'peer_public_key';
    const incoming = await this.next();
    const exchanged = exchange(incoming);
    this.transportKey = exchanged.transportKey;
    const response = exchanged.response;
    this.phase = 'write_public_key_66_bytes';
    await deadline(this.characteristic.write(response), 5000, this.phase);
    this.phase = 'key_ack';
    const ack = await this.next();
    if (ack.length !== 1 || ack[0] !== 3) throw new Error('Invalid key acknowledgement');
    this.log('key_exchange_complete');
    const clientDigest = digest(this.key, this.nonce, this.transportKey);
    const auth = Buffer.concat([Buffer.from([1, 0, 0, 0, 4, this.keyId]), clientDigest]);
    const nonce = Buffer.from(this.nonce); nonce.writeUInt32LE(1, 4);
    this.phase = 'write_authentication';
    await deadline(this.characteristic.write(encrypt(this.transportKey, auth, nonce)), 5000, this.phase);
    this.phase = 'authentication_reply';
    const packet = await this.next();
    const plaintext = this.decryptPacket(packet);
    verifyPeer(plaintext, this.keyId, this.key, exchanged);
    this.log('authentication_reply_verified');
    this.phase = 'observe';
    this.outCounter = 2; this.origin = 1;
  }
  async sendState(unitId, state) {
    if (this.closed || this.disconnected || this.outCounter >= 0x7fffffff) throw new Error('Session needs reconnect');
    const command = operation(unitId, this.origin++, state);
    const prefix = Buffer.alloc(5); prefix.writeUInt32LE(this.outCounter, 0); prefix[4] = 7;
    const nonce = Buffer.from(this.nonce); nonce.writeUInt32LE(this.outCounter++, 4);
    await deadline(this.characteristic.write(encrypt(this.transportKey,
      Buffer.concat([prefix, command]), nonce)), 5000, 'lighting_command');
  }
  async states() {return decodeStates(this.decryptPacket(await this.next()));}
  decryptPacket(packet) {
    const plain = decrypt(this.transportKey, packet,
      Buffer.concat([packet.subarray(0, 4), this.nonce.subarray(4)]));
    const counter = packet.readUInt32LE(0);
    if (this.inCounter !== undefined && counter <= this.inCounter) throw new Error('Stale packet counter');
    this.inCounter = counter;
    return plain;
  }
  async close() {
    if (this.closing) return this.closing;
    this.closed = true;
    this.rejectPending?.(new Error('Session closed'));
    this.closing = this._close();
    return this.closing;
  }
  async _close() {
    if (this.characteristic) await deadline(this.characteristic.unsubscribeFromNotifications(), 3000, 'unsubscribe').catch(error => this.log('unsubscribe_error', {type: error.name}));
    if (this.peripheral) await deadline(this.peripheral.disconnect(), 5000, 'disconnect').catch(() => {});
    this.key.fill(0); if (this.transportKey) this.transportKey.fill(0);
  }
}
module.exports = {Session};
