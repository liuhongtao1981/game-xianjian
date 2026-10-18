// 从设定图（带纸底圆盘）生成游戏用透明精灵：去掉外圈纸底与裁剪
const fs = require('fs');
const path = require('path');

const src = path.join(__dirname, '..', 'docs', 'art');
const out = path.join(src, 'sprites');
fs.mkdirSync(out, { recursive: true });

const names = ['hero', 'imp', 'fox', 'snake', 'zombie', 'boss', 'chest'];
for (const name of names) {
  let s = fs.readFileSync(path.join(src, name + '.svg'), 'utf8');
  s = s.replace(/<clipPath[\s\S]*?<\/clipPath>\s*/g, '');
  s = s.replace(/<g id="bgdecor">[\s\S]*?<\/g>\s*/g, '');
  s = s.replace(/\s*clip-path="url\(#frame\)"/g, '');
  s = s.replace(/\s*<circle cx="256" cy="256" r="236"[^>]*\/>\s*/g, '\n');
  fs.writeFileSync(path.join(out, name + '.svg'), s);
  console.log('sprite:', name + '.svg');
}
