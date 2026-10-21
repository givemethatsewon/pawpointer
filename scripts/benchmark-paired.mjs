import { chromium } from '@playwright/test';
import fs from 'node:fs';
const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
const results=[];
for(const mobile of [false,true])for(let run=0;run<5;run++)for(const version of (run%2?['after','before']:['before','after'])){
 const context=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1440,height:900},isMobile:mobile,hasTouch:mobile,deviceScaleFactor:mobile?2:1});
 const page=await context.newPage(); const cdp=await context.newCDPSession(page);
 await cdp.send('Network.enable');await cdp.send('Network.setCacheDisabled',{cacheDisabled:true});
 if(mobile){await cdp.send('Network.emulateNetworkConditions',{offline:false,latency:150,downloadThroughput:200000,uploadThroughput:93750});await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});}
 await page.goto(`http://127.0.0.1:${version==='before'?4175:4174}/`);
 await page.locator('.stage[data-phase="ready"]').waitFor();
 const initial=await page.evaluate(()=>({readyMs:performance.now(),photoId:document.querySelector('.stage').dataset.photoId,resources:performance.getEntriesByType('resource').map(e=>({name:e.name.split('/').pop(),bytes:e.transferSize,startMs:e.startTime,durationMs:e.duration}))}));
 const transitions=[];
 for(const [x,y] of [[80,180],[300,600],[180,400]]){
  const old=await page.locator('.stage').getAttribute('data-photo-id');const start=Date.now();
  if(mobile)await page.touchscreen.tap(x,y);else await page.mouse.move(x,y);
  await page.waitForFunction(old=>{const e=document.querySelector('.stage');return e.dataset.phase==='ready'&&e.dataset.photoId!==old},old);
  transitions.push({readyMs:Date.now()-start,photoId:await page.locator('.stage').getAttribute('data-photo-id')});
 }
 const start=Date.now();await page.getByRole('button',{name:'Meet the cats',exact:true}).click();await page.locator('.cat-card').first().waitFor();const collectionCardsMs=Date.now()-start;
 results.push({version,mobile,run,initial,transitions,collectionCardsMs});await context.close();console.log(version,mobile?'mobile':'desktop',run,Math.round(initial.readyMs),transitions.map(t=>t.readyMs));
}
fs.writeFileSync('docs/performance/v2/paired.json',JSON.stringify({date:new Date().toISOString(),browser:browser.version(),conditions:{runsPerVariant:5,cache:'disabled, fresh context per run',order:'alternating before/after',mobile:'390x844 DPR2 touch; CPU4x; down200000 bytes/s, up93750 bytes/s, latency150ms',desktop:'1440x900 DPR1, unthrottled localhost',metric:'navigation/input to decoded ready state, excludes entrance animation; collection to first card DOM visibility, not thumbnail completion',behavior:'before: 1200ms dwell for all input and startup; after: startup/touch immediate, desktop dwell1200ms with preload after150ms quiet'},results},null,2));await browser.close();
