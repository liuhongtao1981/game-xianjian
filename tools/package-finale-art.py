"""Convert image_gen output; measure alpha gutters and feet without editing pixels."""
from pathlib import Path
import json
import sys
from PIL import Image

root = Path(__file__).resolve().parent.parent
manifest = json.loads((root / 'docs/finale-art-generation.json').read_text(encoding='utf-8'))
repacked = root / 'docs/finale-art-repacking.json'
if repacked.exists():
    for revision in json.loads(repacked.read_text(encoding='utf-8'))['assets']:
        next(a for a in manifest['assets'] if a['name'] == revision['name'])['source'] = revision['source']
images = {}
for asset in manifest['assets']:
    im = Image.open(asset['source'])
    target = root / 'prototype/assets' / (asset['name'] + '.webp')
    if len(sys.argv) == 1 or asset['name'] in sys.argv[1:]:
        im.save(target, 'WEBP', quality=90, method=4)
    images[asset['name']] = im
    print(target.name, im.size, target.stat().st_size)

def column_cuts(im, columns):
    alpha = im.getchannel('A')
    counts = [sum(v > 80 for v in alpha.crop((x, 0, x+1, im.height)).get_flattened_data()) for x in range(im.width)]
    cuts = [0]
    for col in range(1, columns):
        ideal = round(col*im.width/columns)
        candidates = range(ideal-80, ideal+81)
        least = min(counts[x] for x in candidates)
        cut = min((x for x in candidates if counts[x] == least), key=lambda x: abs(x-ideal))
        if least > 4:
            raise ValueError(('Overlapping atlas columns', col, cut, least))
        cuts.append(cut)
    return cuts+[im.width]

def row_cuts(im, columns, rows, cols=None):
    alpha = im.getchannel('A').point(lambda v: 255 if v > 80 else 0)
    result = []
    for col in range(columns):
        strip = alpha.crop((cols[col] if cols else col*im.width//columns, 0, cols[col+1] if cols else (col+1)*im.width//columns, im.height))
        counts = [sum(v > 0 for v in strip.crop((0, y, strip.width, y+1)).get_flattened_data()) for y in range(im.height)]
        cuts = [0]
        for row in range(1, rows):
            ideal = round(row*im.height/rows)
            candidates = range(ideal-120, ideal+121)
            least = min(counts[y] for y in candidates)
            choices = [y for y in candidates if counts[y] == least]
            cut = min(choices, key=lambda y: abs(y-ideal))
            cuts.append(cut)
            if least > 4:
                raise ValueError(('Overlapping atlas rows', col, row, cut, least))
        result.append(cuts+[im.height])
    return result

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
measurements = {}
for name in ['lifemirror','scorpionecho','twinspring','ashfront','bloodrelic','nineledger','thornscript','falsebuddha','silkpledge','bonecitadel','sixivory','lifedeer','namelesspit','crownless','droughtgate','foldedarms','ownerless','returnstone']:
    im = images['actors-'+name]
    print('Measuring', name)
    cols = column_cuts(im, 4)
    rows = row_cuts(im, 4, 5, cols)
    measurements[name] = {'columns': cols, 'rows': rows}
    actors.append([[rect(im, (cols[c], rows[c][r], cols[c+1], rows[c][r+1]), True)
                    for c in range(4)] for r in range(5)])
props = []
for name in ['zhenxian','xuanxian','jinxian','taiyi','daluo','xianwang']:
    im = images[name+'-props']
    rows = row_cuts(im, 4, 3)
    measurements[name+'-props'] = rows
    props.append([[rect(im, (c*im.width//4, rows[c][r], (c+1)*im.width//4, rows[c][r+1]))
                   for c in range(4)] for r in range(3)])
(root / 'prototype/finale-uv.js').write_text(
    '/* Measured alpha bounds and foot pivots; original source alpha is retained. */\n'
    'FinaleArt.configure('+json.dumps(actors, separators=(',', ':'))+','
    +json.dumps(props, separators=(',', ':'))+');\n', encoding='utf-8')
(root / 'docs/finale-art-uv-measurements.json').write_text(json.dumps(measurements, indent=2), encoding='utf-8')
