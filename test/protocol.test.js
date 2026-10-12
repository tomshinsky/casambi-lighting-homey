'use strict';
const test=require('node:test');const assert=require('node:assert/strict');const crypto=require('node:crypto');
const {operation,decodeStates}=require('../lib/casambi/protocol');
const {digest,exchange,verifyPeer}=require('../lib/casambi/authentication');
const {Session}=require('../lib/ble/connection');const {encrypt}=require('../lib/casambi/encryption');
test('commands address a single unit and carry the exact state',()=>{
  const packet=operation(23,7,Buffer.from([50,100]));
  assert.equal(packet.readUInt16BE(0),0x2802);assert.equal(packet[2],48);assert.equal(packet.readUInt16BE(5),0x0117);
  assert.deepEqual(packet.subarray(9),Buffer.from([50,100]));assert.throws(()=>operation(0,1,Buffer.alloc(2)));
});
test('one notification decodes multiple units with flags and padding',()=>{
  const states=decodeStates(Buffer.from([6,1,0x47,0x10,99,40,60,0,2,2,0,90]));
  assert.equal(states.length,2);assert.deepEqual(states[0].state,Buffer.from([40,60]));assert.equal(states[1].id,2);assert.equal(states[1].online,true);
  assert.throws(()=>decodeStates(Buffer.from([6,1,3,0x30,1])),/Truncated/);
});
test('ECDH transport keys agree and server digest rejects wrong key/type',()=>{
  const peer=crypto.createECDH('prime256v1'),pub=peer.generateKeys();
  const packet=Buffer.concat([Buffer.from([2]),Buffer.from(pub.subarray(1,33)).reverse(),Buffer.from(pub.subarray(33)).reverse()]);
  const result=exchange(packet),hash=digest(peer.computeSecret(result.publicKey).reverse());
  assert.deepEqual(result.transportKey,Buffer.from(hash.subarray(0,16).map((v,i)=>v^hash[i+16])));
  const key=Buffer.alloc(16,9),response=Buffer.concat([Buffer.from([5,3]),digest(key,result.response.subarray(1,65),result.transportKey)]);
  verifyPeer(response,3,key,result);assert.throws(()=>verifyPeer(response,3,Buffer.alloc(16),result));response[0]=6;assert.throws(()=>verifyPeer(response,3,key,result));
});
test('receive counters reject replay and tampering cannot advance counter',()=>{
  const s=new Session({},1,Buffer.alloc(16),()=>{},'000000000001');s.transportKey=Buffer.alloc(16,2);s.nonce=Buffer.alloc(16,3);
  const prefix=Buffer.from([1,0,0,0]),packet=encrypt(s.transportKey,Buffer.concat([prefix,Buffer.from([9])]),Buffer.concat([prefix,s.nonce.subarray(4)]));
  s.decryptPacket(packet);assert.throws(()=>s.decryptPacket(packet),/Stale/);packet[0]=2;assert.throws(()=>s.decryptPacket(packet),/MAC/);assert.equal(s.inCounter,1);
});
test('closing promptly interrupts notification wait',async()=>{
  const s=new Session({},1,Buffer.alloc(16),()=>{},'000000000001');const wait=assert.rejects(s.next(),/closed/);await s.close();await wait;
});
