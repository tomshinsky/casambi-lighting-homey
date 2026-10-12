'use strict';
const {normalizeAddress} = require('../casambi/bundle');
const SERVICE = '0000fe4d00001000800000805f9b34fb';
class Scanner {
  constructor(ble) {this.ble=ble; this.last=0; this.result=[];}
  async scan() {
    if (Date.now()-this.last<15000) return this.result;
    if (this.pending) return this.pending;
    this.pending=this.ble.discover([SERVICE]).then(advertisements => {
      this.last=Date.now();
      this.result=advertisements.filter(a=>/^[a-f0-9]{12}$/.test(normalizeAddress(a.address))).map(a=>({address:normalizeAddress(a.address),name:String(a.localName || 'Casambi device').slice(0,100)}));
      return this.result;
    }).finally(()=>{this.pending=null;});
    return this.pending;
  }
}
module.exports={Scanner};
