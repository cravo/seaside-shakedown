import test from 'node:test';
import assert from 'node:assert/strict';
import {initialState,transition} from '../src/game/engine.js';
import {payoutUnits} from '../src/game/evaluate.js';
import {STRIPS,STAKES} from '../src/game/config.js';
import {load,save,valid} from '../src/game/save.js';
const cherry=[... 'CLL'].map((s,r)=>STRIPS[r].indexOf(s));
test('every possible line award is a whole credit at every stake',()=>{
 for(const [index,stake] of STAKES.entries()){let total=0;for(let a=0;a<20;a++)for(let b=0;b<20;b++)for(let c=0;c<20;c++){const award=payoutUnits([a,b,c],stake);assert.equal(award%2,0);total+=award;}assert.equal(total/8000/stake,[.671125,.591125,.607125][index]);}
});
test('single cherries pay 1, 1, 3 credits on spins and nudges; break-even is labelled honestly',()=>{
 for(const [stake,award] of [[2,2],[4,2],[10,6]]){
  const s={...initialState(),stake,roundStake:stake};let draws=[...cherry,99];
  const spin=transition(s,{type:'spin'},()=>draws.shift());
  assert.equal(spin.balance,200-stake+award);assert.equal(spin.lastReturn,award);assert.equal(spin.message,stake===2?'refund':'partial');
  const nudge=transition({...s,phase:'nudge',nudges:2,indices:[19,cherry[1],cherry[2]]},{type:'nudge',reel:0},()=>99);
  assert.equal(nudge.balance,200+award);assert.equal(nudge.lastReturn,award);assert.equal(nudge.nudges,0);assert.ok(valid(nudge));
 }
});
test('v2 half credits round upward exactly once, preserving active features and preferences',()=>{
 const fixtures=[initialState(),{...initialState(),phase:'hold',held:[true,false,false]},transition(initialState(),{type:'spin'},(()=>{const v=[6,4,2,99];return ()=>v.shift();})())];
 for(const fixture of fixtures){
  const old={...fixture,version:2,balance:321,lastReturn:1,sound:false,motion:true};let raw=JSON.stringify(old);
  const storage={getItem:()=>raw,setItem:(_,v)=>raw=v};const first=load(storage).state;
  assert.equal(first.balance,322);assert.equal(first.lastReturn,2);assert.equal(first.version,3);assert.equal(first.phase,old.phase);assert.deepEqual(first.shakeGame,old.shakeGame);assert.deepEqual(first.held,old.held);assert.equal(first.sound,false);assert.equal(first.motion,true);
  assert.ok(save(first,storage));assert.deepEqual(load(storage).state,first);
 }
});
test('current saves reject half credits; malformed old balances do not get rounded into validity',()=>{
 assert.equal(valid({...initialState(),balance:201}),false);assert.equal(valid({...initialState(),lastReturn:1}),false);
 for(const balance of [-1,1.5,'201',null])assert.ok(load({getItem:()=>JSON.stringify({...initialState(),version:2,balance})}).notice);
});
