'use strict';
const {createHash} = require('node:crypto');
const {profile} = require('../devices/profile');
const {validateBundle, normalizeAddress} = require('./bundle');
const ORIGIN = 'https://api.casambi.com';
class Bootstrap {
  constructor(request = globalThis.fetch) {this.request = request;}
  async json(path, options = {}) {
    let response;
    try {response = await this.request(ORIGIN + path, {...options, redirect: 'error', signal: AbortSignal.timeout(15000)});}
    catch {throw new Error('Casambi setup service is unreachable. You can import an authorized offline export instead.');}
    if (!response.ok) throw new Error(response.status === 404 ? 'Network not found. Check its sharing settings in Casambi; no settings were changed.' : 'Authorization or profile download failed. Check the network password and try again.');
    if (Number(response.headers.get('content-length')) > 2e6) throw new Error('Setup response too large');
    const body = await response.text();
    if (body.length > 2e6) throw new Error('Setup response too large');
    try {return JSON.parse(body);} catch {throw new Error('Invalid setup response');}
  }
  async authorize(address, password) {
    address = normalizeAddress(address);
    if (!/^[a-f0-9]{12}$/.test(address) || typeof password !== 'string' || !password || password.length > 1024) throw new Error('Select a discovered network and enter its network password');
    const found = await this.json(`/network/uuid/${address}`);
    if (typeof found.id !== 'string' || !/^[a-zA-Z0-9-]{1,128}$/.test(found.id)) throw new Error('Invalid network response');
    const session = await this.json(`/network/${found.id}/session`, {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({password, deviceName: 'Independent lighting integration'})});
    password = null; // Password/session are never persisted or logged.
    if (typeof session.session !== 'string') throw new Error('Invalid authorization response');
    const result = await this.json(`/network/${found.id}/`, {method: 'PUT', headers: {'Content-Type':'application/json', 'X-Casambi-Session':session.session}, body: JSON.stringify({formatVersion:1, deviceName:'Independent lighting integration', revision:0})});
    const network = result.network;
    if (!network || !Array.isArray(network.units) || network.units.length > 255) throw new Error('Missing network inventory');
    const keys = network.keyStore?.keys;
    if (!Array.isArray(keys) || !keys.length) throw new Error('This network does not expose an Evolution key; Classic is not supported');
    const key = [...keys].sort((a,b) => b.role - a.role)[0];
    const fixtures = new Map(), units = [], skipped = [];
    for (const unit of network.units) {
      if (!Number.isInteger(unit.type) || unit.type < 0) {skipped.push('Unknown fixture'); continue;}
      if (!fixtures.has(unit.type)) fixtures.set(unit.type, await this.json(`/fixture/${unit.type}`));
      const fixture = fixtures.get(unit.type);
      try {profile(fixture);} catch {skipped.push(String(unit.name || 'Unsupported fixture')); continue;}
      units.push({id:unit.deviceID, address:unit.address, name:String(unit.name || fixture.model || 'Casambi light'), fixture});
    }
    const bundle = validateBundle({schema:1, id:createHash('sha256').update(found.id).digest('hex'), name:String(network.name || 'Casambi network'), keyId:Number(key.id), keyHex:key.key, units});
    return {bundle, skipped};
  }
}
module.exports = {Bootstrap};
