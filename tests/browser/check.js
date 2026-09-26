import {chromium} from 'playwright';
import {mkdirSync,writeFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import {initialState} from '../../src/game/engine.js';
import {STRIPS,SAVE_KEY} from '../../src/game/config.js';
const base=process.env.TEST_URL||'http://127.0.0.1:5173';
mkdirSync('artifacts',{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true});
const context=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'});
const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
async function setState(s){await page.evaluate(([key,s])=>localStorage.setItem(key,JSON.stringify(s)),[SAVE_KEY,s]);await page.reload();await page.waitForFunction(()=>!document.getElementById('spin').disabled);}
await page.goto(base);await page.waitForFunction(()=>!document.getElementById('spin').disabled);
const layouts=[];
for(const [width,height] of [[320,568],[360,640],[375,667],[390,844],[430,932],[667,375],[844,390],[1280,900]]){
 await page.setViewportSize({width,height});await page.screenshot({path:'artifacts/screen-'+width+'x'+height+'.png'});
 const metrics=await page.evaluate(()=>({scrollWidth:document.documentElement.scrollWidth,scrollHeight:document.documentElement.scrollHeight,width:innerWidth,height:innerHeight,spin:document.getElementById('spin').getBoundingClientRect().toJSON()}));
 assert.ok(metrics.scrollWidth<=width,'horizontal overflow '+width);assert.ok(metrics.scrollHeight<=height,'vertical overflow '+width+'x'+height+' '+metrics.scrollHeight);assert.ok(metrics.spin.bottom<=height,'spin clipped');layouts.push(metrics);
}
await page.setViewportSize({width:390,height:844});
await page.getByRole('button',{name:'Rules and paytable'}).click();assert.ok(await page.locator('#rules').evaluate(e=>e.open));await page.keyboard.press('Escape');assert.equal(await page.locator('#help').evaluate(e=>e===document.activeElement),true);
for(let i=0;i<30;i++){await page.locator('#spin').click();await page.waitForFunction(()=>!document.getElementById('spin').disabled);if(await page.locator('#bonus').isVisible()){while(await page.locator('#bonus').isVisible()){const pick=page.locator('#cartons button:not(:disabled)').first();if(await page.locator('#spin').isDisabled())await pick.click();else await page.locator('#spin').click();}}}
let s=initialState();s.phase='hold';s.message='hold';await setState(s);await page.locator('[data-reel="0"]').click();await page.locator('[data-reel="1"]').click();await page.locator('[data-reel="2"]').click();assert.equal(await page.locator('[aria-pressed=true]').count(),2);await page.screenshot({path:'artifacts/hold.png'});await page.reload();await page.waitForFunction(()=>!document.getElementById('spin').disabled);assert.equal(await page.locator('[aria-pressed=true]').count(),2);
s=initialState();s.phase='nudge';s.message='nudge';s.nudges=2;s.indices=[19,0,0];await setState(s);await page.locator('[data-reel="0"]').click();await page.waitForFunction(()=>!document.getElementById('spin').disabled);assert.equal(await page.locator('#credits').textContent(),'100.5');
s=initialState();s.phase='bonus';s.message='bonus';s.balance=268;s.lastReturn=70;s.indices=STRIPS.map(r=>r.indexOf('G'));s.bonus={deck:[1,2,3,5,0],pot:0,revealed:[],ended:false};await page.evaluate(([key,s])=>localStorage.setItem(key,JSON.stringify(s)),[SAVE_KEY,s]);await page.reload();await page.locator('[data-pick="0"]').click();await page.reload();await page.waitForFunction(()=>!document.getElementById('spin').disabled);assert.ok((await page.locator('#bonus-pot').textContent()).includes('1'));await page.screenshot({path:'artifacts/bonus.png'});await page.locator('#spin').click();assert.equal(await page.locator('#credits').textContent(),'135');await page.locator('#spin').click();
s=initialState();s.balance=0;await setState(s);await page.locator('#spin').click();assert.equal(await page.locator('#credits').textContent(),'100');
await page.locator('#sound').click();await page.reload();await page.waitForFunction(()=>!document.getElementById('spin').disabled);assert.equal(await page.locator('#sound').getAttribute('aria-label'),'Enable sound');
const second=await context.newPage();await second.goto(base);await second.waitForTimeout(200);assert.equal(await second.locator('#spin').isDisabled(),true);await page.close();await second.waitForFunction(()=>!document.getElementById('spin').disabled);await second.close();
assert.deepEqual(errors,[]);writeFileSync('artifacts/browser-results.json',JSON.stringify({url:base,layouts,errors,passed:true},null,2));
await browser.close();console.log('Browser checks passed: 8 layouts, 30 spins, rules/focus, holds, nudge, bonus, refill, save, mute, tab ownership.');

