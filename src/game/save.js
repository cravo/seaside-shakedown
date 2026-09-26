import {initialState,initialShake} from './engine.js';
import {SAVE_KEY,STAKES,STRIPS} from './config.js';
export function valid(s) {
 const uint=v=>Number.isSafeInteger(v)&&v>=0;
 if(!s||s.version!==2||!uint(s.balance)||!uint(s.revision)||!uint(s.round)||!uint(s.lastReturn)||!STAKES.includes(s.stake)||!STAKES.includes(s.roundStake)||!['idle','hold','nudge','bonus','shakedown'].includes(s.phase)||typeof s.sound!=='boolean'||typeof s.motion!=='boolean'||typeof s.message!=='string')return false;
 if(!Array.isArray(s.indices)||s.indices.length!==3||!s.indices.every((v,r)=>uint(v)&&v<STRIPS[r].length))return false;
 if(!Array.isArray(s.held)||s.held.length!==3||!s.held.every(v=>typeof v==='boolean')||s.held.filter(Boolean).length>2)return false;
 if(!uint(s.nudges)||s.nudges>2||(s.phase==='nudge'&&s.nudges===0)||(s.phase!=='hold'&&s.held.some(Boolean)))return false;
 const sh=s.shake;
 if(!sh||!uint(sh.count)||sh.count>9||!uint(sh.base)||sh.base>8||!uint(sh.total)||sh.total>9||sh.count!==Math.min(9,sh.base+sh.total)||typeof sh.held!=='boolean'||typeof sh.pending!=='boolean'||(sh.held&&(sh.count===0||sh.count===9))||(sh.pending&&(s.phase!=='bonus'||sh.count!==9)))return false;
 if(s.phase==='shakedown'){
  const b=s.shakeGame;
  if(!b||sh.count!==9||sh.pending||sh.held||!uint(b.step)||b.step>4||!uint(b.pot)||typeof b.ended!=='boolean'||!['ready','win','washout','collect','complete'].includes(b.result)||!(b.sector===null||(uint(b.sector)&&b.sector<8)))return false;
  if(b.pot!==(b.result==='washout'?0:s.roundStake*2*2**b.step))return false;
  if(b.ended!==['washout','collect','complete'].includes(b.result))return false;
  if((b.result==='complete')!==(b.step===4&&b.pot>0))return false;
  if(b.result==='ready'&&(b.step!==0||b.sector!==null))return false;
  if(b.result==='washout'&&(b.step===0||b.sector===null||b.sector%2!==1))return false;
  if(['win','complete'].includes(b.result)&&(b.step===0||b.sector===null||b.sector%2!==0))return false;
 }else if(s.shakeGame!==null)return false;
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
 try {const raw=storage.getItem(SAVE_KEY);if(!raw)return {state:initialState()};const s=JSON.parse(raw);if(s.version===1){s.version=2;s.shake=initialShake();s.shakeGame=null;}if(!valid(s))throw Error('invalid');return {state:s};}
 catch(e){return {state:initialState(),notice:e.name==='SecurityError'?'Progress won’t be saved on this device.':'Saved game could not be read. Here are 100 fresh credits.'};}
}
export function save(state,storage) {try{storage.setItem(SAVE_KEY,JSON.stringify(state));return true;}catch{return false;}}
