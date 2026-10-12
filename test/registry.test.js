'use strict';
const test=require('node:test');const assert=require('node:assert/strict');const Module=require('node:module');
const {bundle}=require('./fixtures');
test('removing the last device and adding another cannot overlap network sessions',async()=>{
  const instances=[];let unblock;
  class Network {
    constructor(){this.running=false;instances.push(this);}
    start(){this.running=true;}
    async stop(){await new Promise(resolve=>{unblock=resolve;});this.running=false;}
  }
  const load=Module._load;
  Module._load=function(name,...args){if(name==='homey')return {App:class{}};if(name==='./lib/casambi/network')return {Network};return load.call(this,name,...args);};
  let App;try{App=require('../app');}finally{Module._load=load;}
  const app=new App();app.registryTail=Promise.resolve();app.ready=Promise.resolve();app.networks=new Map();app.references=new Map();app.vault={get:()=>({bundle,memory:{}})};
  app.homey={setTimeout:fn=>setImmediate(fn)};
  const a={},b={};await app.acquire(bundle.id,a);await new Promise(r=>setImmediate(r));
  const releasing=app.release(bundle.id,a);await new Promise(r=>setImmediate(r));
  const acquiring=app.acquire(bundle.id,b);await new Promise(r=>setImmediate(r));assert.equal(instances.length,1);
  unblock();await releasing;await acquiring;await new Promise(r=>setImmediate(r));
  assert.equal(instances.length,2);assert.equal(instances[0].running,false);assert.equal(instances[1].running,true);
});
