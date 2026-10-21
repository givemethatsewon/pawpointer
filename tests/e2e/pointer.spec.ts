import { test, expect, type Page } from '@playwright/test';
import catalog from '../../src/photos.json' with { type: 'json' };
const centerPhoto = catalog.reduce((best, p) => Math.hypot(p.paw.x-.5,p.paw.y-.5)<Math.hypot(best.paw.x-.5,best.paw.y-.5)?p:best);
const shots = process.env.PAW_SCREENSHOTS;
async function ready(page:Page) { await expect(page.locator('.stage')).toHaveAttribute('data-phase','ready'); }
async function alignment(page:Page,x:number,y:number) {
 await expect.poll(async () => {
 const delta=await page.locator('.aligned-photo').evaluate((el, target)=>{
   const image=el as HTMLImageElement,r=image.getBoundingClientRect();
   return {x:Math.abs(r.left+Number(image.dataset.pawX)*r.width-target.x),y:Math.abs(r.top+Number(image.dataset.pawY)*r.height-target.y)};
 },{x,y});
 return Math.max(delta.x,delta.y);
 }).toBeLessThan(.1);
}
test('immediate play, no landing, real image and no console errors', async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 const photoRequests:string[]=[];page.on('request',r=>{if(r.url().includes('/photos/'))photoRequests.push(r.url());});
 await page.goto('/');await ready(page);await alignment(page,720,450);
 await expect(page.getByRole('button',{name:/start|try a little/i})).toHaveCount(0);
 expect(await page.locator('.aligned-photo').evaluate((el)=>(el as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
 expect(errors).toEqual([]);
 expect(photoRequests.length).toBeLessThanOrEqual(2);
 expect(photoRequests.some(url=>url.includes('-thumb'))).toBe(false);
 if(shots)await page.screenshot({animations:'disabled',path:shots+'/desktop.png'});
});
test('latest pointer wins, center and near-edge alignment',async({page})=>{
 await page.goto('/');await ready(page);
 await page.mouse.move(200,210);await page.waitForTimeout(400);await page.mouse.move(1050,600);
 await ready(page);await alignment(page,1050,600);
 await page.mouse.move(16,150);await ready(page);await alignment(page,16,150);
});
test('Space skips the last four cats and arrows reposition target',async({page})=>{
 await page.goto('/');await ready(page);const ids=[await page.locator('.stage').getAttribute('data-photo-id')];
 for(let i=0;i<4;i++){
   await page.keyboard.press('Space');await ready(page);
   const id=await page.locator('.stage').getAttribute('data-photo-id');expect(ids).not.toContain(id);ids.push(id);
 }
 await page.keyboard.press('ArrowRight');await ready(page);await alignment(page,750,450);
});
test('mobile taps, rotation and no page overflow',async({browser})=>{
 const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:2});
 const page=await context.newPage();const initialPhotos:string[]=[];
 page.on('request',r=>{if(r.url().includes('/photos/'))initialPhotos.push(r.url());});
 await page.goto('http://127.0.0.1:5174/');await ready(page);
 expect(initialPhotos).toHaveLength(1);
 await page.touchscreen.tap(240,350);await ready(page);await alignment(page,240,350);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 if(shots)await page.screenshot({animations:'disabled',path:shots+'/mobile.png'});
 await page.setViewportSize({width:844,height:390});await ready(page);
 await alignment(page,240/390*844,350/844*390);
 await context.close();
});
test('a failed photo falls back to another and all failed photos show retry',async({page})=>{
 await page.route(`**/photos/${centerPhoto.id}.{avif,webp}`,r=>r.abort());
 await page.goto('/');await ready(page);await expect(page.locator('.stage')).not.toHaveAttribute('data-photo-id',centerPhoto.id);
 await page.route('**/photos/*',r=>r.abort());await page.reload();
 await expect(page.locator('.stage')).toHaveAttribute('data-phase','error');
 await expect(page.getByRole('button',{name:'Try again'})).toBeEnabled();
 await page.unroute('**/photos/*');await page.unroute(`**/photos/${centerPhoto.id}.{avif,webp}`);
 await page.getByRole('button',{name:'Try again'}).click();await ready(page);
});
test('slow old request cannot replace a newer target',async({page})=>{
 let release:()=>void=()=>{};const gate=new Promise<void>(resolve=>{release=resolve});
 await page.route(`**/photos/${centerPhoto.id}.{avif,webp}`,async r=>{await gate;await r.continue().catch(()=>{})});
 await page.goto('/');await expect(page.locator('.stage')).toHaveAttribute('data-phase','loading');
 await page.mouse.move(1300,700);await ready(page);await alignment(page,1300,700);
 const id=await page.locator('.stage').getAttribute('data-photo-id');release();await page.waitForTimeout(500);
 await expect(page.locator('.stage')).toHaveAttribute('data-photo-id',id!);await alignment(page,1300,700);
});
test('small mobile reduced motion is usable',async({page})=>{
 await page.setViewportSize({width:320,height:568});await page.emulateMedia({reducedMotion:'reduce'});
 await page.goto('/');await ready(page);
 await expect(page.locator('.wordmark')).toBeInViewport();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBe(320);
});

test('creator link uses the main GitHub profile; canvas has no photo credit',async({page})=>{
 await page.goto('/');await ready(page);
 await expect(page.getByRole('link',{name:'Paw Pointer — Sewon on GitHub'})).toHaveAttribute('href','https://github.com/givemethatsewon');
 await expect(page.locator('.photo-credit, .creator-link')).toHaveCount(0);
 await expect(page.getByRole('button',{name:'Meet the cats',exact:true})).toHaveCount(0);
 await expect(page.getByRole('button',{name:'Show another cat',exact:true})).toHaveCount(0);
 await expect(page.getByRole('link',{name:'Paw Pointer — Sewon on GitHub'})).toBeInViewport();
});

test('AVIF is preferred and a broken AVIF falls back to the same WebP photo',async({page})=>{
 await page.goto('/');await ready(page);
 await expect(page.locator('.aligned-photo')).toHaveAttribute('src',/\.avif$/);
 await page.route('**/photos/*.avif',r=>r.abort());await page.reload();await ready(page);
 await expect(page.locator('.stage')).toHaveAttribute('data-photo-id',centerPhoto.id);
 await expect(page.locator('.aligned-photo')).toHaveAttribute('src',/\.webp$/);
});

test('desktop prepares the intended image during the unchanged 1.2 second dwell',async({page})=>{
 await page.goto('/');await ready(page);
 const old=await page.locator('.stage').getAttribute('data-photo-id');
 const started:number[]=[];page.on('request',r=>{if(r.url().includes('/photos/'))started.push(Date.now());});
 const start=Date.now();await page.mouse.move(80,180);
 await expect(page.locator('.stage')).toHaveAttribute('data-phase','tracking');
 await expect.poll(()=>started.length).toBeGreaterThan(0);
 expect(started[0]-start).toBeLessThan(1000);
 await expect(page.locator('.stage')).toHaveAttribute('data-photo-id',old!);
 await ready(page);await alignment(page,80,180);
 expect(Date.now()-start).toBeGreaterThanOrEqual(1100);
});

test('touch taps start immediately and latest rapid tap wins',async({browser})=>{
 const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 const page=await context.newPage();await page.goto('http://127.0.0.1:5174/');await ready(page);
 const start=Date.now();await page.touchscreen.tap(80,180);await ready(page);await alignment(page,80,180);
 expect(Date.now()-start).toBeLessThan(1000);
 await page.touchscreen.tap(300,600);await page.touchscreen.tap(180,400);
 await ready(page);await alignment(page,180,400);await context.close();
});
