import {initialState} from './engine.js';
import {SAVE_KEY,STAKES,STRIPS} from './config.js';
export function valid(s) {
 const uint=v=>Number.isSafeInteger(v)&&v>=0;
 if(!s||s.version!==1||!uint(s.balance)||!uint(s.revision)||!uint(s.round)||!uint(s.lastReturn)||!STAKES.includes(s.stake)||!STAKES.includes(s.roundStake)||!['idle','hold','nudge','bonus'].includes(s.phase)||typeof s.sound!=='boolean'||typeof s.motion!=='boolean'||typeof s.message!=='string')return false;
 if(!Array.isArray(s.indices)||s.indices.length!==3||!s.indices.every((v,r)=>uint(v)&&v<STRIPS[r].length))return false;
 if(!Array.isArray(s.held)||s.held.length!==3||!s.held.every(v=>typeof v==='boolean')||s.held.filter(Boolean).length>2)return false;
 if(!uint(s.nudges)||s.nudges>2||(s.phase==='nudge'&&s.nudges===0)||(s.phase!=='hold'&&s.held.some(Boolean)))return false;
 if(s.phase==='bonus'){
  const b=s.bonus;
  if(!b||!Array.isArray(b.deck)||[...b.deck].sort((a,b)=>a-b).join(',')!=='0,1,2,3,5'||!Array.isArray(b.revealed)||new Set(b.revealed).size!==b.revealed.length||!b.revealed.every(v=>uint(v)&&v<5)||!uint(b.pot)||typeof b.ended!=='boolean')return false;
  const gull=b.revealed.some(i=>b.deck[i]===0);
  const sum=b.revealed.reduce((n,i)=>n+b.deck[i]*s.roundStake,0);
  if(b.pot!==(gull?0:sum)||(!b.ended&&(gull||b.revealed.length>=4)))return false;
 }else if(s.bonus!==null)return false;
 return true;
}
export function load(storage) {
 try {const raw=storage.getItem(SAVE_KEY);if(!raw)return {state:initialState()};const s=JSON.parse(raw);if(!valid(s))throw Error('invalid');return {state:s};}
 catch(e){return {state:initialState(),notice:e.name==='SecurityError'?'Progress won’t be saved on this device.':'Saved game could not be read. Here are 100 fresh credits.'};}
}
export function save(state,storage) {try{storage.setItem(SAVE_KEY,JSON.stringify(state));return true;}catch{return false;}}

