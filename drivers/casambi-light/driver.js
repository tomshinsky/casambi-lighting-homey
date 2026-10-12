'use strict';
const Homey=require('homey');
const {randomUUID}=require('node:crypto');
const {Bootstrap}=require('../../lib/casambi/bootstrap');
const {validateBundle}=require('../../lib/casambi/bundle');
const {definition}=require('../../lib/homey/device-definition');
module.exports=class LightingDriver extends Homey.Driver {
  async onPair(session) {
    await this.homey.app.ready;
    let selected=null,channels=false;const discovered=new Map();
    session.setHandler('networks',async()=>{
      const saved=this.homey.app.vault.list().map(n=>({id:`saved:${n.id}`,name:`${n.name} (saved)`}));
      const nearby=await this.homey.app.scanner.scan();
      const candidates=nearby.map((n,i)=>{const id=randomUUID();discovered.set(id,n.address);return {id,name:`${n.name} · ${i+1}`};});
      return [...saved,...candidates];
    });
    session.setHandler('authorize',async data=>{
      channels=data.channels===true;
      if(typeof data.selection==='string' && data.selection.startsWith('saved:')) {
        selected=this.homey.app.vault.get(data.selection.slice(6)).bundle.id;return {skipped:[]};
      }
      const address=discovered.get(data.selection);if(!address) throw new Error('Select a scanned device');
      if(data.consent!==true) throw new Error('Confirm one-time online authorization or use an offline export');
      const {bundle,skipped}=await new Bootstrap().authorize(address,data.password);
      await this.homey.app.replace(bundle);selected=bundle.id;return {skipped};
    });
    session.setHandler('import',async data=>{
      if(typeof data.text!=='string' || data.text.length>2e6) throw new Error('Invalid export file');
      let bundle;try{bundle=validateBundle(JSON.parse(data.text));}catch{throw new Error('Invalid or unsupported network export');}
      await this.homey.app.replace(bundle);selected=bundle.id;channels=data.channels===true;return true;
    });
    session.setHandler('list_devices',async()=>{
      if(!selected) throw new Error('Select and authorize a network first');
      const bundle=this.homey.app.vault.get(selected).bundle;
      const existing=new Set(this.getDevices().map(d=>d.getData().id));
      return bundle.units.flatMap(unit=>{
        const main=definition(bundle,unit);const items=[main];
        if(channels) {
          const {profile}=require('../../lib/devices/profile');
          if(profile(unit.fixture).dimmers.length>1) profile(unit.fixture).dimmers.forEach((c,i)=>items.push(definition(bundle,unit,i)));
        }
        return items.filter(item=>!existing.has(item.data.id));
      });
    });
  }
};
