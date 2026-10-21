"""Build same-dimension AVIF alternatives and a small startup catalog. Pillow AVIF required."""
import concurrent.futures,json,pathlib,base64,io
from PIL import Image
root=pathlib.Path(__file__).resolve().parent.parent
photos=json.loads((root/'src/photos.json').read_text())
def encode(p):
 src=root/'public'/p['src'];dest=src.with_suffix('.avif')
 if not dest.exists() or dest.stat().st_mtime<src.stat().st_mtime:
  with Image.open(src) as im:im.save(dest,quality=65,speed=6,max_threads=2)
 with Image.open(dest) as im:im.load();assert im.size==(p['width'],p['height'])
 return {'id':p['id'],'webpBytes':src.stat().st_size,'avifBytes':dest.stat().st_size,'width':p['width'],'height':p['height']}
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:stats=list(pool.map(encode,photos))
# Prefer AVIF only where it saves bytes; WebP remains the fallback everywhere.
small=[{**{k:p[k] for k in ['id','src','width','height','paw','alt']},'avif':p['src'].replace('.webp','.avif') if s['avifBytes']<s['webpBytes'] else None} for p,s in zip(photos,stats)]
(root/'src/gallery.json').write_text(json.dumps(small,ensure_ascii=False,separators=(',',':'))+'\n')
(root/'docs/performance/v2/encodings.json').write_text(json.dumps(stats,indent=2)+'\n')
buf=io.BytesIO();Image.new('RGB',(1,1)).save(buf,format='AVIF',quality=50)
(root/'.work/perf-v2').mkdir(parents=True,exist_ok=True)
(root/'.work/perf-v2/avif-probe.txt').write_text(base64.b64encode(buf.getvalue()).decode())
print('Encoded',len(stats),'WebP bytes',sum(s['webpBytes'] for s in stats),'preferred bytes',sum(min(s['webpBytes'],s['avifBytes']) for s in stats))
