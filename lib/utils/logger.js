'use strict';
function safeEvent(event,fields={}) {
  const result={event,at:new Date().toISOString()};
  if(typeof fields.phase==='string' && /^[a-z_0-9]+$/.test(fields.phase)) result.phase=fields.phase;
  return result;
}
module.exports={safeEvent};
