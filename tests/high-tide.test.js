import test from 'node:test';
import assert from 'node:assert/strict';
import {initialState,transition as go} from '../src/game/engine.js';
import {valid,load,save} from '../src/game/save.js';
import {createFlashSelector} from '../src/ui/flash-selector.js';
function fill(){const v=[6,4,2,99];return go(initialState(),{type:'spin'},()=>v.shift());}
const gamble=(s,selected)=>go(s,{type:'gamble',selected,lower:s.shakeGame.lower},()=>{throw Error('Timing gamble must not draw randomness');});
test('higher advances by one, collect pays lower multiplier at every stage',()=>{
 for(let target=1;target<10;target++){
  let s=fill();const bank=s.balance;for(let n=1;n<target;n++)s=gamble(s,'high');
  assert.equal(s.shakeGame.lower,target);assert.equal(s.shakeGame.pot,4*target);assert.equal(s.balance,bank);assert.ok(valid(s));
  s=go(s,{type:'shake-collect'});assert.equal(s.balance,bank+4*target);assert.equal(s.shakeGame.result,'collect');assert.ok(valid(s));assert.equal(go(s,{type:'shake-collect'}),s);
 }
});
test('the lower light loses only the bonus at every level',()=>{
 for(let target=1;target<10;target++){let s=fill();const bank=s.balance;for(let n=1;n<target;n++)s=gamble(s,'high');s=gamble(s,'low');assert.equal(s.shakeGame.pot,0);assert.equal(s.balance,bank);assert.equal(s.shakeGame.result,'washout');assert.ok(valid(s));assert.equal(gamble(s,'high'),s);}
});
test('nine higher hits pay exactly ten times the starting winnings once',()=>{
 let s=fill(),bank=s.balance;for(let n=1;n<10;n++)s=gamble(s,'high');assert.equal(s.shakeGame.lower,10);assert.equal(s.shakeGame.pot,40);assert.equal(s.balance,bank+40);assert.equal(s.lastReturn,40);assert.equal(s.shakeGame.result,'complete');assert.ok(valid(s));assert.equal(gamble(s,'high'),s);assert.equal(go(s,{type:'shake-collect'}),s);
 let raw;save(s,{setItem:(_,v)=>raw=v});assert.deepEqual(load({getItem:()=>raw}).state,s);assert.equal(go(s,{type:'shake-finish'}).balance,s.balance);
});
test('invalid, duplicate and stale panel snapshots cannot advance',()=>{
 const s=fill();for(const action of [{type:'gamble'},{type:'gamble',selected:'x',lower:1},{type:'gamble',selected:'high',lower:2}])assert.equal(go(s,action),s);
 const next=gamble(s,'high');assert.equal(go(next,{type:'gamble',selected:'high',lower:1}),next);
});
test('old wheel pots migrate without resetting winnings or paying twice',()=>{
 for(const old of [
  {pot:4,step:0,ended:false,result:'ready',sector:null},
  {pot:16,step:2,ended:false,result:'win',sector:0},
  {pot:0,step:2,ended:true,result:'washout',sector:1},
  {pot:16,step:2,ended:true,result:'collect',sector:2},
  {pot:64,step:4,ended:true,result:'complete',sector:6}
 ]){
  const source={...fill(),version:3,shakeGame:old};const migrated=load({getItem:()=>JSON.stringify(source)}).state;
  assert.equal(migrated.balance,source.balance);assert.equal(migrated.shakeGame.pot,old.pot);assert.equal(migrated.shakeGame.ended,old.ended);assert.ok(valid(migrated));
  if(!old.ended){assert.equal(migrated.shakeGame.base,old.pot);assert.equal(go(migrated,{type:'shake-collect'}).balance,source.balance+old.pot);}
  else assert.equal(go(migrated,{type:'shake-collect'}),migrated);
 }
});
test('the input snapshot matches the displayed panel, including delayed frames and pause',()=>{
 let scheduled,painted;const selector=createFlashSelector(side=>painted=side,{request:fn=>{scheduled=fn;return 1;},cancel:()=>scheduled=null});
 selector.sync('round:1',1,true);assert.equal(painted,'low');assert.equal(selector.capture(),'low');scheduled(0);scheduled(224);assert.equal(selector.capture(),'low');scheduled(225);assert.equal(painted,'high');assert.equal(selector.capture(),'high');
 scheduled(5000);assert.equal(painted,'low');assert.equal(selector.capture(),'low'); // delayed paint changes once, not hidden cycles
 selector.stop();assert.equal(selector.capture(),null);selector.sync('round:1',1,true);scheduled(9000);assert.equal(painted,'low');scheduled(9225);assert.equal(painted,'high');selector.sync('round:2',2,true);assert.equal(painted,'low');
});
test('every stage is twice as fast, ending at 125 ms per option',()=>{
 for(const [i,period] of [225,212.5,200,187.5,175,162.5,150,137.5,125].entries()){
  let scheduled;const selector=createFlashSelector(()=>{},{request:fn=>{scheduled=fn;return 1;},cancel:()=>{}});
  selector.sync('stage',i+1,true);scheduled(0);scheduled(period-1);assert.equal(selector.capture(),'low');scheduled(period);assert.equal(selector.capture(),'high');scheduled(2*period-1);assert.equal(selector.capture(),'high');scheduled(2*period);assert.equal(selector.capture(),'low');selector.stop();
 }
});
