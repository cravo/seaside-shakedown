import test from 'node:test';
import assert from 'node:assert/strict';
import {initialState,transition as go} from '../src/game/engine.js';
import {STRIPS,PAYOUTS,STAKES} from '../src/game/config.js';
import {evaluate} from '../src/game/evaluate.js';
import {randomInt,seeded} from '../src/game/random.js';
import {valid,load,save} from '../src/game/save.js';
const indices=s=>[...s].map((v,r)=>STRIPS[r].indexOf(v));
const rng=(...values)=>n=>{assert.ok(values.length,'unexpected draw');const v=values.shift();assert.ok(v>=0&&v<n,'scripted draw outside range');return v;};
const spin=(s,symbols,roll=99)=>go(s,{type:'spin'},rng(...indices(symbols),...(symbols==='GGG'?[0,0,0,0]:[roll]),99));
test('all paytable entries, stakes and cherry precedence',()=>{
 for(const stake of STAKES)for(const [sym,p] of Object.entries(PAYOUTS)){let s=initialState();s.stake=stake;s=spin(s,sym.repeat(3));assert.equal(s.balance,200-stake+p*stake);assert.equal(s.lastReturn,p*stake);assert.equal(valid(s),true);}
 for(const [str,p] of [['CLL',.5],['CLC',.5],['CCL',2],['LCC',0],['LCL',0]])assert.equal(evaluate(indices(str)).multiplier,p);
});
test('base full enumeration and strips',()=>{let sum=0,hits=0;for(let a=0;a<20;a++)for(let b=0;b<20;b++)for(let c=0;c<20;c++){const p=evaluate([a,b,c]).multiplier;sum+=p;if(p)hits++;}assert.equal(sum/8000,.591125);assert.equal(hits/8000,.21775);assert.ok(STRIPS.every(s=>s.length===20));});
test('random integer rejects bias tail and invalid ranges',()=>{let i=0;assert.equal(randomInt(20,a=>a[0]=[4294967295,23][i++]),3);assert.equal(i,2);assert.throws(()=>randomInt(0));});
test('feature thresholds, hold cap, held indices and no chains',()=>{
 for(const [roll,phase] of [[0,'hold'],[7,'hold'],[8,'nudge'],[15,'nudge'],[16,'idle'],[99,'idle']])assert.equal(spin(initialState(),'LLC',roll).phase,phase);
 let s=spin(initialState(),'LLC',0);s=go(s,{type:'hold',reel:0});s=go(s,{type:'hold',reel:1});assert.equal(go(s,{type:'hold',reel:2}),s);
 const old=s.indices;s=go(s,{type:'spin'},rng(STRIPS[2].indexOf('F'),99));assert.deepEqual(s.indices.slice(0,2),old.slice(0,2));assert.equal(s.phase,'idle');
});
test('nudges wrap and stop at first partial return, two max',()=>{
 let s=initialState();s.phase='nudge';s.nudges=2;s.indices=[19,0,0];s.roundStake=4;
 s=go(s,{type:'nudge',reel:0});assert.equal(s.indices[0],0);assert.equal(s.lastReturn,2);assert.equal(s.nudges,0);assert.equal(s.phase,'idle');
 assert.equal(go(s,{type:'nudge',reel:0}),s);
 s=initialState();s.phase='nudge';s.nudges=2;s.indices=indices('LIF');s=go(s,{type:'nudge',reel:2});assert.equal(s.nudges,1);s=go(s,{type:'nudge',reel:2});assert.equal(s.nudges,0);assert.equal(s.phase,'idle');
});
test('gull bonus from ordinary, hold and nudge; collect cannot duplicate',()=>{
 let s=spin(initialState(),'GGG');assert.equal(s.phase,'bonus');assert.equal(s.balance,268);
 const i=s.bonus.deck.indexOf(5);s=go(s,{type:'pick',index:i});assert.equal(s.bonus.pot,10);assert.equal(go(s,{type:'pick',index:i}),s);s=go(s,{type:'collect'});assert.equal(s.balance,278);assert.equal(go(s,{type:'collect'}),s);s=go(s,{type:'finish'});assert.equal(s.phase,'idle');
 let h=initialState();h.phase='hold';h.indices=indices('GGL');h.held=[true,true,false];h=go(h,{type:'spin'},rng(STRIPS[2].indexOf('G'),0,0,0,0,99));assert.equal(h.phase,'bonus');
 let n=initialState();n.phase='nudge';n.nudges=2;n.indices=indices('GGG');n.indices[2]--;n=go(n,{type:'nudge',reel:2},rng(0,0,0,0));assert.equal(n.phase,'bonus');
});
test('gull loses only unbanked pot; all chips auto collect',()=>{
 let s=spin(initialState(),'GGG');s=go(s,{type:'pick',index:s.bonus.deck.indexOf(3)});s=go(s,{type:'pick',index:s.bonus.deck.indexOf(0)});assert.equal(s.balance,268);assert.equal(s.bonus.pot,0);assert.equal(s.bonus.ended,true);
 s=spin(initialState(),'GGG');for(const v of [1,2,3,5])s=go(s,{type:'pick',index:s.bonus.deck.indexOf(v)});assert.equal(s.balance,290);assert.equal(s.lastReturn,92);assert.ok(s.bonus.ended);
});
test('insufficient balance, refill guard, skip and stake lock',()=>{
 let s=initialState();s.balance=1;assert.equal(go(s,{type:'spin'}),s);s=go(s,{type:'refill'});assert.equal(s.balance,200);assert.equal(go(s,{type:'refill'}),s);
 s=spin(s,'LLC',8);assert.equal(go(s,{type:'stake'}),s);s=go(s,{type:'skip'});s=go(s,{type:'stake'});assert.equal(s.stake,4);
});
test('save preserves settled round and bonus, corrupt saves reset, storage failure survives',()=>{
 let data=null;const storage={getItem:()=>data,setItem:(_,v)=>data=v};let s=spin(initialState(),'GGG');s=go(s,{type:'pick',index:s.bonus.deck.indexOf(2)});assert.ok(save(s,storage));assert.deepEqual(load(storage).state,s);assert.equal(load(storage).state.balance,268);
 const corrupt=structuredClone(s);corrupt.bonus.pot=800;assert.equal(valid(corrupt),false);data=JSON.stringify(corrupt);assert.equal(load(storage).state.balance,200);assert.ok(load(storage).notice);
 data='{';assert.ok(load(storage).notice);assert.equal(save(s,{setItem(){throw Error();}}),false);
});
test('10000 random actions preserve wallet and save invariants',()=>{
 const r=seeded(8991);let s=initialState();
 for(let i=0;i<10000;i++){let action;if(s.phase==='shakedown')action={type:s.shakeGame.ended?'shake-finish':r(2)?'gamble':'shake-collect'};else if(s.phase==='bonus')action=s.bonus.ended?{type:'finish'}:s.bonus.pot&&r(2)?{type:'collect'}:{type:'pick',index:r(5)};else if(s.balance<2)action={type:'refill'};else if(s.phase==='nudge')action={type:'nudge',reel:r(3)};else if(s.phase==='hold'&&r(2))action={type:'hold',reel:r(3)};else action={type:'spin'};s=go(s,action,r);assert.ok(valid(s),JSON.stringify(s));assert.ok(s.balance>=0);}
});
