/* World props and inventory share the same inspectable material identity. */
const ItemCatalog=(()=>{
  const images=new Map();
  const url=id=>'assets/items/'+id+'.webp';
  function meta(id){const core=/^core(\d+)$/.exec(id);return {id,url:url(id),quality:core?'天材':id.includes('boss')?'守关':id.includes('elite')?'精英':'灵物',use:core?'用于突破'+Cultivation.realms[Number(core[1])]:'探索与构筑',color:core?'#d9bd7b':'#8dbbad'};}
  function image(id){if(!images.has(id)){const im=new Image();im.src=url(id);images.set(id,im);}return images.get(id);}
  function icon(id,label=''){return `<img class="item-icon" src="${url(id)}" alt="${label}" loading="lazy">`;}
  function draw(id,x,y,size=64,time=0){const im=image(id);if(!im.complete||!im.naturalWidth)return false;ctx.save();ctx.fillStyle='#0006';ctx.beginPath();ctx.ellipse(x,y+3,size*.34,size*.12,0,0,Math.PI*2);ctx.fill();const bob=Math.sin(time*2.2+x)*2;ctx.drawImage(im,x-size/2,y-size*.85+bob,size,size);ctx.restore();return true;}
  return {url,meta,icon,draw};
})();
