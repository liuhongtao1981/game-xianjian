"""Package original generated art; measure visible bounds, retain source alpha."""
from pathlib import Path
from PIL import Image
import json

root = Path(__file__).resolve().parent.parent
manifest = json.loads((root / 'docs/lianxu-art-generation.json').read_text(encoding='utf-8'))
images = {}
for asset in manifest['assets']:
    source = Path(asset['result'].split(' as ', 1)[1].split(' by default.', 1)[0])
    im = Image.open(source)
    destination = root / 'prototype/assets' / (asset['name'] + '.webp')
    im.save(destination, 'WEBP', quality=90, method=6)
    images[asset['name']] = im
    print(destination.name, im.size, destination.stat().st_size)

def rect(im, box, actor=False):
    alpha = im.getchannel('A').crop(box)
    bounds = alpha.point(lambda v: 255 if v > 80 else 0).getbbox()
    if not bounds:
        raise ValueError(('Empty atlas cell', box))
    x, y, r, b = bounds
    out = [box[0]+x, box[1]+y, r-x, b-y]
    if actor:
        points = sorted(xx for yy in range(max(y, b-12), b) for xx in range(x, r)
                        if alpha.getpixel((xx, yy)) > 140)
        px = points[len(points)//2] if points else (x+r)/2
        out += [box[0]+px, box[1]+b-2]
    return out

# Gutters follow the actual generated poses; rows are not assumed to be equal height.
cuts = {'sunken': [0, 290, 526, 838, 1156, 1536],
        'whitebone': [0, 294, 501, 801, 1130, 1536],
        'shadowcity': [0, 287, 513, 801, 1116, 1536]}
actors = []
for name, rows in cuts.items():
    im = images['actors-'+name]
    actors.append([[rect(im, (col*256, rows[row], (col+1)*256, rows[row+1]), True)
                    for col in range(4)] for row in range(5)])
props = images['lianxu-props']
columns = [[0, 430, 800, 1130, 1536], [0, 445, 860, 1125, 1536], [0, 452, 900, 1127, 1536]]
prop_uv = [[rect(props, (cols[i], y, cols[i+1], bottom)) for i in range(4)]
           for cols, y, bottom in zip(columns, [0, 340, 680], [340, 680, 1024])]
(root / 'prototype/lianxu-uv.js').write_text(
    '/* Measured alpha bounds and foot pivots; source atlases remain unmodified. */\n'
    'LianxuArt.configure('+json.dumps(actors, separators=(',', ':'))+','
    +json.dumps(prop_uv, separators=(',', ':'))+');\n', encoding='utf-8')
