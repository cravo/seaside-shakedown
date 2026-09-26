import {STAKES,STRIPS,HOLD_RATE,NUDGE_RATE,SHAKE_HOLD_RATE,SHAKE_TARGET,numbersAt} from './config.js';
import {evaluate,payoutUnits} from './evaluate.js';
import {randomInt,shuffle} from './random.js';
export const initialShake = ()=>({count:0,base:0,total:0,held:false,pending:false});
export const initialState = ()=>({version:3,revision:0,round:0,phase:'idle',balance:200,stake:2,roundStake:2,indices:[0,0,0],held:[false,false,false],nudges:0,lastReturn:0,bonus:null,shake:initialShake(),shakeGame:null,message:'ready',sound:true,motion:false});
function startShakedown(s){
 s.phase='shakedown';s.shake.pending=false;s.shake.held=false;s.nudges=0;s.held=[false,false,false];
 s.shakeGame={pot:s.roundStake*2,step:0,ended:false,result:'ready',sector:null};s.message='shakedown';
}
function countNumbers(s,rng,isSpin){
 const sh=s.shake;sh.total=numbersAt(s.indices).reduce((a,b)=>a+b,0);sh.count=Math.min(SHAKE_TARGET,sh.base+sh.total);
 if(sh.count===SHAKE_TARGET){
  sh.held=false;s.nudges=0;s.held=[false,false,false];
  if(s.phase==='bonus')sh.pending=true;else startShakedown(s);
 }else if(isSpin){sh.held=sh.count>0&&rng(100)<SHAKE_HOLD_RATE;}
 else if(sh.count===0)sh.held=false;
}
function settle(s,rng,eligible) {
 const result=evaluate(s.indices);
 const amount=payoutUnits(s.indices,s.roundStake);
 s.balance+=amount;s.lastReturn+=amount;
 if(result.bonus) {s.phase='bonus';s.bonus={deck:shuffle([1,2,3,5,0],rng),revealed:[],pot:0,ended:false};s.message='bonus';}
 else if(amount) {s.phase='idle';s.nudges=0;s.message=result.multiplier===100?'jackpot':amount<s.roundStake?'partial':amount===s.roundStake?'refund':'win';}
 else if(eligible) {const roll=rng(100);s.phase=roll<HOLD_RATE?'hold':roll<HOLD_RATE+NUDGE_RATE?'nudge':'idle';s.nudges=s.phase==='nudge'?2:0;s.message=s.phase==='idle'?'loss':s.phase;}
 else {s.phase=s.nudges?'nudge':'idle';s.message=s.nudges?'nudge':'loss';}
}
export function transition(state, action, rng=randomInt) {
 const s=structuredClone(state);
 const fail=()=>state;
 switch(action.type) {
 case 'spin': {
  if(!['idle','hold','nudge'].includes(s.phase)||s.balance<s.stake) return fail();
  const eligible=s.phase!=='hold'; const keep=s.phase==='hold'?s.held:[false,false,false];
  s.shake.base=s.shake.held?s.shake.count:0;s.shake.held=false;s.shake.pending=false;s.shakeGame=null;
  s.balance-=s.stake;s.roundStake=s.stake;s.round++;s.lastReturn=0;s.nudges=0;s.bonus=null;
  s.indices=s.indices.map((v,r)=>keep[r]?v:rng(STRIPS[r].length));s.held=[false,false,false];
  settle(s,rng,eligible);countNumbers(s,rng,true);break;
 }
 case 'hold':
  if(s.phase!=='hold'||!Number.isInteger(action.reel)||action.reel<0||action.reel>2) return fail();
  if(!s.held[action.reel]&&s.held.filter(Boolean).length>=2)return fail();
  s.held[action.reel]=!s.held[action.reel];break;
 case 'nudge':
  if(s.phase!=='nudge'||s.nudges<1||!Number.isInteger(action.reel)||action.reel<0||action.reel>2)return fail();
  s.indices[action.reel]=(s.indices[action.reel]+1)%STRIPS[action.reel].length;s.nudges--;settle(s,rng,false);countNumbers(s,rng,false);break;
 case 'skip':
  if(!['hold','nudge'].includes(s.phase))return fail();
  s.phase='idle';s.held=[false,false,false];s.nudges=0;s.message='ready';break;
 case 'stake':
  if(s.phase!=='idle')return fail();
  s.stake=STAKES[(STAKES.indexOf(s.stake)+1)%STAKES.length];s.shake=initialShake();break;
 case 'refill':
  if(s.balance>=2||!['idle','hold','nudge'].includes(s.phase))return fail();
  s.balance=200;s.phase='idle';s.nudges=0;s.held=[false,false,false];s.shake=initialShake();s.shakeGame=null;s.message='refill';break;
 case 'pick': {
  if(s.phase!=='bonus'||s.bonus.ended||!Number.isInteger(action.index)||action.index<0||action.index>4||s.bonus.revealed.includes(action.index))return fail();
  const b=s.bonus;b.revealed.push(action.index);
  const prize=b.deck[action.index];
  if(prize===0){b.pot=0;b.ended=true;s.message='gull';}
  else {b.pot+=prize*s.roundStake;s.message='chips';if(b.revealed.length===4){s.balance+=b.pot;s.lastReturn+=b.pot;b.ended=true;s.message='collected';}}
  break;
 }
 case 'collect':
  if(s.phase!=='bonus'||s.bonus.ended||!s.bonus.pot)return fail();
  s.balance+=s.bonus.pot;s.lastReturn+=s.bonus.pot;s.bonus.ended=true;s.message='collected';break;
 case 'finish':
  if(s.phase!=='bonus'||!s.bonus.ended)return fail();
  s.phase='idle';s.bonus=null;s.nudges=0;if(s.shake.pending)startShakedown(s);break;
 case 'gamble': {
  if(s.phase!=='shakedown'||s.shakeGame.ended)return fail();
  const b=s.shakeGame;b.sector=rng(8);b.step++;
  if(b.sector%2===0){b.pot*=2;b.result='win';if(b.step===4){s.balance+=b.pot;s.lastReturn+=b.pot;b.ended=true;b.result='complete';}}
  else{b.pot=0;b.ended=true;b.result='washout';}
  break;
 }
 case 'shake-collect': {
  if(s.phase!=='shakedown'||s.shakeGame.ended)return fail();
  const b=s.shakeGame;s.balance+=b.pot;s.lastReturn+=b.pot;b.ended=true;b.result='collect';break;
 }
 case 'shake-finish':
  if(s.phase!=='shakedown'||!s.shakeGame.ended)return fail();
  s.phase='idle';s.shakeGame=null;s.shake=initialShake();s.message='ready';break;
 case 'sound': s.sound=!s.sound;break;
 case 'motion': s.motion=!s.motion;break;
 default:return fail();
 }
 s.revision++;return s;
}
