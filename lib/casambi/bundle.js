'use strict';
const {profile} = require('../devices/profile');
const normalizeAddress = value => String(value).replace(/[:-]/g, '').toLowerCase();
function validateBundle(value) {
  if (!value || value.schema !== 1 || !/^[a-zA-Z0-9_-]{8,80}$/.test(value.id) || typeof value.name !== 'string' || value.name.length > 100) throw new Error('Invalid network export');
  if (!Number.isInteger(value.keyId) || value.keyId < 0 || value.keyId > 255 || typeof value.keyHex !== 'string' || !/^(?:[a-f0-9]{32}|[a-f0-9]{64})$/i.test(value.keyHex)) throw new Error('Invalid network credentials');
  if (!Array.isArray(value.units) || !value.units.length || value.units.length > 255) throw new Error('Invalid network units');
  if (!Array.isArray(value.proxies)) throw new Error('Missing verified Bluetooth proxies');
  const proxies = value.proxies.map(normalizeAddress);
  if (!proxies.length || proxies.length > 32 || proxies.some(p => !/^[a-f0-9]{12}$/.test(p))) throw new Error('Missing verified Bluetooth proxies');
  const ids = new Set();
  const units = value.units.map(unit => {
    if (!Number.isInteger(unit.id) || unit.id < 1 || unit.id > 255 || ids.has(unit.id) || typeof unit.name !== 'string' || unit.name.length > 100) throw new Error('Invalid network unit');
    ids.add(unit.id); profile(unit.fixture);
    return {id: unit.id, name: unit.name, fixture: unit.fixture};
  });
  return {schema: 1, id: value.id, name: value.name, keyId: value.keyId, keyHex: value.keyHex, proxies: [...new Set(proxies)], units};
}
module.exports = {validateBundle, normalizeAddress};
