import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {initialState} from '../../src/game/engine.js';
import {STRIPS,SAVE_KEY} from '../../src/game/config.js';
const url=process.env.TEST_URL||'http://127.0.0.1:5173';
const browser=await chromium.launch({channel:'msedge',headless:true});
const context=await browser.newContext({viewport:{width:320,height:568}});
const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.goto(url);await page.waitForFunction(()=>!document.getElementById('spin').disabled);
async function fixture(s){await page.evaluate(([k,s])=>localStorage.setItem(k,JSON.stringify(s)),[SAVE_KEY,s]);await page.reload();await page.waitForFunction(()=>document.getElementById('message').textContent!=='Open in another tab');}
async function fits(name){const m=await page.evaluate(()=>({h:document.documentElement.scrollHeight,w:document.documentElement.scrollWidth,height:innerHeight,width:innerWidth}));assert.ok(m.h<=m.height&&m.w<=m.width,name+' overflow '+JSON.stringify(m));await page.screenshot({path:'artifacts/'+name+'.png'});}
let s=initialState();s.phase='hold';s.held=[true,true,false];s.indices=STRIPS.map(strip=>strip.indexOf('S'));s.message='hold';await fixture(s);
await page.evaluate(()=>crypto.getRandomValues=a=>{a.fill(9);return a;});await page.locator('#spin').click();
await page.waitForFunction(()=>document.getElementById('spin-label').textContent==='SPINNING');
await page.locator('#spin').dispatchEvent('click');await page.locator('#spin').dispatchEvent('click');
assert.equal(await page.evaluate(k=>JSON.parse(localStorage.getItem(k)).round,SAVE_KEY),1);
await page.waitForFunction(()=>!document.getElementById('spin').disabled);
assert.equal(await page.locator('#credits').textContent(),'199');await fits('jackpot-small');
await page.setViewportSize({width:390,height:844});await fits('jackpot-mobile');
// Refresh while an actual moving spin is in progress; the committed round must survive.
await page.locator('#spin').click();const committed=await page.evaluate(k=>JSON.parse(localStorage.getItem(k)),SAVE_KEY);await page.reload();await page.waitForFunction(()=>!document.getElementById('spin').disabled);const recovered=await page.evaluate(k=>JSON.parse(localStorage.getItem(k)),SAVE_KEY);assert.deepEqual(recovered,committed);
for(const [w,h] of [[320,568],[390,844]]){
 await page.setViewportSize({width:w,height:h});
 s=initialState();s.phase='nudge';s.nudges=2;s.message='nudge';s.indices=[19,0,0];await fixture(s);await fits('nudge-'+w);await page.locator('[data-reel="0"]').click();await page.waitForFunction(()=>!document.getElementById('spin').disabled);assert.equal(await page.locator('#credits').textContent(),'100.5');
 s=initialState();s.phase='bonus';s.message='bonus';s.balance=268;s.lastReturn=70;s.indices=STRIPS.map(r=>r.indexOf('G'));s.bonus={deck:[1,2,3,5,0],pot:0,revealed:[],ended:false};await fixture(s);await fits('bonus-'+w);await page.locator('[data-pick="3"]').click();await page.locator('[data-pick="4"]').click();assert.equal(await page.locator('#credits').textContent(),'134');await fits('gull-'+w);await page.locator('#spin').click();
 s=initialState();s.phase='hold';s.message='hold';await fixture(s);await page.locator('[data-reel="0"]').click();await fits('hold-'+w);
}
await page.evaluate(k=>localStorage.setItem(k,'{broken'),SAVE_KEY);await page.reload();await page.waitForFunction(()=>!document.getElementById('spin').disabled);assert.ok((await page.locator('#notice').textContent()).includes('100 fresh'));assert.equal(await page.locator('#credits').textContent(),'100');
await page.locator('#help').click();await page.locator('#motion').check();await page.keyboard.press('Escape');assert.ok(await page.locator('.cabinet').evaluate(e=>e.classList.contains('reduced')));
await page.close();await context.close();
// Storage and audio unavailable should still permit an in-memory game.
const isolated=await browser.newContext({viewport:{width:320,height:568},reducedMotion:'reduce'});await isolated.addInitScript(()=>{Object.defineProperty(window,'localStorage',{get(){throw new DOMException('blocked','SecurityError');}});window.AudioContext=undefined;window.webkitAudioContext=undefined;Object.defineProperty(navigator,'locks',{value:undefined});});
const fallback=await isolated.newPage();fallback.on('pageerror',e=>errors.push(e.message));await fallback.goto(url);await fallback.locator('#spin').click();await fallback.waitForFunction(()=>!document.getElementById('spin').disabled);assert.ok((await fallback.locator('#notice').textContent()).includes('won’t be saved'));await fallback.screenshot({path:'artifacts/storage-unavailable.png'});
assert.deepEqual(errors,[]);await browser.close();console.log('Edge cases passed: jackpot, duplicate clicks, reload mid-animation, small-screen features, corrupt save, motion, unavailable storage/audio/locks.');
