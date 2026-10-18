// Package only runtime files and give changed scripts/styles an immutable release URL.
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..'),source=path.join(root,'prototype'),output=path.join(root,'_site');
const version=encodeURIComponent(process.env.GITHUB_SHA||'local');
fs.mkdirSync(output,{recursive:true});
for(const name of fs.readdirSync(source)){
  if(name==='index.html'||/\.(js|css)$/.test(name))fs.copyFileSync(path.join(source,name),path.join(output,name));
}
function copyTree(from,to){fs.mkdirSync(to,{recursive:true});for(const item of fs.readdirSync(from,{withFileTypes:true})){const a=path.join(from,item.name),b=path.join(to,item.name);if(item.isDirectory())copyTree(a,b);else fs.copyFileSync(a,b);}}
copyTree(path.join(source,'assets'),path.join(output,'assets'));
const entry=path.join(output,'index.html');
const html=fs.readFileSync(entry,'utf8').replace(/(src|href)="([^"?]+\.(?:js|css))"/g,(_,attribute,file)=>`${attribute}="${file}?v=${version}"`);
fs.writeFileSync(entry,html);
fs.writeFileSync(path.join(output,'.nojekyll'),'');
fs.writeFileSync(path.join(output,'version.json'),JSON.stringify({revision:process.env.GITHUB_SHA||'local'}));
for(const file of ['index.html','assets/hero-motion.png','assets/audio/music/birth-field.mp3']){
  if(!fs.statSync(path.join(output,file)).size)throw new Error('Missing game resource: '+file);
}
console.log('Packaged game for GitHub Pages: '+version);
