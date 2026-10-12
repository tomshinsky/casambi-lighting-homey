'use strict';
const test=require('node:test');const assert=require('node:assert/strict');const {once}=require('node:events');
const {Network}=require('../lib/casambi/network');const {bundle}=require('./fixtures');
function setup() {
  const sessions=[];
  class FakeSession {
    constructor(_ble,_id,_key,_log,address){this.address=address;this.peripheral={isConnected:true};this.queue=[];this.commands=[];sessions.push(this);}
    async connect(){this.queue.push(bundle.units.map(u=>({id:u.id,online:true,on:true,state:Buffer.from([200,100,50,3])})));}
    states(){if(this.queue.length)return Promise.resolve(this.queue.shift());return new Promise((yes,no)=>{this.resolve=yes;this.reject=no;});}
    async sendState(id,state){this.commands.push({id,state:Buffer.from(state)});const record=[{id,online:true,on:true,state}];if(this.resolve){const resolve=this.resolve;this.resolve=null;resolve(record);}else this.queue.push(record);}
    async close(){this.closed=true;this.peripheral.isConnected=false;this.reject?.(new Error('Disconnected'));}
  }
  return {network:new Network({},bundle,{Session:FakeSession,retryDelay:1}),sessions};
}
async function ready(network){const event=once(network,'state');network.start();await event;}
test('one shared connection handles two units and preserves interleaved channel writes',async()=>{
  const {network,sessions}=setup();await ready(network);
  try {await Promise.all([network.set(1,'dim',0.2,0),network.set(2,'dim',0.3,1),network.set(1,'dim',0.4,1)]);
    assert.equal(sessions.length,1);assert.deepEqual(sessions[0].commands.map(c=>c.id),[1,2,1]);assert.deepEqual(network.status(1).state,Buffer.from([51,102,50,3]));
  }finally{await network.stop();}
});
test('recovery uses another network proxy and never replays an uncertain write',async()=>{
  const {network,sessions}=setup();await ready(network);sessions[0].sendState=async()=>{throw new Error('write failed');};
  await assert.rejects(network.set(1,'dim',0.2),/write failed/);
  while(!network.status(1).available)await once(network,'state');
  assert.equal(sessions.length,2);assert.equal(sessions[1].address,bundle.units[1].address);assert.equal(sessions[1].commands.length,0);await network.stop();
});
test('duplicate commands are suppressed; offline and stale state reject writes',async()=>{
  const {network,sessions}=setup();await ready(network);
  await network.set(1,'dim',200/255);assert.equal(sessions[0].commands.length,0);
  network.states.get(1).receivedAt=0;await assert.rejects(network.set(1,'dim',0.2),/stale/);
  network.accept({id:2,online:false,state:Buffer.alloc(4)});await assert.rejects(network.set(2,'dim',0.2),/unavailable/);await network.stop();
});
