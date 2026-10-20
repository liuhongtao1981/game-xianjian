// 语法检查：抽出 prototype/index.html 里的脚本并用 Function 编译（不执行）
const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '..', 'prototype', 'index.html');
const html = fs.readFileSync(file, 'utf8');
const scripts = [...html.matchAll(/<script(?:\s+src="([^"]+)")?>([\s\S]*?)<\/script>/g)];
if (!scripts.length) {
  console.error('未找到 <script> 块');
  process.exit(1);
}
try {
  for (const [,src,inline] of scripts){
    const source = src ? fs.readFileSync(path.resolve(path.dirname(file),src.split('?')[0]),'utf8') : inline;
    new Function(source);
    console.log('语法 OK · ' + (src || 'inline') + ' · ' + source.length + ' chars');
  }
} catch (e) {
  console.error('语法错误:', e.message);
  process.exit(1);
}
