"""Convert original image_gen atlases and record measured, non-destructive UVs."""
from pathlib import Path
import json
import sys
from PIL import Image

root = Path(__file__).resolve().parent.parent
manifest = json.loads((root / 'docs/heti-art-generation.json').read_text(encoding='utf-8'))
repacked = json.loads((root / 'docs/heti-art-repacking.json').read_text(encoding='utf-8'))
for revision in repacked['assets']:
    next(a for a in manifest['assets'] if a['name'] == revision['name'])['source'] = revision['source']
images = {}
for asset in manifest['assets']:
    im = Image.open(asset['source'])
    target = root / 'prototype/assets' / (asset['name'] + '.webp')
    if len(sys.argv) == 1 or asset['name'] in sys.argv[1:]:
        im.save(target, 'WEBP', quality=90, method=6)
    images[asset['name']] = im
    print(target.name, im.size, target.stat().st_size)

def rect(im, box, actor=False):
    alpha = im.getchannel('A').crop(box)
    bounds = alpha.point(lambda v: 255 if v > 80 else 0).getbbox()
    if not bounds:
        raise ValueError(('Empty atlas cell', box))
    x, y, r, b = bounds
    out = [box[0]+x, box[1]+y, r-x, b-y]
    if actor:
        feet = sorted(xx for yy in range(max(y, b-10), b) for xx in range(x, r)
                      if alpha.getpixel((xx, yy)) > 140)
        out += [box[0]+(feet[len(feet)//2] if feet else (x+r)/2), box[1]+b-2]
    return out

actors = []
for name in ['twinforge', 'lotusname', 'mirrorwell']:
    im = images['actors-'+name]
    # All row gutters are measured per column and verified in the pose gallery.
    rows = manifest.get('rowCuts', {}).get(name, [[0, 307, 614, 922, 1229, 1536]]*4)
    actors.append([[rect(im, (c*256, rows[c][r], (c+1)*256, rows[c][r+1]), True)
                    for c in range(4)] for r in range(5)])
props = images['heti-props']
prop_uv = [[rect(props, (c*384, r*1024//3, (c+1)*384, (r+1)*1024//3))
            for c in range(4)] for r in range(3)]
(root / 'prototype/heti-uv.js').write_text(
    '/* Measured alpha bounds and foot pivots; original source alpha is retained. */\n'
    'HetiArt.configure('+json.dumps(actors, separators=(',', ':'))+','
    +json.dumps(prop_uv, separators=(',', ':'))+');\n', encoding='utf-8')
