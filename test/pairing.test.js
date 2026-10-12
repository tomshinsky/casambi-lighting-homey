'use strict';
const test=require('node:test');const assert=require('node:assert/strict');const Module=require('node:module');
const {bundle}=require('./fixtures');
test('pairing imports without exposing credentials and lists independent channel devices',async()=>{
  const original=Module._load;
  Module._load=function(name,...args){if(name==='homey')return {Driver:class{}};return original.call(this,name,...args);};
  let Driver;try{Driver=require('../drivers/casambi-light/driver');}finally{Module._load=original;}
  const saved=new Map(),handlers=new Map(),driver=new Driver();
  driver.getDevices=()=>[];
  driver.homey={app:{ready:Promise.resolve(),vault:{list:()=>[],get:id=>({bundle:saved.get(id)})},scanner:{scan:async()=>[{address:'000000000001',name:'Test'}]},replace:async b=>saved.set(b.id,b)}};
  await driver.onPair({setHandler:(name,fn)=>handlers.set(name,fn)});
  assert.equal(handlers.get('scan')(),true);await new Promise(r=>setImmediate(r));
  const networks=handlers.get('networks')();assert.equal(networks.entries.length,1);assert.ok(!JSON.stringify(networks).includes('000000000001'));
  assert.equal(handlers.get('import')({text:JSON.stringify(bundle),channels:true}),true);
  await new Promise(r=>setImmediate(r));
  assert.equal(handlers.get('setup_status')().pending,false);
  const devices=await handlers.get('list_devices')();assert.equal(devices.length,6);
  assert.ok(!JSON.stringify(devices).includes(bundle.keyHex));assert.ok(!JSON.stringify(devices).includes('000000000001'));
});
