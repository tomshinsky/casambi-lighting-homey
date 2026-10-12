'use strict';
const {profile} = require('../devices/profile');
function definition(bundle,unit,channel=null) {
  const layout=profile(unit.fixture);
  const capabilities=['onoff','dim'];const capabilitiesOptions={};
  if(layout.temperature) capabilities.push('light_temperature');
  if(channel===null && layout.dimmers.length>1) {
    layout.dimmers.forEach((c,i)=>{const name=`dim.channel${i+1}`;capabilities.push(name);capabilitiesOptions[name]={title:{en:`Channel ${i+1}`}};});
  }
  capabilities.push('button.reconnect');
  return {name:channel===null?unit.name:`${unit.name} · Channel ${channel+1}`,data:{id:`${bundle.id}:${unit.id}:${channel===null?'all':channel}`,networkId:bundle.id,unitId:unit.id,channel},capabilities,capabilitiesOptions};
}
module.exports={definition};
