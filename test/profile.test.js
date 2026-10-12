'use strict';
const test=require('node:test');const assert=require('node:assert/strict');
const {profile,decode,apply}=require('../lib/devices/profile');const {fixture}=require('./fixtures');
const layout=profile(fixture);
test('master brightness preserves asymmetry and auxiliary bits',()=>{
  const original=Buffer.from([200,50,99,0xf3]);const next=apply(layout,original,'dim',100/255);
  assert.deepEqual(next,Buffer.from([100,25,99,0xf3]));
});
test('power restores an intentionally zero channel as zero',()=>{
  const off=apply(layout,Buffer.from([200,0,99,0xf3]),'onoff',false);
  assert.deepEqual(apply(layout,off,'onoff',true,null,[200/255,0]),Buffer.from([200,0,99,0xf3]));
});
test('independent channel does not alter another channel',()=>{
  assert.deepEqual(apply(layout,Buffer.from([200,50,99,0xf3]),'dim',1,1),Buffer.from([200,255,99,0xf3]));
  assert.throws(()=>apply(layout,Buffer.alloc(4),'dim',1,2),/Unknown/);
});
test('generic bitfields cross byte boundaries without corrupting adjacent bits',()=>{
  const p=profile({stateLength:3,controls:[{type:'DIMMER',offset:3,length:10},{type:'TEMPERATURE',offset:13,length:8,min:2700,max:5000}]});
  const next=apply(p,Buffer.from([7,0,0xe0]),'dim',1);
  assert.equal(decode(p,next).dim,1);assert.equal(next[0]&7,7);assert.equal(next[2]&0xe0,0xe0);
});
test('CCT endpoints follow individual profile range and reject invalid values',()=>{
  assert.equal(layout.temperature.min,2200);assert.equal(layout.temperature.max,6500);
  for(const value of [0,1,0.3]) assert.ok(Math.abs(decode(layout,apply(layout,Buffer.alloc(4),'temperature',value)).temperature-value)<1/255);
  for(const value of [NaN,Infinity,-1,2,'1']) assert.throws(()=>apply(layout,Buffer.alloc(4),'temperature',value));
});
test('unsupported, overlapping and ambiguous profiles fail explicitly',()=>{
  assert.throws(()=>profile({...fixture,controls:[{type:'RGB',offset:0,length:24}]}));
  assert.throws(()=>profile({...fixture,controls:[fixture.controls[0],fixture.controls[0]]}));
  assert.throws(()=>profile({...fixture,controls:[{...fixture.controls[0],type:'ONOFF'}]}));
});
