import { chromium } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
const label=process.argv[2] || 'current';
const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
const results=[];
for(const mobile of [false,true])for(let run=0;run<3;run++){
 const context=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1440,height:900},isMobile:mobile,hasTouch:mobile,deviceScaleFactor:mobile?2:1});
 const page=await context.newPage();const cdp=await context.newCDPSession(page);
 await cdp.send('Network.enable');await cdp.send('Network.setCacheDisabled',{cacheDisabled:true});
 if(mobile){await cdp.send('Network.emulateNetworkConditions',{offline:false,latency:150,downloadThroughput:200000,uploadThroughput:93750});await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});}
 await page.addInitScript(()=>{
  window.__longTasks=[];
  new PerformanceObserver(l=>window.__longTasks.push(...l.getEntries().map(e=>e.duration))).observe({type:'longtask',buffered:true});
  new PerformanceObserver(l=>window.__lcp=l.getEntries().at(-1)?.startTime).observe({type:'largest-contentful-paint',buffered:true});
 });
 await page.goto('http://127.0.0.1:4174/');
 await page.locator('.stage[data-phase="ready"]').waitFor();
 const initial=await page.evaluate(()=>({readyMs:performance.now(),lcpMs:window.__lcp,requests:performance.getEntriesByType('resource').map(e=>({name:e.name.split('/').pop(),bytes:e.transferSize,duration:e.duration})),longTasks:window.__longTasks}));
 const transitions=[];
 for(const [x,y] of [[80,180],[300,600],[180,400]]){
  const old=await page.locator('.stage').getAttribute('data-photo-id');const start=Date.now();
  if(mobile)await page.touchscreen.tap(x,y);else await page.mouse.move(x,y);
  await page.waitForFunction(old=>{const e=document.querySelector('.stage');return e.dataset.phase==='ready'&&e.dataset.photoId!==old},old);
  transitions.push(Date.now()-start);
 }
 const before=await page.evaluate(()=>performance.now());await page.getByRole('button',{name:'Meet the cats',exact:true}).click();await page.getByRole('dialog').waitFor();
 const collectionMs=await page.evaluate(start=>performance.now()-start,before);
 results.push({mobile,run,initial,transitions,collectionMs});await context.close();
 console.log(label,mobile?'mobile':'desktop',run,Math.round(initial.readyMs),transitions);
}
await browser.close();
const photos=JSON.parse(fs.readFileSync('src/photos.json'));const sizes=photos.map(p=>fs.statSync(path.join('public',p.src)).size).sort((a,b)=>a-b);
fs.writeFileSync(`docs/performance/${label}.json`,JSON.stringify({label,date:new Date().toISOString(),conditions:{mobile:'390x844 DPR2, CPU4x, 1.6Mbps down, 150ms latency',desktop:'1440x900 DPR1 unthrottled localhost',runs:3,cache:'disabled',note:'ready and transitions include intentional 1200ms debounce; collection measures dialog open, not all thumbnails'},photoCount:photos.length,assetBytes:fs.readdirSync('public/photos').reduce((n,f)=>n+fs.statSync('public/photos/'+f).size,0),imageBytes:{median:sizes[Math.floor(sizes.length/2)],p95:sizes[Math.floor(sizes.length*.95)],max:sizes.at(-1)},results},null,2));
