// Read-only alpha inspection. Writes UV metadata, never edits or rewrites artwork.
const fs=require('node:fs');
const path=require('node:path');
const {spawnSync}=require('node:child_process');
const files=['bosses-attack','bosses-walk','bestiary-exile-attack','bestiary-birth-attack','bestiary-river-attack'];
function gap(counts,point,radius){
  let best=[point,point],start=-1;
  for(let i=Math.max(0,point-radius);i<=Math.min(counts.length-1,point+radius);i++){
    if(counts[i]<=3){if(start<0)start=i;if(i-start>best[1]-best[0])best=[start,i];}else start=-1;
  }
  return Math.round((best[0]+best[1])/2);
}
const result={};
for(const file of files){
  const source=path.join(__dirname,'../prototype/assets',file+'.png');
  const info=JSON.parse(spawnSync('ffprobe',['-v','error','-show_entries','stream=width,height','-of','json',source],{encoding:'utf8'}).stdout).streams[0];
  const {width:w,height:h}=info,rows=file.startsWith('bosses')?3:4;
  const decoded=spawnSync('ffmpeg',['-v','error','-i',source,'-f','rawvideo','-pix_fmt','rgba','pipe:1'],{maxBuffer:32*1024*1024});
  if(decoded.status!==0)throw Error(decoded.stderr.toString());
  const raw=decoded.stdout,alpha=(x,y)=>raw[(y*w+x)*4+3],ys=Array(h).fill(0);
  for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(alpha(x,y)>64)ys[y]++;
  const yCuts=[0,...Array.from({length:rows-1},(_,i)=>gap(ys,Math.round((i+1)*h/rows),65)),h],rects=[],heights=[];
  for(let row=0;row<rows;row++){
    const xs=Array(w).fill(0);for(let y=yCuts[row];y<yCuts[row+1];y++)for(let x=0;x<w;x++)if(alpha(x,y)>64)xs[x]++;
    const xCuts=[0,...[1,2,3].map(i=>gap(xs,Math.round(i*w/4),50)),w],rowRects=[];
    for(let col=0;col<4;col++){
      let l=xCuts[col+1],r=xCuts[col],t=yCuts[row+1],b=yCuts[row];
      for(let y=yCuts[row];y<yCuts[row+1];y++)for(let x=xCuts[col];x<xCuts[col+1];x++)if(alpha(x,y)>64){l=Math.min(l,x);r=Math.max(r,x);t=Math.min(t,y);b=Math.max(b,y);}
      // The support area, rather than a weapon/robe's bounding center, anchors the body.
      let footLeft=r,footRight=l;
      for(let y=Math.max(t,b-Math.round((b-t)*.14));y<=b;y++)for(let x=l;x<=r;x++)if(alpha(x,y)>128){footLeft=Math.min(footLeft,x);footRight=Math.max(footRight,x);}
      rowRects.push([l,t,r-l+1,b-t+1,Math.round((footLeft+footRight)/2),b-2]);
    }
    rects.push(rowRects);const hs=rowRects.map(r=>r[3]).sort((a,b)=>a-b);heights.push(Math.round((hs[1]+hs[2])/2));
  }
  if(file==='bosses-walk'){
    // Visual inspection: the low bell/saber is not a supporting foot.
    rects[0].forEach((r,i)=>r[4]=[234,589,955,1318][i]);
    rects[1].forEach((r,i)=>r[4]=[240,615,974,1332][i]);
  }
  result[file]={width:w,height:h,rects,heights};
}
fs.writeFileSync(path.join(__dirname,'../docs/actor-atlas-metrics.json'),JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify(result));
