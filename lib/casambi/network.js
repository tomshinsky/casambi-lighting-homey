'use strict';
const {EventEmitter} = require('node:events');
const {Session} = require('../ble/connection');
const {profile, decode, apply} = require('../devices/profile');
class Network extends EventEmitter {
  constructor(ble, bundle, options = {}) {
    super(); this.ble=ble; this.bundle=bundle; this.Session=options.Session || Session;
    this.log=options.log || (()=>{}); this.saveMemory=options.saveMemory || (()=>{});
    this.memory=options.memory || {}; this.clock=options.clock || (()=>Date.now());
    this.delay=options.retryDelay || 2000; this.staleMs=options.staleMs || 300000;
    this.layouts=new Map(bundle.units.map(u=>[u.id,profile(u.fixture)]));
    this.states=new Map(); this.tail=Promise.resolve(); this.running=false;
  }
  start() {if (!this.running) {this.running=true; this.task=this.run();}}
  status(id) {return this.states.get(id) || {available:false,quality:'unavailable'};}
  accept(record) {
    const layout=this.layouts.get(record.id); if (!layout) return;
    const values=decode(layout,record.state);
    const status={...record,values,receivedAt:this.clock(),available:record.online,quality:record.online?'confirmed':'unavailable'};
    this.states.set(record.id,status);
    if (record.online && values.channels.some(v=>v>0)) {
      this.memory[record.id]=values.channels.slice();
      this.saveMemory(this.memory);
    }
    this.emit('state',record.id,status);
  }
  unavailable(quality='unavailable') {
    for (const unit of this.bundle.units) {
      const previous=this.status(unit.id);
      const current={...previous,available:false,quality};
      this.states.set(unit.id,current); this.emit('state',unit.id,current);
    }
    this.emit('offline');
  }
  async run() {
    let backoff=this.delay, proxy=0;
    while (this.running) {
      const candidate=this.bundle.units[proxy++ % this.bundle.units.length];
      const session=new this.Session(this.ble,this.bundle.keyId,Buffer.from(this.bundle.keyHex,'hex'),this.log,candidate.address);
      this.session=session; let received=false;
      try {
        await session.connect();
        const connectedAt=this.clock();
        while (this.running && !session.closed && !session.disconnected && session.peripheral.isConnected) {
          try {
            for (const state of await session.states()) {this.accept(state); received=true; backoff=this.delay;}
          } catch (error) {if (!error.message.startsWith('Timeout:')) throw error;}
          const now=this.clock();
          for (const unit of this.bundle.units) {
            const state=this.status(unit.id);
            if (state.available && now-state.receivedAt>this.staleMs) {
              this.states.set(unit.id,{...state,available:false,quality:'stale'});
              this.emit('state',unit.id,this.status(unit.id));
            }
          }
          // Casambi does not provide a verified read-state opcode here. A quiet
          // connection is renewed at a bounded interval to get a fresh snapshot.
          if ((!received && now-connectedAt>20000) || now-connectedAt>this.staleMs) break;
        }
      } catch {this.log('connection_failed',{phase:session.phase});}
      finally {this.unavailable(); await session.close();}
      if (this.running) {
        await new Promise(resolve=>{this.wake=resolve; this.timer=setTimeout(resolve,backoff);});
        this.wake=null; backoff=Math.min(backoff*2,60000);
      }
    }
  }
  set(id,action,value,channel=null) {
    const job=this.tail.then(()=>this.command(id,action,value,channel));
    this.tail=job.catch(()=>{}); return job;
  }
  async command(id,action,value,channel) {
    const current=this.status(id), layout=this.layouts.get(id);
    if (!this.running || !layout || !current.available || current.quality!=='confirmed' || this.clock()-current.receivedAt>this.staleMs) throw new Error('Light state is unavailable or stale; waiting for Bluetooth');
    const desired=apply(layout,current.state,action,value,channel,this.memory[id] || []);
    if (desired.equals(current.state)) return;
    const session=this.session;
    let resolve,reject;
    const confirmation=new Promise((yes,no)=>{resolve=yes;reject=no;}); confirmation.catch(()=>{});
    const onState=(unitId,state)=>{if(unitId===id) {if(!state.available) reject(new Error('Light became unavailable')); else if(state.state.equals(desired)) resolve();}};
    const offline=()=>reject(new Error('Bluetooth connection lost before confirmation'));
    this.on('state',onState); this.on('offline',offline);
    const timer=setTimeout(()=>reject(new Error('Light did not confirm the requested state')),8000);
    try {await session.sendState(id,desired); await confirmation;}
    catch(error) {this.unavailable(); await session.close(); throw error;}
    finally {clearTimeout(timer);this.off('state',onState);this.off('offline',offline);}
  }
  async reconnect() {this.unavailable();await this.session?.close();}
  async stop() {this.running=false;clearTimeout(this.timer);this.wake?.();this.unavailable();await this.session?.close();await this.task;}
}
module.exports={Network};
