"""Format generated assets as WebP and measure alpha bounds; never repaint art."""
from pathlib import Path
from PIL import Image
import json

root = Path(__file__).resolve().parent.parent
manifest = json.loads((root / 'docs/huashen-art-generation.json').read_text(encoding='utf-8'))
paths = {}
for asset in manifest['assets']:
    source = Path(asset['result'].split(' as ', 1)[1].split(' by default.', 1)[0])
    im = Image.open(source)
    destination = root / 'prototype/assets' / (asset['name'] + '.webp')
    im.save(destination, 'WEBP', quality=90, method=6)
    paths[asset['name']] = im
    print(destination.name, im.size, destination.stat().st_size)

def rect(im, box, actor=False):
    # Visible bounds/pivots only; the generated alpha is retained in the asset.
    a = im.getchannel('A').crop(box)
    bounds = a.point(lambda v: 255 if v > 80 else 0).getbbox()
    if not bounds:
        raise ValueError(('Empty atlas cell', box))
    x, y, r, b = bounds
    absolute = [box[0]+x, box[1]+y, r-x, b-y]
    if actor:
        bottom = min(a.height, b)
        points = [xx for yy in range(max(y, bottom-12), bottom) for xx in range(x, r) if a.getpixel((xx, yy)) > 140]
        points.sort()
        px = points[len(points)//2] if points else (x+r)/2
        absolute += [box[0]+px, box[1]+bottom-2]
    return absolute

cuts = {'contract':[0,300,525,832,1120,1536], 'wedding':[0,298,528,836,1159,1536], 'yellowwind':[0,296,528,830,1118,1536]}
actors = []
for name, rows in cuts.items():
    im = paths['actors-'+name]
    actors.append([[rect(im, (col*256, rows[row], (col+1)*256, rows[row+1]), True) for col in range(4)] for row in range(5)])
im = paths['huashen-props']
boxes = [[(0,0,425,340),(430,0,900,340),(900,0,1130,340),(1135,0,1536,340)],[(0,341,430,680),(431,341,900,680),(905,341,1135,680),(1138,341,1536,680)],[(0,682,450,1024),(451,682,912,1024),(913,682,1145,1024),(1146,682,1536,1024)]]
props = [[rect(im, box) for box in row] for row in boxes]
(root/'prototype/huashen-uv.js').write_text('/* Measured alpha bounds and foot pivots from original generated atlases. */\nHuashenArt.configure('+json.dumps(actors,separators=(',',':'))+','+json.dumps(props,separators=(',',':'))+');\n',encoding='utf-8')
