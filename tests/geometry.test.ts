import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { normalize, denormalize, placePhoto, selectPhoto, remember, type CatPhoto } from '../src/lib/geometry.ts';
const photos: CatPhoto[] = JSON.parse(readFileSync(new URL('../src/photos.json',import.meta.url),'utf8'));
test('annotated paws land at the requested pixel across desktop/mobile and all edges', () => {
  for(const viewport of [{width:1440,height:900},{width:390,height:844},{width:320,height:568},{width:2560,height:1440}]) {
    for(const photo of photos) for(const n of [{x:0,y:0},{x:1,y:1},{x:0,y:1},{x:1,y:0},{x:.37,y:.62}]) {
      const target=denormalize(n,viewport), placed=placePhoto(photo,target,viewport);
      assert.ok(Math.abs(placed.left+photo.paw.x*placed.width-target.x)<1e-8);
      assert.ok(Math.abs(placed.top+photo.paw.y*placed.height-target.y)<1e-8);
      assert.ok(placed.width>=viewport.width && placed.height>=viewport.height);
    }
  }
});
test('twenty-five consecutive selections do not repeat; recent history stays bounded',()=>{
  let history:string[]=[];const picked:string[]=[];
  for(let i=0;i<50;i++){
    const next=selectPhoto(photos,{x:.5,y:.5},history)!;
    assert.ok(!history.includes(next.id));picked.push(next.id);history=remember(history,next.id);
    assert.ok(history.length<=24);
  }
  assert.equal(new Set(picked.slice(0,25)).size,25);
});
test('failed photos are excluded and exhaustion is explicit',()=>{
  const first=selectPhoto(photos,{x:.4,y:.5})!;
  const failed=new Set([first.id]);assert.notEqual(selectPhoto(photos,{x:.4,y:.5},[],failed)?.id,first.id);
  assert.equal(selectPhoto(photos,{x:.5,y:.5},[],new Set(photos.map(p=>p.id))),undefined);
});
test('resize preserves the normalized target',()=>{
  const n=normalize({x:720,y:450},{width:1440,height:900});
  assert.deepEqual(denormalize(n,{width:390,height:844}),{x:195,y:422});
});
test('catalog is valid, unique, local and attributed',()=>{
  assert.equal(new Set(photos.map(p=>p.id)).size,photos.length);
  assert.ok(photos.length>=200);
  for(const p of photos){
    assert.ok(p.paw.x>=0&&p.paw.x<=1&&p.paw.y>=0&&p.paw.y<=1);
    assert.ok(p.width>0&&p.height>0&&p.photographer&&p.alt&&p.title);
    assert.ok(p.sourceUrl.startsWith('https://www.pexels.com/photo/'));
    assert.ok(existsSync(new URL('../public/'+p.src,import.meta.url)));
    assert.ok(existsSync(new URL('../public/'+p.thumbnail,import.meta.url)));
  }
});

test('startup catalog matches source geometry and has local format alternatives',()=>{
  const gallery = JSON.parse(readFileSync(new URL('../src/gallery.json',import.meta.url),'utf8'));
  assert.equal(gallery.length, photos.length);
  for(const p of gallery){
    const source=photos.find(x=>x.id===p.id)!;
    for(const key of ['id','src','width','height','paw','alt'] as const) assert.deepEqual(p[key],source[key]);
    if(p.avif) assert.ok(existsSync(new URL('../public/'+p.avif,import.meta.url)));
  }
});

test('nearby selections stay stable for preloading and avoid repeats across the canvas',()=>{
 for(const x of [0,.25,.5,.75,1])for(const y of [0,.25,.5,.75,1]){
  let history:string[]=[];
  for(let i=0;i<25;i++){
   const next=selectPhoto(photos,{x,y},history)!;
   assert.equal(selectPhoto(photos,{x,y},history)?.id,next.id);
   assert.ok(!history.includes(next.id));
   const fresh=photos.filter(p=>!history.includes(p.id));
   const d=(p:CatPhoto)=>(p.paw.x-x)**2+(p.paw.y-y)**2;
   assert.ok(d(next)<=Math.min(...fresh.map(d))+.025+1e-12);
   history=remember(history,next.id);
  }
 }
});


test('every photo has a bounded mobile asset and an embedded network-independent preview',()=>{
 const gallery = JSON.parse(readFileSync(new URL('../src/gallery.json',import.meta.url),'utf8'));
 for(const p of gallery){
  assert.ok(p.preview.startsWith('data:image/webp;base64,'));
  const bytes=Buffer.from(p.preview.split(',')[1],'base64');
  assert.equal(bytes.toString('ascii',0,4),'RIFF');
  assert.equal(bytes.toString('ascii',8,12),'WEBP');
  assert.ok(bytes.length<2000);
  assert.match(p.mobile,/^photos\/mobile\/[a-z0-9-]+-[a-f0-9]{12}\.webp$/);
  assert.ok(statSync(new URL('../public/'+p.mobile,import.meta.url)).size<=80000);
 }
});
