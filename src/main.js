import './styles.css';
import {SYMBOLS,STRIPS,PAYOUTS,SAVE_KEY,money,symbolsAt} from './game/config.js';
import {initialState,transition} from './game/engine.js';
import {load,save} from './game/save.js';
import {sound} from './ui/audio.js';
const $=id=>document.getElementById(id);
let storage;try{storage=localStorage;}catch{storage={getItem(){return null},setItem(){throw Error()}};}
let loaded=load(storage),state=loaded.state,busy=false,owned=!navigator.locks,fallback=false;
let visual=structuredClone(state),firstRender=true;
const img=(s,cls='')=>'<img class="'+cls+'" src="/art/'+s+'.svg" alt="" draggable="false">';
$('reels').innerHTML=[0,1,2].map(r=>'<div class="reel" id="reel-'+r+'"></div>').join('');
$('reel-controls').innerHTML=[0,1,2].map(r=>'<button data-reel="'+r+'" aria-label="Hold reel '+(r+1)+'">HOLD</button>').join('');
$('paytable').innerHTML=Object.entries(PAYOUTS).reverse().map(([s,p])=>'<div>'+img(s)+img(s)+img(s)+'<span class="pay-name">'+SYMBOLS[s]+'</span><strong>'+p+'×'+(s==='G'?' + bonus':'')+'</strong></div>').join('')+'<div class="cherry-note"><b>C · C · other</b> = 2×<br><b>C · other · any</b> = 0.5× partial return<br>Cherries must start on the left. Highest match only.</div>';
const speaker='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 9h4l5-4v14l-5-4H4z"/><path d="M16 8q5 4 0 8"/></svg>';
const muted='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 9h4l5-4v14l-5-4H4z"/><path d="m17 9 5 6m0-6-5 6"/></svg>';
function notice(text){$('notice').hidden=!text;$('notice').textContent=text||'';}
if(loaded.notice)notice(loaded.notice);
function commit(next){state=next;if(!save(state,storage))notice('Progress won’t be saved on this device.');}
function reels(s){s.indices.forEach((index,r)=>{const strip=STRIPS[r];const el=$('reel-'+r);el.innerHTML=img(strip[(index+19)%20],'symbol previous')+img(strip[index],'symbol centre')+img(strip[(index+1)%20],'symbol next');el.classList.toggle('held',s.held[r]);el.setAttribute('aria-label','Reel '+(r+1)+': '+SYMBOLS[strip[index]]+(s.held[r]?', held':''));});}
function message(){
 if(!owned)return ['Open in another tab','Close the other game tab to play here.'];
 if(busy)return ['A little luck by the sea…','Reels are rolling.'];
 if(state.phase==='bonus'){
  if(state.bonus.ended)return [state.message==='gull'?'The gull nicked your chips!':'Chips are on you!','Your original line win is safe. Tap CONTINUE.'];
  return ['Watch your chips!',state.bonus.pot?'Collect, or risk the bonus pot for another pick.':'Pick a carton. Dodge the hungry gull.'];
 }
 if(state.phase==='nudge')return ['Give it a little nudge.',state.nudges+' free nudges left. SPIN skips them.'];
 if(state.balance<2)return ['The arcade’s still open.','Grab 100 fresh credits, on the house.'];
 if(state.balance<state.stake)return ['A smaller spin?','Skip any feature, then lower your stake.'];
 if(state.phase==='hold')return ['Hang on to the good bits.','Hold up to 2 reels for your next paid spin.'];
 const text={ready:['Fancy a spin?','Match 3 on the centre line. Tap SPIN to start.'],loss:['Another day at the seaside.','Fancy another go?'],win:['Lovely little win!','Returned '+money(state.lastReturn)+' credits.'],partial:['A little back.','Returned '+money(state.lastReturn)+' credits — less than the spin cost.'],jackpot:['THE BIG SEASIDE JACKPOT!','100× your stake. What a day at the seaside!'],refill:['On the house!','100 fresh credits. Enjoy yourself.'],collected:['Chips are on you!','Bonus safely collected.'],gull:['Cheeky seagull.','Your line win is safe. Fancy a spin?']};
 return text[state.message]||text.ready;
}
function render(){
 const locked=busy||!owned;
 document.querySelector('.cabinet').classList.toggle('reduced',state.motion||matchMedia('(prefers-reduced-motion: reduce)').matches);
 if(!busy){visual=structuredClone(state);reels(state);}
 $('credits').textContent=money(busy?Math.max(0,visual.balance-(state.round>visual.round?state.roundStake:0)):state.balance);
 $('last').textContent=state.lastReturn&&!busy?money(state.lastReturn):'—';
 $('stake-meter').textContent=money(state.stake);$('stake-value').textContent=money(state.stake);
 $('stake').disabled=locked||state.phase!=='idle';
 $('sound').innerHTML=state.sound?speaker:muted;$('sound').setAttribute('aria-label',state.sound?'Mute sound':'Enable sound');
 $('motion').checked=state.motion;
 $('skip').hidden=!['hold','nudge'].includes(state.phase)||busy;$('skip').disabled=locked;
 const [title,hint]=message();$('message').textContent=title;$('hint').textContent=hint;
 [...$('reel-controls').children].forEach((b,r)=>{const nudging=state.phase==='nudge';b.textContent=nudging?'NUDGE ↑':state.held[r]?'HELD ✓':'HOLD';b.disabled=locked||!['hold','nudge'].includes(state.phase);b.setAttribute('aria-pressed',String(state.held[r]));b.setAttribute('aria-label',(nudging?'Nudge':'Hold')+' reel '+(r+1));});
 let label='SPIN',sub="LET’S GO!",disabled=locked;
 if(state.phase==='bonus'){label=state.bonus.ended?'CONTINUE':'COLLECT';sub=state.bonus.ended?'BACK TO THE ARCADE':money(state.bonus.pot)+' BONUS CREDITS';disabled||=!state.bonus.ended&&!state.bonus.pot;}
 else if(state.balance<2){label='REFILL';sub='100 FREE CREDITS';}
 else if(state.balance<state.stake)disabled=true;
 if(busy){label='SPINNING';sub='A LITTLE SEASIDE LUCK';}
 $('spin-label').textContent=label;$('spin-sub').textContent=sub;$('spin').disabled=disabled;document.querySelector('.spin-arrow').hidden=label.length>5;
 $('bonus').hidden=busy||state.phase!=='bonus';
 if(state.phase==='bonus'&&!busy){
 const b=state.bonus;$('bonus-pot').textContent=b.ended?(state.message==='gull'?'The gull got the bonus pot.':'Collected '+money(b.pot)+' bonus credits!'):(b.pot?'Bonus pot: '+money(b.pot)+' credits':'Pick a carton to start');
 $('cartons').innerHTML=b.deck.map((v,i)=>{const show=b.ended||b.revealed.includes(i);return '<button data-pick="'+i+'" '+(locked||show?'disabled':'')+' class="'+(show?'revealed':'')+'" aria-label="'+(show?(v?'Prize '+v+' times stake':'Gull'):'Pick carton '+(i+1))+'">'+img(show&&!v?'G':'F')+'<span>'+(show?(v?v+'×':'GULL'):'?')+'</span></button>';}).join('');
 }
 if(!busy&&!firstRender)$('announcement').textContent=symbolsAt(state.indices).map(s=>SYMBOLS[s]).join(', ')+'. '+title+' '+hint+' Balance '+money(state.balance)+' credits.';
 firstRender=false;
}
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function act(action){
 if(busy||!owned)return;
 if(fallback){const current=load(storage).state;if(current.revision>state.revision)state=current;}
 const before=structuredClone(state),next=transition(state,action);
 if(next===state)return;
 const animate=action.type==='spin'||action.type==='nudge';
 sound(action.type==='nudge'?'nudge':'click',before.sound);
 commit(next);
 if(animate){
  busy=true;visual=before;render();
  const reduced=state.motion||matchMedia('(prefers-reduced-motion: reduce)').matches;
  const moving=[0,1,2].filter(r=>action.type==='nudge'?r===action.reel:before.phase!=='hold'||!before.held[r]);
  await Promise.all(moving.map(async(r)=>{
   const el=$('reel-'+r);
   if(action.type==='spin')el.classList.add('spinning');
   else if(!reduced){const step=el.querySelector('.centre').getBoundingClientRect().height*.9;el.querySelectorAll('.symbol').forEach(symbol=>{const start=getComputedStyle(symbol).transform;symbol.animate([{transform:start},{transform:(start==='none'?'':start)+' translateY(-'+step+'px)'}],{duration:180,easing:'ease-out'});});}
   await pause(reduced?160:action.type==='nudge'?180:650+r*200);
   el.classList.remove('spinning');
   const temp=structuredClone(before);temp.indices[r]=state.indices[r];const strip=STRIPS[r],idx=state.indices[r];el.innerHTML=img(strip[(idx+19)%20],'symbol previous')+img(strip[idx],'symbol centre')+img(strip[(idx+1)%20],'symbol next');
   sound('stop',state.sound);
  }));
  busy=false;
 }
 render();
 if(state.message==='jackpot'&&action.type==='spin'&&!state.motion&&!matchMedia('(prefers-reduced-motion: reduce)').matches){const burst=document.createElement('div');burst.className='confetti';burst.setAttribute('aria-hidden','true');burst.innerHTML=Array.from({length:24},(_,i)=>'<i style="--x:'+((i*43)%100)+'%;--delay:'+((i%5)*.08)+'s;--angle:'+(i%2?'-':'')+(30+i*9)+'deg"></i>').join('');document.querySelector('.cabinet').append(burst);setTimeout(()=>burst.remove(),2400);}
 if(['spin','nudge','pick','collect'].includes(action.type)){
  const kind=state.message==='jackpot'?'jackpot':state.message==='gull'?'gull':state.message==='chips'?'chips':state.lastReturn>=state.roundStake&&['win','bonus','collected'].includes(state.message)?'win':null;
  if(kind){sound(kind,state.sound);const cabinet=document.querySelector('.cabinet');cabinet.classList.add(kind==='jackpot'?'jackpot-win':'win');setTimeout(()=>cabinet.classList.remove('win','jackpot-win'),1600);}
 }
}
$('spin').onclick=()=>act({type:state.phase==='bonus'?(state.bonus.ended?'finish':'collect'):state.balance<2?'refill':'spin'});
$('stake').onclick=()=>act({type:'stake'});$('skip').onclick=()=>act({type:'skip'});
$('sound').onclick=()=>act({type:'sound'});$('motion').onchange=()=>act({type:'motion'});
$('reel-controls').onclick=e=>{const b=e.target.closest('button');if(b)act({type:state.phase==='nudge'?'nudge':'hold',reel:Number(b.dataset.reel)});};
$('cartons').onclick=e=>{const b=e.target.closest('button');if(b)act({type:'pick',index:Number(b.dataset.pick)});};
$('help').onclick=()=>$('rules').showModal();$('close-rules').onclick=()=>$('rules').close();
$('rules').addEventListener('close',()=>$('help').focus());
document.addEventListener('keydown',e=>{if(e.code==='Space'&&!$('rules').open&&!e.repeat&&!['BUTTON','INPUT','SELECT','TEXTAREA'].includes(document.activeElement.tagName)){e.preventDefault();$('spin').click();}});
document.addEventListener('visibilitychange',()=>document.body.classList.toggle('hidden-page',document.hidden));
window.addEventListener('pageshow',e=>{if(e.persisted)location.reload();});
window.addEventListener('storage',e=>{if(e.key===SAVE_KEY&&!owned){state=load(storage).state;render();}});
if(navigator.locks){
 navigator.locks.request(SAVE_KEY,async()=>{owned=true;state=load(storage).state;render();await new Promise(resolve=>window.addEventListener('pagehide',resolve,{once:true}));owned=false;}).catch(()=>{owned=false;notice('This browser could not open a game lock. Please reload.');render();});
}else{fallback=true;notice('This browser saves progress but supports one game tab at a time.');}
render();
