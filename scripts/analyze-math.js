import {writeFileSync} from 'node:fs';
import {initialState,transition} from '../src/game/engine.js';
import {numbersAt,symbolsAt} from '../src/game/config.js';
import {payoutUnits} from '../src/game/evaluate.js';
import {seeded} from '../src/game/random.js';

// Run the actual production engine, including carried signs, nudges and both bonuses.
function run(policy,seed,spins=20000){
 const rng=seeded(seed);let s=initialState(),returns=0,triggers=0,holds=0,gambles=0,wins=0,refills=0;
 const act=a=>s=transition(s,a,rng);
 function bonuses(){while(['bonus','shakedown'].includes(s.phase)){
  if(s.phase==='bonus'){
   if(s.bonus.ended)act({type:'finish'});
   else if(s.bonus.pot)act({type:'collect'});
   else {const available=[0,1,2,3,4].filter(i=>!s.bonus.revealed.includes(i));act({type:'pick',index:available[rng(available.length)]});}
  }else{
   if(s.shakeGame.lower===1&&!s.shakeGame.ended)triggers++;
   if(s.shakeGame.ended)act({type:'shake-finish'});
   else if(policy==='numbers-blind-climb'){gambles++;act({type:'gamble',lower:s.shakeGame.lower,selected:rng(2)?'high':'low'});if(s.shakeGame.result!=='washout')wins++;}
   else act({type:'shake-collect'});
  }
 }}
 for(let i=0;i<spins;i++){
  if(s.balance<2){act({type:'refill'});refills++;}
  if(s.phase==='hold'){
   if(policy==='no-reel-features')act({type:'skip'});
   else if(policy==='casual-collect'){
    const symbols=symbolsAt(s.indices),pair=[[0,1],[0,2],[1,2]].find(([a,b])=>symbols[a]===symbols[b]);
    if(pair)pair.forEach(reel=>act({type:'hold',reel}));else act({type:'skip'});
   }else{
    const best=numbersAt(s.indices).map((n,reel)=>({n,reel})).filter(x=>x.n>=2).sort((a,b)=>b.n-a.n).slice(0,2);
    if(best.length)best.forEach(({reel})=>act({type:'hold',reel}));else act({type:'skip'});
   }
  }
  const before=s.balance;act({type:'spin'});if(s.shake.held)holds++;bonuses();
  while(s.phase==='nudge'){
   if(policy==='no-reel-features'){act({type:'skip'});break;}
   const options=[0,1,2].map(reel=>{const next=[...s.indices];next[reel]=(next[reel]+1)%20;const letters=Math.min(9,s.shake.base+numbersAt(next).reduce((a,b)=>a+b,0));return {reel,value:payoutUnits(next,s.roundStake)/s.roundStake+(letters===9?2:policy==='numbers-blind-climb'?letters*.05:0)};});
   const best=options.sort((a,b)=>b.value-a.value)[0];act({type:'nudge',reel:best.value?best.reel:rng(3)});bonuses();
  }
  returns+=s.balance-before+2;
 }
 return {rtp:returns/(spins*2),triggers,holds,gambles,wins,refills};
}
const results={};
for(const policy of ['no-reel-features','casual-collect','numbers-blind-climb']){
 const batches=Array.from({length:10},(_,i)=>run(policy,60726+i)),mean=batches.reduce((n,b)=>n+b.rtp,0)/10;
 const interval=1.96*Math.sqrt(batches.reduce((n,b)=>n+(b.rtp-mean)**2,0)/9/10);
 results[policy]={spins:200000,return:mean,interval95:interval,...Object.fromEntries(['triggers','holds','gambles','wins','refills'].map(k=>[k,batches.reduce((n,b)=>n+b[k],0)]))};
}
const histogram=Array(10).fill(0);for(let a=0;a<20;a++)for(let b=0;b<20;b++)for(let c=0;c<20;c++)histogram[numbersAt([a,b,c]).reduce((x,y)=>x+y,0)]++;
console.log(JSON.stringify({freshTotalHistogram:histogram,results},null,2));
if(process.argv.includes('--write')){
 const pct=x=>(x*100).toFixed(3)+'%';
 writeFileSync('MATH.md',
 '# Seaside Shakedown v3 — High Tide timing bonus\n\nGenerated from the production engine with `node scripts/analyze-math.js --write`.\n\n'+
 '## Fixed rules\n\nAll awards settle in whole credits. A single left cherry pays half the stake rounded up: 1, 1 or 3 credits at stakes 1, 2 or 5. Existing half-credit balances and last returns round up on migration to save schema v4. Rounding is an actual wallet award, not display formatting. Other payouts and feature probabilities are unchanged.\n\nEach 20-stop reel contains eight unnumbered stops, five 1s, four 2s and three 3s. Numbers are fixed to stops. The average fresh total is 3.3. Independent fresh spins total nine with probability 27/8000 = 0.3375%; carried signs and reel features make actual bonus entry much more common.\n\n'+
 'A nonzero incomplete sign is held with probability 25%. Subsequent spins carry those lit letters only when held; the hold chance can recur. Nudges replace the current spin total, never add it again. Changing stake and refilling clear the sign. A complete sign awards one bonus, including when it is queued behind the gull bonus.\n\n'+
 'High Tide starts with base winnings of 2× the triggering stake. The displayed pair starts at ×1 / ×2. Pressing while the higher panel is lit advances one multiplier; the lower panel loses the unbanked bonus. Collect pays the current lower multiplier times the base, irrespective of the active light. Nine successful presses reach ×10 and automatically bank 10 times the base (20× the original stake). Previously banked wins are safe.\n\nThis is a timing game, not an independent random gamble. The frame loop and input share one displayed-side snapshot; the production gamble draws no random number. Panels alternate with equal dwell times, starting at 450 ms per panel and decreasing by 25 ms per level to 250 ms at ×9. Paused rules and hidden tabs stop the selector. Actual success depends on player timing and device responsiveness, so there is no single game-wide RTP.\n\nFor the explicitly hypothetical blind-tap model below, each tap independently hits high with probability 1/2. Nine consecutive hits have probability 1/512; always attempting ×10 returns an expected 10/512 of the base. Perfect timing instead earns the full 10× base. These are model assumptions and bounds, not measured human accuracy or advertised odds.\n\n'+
 '## Empirical full-game sessions\n\nTen independent seeded batches of 20,000 paid spins per strategy; 600,000 spins overall, stake 1, 100-credit start and free refills. Intervals are approximate 95% intervals from between-batch standard errors, not guarantees about an individual session. Free nudges and bonus gambles are excluded from the stake denominator.\n\n'+
 '| Policy | Returned / staked ± interval | Shakedowns | Held signs | Timed attempts / hits | Refills |\n|---|---:|---:|---:|---:|---:|\n'+
 Object.entries(results).map(([k,r])=>'| '+k+' | '+pct(r.return)+' ± '+pct(r.interval95)+' | '+r.triggers+' | '+r.holds+' | '+r.gambles+' / '+r.wins+' | '+r.refills+' |').join('\n')+
 '\n\nNo-reel-features skips conventional holds/nudges and collects the Shakedown pot immediately. Casual-collect holds a matching pair, prefers an immediately paying nudge (including a complete sign), and collects. Numbers-blind-climb holds up to two numbered stops worth at least 2, nudges towards pay/letters, and models independent blind taps until loss or ×10. All policies collect after the first safe gull pick. None is proven optimal; do not label these figures optimal RTP.\n\n'+
 'The v1 92.72% optimal-return figure excluded this new feature and no longer describes the whole game. Historical calculations are retained in MATH-V1.md and scripts/analyze-math-v1.js. This free-credit simulator now deliberately offers an additional frequent bonus; there is no advertised RTP or claim that every possible strategy stays below 100%. There is no purchase, cash-out, or shared credit economy.\n');
}
