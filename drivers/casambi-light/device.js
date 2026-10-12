'use strict';
const Homey=require('homey');
const {profile}=require('../../lib/devices/profile');
module.exports=class LightingDevice extends Homey.Device {
  async onInit() {
    this.stopping=false;this.tail=Promise.resolve();this.lastAvailable=null;
    await this.homey.app.ready;
    const data=this.getData();
    const bundle=this.homey.app.vault.get(data.networkId).bundle;
    const unit=bundle.units.find(u=>u.id===data.unitId);if(!unit) {await this.setUnavailable('Unit no longer exists in the saved network');return;}
    this.layout=profile(unit.fixture);this.channel=data.channel??null;
    this.network=await this.homey.app.acquire(data.networkId,this);
    this.listener=(id,status)=>{if(id===data.unitId) this.enqueue(status);};
    this.network.on('state',this.listener);
    this.registerCapabilityListener('onoff',v=>this.control('onoff',v));
    this.registerCapabilityListener('dim',v=>this.control('dim',v));
    if(this.hasCapability('light_temperature')) this.registerCapabilityListener('light_temperature',v=>this.control('temperature',v));
    if(this.channel===null) this.layout.dimmers.forEach((c,i)=>{
      if(this.hasCapability(`dim.channel${i+1}`)) this.registerCapabilityListener(`dim.channel${i+1}`,v=>this.control('dim',v,i));
    });
    this.registerCapabilityListener('button.reconnect',()=>this.network.reconnect());
    await this.setUnavailable('Waiting for confirmed Bluetooth state');
    this.enqueue(this.network.status(data.unitId));
  }
  enqueue(status) {this.tail=this.tail.then(()=>this.publish(status)).catch(()=>this.homey.app.record('device_update_failed'));}
  async publish(status) {
    if(this.stopping) return;
    const available=status.available===true;
    if(available) {
      const v=status.values,values={onoff:this.channel===null?v.onoff:(v.onoff&&v.channels[this.channel]>0),dim:this.channel===null?v.dim:v.channels[this.channel]};
      if(this.layout.temperature) values.light_temperature=v.temperature;
      if(this.channel===null) v.channels.forEach((value,i)=>{if(this.hasCapability(`dim.channel${i+1}`)) values[`dim.channel${i+1}`]=value;});
      for(const [cap,value] of Object.entries(values)) if(this.getCapabilityValue(cap)!==value) await this.setCapabilityValue(cap,value);
      await this.setAvailable();
    } else await this.setUnavailable(status.quality==='stale'?'State is stale; refreshing Bluetooth connection':'Bluetooth unavailable; reconnecting');
    if(this.lastAvailable!==null && this.lastAvailable!==available) await this.homey.flow.getDeviceTriggerCard(available?'became_available':'became_unavailable').trigger(this).catch(()=>this.homey.app.record('availability_flow_failed'));
    this.lastAvailable=available;
  }
  async control(action,value,channel=this.channel) {if(!this.network) throw new Error('Device is not ready');await this.network.set(this.getData().unitId,action,value,channel);await this.tail;return true;}
  async shutdown() {if(this.stopping)return;this.stopping=true;this.network?.off('state',this.listener);await this.homey.app.release(this.getData().networkId,this);}
  async onDeleted() {await this.shutdown();}
  async onUninit() {await this.shutdown();}
};
