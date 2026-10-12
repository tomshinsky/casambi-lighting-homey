'use strict';
const ALLOWED = new Set(['DIMMER', 'TEMPERATURE', 'ONOFF', 'SLIDER']);
function profile(fixture) {
  if (!fixture || !Number.isInteger(fixture.stateLength) || fixture.stateLength < 1 || fixture.stateLength > 16 || !Array.isArray(fixture.controls)) throw new Error('Unsupported fixture layout');
  const controls = fixture.controls.map(c => ({...c, type: String(c.type).toUpperCase()}));
  const used = new Set();
  for (const c of controls) {
    if (!ALLOWED.has(c.type) || !Number.isInteger(c.offset) || !Number.isInteger(c.length) || c.offset < 0 || c.length < 1 || c.length > 16 || c.offset + c.length > fixture.stateLength * 8) throw new Error('Unsupported fixture control');
    for (let bit = c.offset; bit < c.offset + c.length; bit++) {
      if (used.has(bit)) throw new Error('Overlapping fixture controls');
      used.add(bit);
    }
  }
  const dimmers = controls.filter(c => c.type === 'DIMMER' && !c.readonly);
  const temperatures = controls.filter(c => c.type === 'TEMPERATURE' && !c.readonly);
  const powers = controls.filter(c => c.type === 'ONOFF' && !c.readonly);
  if (!dimmers.length || dimmers.length > 8 || temperatures.length > 1 || powers.length > 1) throw new Error('Unsupported lighting profile');
  const temperature = temperatures[0];
  if (temperature && (!Number.isFinite(temperature.min) || !Number.isFinite(temperature.max) || temperature.min < 1000 || temperature.max > 20000 || temperature.min >= temperature.max)) throw new Error('Unknown temperature range');
  return {stateLength: fixture.stateLength, dimmers, temperature, power: powers[0]};
}
function readBits(state, control) {
  let value = 0;
  for (let i = 0; i < control.length; i++) {const bit = control.offset + i; value += ((state[bit >> 3] >> (bit % 8)) & 1) * 2 ** i;}
  return value;
}
function writeBits(state, control, value) {
  for (let i = 0; i < control.length; i++) {
    const bit = control.offset + i, mask = 1 << (bit % 8);
    state[bit >> 3] = (state[bit >> 3] & ~mask) | (((value >> i) & 1) << (bit % 8));
  }
}
function checkState(layout, state) {if (!Buffer.isBuffer(state) || state.length !== layout.stateLength) throw new Error('Fixture state length changed');}
function decode(layout, state) {
  checkState(layout, state);
  const channels = layout.dimmers.map(c => readBits(state, c) / (2 ** c.length - 1));
  const on = channels.some(v => v > 0) && (!layout.power || readBits(state, layout.power) > 0);
  const result = {onoff: on, dim: Math.max(...channels), channels};
  if (layout.temperature) result.temperature = 1 - readBits(state, layout.temperature) / (2 ** layout.temperature.length - 1);
  return result;
}
function normalized(value) {if (!Number.isFinite(value) || value < 0 || value > 1) throw new Error('Brightness/temperature must be between 0 and 1'); return value;}
function apply(layout, state, action, value, channel = null, remembered = []) {
  checkState(layout, state);
  const next = Buffer.from(state), current = decode(layout, state);
  if (channel !== null && (!Number.isInteger(channel) || channel < 0 || channel >= layout.dimmers.length)) throw new Error('Unknown channel');
  const indices = channel === null ? layout.dimmers.map((_, i) => i) : [channel];
  let levels = current.channels.slice();
  if (action === 'onoff') {
    if (typeof value !== 'boolean') throw new Error('Expected a power value');
    for (const i of indices) levels[i] = value ? (levels[i] || remembered[i] || 0.64) : 0;
    if (channel === null && value) levels = current.channels.some(v => v > 0) ? current.channels : (remembered.some(v => v > 0) ? remembered.slice() : levels);
  } else if (action === 'dim') {
    normalized(value);
    if (channel !== null) levels[channel] = value;
    else {
      const base = current.channels.some(v => v > 0) ? current.channels : (remembered.some(v => v > 0) ? remembered : levels.map(() => 1));
      const peak = Math.max(...base);
      levels = base.map(v => v * value / peak);
    }
  } else if (action === 'temperature') {
    if (!layout.temperature) throw new Error('This fixture has no colour-temperature control');
    const c = layout.temperature; writeBits(next, c, Math.round((1 - normalized(value)) * (2 ** c.length - 1)));
    return next;
  } else throw new Error('Unsupported lighting command');
  layout.dimmers.forEach((c, i) => writeBits(next, c, Math.round(normalized(levels[i]) * (2 ** c.length - 1))));
  if (layout.power) writeBits(next, layout.power, levels.some(v => v > 0) ? 1 : 0);
  return next;
}
module.exports = {profile, decode, apply, readBits, writeBits};
