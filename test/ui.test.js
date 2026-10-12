'use strict';
const test=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const vm=require('node:vm');
test('pairing view inline script parses and renders service text without HTML injection',()=>{
  const html=fs.readFileSync(require.resolve('../drivers/casambi-light/pair/setup.html'),'utf8');
  const script=html.match(/<script>([\s\S]*?)<\/script>/)[1];
  assert.doesNotThrow(()=>new vm.Script(script));
  assert.ok(!script.includes('innerHTML'));assert.ok(script.includes('textContent'));assert.ok(html.includes('type="password"'));
});
