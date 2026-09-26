import test from 'node:test';
import assert from 'node:assert/strict';
import {initialState,transition as go} from '../src/game/engine.js';
import {NUMBER_STRIPS,numbersAt,STRIPS,SAVE_KEY} from '../src/game/config.js';
import {valid,load,save} from '../src/game/save.js';
const draws=(...values)=>n=>{const v=values.shift();assert.ok(v!==undefined&&v>=0&&v<n,'Unexpected draw '+v+' / '+n);return v;};
const spin=(s,indices,held=false)=>go(s,{type:'spin'},draws(...indices,held?0:99,held?0:99,99));
const fill=()=>spin(initialState(),[6,4,2]);
test('numbers include blank, 1, 2 and 3 attached to every reel stop',()=>{assert.ok(NUMBER_STRIPS.every(a=>a.length===20));for(const strip of NUMBER_STRIPS)assert.deepEqual([0,1,2,3].map(n=>strip.filter(v=>v===n).length),[8,5,4,3]);assert.deepEqual(numbersAt([6,4,2]),[3,3,3]);});
test('Shakedown held probability threshold is exactly 25 out of 100',()=>{for(const [roll,held] of [[0,true],[24,true],[25,false],[99,false]]){const s=go(initialState(),{type:'spin'},draws(1,0,0,99,roll));assert.equal(s.shake.held,held);}});
test('a fresh paid spin resets previous letters unless Shakedown held',()=>{
 let s=spin(initialState(),[3,1,4]);assert.equal(s.shake.count,6);assert.equal(s.shake.held,false);
 s=spin(s,[1,0,0]);assert.equal(s.shake.count,1);assert.equal(s.shake.base,0);
 s=spin(s,[0,0,0]);assert.equal(s.shake.count,0);assert.equal(s.shake.held,false);
});
test('held sign adds the next spin, can chain and does not persist forever',()=>{
 let s=spin(initialState(),[3,1,4],true);assert.equal(s.shake.count,6);assert.equal(s.shake.held,true);
 // Skip any independent reel hold; this must not clear the Shakedown hold.
 if(s.phase==='hold')s=go(s,{type:'skip'});
 s=spin(s,[1,0,0],true);assert.equal(s.shake.count,7);assert.equal(s.shake.held,true);
 if(s.phase==='hold')s=go(s,{type:'skip'});
 s=spin(s,[1,0,0]);assert.equal(s.shake.count,8);assert.equal(s.shake.held,false);
 s=spin(s,[0,0,0]);assert.equal(s.shake.count,0);
});
test('holding reels retains their numbers and counts them on next paid spin',()=>{
 let s=initialState();s.phase='hold';s.indices=[6,4,0];s.held=[true,true,false];
 s=go(s,{type:'spin'},draws(2));assert.equal(s.shake.count,9);assert.equal(s.phase,'shakedown');assert.deepEqual(s.indices,[6,4,2]);
});
test('nudges replace the total, rather than repeatedly adding old numbers',()=>{
 let s=initialState();s.indices=[1,0,0];s.phase='nudge';s.nudges=2;s.shake={count:3,base:2,total:1,held:true,pending:false};
 s=go(s,{type:'nudge',reel:0});assert.equal(s.shake.count,2);assert.equal(s.shake.total,0);
 s=go(s,{type:'nudge',reel:0});assert.equal(s.shake.count,4);assert.equal(s.shake.total,2);
});
test('nudge can complete the sign; excess letters are capped',()=>{
 let s=initialState();s.indices=[5,4,2];s.phase='nudge';s.nudges=2;s.shake={count:6,base:0,total:6,held:false,pending:false};s=go(s,{type:'nudge',reel:0});assert.equal(s.phase,'shakedown');assert.equal(s.nudges,0);
 s=initialState();s.shake={count:8,base:0,total:8,held:true,pending:false};s=spin(s,[6,4,2]);assert.equal(s.shake.count,9);assert.equal(s.shake.held,false);
});
test('nine letters give 2x pot, collect credits once, finish clears sign',()=>{
 let s=fill();assert.equal(s.phase,'shakedown');assert.equal(s.shakeGame.pot,4);const bank=s.balance;
 s=go(s,{type:'shake-collect'});assert.equal(s.balance,bank+4);assert.equal(go(s,{type:'shake-collect'}),s);assert.equal(go(s,{type:'gamble'}),s);
 s=go(s,{type:'shake-finish'});assert.equal(s.phase,'idle');assert.equal(s.shake.count,0);assert.equal(s.shakeGame,null);
});
test('all eight wheel segments have exact 50/50 outcomes and protect bank',()=>{
 for(let sector=0;sector<8;sector++){let s=fill();const bank=s.balance;s=go(s,{type:'gamble'},draws(sector));assert.equal(s.balance,bank);assert.equal(s.shakeGame.pot,sector%2?0:8);assert.equal(s.shakeGame.ended,!!(sector%2));assert.ok(valid(s));}
});
test('four wins auto bank 32x; washout after wins loses only bonus',()=>{
 let s=fill(),bank=s.balance;for(let i=0;i<4;i++)s=go(s,{type:'gamble'},draws(0));assert.equal(s.balance,bank+64);assert.equal(s.shakeGame.result,'complete');assert.equal(go(s,{type:'gamble'}),s);assert.ok(valid(s));
 s=fill();bank=s.balance;s=go(s,{type:'gamble'},draws(2));s=go(s,{type:'gamble'},draws(7));assert.equal(s.balance,bank);assert.equal(s.shakeGame.pot,0);
});
test('simultaneous gull and Shakedown rewards queue without losing either',()=>{
 let s=initialState();s.shake={count:6,base:0,total:6,held:true,pending:false};
 s=go(s,{type:'spin'},draws(7,4,6,0,0,0,0));assert.equal(s.phase,'bonus');assert.equal(s.shake.pending,true);assert.equal(s.balance,268);
 s=go(s,{type:'pick',index:s.bonus.deck.indexOf(0)});s=go(s,{type:'finish'});assert.equal(s.phase,'shakedown');assert.equal(s.balance,268);assert.equal(s.shakeGame.pot,4);assert.equal(s.bonus,null);assert.ok(valid(s));
});
test('stake changes and refills clear carried letters; bonus stake stays fixed',()=>{
 let s=initialState();s.shake={count:7,base:0,total:7,held:true,pending:false};s=go(s,{type:'stake'});assert.equal(s.shake.count,0);
 s.balance=0;s.shake={count:7,base:0,total:7,held:true,pending:false};s=go(s,{type:'refill'});assert.equal(s.shake.count,0);
 s=fill();assert.equal(go(s,{type:'stake'}),s);assert.equal(go(s,{type:'refill'}),s);assert.equal(go(s,{type:'spin'}),s);
});
test('v1 saves migrate balances, preferences and pending gull games',()=>{
 let s=initialState();s.version=1;s.balance=123;s.sound=false;delete s.shake;delete s.shakeGame;
 const loaded=load({getItem:()=>JSON.stringify(s)});assert.equal(loaded.state.balance,124);assert.equal(loaded.state.version,3);assert.equal(loaded.state.sound,false);assert.equal(loaded.state.shake.count,0);assert.ok(valid(loaded.state));
 s=go(initialState(),{type:'spin'},draws(7,4,6,0,0,0,0,99));s.version=1;delete s.shake;delete s.shakeGame;const migrated=load({getItem:()=>JSON.stringify(s)}).state;assert.equal(migrated.phase,'bonus');assert.deepEqual(migrated.bonus,s.bonus);assert.equal(migrated.balance,268);
});
test('held progress and each resolved gamble survive reload without reroll or duplicate credit',()=>{
 let raw;const storage={getItem:()=>raw,setItem:(_,v)=>raw=v};let s=fill();
 for(const type of ['gamble','gamble','shake-collect']){s=go(s,{type},draws(0));save(s,storage);const r=load(storage).state;assert.deepEqual(r,s);assert.ok(valid(r));}
 const bad=structuredClone(s);bad.shakeGame.pot+=2;assert.equal(valid(bad),false);bad.shakeGame=s.shakeGame;bad.shake.count=10;assert.equal(valid(bad),false);
 s=spin(initialState(),[3,1,4],true);save(s,storage);assert.deepEqual(load(storage).state,s);
});
