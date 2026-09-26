import './styles.css';
import './shakedown.css';
import {SYMBOLS,STRIPS,NUMBER_STRIPS,PAYOUTS,SAVE_KEY,money,symbolsAt,numbersAt} from './game/config.js';
import {initialState,transition} from './game/engine.js';
import {load,save} from './game/save.js';
import {sound} from './ui/audio.js';
const $=id=>document.getElementById(id);
let storage;try{storage=localStorage;}catch{storage={getItem(){return null},setItem(){throw Error()}};}
let loaded=load(storage),state=loaded.state,busy=false,owned=!navigator.locks,fallback=false;
let visual=structuredClone(state),firstRender=true;
let busyKind=null,shownLetters=state.shake.count;
const img=(s,cls='')=>'<img class="'+cls+'" src="/art/'+s+'.svg" alt="" draggable="false">';
const reelSymbol=(r,index,cls)=>'<div class="symbol '+cls+'">'+img(STRIPS[r][index])+(NUMBER_STRIPS[r][index]?'<b class="number-badge">'+NUMBER_STRIPS[r][index]+'</b>':'')+'</div>';
$('shake-sign').innerHTML=[...'SHAKEDOWN'].map(letter=>'<span>'+letter+'</span>').join('');
$('drench-wheel').innerHTML=Array.from({length:8},(_,i)=>'<span class="sector-mark" style="--sector-angle:'+(i*45+22.5)+'deg">'+(i%2?'≈':'2×')+'</span>').join('');
$('drench-ladder').innerHTML=[2,4,8,16,32].map((n,i)=>'<span data-step="'+i+'">'+n+'×</span>').join('');
const shakeHelp=document.createElement('section');shakeHelp.innerHTML='<h3>Light up SHAKEDOWN.</h3><p>Reel items carry no number, 1, 2 or 3. Add the three centre-line numbers: each point lights one of the nine letters. A new paid spin clears the sign unless you earned <strong>SHAKEDOWN HELD</strong> (25% chance on an incomplete, nonzero sign). Held letters carry into the next spin, and another hold can extend the run. Held reels keep their numbers and count again on the next paid spin.</p><p>Nudges recalculate this spin’s number total; they never count a number twice. Changing stake or refilling clears held letters. Fill all nine to start <strong>Double or Drench</strong>. If the gull bonus also triggers, play it first, then your Shakedown bonus follows.</p><h3>Double or Drench</h3><p>Start with <strong>2× your triggering stake</strong>. Collect immediately, or spin the wheel: four GOLD segments double the pot; four WAVE segments wash it away. Every gamble is independently <strong>50/50</strong>. Reach 4×, 8×, 16×, then 32×, which banks automatically. Only the uncollected bonus pot is at risk; your credit balance and line wins are safe.</p>';$('paytable').after(shakeHelp);
$('reels').innerHTML=[0,1,2].map(r=>'<div class="reel" id="reel-'+r+'"></div>').join('');
$('reel-controls').innerHTML=[0,1,2].map(r=>'<button data-reel="'+r+'" aria-label="Hold reel '+(r+1)+'">HOLD</button>').join('');
$('paytable').innerHTML=Object.entries(PAYOUTS).reverse().map(([s,p])=>'<div>'+img(s)+img(s)+img(s)+'<span class="pay-name">'+SYMBOLS[s]+'</span><strong>'+p+'×'+(s==='G'?' + bonus':'')+'</strong></div>').join('')+'<div class="cherry-note"><b>C · C · other</b> = 2×<br><b>C · other · any</b> = 0.5× partial return<br>Cherries must start on the left. Highest match only.</div>';
const speaker='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 9h4l5-4v14l-5-4H4z"/><path d="M16 8q5 4 0 8"/></svg>';
const muted='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 9h4l5-4v14l-5-4H4z"/><path d="m17 9 5 6m0-6-5 6"/></svg>';
function notice(text){$('notice').hidden=!text;$('notice').textContent=text||'';}
if(loaded.notice)notice(loaded.notice);
function commit(next){state=next;if(!save(state,storage))notice('Progress won’t be saved on this device.');}
function reels(s){s.indices.forEach((index,r)=>{const strip=STRIPS[r];const el=$('reel-'+r);el.innerHTML=reelSymbol(r,(index+19)%20,'previous')+reelSymbol(r,index,'centre')+reelSymbol(r,(index+1)%20,'next');el.classList.toggle('held',s.held[r]);el.setAttribute('aria-label','Reel '+(r+1)+': '+SYMBOLS[strip[index]]+', '+(NUMBER_STRIPS[r][index]||'no')+' number'+(s.held[r]?', held':''));});}
function renderSign(count){
 [...$('shake-sign').children].forEach((el,i)=>el.classList.toggle('lit',i<count));
 const held=busy&&busyKind==='spin'?visual.shake.held:state.shake.held;
 $('shake-sign').classList.toggle('sign-held',held);$('shake-sign').classList.toggle('sign-full',count===9);
 $('shake-sign').setAttribute('aria-label','Shakedown: '+count+' of 9 letters lit'+(held?', Shakedown held':''));
 $('shake-count').textContent=count+' / 9';
 $('shake-status').textContent=count===9?(state.shake.pending?'BONUS QUEUED!':'SHAKEDOWN! BONUS TIME'):held?'SHAKEDOWN HELD':busy?'ADDING THE REEL NUMBERS…':'LIGHT ALL 9 FOR A BONUS';
 document.querySelector('.shake-status').classList.toggle('is-held',held);
}
function renderDrench(){
 const b=busy&&busyKind==='gamble'?visual.shakeGame:state.shakeGame;
 if(!b)return;
 $('drench-pot').textContent=money(b.pot);$('drench-pot-label').textContent=b.ended?(b.result==='washout'?'WASHED AWAY':'SAFELY COLLECTED'):'BONUS POT';
 $('wheel-hub').textContent=b.sector===null?'?':b.result==='washout'?'≈':b.result==='collect'?'✓':'2×';
 $('drench-wheel').style.transform='rotate('+(b.sector===null?0:360-(b.sector*45+22.5))+'deg)';
 document.querySelector('.wheel-wrap').classList.toggle('washed',b.result==='washout');
 $('gamble').disabled=busy||!owned||b.ended;$('gamble').hidden=b.ended;
 $('gamble').textContent=busy?'ROUND AND ROUND…':'GAMBLE FOR '+money(b.pot*2)+' CREDITS';
 $('drench-odds').textContent=b.ended?(b.result==='washout'?'The bonus pot is gone. Your balance is safe.':'That’s yours. Tap CONTINUE to spin again.'):'50% double · 50% lose the bonus pot';
 [...$('drench-ladder').children].forEach((el,i)=>{el.classList.toggle('reached',i<=b.step&&b.result!=='washout');el.classList.toggle('current',i===b.step&&b.result!=='washout');});
}
function message(){
 if(!owned)return ['Open in another tab','Close the other game tab to play here.'];
 if(busy)return busyKind==='gamble'?['Double… or a drenching?','The wheel decides. 50/50 every time.']:['A little luck by the sea…','Reel numbers light the letters.'];
 if(state.phase==='shakedown'){
  const b=state.shakeGame;
  return b.ended?[b.result==='washout'?'A proper seaside washout!':'A lovely haul — collected.',b.result==='washout'?'Only the bonus pot was lost. Tap CONTINUE.':money(b.pot)+' credits banked. Tap CONTINUE.']:[b.result==='win'?'DOUBLED! Fancy another?':'You’ve earned a Shakedown!',money(b.pot)+' credits: collect, or gamble for '+money(b.pot*2)+'.'];
 }
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
 document.querySelector('.cabinet').classList.toggle('shake-active',state.phase==='shakedown'&&(!busy||busyKind==='gamble'));
 document.querySelector('.cabinet').classList.toggle('reduced',state.motion||matchMedia('(prefers-reduced-motion: reduce)').matches);
 if(!busy){visual=structuredClone(state);reels(state);}
 renderSign(busy?shownLetters:state.shake.count);
 const nums=numbersAt(busy?visual.indices:state.indices);
 $('number-total').textContent=state.round?nums.map(n=>n||'–').join(' + ')+' = '+nums.reduce((a,b)=>a+b,0)+' LETTERS':'NUMBERS LIGHT THE SHAKEDOWN SIGN';
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
 else if(state.phase==='shakedown'){label=state.shakeGame.ended?'CONTINUE':'COLLECT';sub=state.shakeGame.ended?'BACK TO THE ARCADE':money(state.shakeGame.pot)+' BONUS CREDITS';}
 else if(state.balance<2){label='REFILL';sub='100 FREE CREDITS';}
 else if(state.balance<state.stake)disabled=true;
 if(busy){label=busyKind==='gamble'?'GAMBLING':'SPINNING';sub='A LITTLE SEASIDE LUCK';}
 $('spin-label').textContent=label;$('spin-sub').textContent=sub;$('spin').disabled=disabled;document.querySelector('.spin-arrow').hidden=label.length>5;
 $('bonus').hidden=busy||state.phase!=='bonus';
 $('shakedown-bonus').hidden=state.phase!=='shakedown'||(busy&&busyKind!=='gamble');if(state.phase==='shakedown')renderDrench();
 if(state.phase==='bonus'&&!busy){
 const b=state.bonus;$('bonus-pot').textContent=b.ended?(state.message==='gull'?'The gull got the bonus pot.':'Collected '+money(b.pot)+' bonus credits!'):(b.pot?'Bonus pot: '+money(b.pot)+' credits':'Pick a carton to start');
 $('cartons').innerHTML=b.deck.map((v,i)=>{const show=b.ended||b.revealed.includes(i);return '<button data-pick="'+i+'" '+(locked||show?'disabled':'')+' class="'+(show?'revealed':'')+'" aria-label="'+(show?(v?'Prize '+v+' times stake':'Gull'):'Pick carton '+(i+1))+'">'+img(show&&!v?'G':'F')+'<span>'+(show?(v?v+'×':'GULL'):'?')+'</span></button>';}).join('');
 }
 if(!busy&&!firstRender)$('announcement').textContent=symbolsAt(state.indices).map((s,r)=>SYMBOLS[s]+' '+(numbersAt(state.indices)[r]||'no number')).join(', ')+'. '+title+' '+hint+' Shakedown '+state.shake.count+' of 9.'+(state.shake.held?' Shakedown held.':'')+' Balance '+money(state.balance)+' credits.';
 firstRender=false;
}
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function act(action){
 if(busy||!owned)return;
 if(fallback){const current=load(storage).state;if(current.revision>state.revision)state=current;}
 const before=structuredClone(state),next=transition(state,action);
 if(next===state)return;
 const animate=action.type==='spin'||action.type==='nudge';
 const reduced=state.motion||matchMedia('(prefers-reduced-motion: reduce)').matches;
 sound(action.type==='nudge'?'nudge':'click',before.sound);
 commit(next);
 if(animate){
  busy=true;busyKind=action.type;visual=before;shownLetters=action.type==='spin'?(before.shake.held?before.shake.count:0):before.shake.count;render();
  const moving=[0,1,2].filter(r=>action.type==='nudge'?r===action.reel:before.phase!=='hold'||!before.held[r]);
  await Promise.all(moving.map(async(r)=>{
   const el=$('reel-'+r);
   if(action.type==='spin')el.classList.add('spinning');
   else if(!reduced){const step=el.querySelector('.centre').getBoundingClientRect().height*.9;el.querySelectorAll('.symbol').forEach(symbol=>{const start=getComputedStyle(symbol).transform;symbol.animate([{transform:start},{transform:(start==='none'?'':start)+' translateY(-'+step+'px)'}],{duration:180,easing:'ease-out'});});}
   await pause(reduced?160:action.type==='nudge'?180:650+r*200);
   el.classList.remove('spinning');
   const idx=state.indices[r];el.innerHTML=reelSymbol(r,(idx+19)%20,'previous')+reelSymbol(r,idx,'centre')+reelSymbol(r,(idx+1)%20,'next');
   sound('stop',state.sound);
  }));
  if(!reduced){while(shownLetters<state.shake.count){shownLetters++;renderSign(shownLetters);sound('letter',state.sound);await pause(85);}}
  busy=false;busyKind=null;
 }else if(action.type==='gamble'){
  busy=true;busyKind='gamble';visual=before;shownLetters=state.shake.count;render();
  const wheel=$('drench-wheel'),angle=1440+360-(state.shakeGame.sector*45+22.5);
  if(reduced){await pause(160);}else{
   const animation=wheel.animate([{transform:wheel.style.transform},{transform:'rotate('+angle+'deg)'}],{duration:1300,easing:'cubic-bezier(.12,.7,.15,1)',fill:'forwards'});
   await animation.finished;animation.cancel();
  }
  busy=false;busyKind=null;
  sound(state.shakeGame.result==='washout'?'gull':'jackpot',state.sound);
 }
 render();
 if(state.message==='jackpot'&&action.type==='spin'&&!state.motion&&!matchMedia('(prefers-reduced-motion: reduce)').matches){const burst=document.createElement('div');burst.className='confetti';burst.setAttribute('aria-hidden','true');burst.innerHTML=Array.from({length:24},(_,i)=>'<i style="--x:'+((i*43)%100)+'%;--delay:'+((i%5)*.08)+'s;--angle:'+(i%2?'-':'')+(30+i*9)+'deg"></i>').join('');document.querySelector('.cabinet').append(burst);setTimeout(()=>burst.remove(),2400);}
 if(['spin','nudge','pick','collect'].includes(action.type)){
  const kind=state.message==='jackpot'?'jackpot':state.message==='gull'?'gull':state.message==='chips'?'chips':state.lastReturn>=state.roundStake&&['win','bonus','collected'].includes(state.message)?'win':null;
  if(kind){sound(kind,state.sound);const cabinet=document.querySelector('.cabinet');cabinet.classList.add(kind==='jackpot'?'jackpot-win':'win');setTimeout(()=>cabinet.classList.remove('win','jackpot-win'),1600);}
 }
}
$('spin').onclick=()=>act({type:state.phase==='shakedown'?(state.shakeGame.ended?'shake-finish':'shake-collect'):state.phase==='bonus'?(state.bonus.ended?'finish':'collect'):state.balance<2?'refill':'spin'});
$('gamble').onclick=()=>act({type:'gamble'});
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
