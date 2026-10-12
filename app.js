'use strict';
const Homey = require('homey');
const {Vault} = require('./lib/homey/vault');
const {Network} = require('./lib/casambi/network');
const {Scanner} = require('./lib/ble/scanner');
const {safeEvent} = require('./lib/utils/logger');
module.exports = class LightingApp extends Homey.App {
  async onInit() {
    this.registryTail=Promise.resolve();this.stopping=false;
    this.networks=new Map();this.references=new Map();this.vault=new Vault();
    this.ready=this.vault.load();await this.ready;
    this.scanner=new Scanner(this.homey.ble);
    this.homey.flow.getActionCard('set_channel').registerRunListener(({device,channel,brightness})=>device.control('dim',brightness/100,Number(channel)-1));
    this.homey.flow.getActionCard('set_kelvin').registerRunListener(({device,kelvin})=>{
      const c=device.layout.temperature;
      if(!c || !Number.isFinite(kelvin) || kelvin<c.min || kelvin>c.max) throw new Error(c?`Use ${c.min}–${c.max} K`:'This light has no colour-temperature control');
      return device.control('temperature',1-(kelvin-c.min)/(c.max-c.min));
    });
  }
  record(event,fields) {
    const sanitized=safeEvent(event,fields);this.log(JSON.stringify(sanitized));
    this.history=[...(this.history || []),sanitized].slice(-30);
    this.homey.settings.set('diagnostics',this.history);
  }
  serial(operation) {
    const task=this.registryTail.then(operation);this.registryTail=task.catch(()=>{});return task;
  }
  acquire(id,reference) {return this.serial(()=>this.acquireLocked(id,reference));}
  async acquireLocked(id,reference) {
    if(this.stopping) throw new Error('Application is stopping');
    await this.ready;
    if(!this.networks.has(id)) {
      const entry=this.vault.get(id);
      const network=new Network(this.homey.ble,entry.bundle,{memory:entry.memory,log:(event,fields)=>this.record(event,fields),saveMemory:memory=>{
        this.vault.get(id).memory=memory;
        clearTimeout(this.saveTimer);this.saveTimer=setTimeout(()=>this.vault.save().catch(()=>this.record('storage_failed')),500);
      }});
      this.networks.set(id,network);this.references.set(id,new Set());
    }
    this.references.get(id).add(reference);
    const network=this.networks.get(id);
    // Device initialization returns before notification-driven work starts.
    this.homey.setTimeout(()=>{if(this.networks.get(id)===network && this.references.get(id)?.size) network.start();},100);
    return network;
  }
  release(id,reference) {return this.serial(()=>this.releaseLocked(id,reference));}
  async releaseLocked(id,reference) {
    const refs=this.references.get(id);refs?.delete(reference);
    if(refs && !refs.size) {await this.networks.get(id)?.stop();this.networks.delete(id);this.references.delete(id);}
  }
  replace(bundle) {return this.serial(()=>this.replaceLocked(bundle));}
  async replaceLocked(bundle) {
    const active=this.networks.get(bundle.id);
    if(active) await active.reconfigure(bundle);
    await this.vault.put(bundle);
  }
  async onUninit() {this.stopping=true;clearTimeout(this.saveTimer);await this.serial(async()=>{await Promise.all([...this.networks.values()].map(n=>n.stop()));await this.vault.save();});}
};
