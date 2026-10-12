'use strict';
// Entirely synthetic identifiers and keys; never derived from a real network.
const fixture={id:1,model:'Synthetic tunable light',vendor:'Test',stateLength:4,controls:[{type:'DIMMER',offset:0,length:8,readonly:false},{type:'DIMMER',offset:8,length:8,readonly:false},{type:'TEMPERATURE',offset:16,length:8,readonly:false,min:2200,max:6500},{type:'SLIDER',offset:24,length:2,readonly:false}]};
const bundle={schema:1,id:'synthetic-network',name:'Test network',keyId:1,keyHex:'01'.repeat(16),units:[{id:1,address:'000000000001',name:'Test light A',fixture},{id:2,address:'000000000002',name:'Test light B',fixture}]};
module.exports={fixture,bundle};
