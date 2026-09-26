import {initialState,initialShake} from './engine.js';
import {SAVE_KEY,STAKES,STRIPS} from './config.js';
export function valid(s) {
 const uint=v=>Number.isSafeInteger(v)&&v>=0;
 if(!s||s.version!==4||!uint(s.balance)||s.balance%2!==0||!uint(s.revision)||!uint(s.round)||!uint(s.lastReturn)||s.lastReturn%2!==0||!STAKES.includes(s.stake)||!STAKES.includes(s.roundStake)||!['idle','hold','nudge','bonus','shakedown'].includes(s.phase)||typeof s.sound!=='boolean'||typeof s.motion!=='boolean'||typeof s.message!=='string')return false;
 if(!Array.isArray(s.indices)||s.indices.length!==3||!s.indices.every((v,r)=>uint(v)&&v<STRIPS[r].length))return false;
 if(!Array.isArray(s.held)||s.held.length!==3||!s.held.every(v=>typeof v==='boolean')||s.held.filter(Boolean).length>2)return false;
 if(!uint(s.nudges)||s.nudges>2||(s.phase==='nudge'&&s.nudges===0)||(s.phase!=='hold'&&s.held.some(Boolean)))return false;
 const sh=s.shake;
 if(!sh||!uint(sh.count)||sh.count>9||!uint(sh.base)||sh.base>8||!uint(sh.total)||sh.total>9||sh.count!==Math.min(9,sh.base+sh.total)||typeof sh.held!=='boolean'||typeof sh.pending!=='boolean'||(sh.held&&(sh.count===0||sh.count===9))||(sh.pending&&(s.phase!=='bonus'||sh.count!==9)))return false;
 if(s.phase==='shakedown'){
  const b=s.shakeGame;
  if(!b||sh.count!==9||sh.pending||sh.held||!uint(b.lower)||b.lower<1||b.lower>10||!uint(b.base)||b.base<2||b.base%2!==0||!uint(b.pot)||typeof b.ended!=='boolean'||!['ready','win','washout','collect','complete'].includes(b.result)||![null,'low','high'].includes(b.selected))return false;
  if(b.pot!==(b.result==='washout'?0:b.base*b.lower)||!uint(b.base*10))return false;
  if(b.ended!==['washout','collect','complete'].includes(b.result))return false;
  if((b.result==='complete')!==(b.lower===10))return false;
  if(b.result==='ready'&&(b.lower!==1||b.selected!==null))return false;
  if(b.result==='washout'&&b.selected!=='low')return false;
  if(['win','complete'].includes(b.result)&&(b.lower<2||b.selected!=='high'))return false;
  if(b.result==='collect'&&b.selected!==null)return false;
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
 try {
  const raw=storage.getItem(SAVE_KEY);if(!raw)return {state:initialState()};const s=JSON.parse(raw);
  if(s.version===1){s.version=2;s.shake=initialShake();s.shakeGame=null;}
  if(s.version===2){
   for(const key of ['balance','lastReturn']){if(!Number.isSafeInteger(s[key])||s[key]<0)throw Error('invalid');s[key]=Math.ceil(s[key]/2)*2;}
   if(s.message==='partial'&&s.lastReturn===s.roundStake)s.message='refund';
   s.version=3;
  }
  if(s.version===3){
   if(s.phase==='shakedown'){
    const b=s.shakeGame;
    // Preserve an old wheel pot as the new ×1 base; already settled awards stay settled.
    if(!b||!Number.isInteger(b.step)||b.step<0||b.step>4||typeof b.ended!=='boolean'||!['ready','win','washout','collect','complete'].includes(b.result)||!(b.sector===null||(Number.isInteger(b.sector)&&b.sector>=0&&b.sector<8))||b.pot!==(b.result==='washout'?0:s.roundStake*2*2**b.step)||b.ended!==['washout','collect','complete'].includes(b.result))throw Error('invalid');
    if(b.result==='washout'&&(b.step===0||b.sector===null||b.sector%2!==1))throw Error('invalid');
    if(['win','complete'].includes(b.result)&&(b.step===0||b.sector===null||b.sector%2!==0))throw Error('invalid');
    if(b.result==='ready'&&(b.step!==0||b.sector!==null))throw Error('invalid');
    if((b.result==='complete')!==(b.step===4&&b.pot>0))throw Error('invalid');
    const lost=b.result==='washout';
    s.shakeGame={base:lost?s.roundStake*2:b.pot,lower:1,pot:b.pot,ended:b.ended,result:lost?'washout':b.ended?'collect':'ready',selected:lost?'low':null};
   }
   s.version=4;
  }
  if(!valid(s))throw Error('invalid');return {state:s};
 }
 catch(e){return {state:initialState(),notice:e.name==='SecurityError'?'Progress won’t be saved on this device.':'Saved game could not be read. Here are 100 fresh credits.'};}
}
export function save(state,storage) {try{storage.setItem(SAVE_KEY,JSON.stringify(state));return true;}catch{return false;}}
