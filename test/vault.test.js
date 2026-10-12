'use strict';
const test=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs/promises');const os=require('node:os');const path=require('node:path');
const {Vault}=require('../lib/homey/vault');const {bundle}=require('./fixtures');const {definition}=require('../lib/homey/device-definition');const {safeEvent}=require('../lib/utils/logger');
test('vault persists offline credentials with owner-only permissions and hides keys from selection lists',async()=>{
  const dir=await fs.mkdtemp(path.join(os.tmpdir(),'casambi-test-'));
  try {const vault=new Vault(dir);await vault.load();await vault.put(bundle);const other=new Vault(dir);await other.load();assert.equal(other.get(bundle.id).bundle.units.length,2);assert.equal((await fs.stat(vault.file)).mode&0o777,0o600);assert.ok(!JSON.stringify(vault.list()).includes(bundle.keyHex));}
  finally{await fs.rm(dir,{recursive:true,force:true});}
});
test('Homey definitions expose CCT only when supported and channel devices have stable separate IDs',()=>{
  const main=definition(bundle,bundle.units[0]);const channel=definition(bundle,bundle.units[0],0);
  assert.ok(main.capabilities.includes('dim.channel2'));assert.ok(main.capabilities.includes('light_temperature'));assert.ok(!channel.capabilities.includes('dim.channel2'));assert.notEqual(channel.data.id,main.data.id);
  const unit={...bundle.units[0],fixture:{stateLength:1,controls:[{type:'DIMMER',offset:0,length:8}]}};
  assert.ok(!definition(bundle,unit).capabilities.includes('light_temperature'));
});
test('diagnostic allowlist drops credentials, addresses and raw error messages',()=>{
  const event=safeEvent('connection_failed',{phase:'connect',password:'secret',address:'private-address',message:'token secret'});
  assert.deepEqual(Object.keys(event).sort(),['at','event','phase']);
});
