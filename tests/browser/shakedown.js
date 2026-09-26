import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {initialState,transition} from '../../src/game/engine.js';
import {SAVE_KEY,numbersAt} from '../../src/game/config.js';
const url=process.env.TEST_URL||'http://127.0.0.1:5173';
const browser=await chromium.launch({channel:'msedge',headless:true});
const context=await browser.newContext({viewport:{width:390,height:844}});
const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
await page.goto(url);await page.waitForFunction(()=>!document.getElementById('spin').disabled);
async function fixture(s){await page.evaluate(([k,s])=>localStorage.setItem(k,JSON.stringify(s)),[SAVE_KEY,s]);await page.reload();await page.waitForFunction(()=>document.getElementById('message').textContent!=='Open in another tab');}
async function random(values){await page.evaluate(values=>{crypto.getRandomValues=a=>{a[0]=values.length?values.shift():99;return a;};},values);}
async function read(){return page.evaluate(k=>JSON.parse(localStorage.getItem(k)),SAVE_KEY);}
async function fit(name){const bad=await page.evaluate(()=>{const els=[...document.querySelectorAll('.cabinet button,.shake-sign,#shake-count,#flash-options,#drench-pot,#drench-ladder,#drench-odds')].filter(e=>e.checkVisibility());return els.map(e=>({id:e.id,r:e.getBoundingClientRect().toJSON()})).filter(({r})=>r.x<0||r.right>innerWidth+.5||r.y<0||r.bottom>innerHeight+.5);});assert.deepEqual(bad,[],name);if(await page.locator('#shakedown-bonus').isVisible()){const clipped=await page.locator('#shakedown-bonus').evaluate(el=>{const p=el.getBoundingClientRect();return [...el.children].filter(e=>e.checkVisibility()).map(e=>({id:e.id,r:e.getBoundingClientRect().toJSON()})).filter(({r})=>r.top<p.top-.5||r.bottom>p.bottom+.5||r.left<p.left-.5||r.right>p.right+.5);});assert.deepEqual(clipped,[],name+' panel clipping');}await page.screenshot({path:'artifacts/'+name+'.png'});}
// Progress stays lit during an earned hold, then adds to it one letter at a time.
let s=initialState();s.shake={count:6,base:0,total:6,held:true,pending:false};s.indices=[3,1,4];s.message='loss';await fixture(s);assert.equal(await page.locator('.shake-sign .lit').count(),6);assert.equal(await page.locator('#shake-status').textContent(),'SHAKEDOWN HELD');await fit('shakedown-held');
await random([1,0,0,99,99]);await page.locator('#spin').click();assert.equal(await page.locator('.shake-sign .lit').count(),6);await page.waitForFunction(()=>!document.getElementById('spin').disabled);assert.equal(await page.locator('.shake-sign .lit').count(),7);assert.equal((await read()).shake.held,false);
await random([1,0,0,99,99]);await page.locator('#spin').click();assert.equal(await page.locator('.shake-sign .lit').count(),0);await page.waitForFunction(()=>!document.getElementById('spin').disabled);assert.equal(await page.locator('.shake-sign .lit').count(),1);
// A held sign carries across a page refresh. Numbers are badges only when nonzero.
s=initialState();s.indices=[6,4,2];s.shake={count:7,base:0,total:7,held:true,pending:false};await fixture(s);assert.deepEqual(await page.locator('.centre .number-badge').allTextContents(),['3','3','3']);await page.reload();await page.waitForFunction(()=>!document.getElementById('spin').disabled);assert.equal(await page.locator('.lit').count(),7);
// Complete via an actual spin and inspect the progressive fill before bonus entry.
await fixture(initialState());await random([6,4,2,99]);await page.locator('#spin').click();await page.waitForFunction(()=>document.querySelectorAll('.shake-sign .lit').length>0);assert.ok(await page.locator('#shakedown-bonus').isHidden());await page.waitForFunction(()=>!document.getElementById('spin').disabled);assert.equal(await page.locator('.lit').count(),9);assert.ok(await page.locator('#shakedown-bonus').isVisible());assert.equal(await page.locator('#drench-pot').textContent(),'2');const full=await read();
for(const [w,h] of [[320,568],[360,640],[375,667],[390,844],[430,932],[667,375],[844,390],[1280,900]]){await page.setViewportSize({width:w,height:h});await fixture(full);await fit('drench-'+w+'x'+h);}
await page.setViewportSize({width:390,height:844});await fixture(full);
async function press(side,input='pointer',wait=true){
 await page.waitForFunction(({side,input})=>{
  const button=document.getElementById('gamble');if(button.disabled||document.getElementById('flash-options').dataset.active!==side)return false;
  if(input==='keyboard')button.dispatchEvent(new KeyboardEvent('keydown',{key:' ',bubbles:true}));
  else if(input==='click')button.click();
  else button.dispatchEvent(new PointerEvent('pointerdown',{button:0,isPrimary:true,bubbles:true}));
  button.click(); // duplicate activation while the reveal is locked must be ignored
  return true;
 },{side,input});
 if(wait)await page.waitForFunction(()=>!document.getElementById('spin').disabled);
}
assert.equal(await page.locator('#drench-wheel').count(),0);assert.equal(await page.locator('#low-multiplier').textContent(),'×1');assert.equal(await page.locator('#high-multiplier').textContent(),'×2');
await press('high');assert.equal((await read()).shakeGame.lower,2);assert.equal(await page.locator('#drench-pot').textContent(),'4');assert.equal(await page.locator('#low-multiplier').textContent(),'×2');assert.equal(await page.locator('#high-multiplier').textContent(),'×3');await fit('tide-advance');
await page.reload();await page.waitForFunction(()=>!document.getElementById('spin').disabled);assert.equal(await page.locator('#drench-pot').textContent(),'4');
// Collect pays the bottom multiplier, including when the higher light is on.
await page.waitForFunction(()=>{if(document.getElementById('flash-options').dataset.active!=='high')return false;document.getElementById('spin').click();return true;});assert.equal((await read()).balance,full.balance+8);await page.locator('#spin').click();assert.equal(await page.locator('.lit').count(),0);
// A reload during the stopped-panel reveal cannot retry a loss or pay again.
await fixture(full);await press('low','pointer',false);const committed=await read();await page.reload();await page.waitForFunction(()=>!document.getElementById('spin').disabled);assert.deepEqual(await read(),committed);assert.equal(await page.locator('#drench-pot').textContent(),'0');await fit('tide-washout');
await fixture({...full,motion:true});
for(let i=0;i<9;i++){await press('high',i%3===0?'keyboard':i%3===1?'pointer':'click');assert.equal((await read()).shakeGame.lower,i+2);}
assert.equal((await read()).balance,full.balance+40);assert.equal(await page.locator('#drench-pot').textContent(),'20');assert.ok(await page.locator('#mega-win').isVisible());assert.equal((await read()).shakeGame.result,'complete');
const top=await read();for(const [w,h]of [[320,568],[390,844],[667,375],[1280,900]]){await page.setViewportSize({width:w,height:h});await fixture(top);await fit('tide-top-'+w+'x'+h);}
await page.setViewportSize({width:390,height:844});await fixture(full);
await page.locator('#help').click();const paused=await page.locator('#flash-options').getAttribute('data-active');await page.waitForTimeout(1400);assert.equal(await page.locator('#flash-options').getAttribute('data-active'),paused);await page.keyboard.press('Escape');await press('high','keyboard');
// Real animated max-win celebration, with the payout already committed.
const near={...full,shakeGame:{...full.shakeGame,lower:9,pot:36,result:'win',selected:'high'}};await fixture(near);await press('high');assert.ok(await page.locator('.mega-confetti').isVisible());await fit('tide-mega-celebration');
await page.reload();await page.waitForFunction(()=>!document.getElementById('spin').disabled);assert.equal((await read()).balance,full.balance+40);assert.ok(await page.locator('#mega-win').isVisible());
// An unfinished previous wheel bonus retains its full pot as the new ×1 amount.
await fixture({...full,version:3,shakeGame:{pot:16,step:2,ended:false,result:'win',sector:0}});assert.equal(await page.locator('#drench-pot').textContent(),'8');assert.equal(await page.locator('#low-multiplier').textContent(),'×1');await page.locator('#spin').click();assert.equal((await read()).balance,full.balance+16);
// Existing saves migrate without discarding the user's balance.
s=initialState();s.version=1;s.balance=321;s.sound=false;delete s.shake;delete s.shakeGame;await fixture(s);assert.equal(await page.locator('#credits').textContent(),'161');assert.equal(await page.locator('#shake-count').textContent(),'0 / 9');
await page.locator('#help').click();assert.ok((await page.locator('.rules-body').textContent()).includes('timing game'));await page.keyboard.press('Escape');
assert.deepEqual(errors,[]);await browser.close();console.log('Shakedown browser checks passed: numbers, incremental fill/reset/carry, 8 bonus layouts, timed pointer/keyboard/accessible input, lower collect, loss, ×10 celebration, duplicate input, reload, paused rules, old-pot migration.');
