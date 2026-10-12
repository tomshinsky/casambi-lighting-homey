'use strict';
module.exports=[{
  ignores:['.homeybuild/**','node_modules/**'],
},{
  files:['**/*.js'],
  languageOptions:{ecmaVersion:2023,sourceType:'commonjs',globals:{Buffer:'readonly',process:'readonly',setTimeout:'readonly',clearTimeout:'readonly',AbortSignal:'readonly',console:'readonly'}},
  rules:{'no-unused-vars':['error',{argsIgnorePattern:'^_',caughtErrors:'none'}],'no-undef':'error','no-unreachable':'error','no-constant-condition':['error',{checkLoops:false}],'eqeqeq':'error'},
}];
