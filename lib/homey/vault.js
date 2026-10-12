'use strict';
const fs = require('node:fs/promises');
const path = require('node:path');
const {validateBundle} = require('../casambi/bundle');
class Vault {
  constructor(directory='/userdata/casambi') {this.directory=directory;this.file=path.join(directory,'networks.json');this.entries={};this.tail=Promise.resolve();}
  async load() {
    await fs.mkdir(this.directory,{recursive:true,mode:0o700});
    let entries;
    try {entries=JSON.parse(await fs.readFile(this.file,'utf8'));}
    catch(error) {if(error.code==='ENOENT') return;throw new Error('Stored network configuration cannot be read');}
    for(const [id,entry] of Object.entries(entries)) {
      const bundle=validateBundle(entry.bundle);
      if(id!==bundle.id) throw new Error('Stored network configuration is inconsistent');
      this.entries[id]={bundle,memory:entry.memory || {}};
    }
  }
  get(id) {const entry=this.entries[id];if(!entry) throw new Error('Network authorization is missing; repair this device');return entry;}
  list() {return Object.values(this.entries).map(({bundle})=>({id:bundle.id,name:bundle.name}));}
  async put(bundle) {bundle=validateBundle(bundle);this.entries[bundle.id]={bundle,memory:this.entries[bundle.id]?.memory || {}};await this.save();}
  async save() {
    const snapshot=JSON.stringify(this.entries);
    const operation=this.tail.then(async()=>{await fs.writeFile(this.file+'.tmp',snapshot,{mode:0o600});await fs.rename(this.file+'.tmp',this.file);await fs.chmod(this.file,0o600);});
    this.tail=operation.catch(()=>{});return operation;
  }
}
module.exports={Vault};
