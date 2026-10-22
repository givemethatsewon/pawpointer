"""Generate versioned mobile images and embedded previews without changing geometry.
Run: uv run --no-project --with pillow python scripts/prepare-responsive.py
"""
from pathlib import Path
from PIL import Image
import base64, hashlib, io, json, statistics
root=Path(__file__).resolve().parent.parent
catalog=json.loads((root/'src/gallery.json').read_text())
mobile_dir=root/'public/photos/mobile';mobile_dir.mkdir(exist_ok=True)
sizes=[]
for photo in catalog:
    with Image.open(root/'public'/photo['src']) as image:
        preview=image.copy();preview.thumbnail((96,96))
        data=io.BytesIO();preview.save(data,format='WEBP',quality=35,method=6)
        photo['preview']='data:image/webp;base64,'+base64.b64encode(data.getvalue()).decode()
        mobile=image.copy();mobile.thumbnail((960,960))
        data=io.BytesIO();mobile.save(data,format='WEBP',quality=68,method=6)
        payload=data.getvalue()
        while len(payload)>80000:
            mobile.thumbnail((int(mobile.width*.8),int(mobile.height*.8)))
            data=io.BytesIO();mobile.save(data,format='WEBP',quality=62,method=6)
            payload=data.getvalue()
        digest=hashlib.sha256(payload).hexdigest()[:12]
        photo['mobile']=f'photos/mobile/{photo["id"]}-{digest}.webp'
        (root/'public'/photo['mobile']).write_bytes(payload)
        sizes.append(len(payload))
(root/'src/gallery.json').write_text(json.dumps(catalog,ensure_ascii=False,separators=(',',':'))+'\n')
print({'count':len(sizes),'mobile_total_bytes':sum(sizes),'mobile_median_bytes':statistics.median(sizes),'mobile_max_bytes':max(sizes)})
