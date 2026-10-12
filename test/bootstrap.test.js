'use strict';
const test=require('node:test');const assert=require('node:assert/strict');
const {Bootstrap}=require('../lib/casambi/bootstrap');const {validateBundle}=require('../lib/casambi/bundle');
const {fixture,bundle}=require('./fixtures');
function response(data,status=200){return {ok:status===200,status,headers:new Map(),text:async()=>JSON.stringify(data)};}
test('one-time setup scopes credentials to the session request and filters unsupported fixtures',async()=>{
  const calls=[];
  const bootstrap=new Bootstrap(async(url,opts)=>{
    calls.push({url,opts});
    if(url.endsWith('/uuid/000000000001'))return response({id:'synthetic-cloud-id'});
    if(url.endsWith('/session'))return response({session:'synthetic-token'});
    if(url.endsWith('/synthetic-cloud-id/'))return response({network:{name:'Test',keyStore:{keys:[{id:1,role:3,key:bundle.keyHex}]},units:[{deviceID:1,address:'000000000001',name:'Test light',type:1},{deviceID:2,address:'000000000002',name:'Excluded RGB',type:2}]}});
    return response(url.endsWith('/fixture/1')?fixture:{stateLength:3,controls:[{type:'RGB',offset:0,length:24}]});
  });
  const result=await bootstrap.authorize('000000000001','synthetic-password');
  assert.equal(result.bundle.units.length,1);assert.deepEqual(result.skipped,['Excluded RGB']);
  assert.equal(calls.filter(c=>c.opts.body?.includes('synthetic-password')).length,1);
  assert.equal(calls.filter(c=>c.opts.headers?.['X-Casambi-Session']).length,1);
  assert.ok(!JSON.stringify(result.bundle).includes('synthetic-password'));assert.ok(!JSON.stringify(result.bundle).includes('synthetic-token'));
  assert.ok(calls.every(c=>c.opts.redirect==='error' && c.url.startsWith('https://api.casambi.com/')));
});
test('authorization errors never echo service response or submitted password',async()=>{
  const bootstrap=new Bootstrap(async()=>response({secret:'do-not-echo'},403));
  await assert.rejects(bootstrap.authorize('000000000001','secret-password'),error=>!error.message.includes('do-not-echo')&&!error.message.includes('secret-password'));
});
test('offline import rejects duplicate units, unsupported capabilities and bad keys',()=>{
  validateBundle(bundle);
  assert.throws(()=>validateBundle({...bundle,keyHex:'invalid'}));
  assert.throws(()=>validateBundle({...bundle,units:[bundle.units[0],bundle.units[0]]}));
});
