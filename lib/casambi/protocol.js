'use strict';
// Modified JavaScript protocol adaptation of lkempf/casambi-bt (Apache-2.0).
// See NOTICE for attribution, pinned source and project-specific changes.
function decodeStates(plain) {
  if (plain[0] !== 6) return [];
  const states = [];
  let pos = 1;
  while (pos < plain.length) {
    if (pos + 3 > plain.length) throw new Error('Truncated state header');
    const id = plain[pos], flags = plain[pos + 1], length = (plain[pos + 2] >> 4) + 1;
    pos += 3;
    for (const flag of [4, 8, 16]) if (flags & flag) pos++;
    const end = pos + length, padded = end + ((flags >> 6) & 3);
    if (padded > plain.length) throw new Error('Truncated state payload');
    states.push({id, online: Boolean(flags & 2), on: Boolean(flags & 1), state: Buffer.from(plain.subarray(pos, end))});
    pos = padded;
  }
  return states;
}
function operation(unitId, origin, state) {
  if (!Number.isInteger(unitId) || unitId < 1 || unitId > 255) throw new Error('Invalid unit ID');
  if (!Buffer.isBuffer(state) || state.length < 1 || state.length > 16) throw new Error('Invalid state length');
  const header = Buffer.alloc(9);
  header.writeUInt16BE((5 << 11) | state.length, 0);
  header[2] = 48; // SetState, not a broadcast or topology operation.
  header.writeUInt16BE(origin & 0xffff, 3);
  header.writeUInt16BE(0x100 | unitId, 5);
  return Buffer.concat([header, state]);
}
module.exports = {decodeStates, operation};
