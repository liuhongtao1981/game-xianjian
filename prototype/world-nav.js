/* Normalized walkable land traced from the generated 1448x1086 terrain images.
 * Polygons form an overlapping UNION. Do not treat overlapping interior edges as walls.
 * Site order is three lore stones, one chest, one rest stop, then the boss entrance.
 * bossArena radii describe an ellipse; its rectangular bounds include off-land corners.
 */
const WorldNavData = [
  {
    id: "exile",
    spawn: {"x":0.22,"y":0.79},
    boss: {"x":0.79,"y":0.25},
    bossArena: {"shape":"ellipse","x":0.79,"y":0.25,"rx":0.17,"ry":0.18},
    polygons: [
      [[0.14,0.72],[0.16,0.57],[0.23,0.47],[0.36,0.39],[0.41,0.32],[0.38,0.26],[0.4,0.2],[0.52,0.17],[0.62,0.14],[0.69,0.19],[0.68,0.35],[0.79,0.4],[0.75,0.49],[0.64,0.54],[0.59,0.59],[0.55,0.64],[0.43,0.61],[0.38,0.66],[0.34,0.77],[0.27,0.85],[0.18,0.85]],
      [[0.345,0.79],[0.3411,0.812],[0.3296,0.8325],[0.3113,0.8501],[0.2875,0.8636],[0.2598,0.8721],[0.23,0.875],[0.2002,0.8721],[0.1725,0.8636],[0.1487,0.8501],[0.1304,0.8325],[0.1189,0.812],[0.115,0.79],[0.1189,0.768],[0.1304,0.7475],[0.1487,0.7299],[0.1725,0.7164],[0.2002,0.7079],[0.23,0.705],[0.2598,0.7079],[0.2875,0.7164],[0.3113,0.7299],[0.3296,0.7475],[0.3411,0.768]],
      [[0.97,0.25],[0.9639,0.2992],[0.9459,0.345],[0.9173,0.3844],[0.88,0.4145],[0.8366,0.4335],[0.79,0.44],[0.7434,0.4335],[0.7,0.4145],[0.6627,0.3844],[0.6341,0.345],[0.6161,0.2992],[0.61,0.25],[0.6161,0.2008],[0.6341,0.155],[0.6627,0.1156],[0.7,0.0855],[0.7434,0.0665],[0.79,0.06],[0.8366,0.0665],[0.88,0.0855],[0.9173,0.1156],[0.9459,0.155],[0.9639,0.2008]],
      [[0.12,0.155],[0.155,0.095],[0.24,0.095],[0.29,0.135],[0.29,0.185],[0.25,0.217],[0.15,0.21],[0.11,0.185]],
      [[0.27,0.145],[0.35,0.17],[0.43,0.205],[0.43,0.26],[0.35,0.235],[0.27,0.205]],
      [[0.53,0.54],[0.62,0.55],[0.72,0.63],[0.82,0.69],[0.83,0.76],[0.76,0.79],[0.68,0.71],[0.58,0.65],[0.51,0.63]],
      [[0.915,0.77],[0.9114,0.7894],[0.9009,0.8075],[0.8842,0.823],[0.8625,0.835],[0.8372,0.8424],[0.81,0.845],[0.7828,0.8424],[0.7575,0.835],[0.7358,0.823],[0.7191,0.8075],[0.7086,0.7894],[0.705,0.77],[0.7086,0.7506],[0.7191,0.7325],[0.7358,0.717],[0.7575,0.705],[0.7828,0.6976],[0.81,0.695],[0.8372,0.6976],[0.8625,0.705],[0.8842,0.717],[0.9009,0.7325],[0.9114,0.7506]]
    ],
    sites: [
      {"x":0.33,"y":0.54,"kind":"lore","name":"焚卷残碑","loreIndex":0},
      {"x":0.2,"y":0.15,"kind":"lore","name":"失声证词","loreIndex":1},
      {"x":0.81,"y":0.77,"kind":"lore","name":"断钟遗刻","loreIndex":2},
      {"x":0.25,"y":0.69,"kind":"chest","name":"行旅遗箱"},
      {"x":0.55,"y":0.38,"kind":"rest","name":"禅庭清泉"},
      {"x":0.69,"y":0.385,"kind":"boss","name":"封口禅坛"}
    ],
    camps: [[0.25,0.7],[0.32,0.57],[0.45,0.48],[0.38,0.22],[0.55,0.27],[0.59,0.59],[0.69,0.69],[0.79,0.76],[0.63,0.37]]
  },
  {
    id: "birth",
    spawn: {"x":0.2,"y":0.79},
    boss: {"x":0.77,"y":0.235},
    bossArena: {"shape":"ellipse","x":0.77,"y":0.235,"rx":0.18,"ry":0.18},
    polygons: [
      [[0.12,0.77],[0.19,0.64],[0.19,0.55],[0.25,0.46],[0.35,0.38],[0.42,0.3],[0.45,0.2],[0.6,0.16],[0.72,0.18],[0.76,0.37],[0.74,0.49],[0.71,0.57],[0.69,0.65],[0.58,0.69],[0.49,0.72],[0.39,0.7],[0.32,0.77],[0.27,0.86],[0.17,0.85]],
      [[0.33,0.8],[0.3266,0.8207],[0.3166,0.84],[0.3007,0.8566],[0.28,0.8693],[0.2559,0.8773],[0.23,0.88],[0.2041,0.8773],[0.18,0.8693],[0.1593,0.8566],[0.1434,0.84],[0.1334,0.8207],[0.13,0.8],[0.1334,0.7793],[0.1434,0.76],[0.1593,0.7434],[0.18,0.7307],[0.2041,0.7227],[0.23,0.72],[0.2559,0.7227],[0.28,0.7307],[0.3007,0.7434],[0.3166,0.76],[0.3266,0.7793]],
      [[0.96,0.235],[0.9535,0.2842],[0.9345,0.33],[0.9044,0.3694],[0.865,0.3995],[0.8192,0.4185],[0.77,0.425],[0.7208,0.4185],[0.675,0.3995],[0.6356,0.3694],[0.6055,0.33],[0.5865,0.2842],[0.58,0.235],[0.5865,0.1858],[0.6055,0.14],[0.6356,0.1006],[0.675,0.0705],[0.7208,0.0515],[0.77,0.045],[0.8192,0.0515],[0.865,0.0705],[0.9044,0.1006],[0.9345,0.14],[0.9535,0.1858]],
      [[0.335,0.145],[0.3314,0.1644],[0.3209,0.1825],[0.3042,0.198],[0.2825,0.21],[0.2572,0.2174],[0.23,0.22],[0.2028,0.2174],[0.1775,0.21],[0.1558,0.198],[0.1391,0.1825],[0.1286,0.1644],[0.125,0.145],[0.1286,0.1256],[0.1391,0.1075],[0.1558,0.092],[0.1775,0.08],[0.2028,0.0726],[0.23,0.07],[0.2572,0.0726],[0.2825,0.08],[0.3042,0.092],[0.3209,0.1075],[0.3314,0.1256]],
      [[0.25,0.17],[0.33,0.175],[0.43,0.235],[0.49,0.27],[0.43,0.34],[0.34,0.27],[0.25,0.22]],
      [[0.65,0.58],[0.73,0.58],[0.82,0.69],[0.85,0.75],[0.78,0.8],[0.69,0.73],[0.63,0.68]],
      [[0.925,0.775],[0.9214,0.797],[0.9109,0.8175],[0.8942,0.8351],[0.8725,0.8486],[0.8472,0.8571],[0.82,0.86],[0.7928,0.8571],[0.7675,0.8486],[0.7458,0.8351],[0.7291,0.8175],[0.7186,0.797],[0.715,0.775],[0.7186,0.753],[0.7291,0.7325],[0.7458,0.7149],[0.7675,0.7014],[0.7928,0.6929],[0.82,0.69],[0.8472,0.6929],[0.8725,0.7014],[0.8942,0.7149],[0.9109,0.7325],[0.9214,0.753]]
    ],
    sites: [
      {"x":0.34,"y":0.54,"kind":"lore","name":"血书残碑","loreIndex":0},
      {"x":0.23,"y":0.145,"kind":"lore","name":"无名诏令","loreIndex":1},
      {"x":0.82,"y":0.775,"kind":"lore","name":"陈府遗刻","loreIndex":2},
      {"x":0.3,"y":0.73,"kind":"chest","name":"行旅遗箱"},
      {"x":0.55,"y":0.42,"kind":"rest","name":"偏庭药囊"},
      {"x":0.67,"y":0.375,"kind":"boss","name":"司命刑庭"}
    ],
    camps: [[0.24,0.77],[0.32,0.65],[0.43,0.52],[0.35,0.25],[0.55,0.25],[0.59,0.61],[0.71,0.66],[0.79,0.77],[0.66,0.39]]
  },
  {
    id: "river",
    spawn: {"x":0.2,"y":0.71},
    boss: {"x":0.77,"y":0.225},
    bossArena: {"shape":"ellipse","x":0.77,"y":0.225,"rx":0.173,"ry":0.178},
    polygons: [
      [[0.235,0.625],[0.29,0.58],[0.37,0.55],[0.39,0.61],[0.31,0.7],[0.25,0.72]],
      [[0.277,0.598],[0.316,0.502],[0.33,0.39],[0.348,0.311],[0.407,0.312],[0.47,0.33],[0.539,0.291],[0.602,0.25],[0.683,0.329],[0.634,0.4],[0.597,0.439],[0.523,0.504],[0.469,0.536],[0.375,0.612],[0.312,0.648]],
      [[0.315,0.7],[0.3107,0.7272],[0.2983,0.7525],[0.2784,0.7742],[0.2525,0.7909],[0.2224,0.8014],[0.19,0.805],[0.1576,0.8014],[0.1275,0.7909],[0.1016,0.7742],[0.0817,0.7525],[0.0693,0.7272],[0.065,0.7],[0.0693,0.6728],[0.0817,0.6475],[0.1016,0.6258],[0.1275,0.6091],[0.1576,0.5986],[0.19,0.595],[0.2224,0.5986],[0.2525,0.6091],[0.2784,0.6258],[0.2983,0.6475],[0.3107,0.6728]],
      [[0.955,0.225],[0.9487,0.2742],[0.9302,0.32],[0.9008,0.3594],[0.8625,0.3895],[0.8179,0.4085],[0.77,0.415],[0.7221,0.4085],[0.6775,0.3895],[0.6392,0.3594],[0.6098,0.32],[0.5913,0.2742],[0.585,0.225],[0.5913,0.1758],[0.6098,0.13],[0.6392,0.0906],[0.6775,0.0605],[0.7221,0.0415],[0.77,0.035],[0.8179,0.0415],[0.8625,0.0605],[0.9008,0.0906],[0.9302,0.13],[0.9487,0.1758]],
      [[0.3,0.17],[0.2963,0.1868],[0.2853,0.2025],[0.2678,0.216],[0.245,0.2263],[0.2185,0.2328],[0.19,0.235],[0.1615,0.2328],[0.135,0.2263],[0.1122,0.216],[0.0947,0.2025],[0.0837,0.1868],[0.08,0.17],[0.0837,0.1532],[0.0947,0.1375],[0.1122,0.124],[0.135,0.1137],[0.1615,0.1072],[0.19,0.105],[0.2185,0.1072],[0.245,0.1137],[0.2678,0.124],[0.2853,0.1375],[0.2963,0.1532]],
      [[0.25,0.18],[0.29,0.18],[0.36,0.28],[0.395,0.33],[0.39,0.4],[0.35,0.38],[0.3,0.28],[0.23,0.24]],
      [[0.54,0.42],[0.65,0.46],[0.76,0.6],[0.82,0.64],[0.78,0.73],[0.7,0.69],[0.6,0.56],[0.51,0.5]],
      [[0.92,0.72],[0.9159,0.742],[0.9039,0.7625],[0.8849,0.7801],[0.86,0.7936],[0.8311,0.8021],[0.8,0.805],[0.7689,0.8021],[0.74,0.7936],[0.7151,0.7801],[0.6961,0.7625],[0.6841,0.742],[0.68,0.72],[0.6841,0.698],[0.6961,0.6775],[0.7151,0.6599],[0.74,0.6464],[0.7689,0.6379],[0.8,0.635],[0.8311,0.6379],[0.86,0.6464],[0.8849,0.6599],[0.9039,0.6775],[0.9159,0.698]],
      [[0.035,0.91],[0.005,0.88],[0.115,0.765],[0.165,0.79]]
    ],
    sites: [
      {"x":0.41,"y":0.46,"kind":"lore","name":"沉灯残碑","loreIndex":0},
      {"x":0.19,"y":0.17,"kind":"lore","name":"旧渡证词","loreIndex":1},
      {"x":0.79,"y":0.72,"kind":"lore","name":"缚舟遗刻","loreIndex":2},
      {"x":0.23,"y":0.69,"kind":"chest","name":"漂流遗箱"},
      {"x":0.55,"y":0.36,"kind":"rest","name":"渡头药囊"},
      {"x":0.66,"y":0.355,"kind":"boss","name":"河伯祭台"}
    ],
    camps: [[0.24,0.66],[0.32,0.59],[0.43,0.47],[0.33,0.29],[0.54,0.36],[0.61,0.5],[0.69,0.62],[0.79,0.72],[0.63,0.34]]
  },
];

// New terrain has independent geometry; the first nine camp IDs stay stable for old saves.
for(let i=3;i<6;i++){
 const ellipse=(x,y,rx,ry)=>Array.from({length:32},(_,n)=>[x+Math.cos(n*Math.PI/16)*rx,y+Math.sin(n*Math.PI/16)*ry]);
 const corridors=[[[.12,.82],[.30,.88],[.57,.55],[.70,.43],[.69,.28],[.57,.32],[.42,.49],[.25,.65]],[[.15,.16],[.29,.12],[.47,.39],[.45,.53],[.35,.42],[.23,.26]],[[.48,.48],[.57,.43],[.79,.67],[.86,.79],[.72,.83],[.65,.65]]];
 WorldNavData.push({id:ChapterCatalog.get(i).id,spawn:{x:.20,y:.80},boss:{x:.78,y:.24},bossArena:{x:.78,y:.24,rx:.14,ry:.16},polygons:[...corridors,ellipse(.20,.80,.14,.12),ellipse(.20,.20,.15,.13),ellipse(.79,.76,.15,.13),ellipse(.78,.24,.18,.20)],
 sites:[{x:.36,y:.58,kind:'lore',name:'旧契残碑',loreIndex:0},{x:.20,y:.20,kind:'lore',name:'隐名证词',loreIndex:1},{x:.79,y:.76,kind:'lore',name:'劫痕遗刻',loreIndex:2},{x:.23,y:.75,kind:'chest',name:'寻圣行囊'},{x:.55,y:.43,kind:'rest',name:'山泉药庐'},{x:.65,y:.39,kind:'boss',name:'守关祭坛'}],
 camps:[[.25,.76],[.33,.65],[.43,.52],[.20,.21],[.57,.38],[.57,.58],[.68,.66],[.79,.76],[.65,.39]]});
}
// Later trilogies own independent routes; existing chapter IDs and geometry stay stable.
for(const c of LaterChapters){const l=c.layout,along=(route,t)=>{const f=t*(route.length-1),j=Math.min(route.length-2,Math.floor(f)),k=f-j;return [route[j][0]+(route[j+1][0]-route[j][0])*k,route[j][1]+(route[j+1][1]-route[j][1])*k];};
 const pos=[l.hub,l.left,l.right,[l.spawn[0]+.035,l.spawn[1]-.025],along(l.main,.61),along(l.main,.82)];
 WorldNavData.push({id:c.id,spawn:{x:l.spawn[0],y:l.spawn[1]},boss:{x:l.boss[0],y:l.boss[1]},bossArena:{x:l.boss[0],y:l.boss[1],rx:.15,ry:.16},polygons:[],sites:pos.map((p,i)=>({x:p[0],y:p[1],kind:['lore','lore','lore','chest','rest','boss'][i],name:c.siteNames[i],...(i<3?{loreIndex:i}:{})})),camps:[along(l.main,.03),along(l.main,.17),along(l.main,.34),l.left,along(l.upper,.5),along(l.main,.5),along(l.lower,.6),l.right,along(l.main,.76)]});
}
WorldNavData.forEach((d,index)=>{
 const c=ChapterCatalog.get(index);d.width=c.width;d.height=c.height;
 const additions=index<3?[[.24,.78],[.29,.62],[.39,.50],[.47,.42],[.49,.27],[.25,.18],[.60,.51],[.74,.72],[.62,.36]]:[[.18,.79],[.29,.71],[.38,.57],[.48,.48],[.35,.31],[.23,.19],[.64,.59],[.76,.71],[.60,.41]];
 d.camps.push(...additions);d.elites=[3,7,11,15];
 d.regions=index<3?['旧路山门','证词支境','残卷外庭','守关禁坛']:index===3?['碎石驿','镇契碑林','断锁峡道','压山坛']:index===4?['荒驿前街','藏籍山寨','追名峡口','问籍刑庭']:['芦洲旧渡','锁鳞浅滩','龙骨长桥','沉鳞龙渊'];
 const points=[d.spawn,{x:d.sites[1].x,y:d.sites[1].y},{x:d.sites[2].x,y:d.sites[2].y},{x:d.sites[4].x,y:d.sites[4].y}];
 for(let j=0;j<2;j++){const p=points[j+1];d.sites.push({x:p.x+.025,y:p.y+.025,kind:'chest',name:['隐径珍藏','远行遗匣'][j]},{x:p.x-.025,y:p.y+.025,kind:'rest',name:'旅人药囊'});}
 points.forEach((p,j)=>d.sites.push({x:p.x+.035,y:p.y,kind:'station',region:j,name:d.regions[j]+'驿站'}));
});

// Match the generated plazas and bridges in world space, rather than a bounding rectangle.
for(let i=3;i<6;i++){
 const d=WorldNavData[i],ellipse=(x,y,rx,ry)=>Array.from({length:40},(_,n)=>[x+Math.cos(n*Math.PI/20)*rx,y+Math.sin(n*Math.PI/20)*ry]);
 const bridge=(x,y,tx,ty,w)=>{const dx=(tx-x)*d.width,dy=(ty-y)*d.height,len=Math.hypot(dx,dy),ox=-dy/len*w/d.width,oy=dx/len*w/d.height;return [[x+ox,y+oy],[tx+ox,ty+oy],[tx-ox,ty-oy],[x-ox,y-oy]];};
 d.polygons=[ellipse(.20,.78,.145,.15),ellipse(.46,.45,.09,.09),ellipse(.19,.17,.14,.13),ellipse(.79,.75,.14,.15),ellipse(.78,.23,.17,.185),bridge(.20,.78,.46,.45,230),bridge(.46,.45,.78,.23,230),bridge(.19,.17,.46,.45,220),bridge(.46,.45,.79,.75,220)];
 d.spawn={x:.20,y:.80};d.sites[5]={...d.sites[5],x:.64,y:.32};
}

// Independently traced routes for the remade opening trilogy.
const OpeningLayouts=[
 {spawn:[.39,.80],hub:[.46,.47],left:[.20,.15],right:[.81,.73],boss:[.81,.19],main:[[.39,.80],[.43,.62],[.46,.47],[.60,.40],[.67,.24],[.81,.19]],upper:[[.46,.47],[.42,.32],[.35,.24],[.20,.15]],lower:[[.46,.47],[.60,.48],[.70,.62],[.81,.73]]},
 {spawn:[.32,.76],hub:[.51,.39],left:[.18,.13],right:[.80,.65],boss:[.81,.18],main:[[.32,.76],[.37,.61],[.46,.48],[.51,.39],[.58,.30],[.70,.25],[.81,.18]],upper:[[.51,.39],[.48,.23],[.36,.21],[.18,.13]],lower:[[.51,.39],[.60,.46],[.65,.53],[.80,.65]]},
 {spawn:[.19,.71],hub:[.46,.30],left:[.20,.13],right:[.85,.71],boss:[.80,.18],main:[[.19,.71],[.31,.52],[.39,.39],[.46,.30],[.63,.23],[.80,.18]],upper:[[.46,.30],[.35,.22],[.20,.13]],lower:[[.46,.30],[.58,.42],[.69,.56],[.85,.71]]}
];
OpeningLayouts.forEach((l,i)=>{
 const d=WorldNavData[i],ellipse=(p,rx,ry)=>Array.from({length:40},(_,n)=>[p[0]+Math.cos(n*Math.PI/20)*rx,p[1]+Math.sin(n*Math.PI/20)*ry]);
 const bridge=(p,q,w=180)=>{const dx=(q[0]-p[0])*d.width,dy=(q[1]-p[1])*d.height,len=Math.hypot(dx,dy),x=-dy/len*w/d.width,y=dx/len*w/d.height;return [[p[0]+x,p[1]+y],[q[0]+x,q[1]+y],[q[0]-x,q[1]-y],[p[0]-x,p[1]-y]];};
 d.polygons=[ellipse(l.spawn,.105,.10),ellipse(l.hub,.09,.095),ellipse(l.left,.105,.085),ellipse(l.right,.105,.10),ellipse(l.boss,.145,.135)];
 for(const route of [l.main,l.upper,l.lower])for(let j=1;j<route.length;j++){d.polygons.push(bridge(route[j-1],route[j]));d.polygons.push(ellipse(route[j],.036,.05));}
 d.spawn={x:l.spawn[0],y:l.spawn[1]};d.boss={x:l.boss[0],y:l.boss[1]};d.bossArena={...d.boss,rx:.13,ry:.12};
 const along=(route,t)=>{const f=t*(route.length-1),j=Math.min(route.length-2,Math.floor(f)),k=f-j;return [route[j][0]+(route[j+1][0]-route[j][0])*k,route[j][1]+(route[j+1][1]-route[j][1])*k];};
 d.camps=[along(l.main,.02),along(l.main,.16),along(l.main,.32),l.left,along(l.upper,.50),along(l.main,.48),along(l.lower,.65),l.right,along(l.main,.74),[l.spawn[0]+.035,l.spawn[1]+.025],along(l.main,.25),along(l.main,.4),along(l.upper,.75),along(l.main,.61),along(l.lower,.35),along(l.lower,.86),[l.right[0]+.035,l.right[1]+.015],along(l.main,.85)];
 const mid=along(l.main,.62),entry=along(l.main,.80),positions=[l.hub,l.left,l.right,[l.spawn[0]+.04,l.spawn[1]-.03],mid,entry];
 for(let j=0;j<6;j++)Object.assign(d.sites[j],{x:positions[j][0],y:positions[j][1]});
 const extras=[l.left,l.left,l.right,l.right,l.spawn,l.left,l.right,mid];for(let j=6;j<14;j++){const p=extras[j-6];Object.assign(d.sites[j],{x:p[0]+(j%2?.025:-.025),y:p[1]+.025});}
});

LaterChapters.forEach((c,i)=>{const d=WorldNavData[i+6],l=c.layout,along=(route,t)=>{const f=t*(route.length-1),j=Math.min(route.length-2,Math.floor(f)),k=f-j;return [route[j][0]+(route[j+1][0]-route[j][0])*k,route[j][1]+(route[j+1][1]-route[j][1])*k];};d.regions=c.regions;
 const extra=[l.spawn,along(l.main,.26),along(l.main,.42),along(l.upper,.72),along(l.main,.60),along(l.lower,.32),along(l.lower,.86),[l.right[0]+.03,l.right[1]],along(l.main,.88)];d.camps.splice(9,9,...extra);
 const spots=[l.left,l.left,l.right,l.right,l.spawn,l.left,l.right,along(l.main,.61)];for(let j=6;j<14;j++)Object.assign(d.sites[j],{x:spots[j-6][0]+(j%2?.02:-.02),y:spots[j-6][1]+.02,name:j>=10?c.regions[j-10]+'驿站':j%2?(c.realm===7?'渡劫药囊':c.realm===6?'归誓药囊':c.realm===5?'补天药囊':c.realm===4?'归名药囊':c.realm===3?'化神药囊':'养魂药囊'):(c.realm===7?'羽化仙匣':c.realm===6?'雷液遗藏':c.realm===5?'七彩芝匣':c.realm===4?'并蒂莲匣':c.realm===3?'晶髓遗藏':'神木遗藏')});
});

/* A single scene owns the ground, curved deck edges, rails and collision geometry. */
const TerrainScene=(()=>{
  const version=2,tile=256,atlas=new Image(),infantAtlas=new Image(),huashenAtlas=new Image(),lianxuAtlas=new Image(),hetiAtlas=new Image(),dachengAtlas=new Image(),dujieAtlas=new Image(),props=new Image();dachengAtlas.src='assets/dacheng-terrain.webp';dujieAtlas.src='assets/dujie-terrain.webp';hetiAtlas.src='assets/heti-terrain.webp';lianxuAtlas.src='assets/lianxu-terrain.webp';huashenAtlas.src='assets/huashen-terrain.webp';infantAtlas.src='assets/infant-terrain.webp';atlas.src='assets/terrain-materials-v1.webp';props.src='assets/terrain-props-v1.webp';
  const scenes=[],paths=new Map();
  const ellipse=(x,y,rx,ry)=>Array.from({length:64},(_,i)=>[x+Math.cos(i*Math.PI/32)*rx,y+Math.sin(i*Math.PI/32)*ry]);
  function inside(poly,x,y){let hit=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++)if((poly[i][1]>y)!==(poly[j][1]>y)&&x<(poly[j][0]-poly[i][0])*(y-poly[i][1])/(poly[j][1]-poly[i][1])+poly[i][0])hit=!hit;return hit;}
  function curve(input){
    const out=[];
    for(let j=0;j<input.length-1;j++){
      const a=input[Math.max(0,j-1)],b=input[j],c=input[j+1],d=input[Math.min(input.length-1,j+2)],n=Math.ceil(Math.hypot(c[0]-b[0],c[1]-b[1])/36);
      for(let k=0;k<n;k++){const t=k/n;out.push([0,1].map(i=>.5*((2*b[i])+(-a[i]+c[i])*t+(2*a[i]-5*b[i]+4*c[i]-d[i])*t*t+(-a[i]+3*b[i]-3*c[i]+d[i])*t*t*t)));}
    }return [...out,input[input.length-1]];
  }
  for(let stage=0;stage<ChapterCatalog.playable;stage++){
    const d=WorldNavData[stage],w=d.width,h=d.height;
    const l=stage>=6?LaterChapters[stage-6].layout:stage<3?OpeningLayouts[stage]:{spawn:[.20,.80],hub:[.46,.45],left:[.19,.17],right:[.79,.75],boss:[.78,.23],main:[[.20,.80],[.28,.66],[.40,.57],[.46,.45],[.59,.38],[.67,.29],[.78,.23]],upper:[[.46,.45],[.38,.34],[.30,.28],[.19,.17]],lower:[[.46,.45],[.59,.49],[.65,.64],[.79,.75]]};
    const lines=[l.main,l.upper,stage===2?[[.46,.30],[.60,.34],[.71,.43],[.74,.56],[.76,.66],[.85,.71]]:l.lower];
    const plazas=[l.spawn,l.hub,l.left,l.right,l.boss].map((p,i)=>({x:p[0]*w,y:p[1]*h,rx:w*(i===4?(stage<3?.145:.18):i===1?.09:.105),ry:h*(i===4?(stage<3?.135:.20):i===1?.095:.10)}));
    const polygons=plazas.map(p=>ellipse(p.x,p.y,p.rx,p.ry));
    const routes=lines.map((line,id)=>{
      const points=curve(line.map(p=>[p[0]*w,p[1]*h])),half=stage===2&&id===2?108:stage<3?142:174;
      const left=[],right=[],widths=[];
      points.forEach((p,i)=>{const a=points[Math.max(0,i-1)],b=points[Math.min(points.length-1,i+1)],dx=b[0]-a[0],dy=b[1]-a[1],len=Math.hypot(dx,dy),width=half*(1+.07*Math.sin(i*.08+id));widths.push(width);left.push([p[0]-dy/len*width,p[1]+dx/len*width]);right.push([p[0]+dy/len*width,p[1]-dx/len*width]);});
      for(let i=1;i<points.length;i++)polygons.push([left[i-1],left[i],right[i],right[i-1]]);
      return {points,left,right,widths};
    });
    // Normalize winding: overlapping clip subpaths must form a union, never cut holes.
    for(const poly of polygons){let area=0;for(let i=0;i<poly.length;i++){const a=poly[i],b=poly[(i+1)%poly.length];area+=a[0]*b[1]-b[0]*a[1];}if(area<0)poly.reverse();}
    const scene={stage,version,plazas,routes,polygons,props:[],obstacles:[]};
    const safe=(x,y,r=0)=>polygons.some(p=>inside(p,x,y))&&Array.from({length:8},(_,i)=>i*Math.PI/4).every(a=>polygons.some(p=>inside(p,x+Math.cos(a)*r,y+Math.sin(a)*r)));
    const project=(x,y)=>{if(safe(x,y,48))return [x,y];let best=Infinity,out=[plazas[0].x,plazas[0].y];for(const route of routes)for(const p of route.points){const dist=(x-p[0])**2+(y-p[1])**2;if(dist<best){best=dist;out=p;}}return out;};
    d.camps=d.camps.map(([x,y])=>{const p=project(x*w,y*h);return [p[0]/w,p[1]/h];});
    for(const s of d.sites){const p=project(s.x*w,s.y*h);s.x=p[0]/w;s.y=p[1]/h;}
    for(let i=0;i<plazas.length;i++){
      const p=plazas[i];for(let k=0;k<18;k++){const a=k*Math.PI/9+.13,point={x:p.x+Math.cos(a)*(p.rx+24),y:p.y+Math.sin(a)*(p.ry+24),kind:k%6===0?'lantern':k%3===0?'tree':'rock',seed:k+i*17};scene.props.push(point);}
      if(i<4)scene.props.push({x:p.x,y:p.y-p.ry-25,kind:'gate',seed:i});
      if(i===2||i===3)scene.props.push({x:p.x-p.rx*.65,y:p.y+p.ry*.9,kind:'shrine',seed:i});
      if(i===4&&stage>=6)for(const side of [-1,1]){scene.props.push({x:p.x+side*520,y:p.y-260,kind:'shrine',seed:stage});scene.props.push({x:p.x+side*410,y:p.y+90,kind:'lantern',seed:stage});}
      if(i!==4)for(let k=0;k<3;k++){const a=k*2.1+.7,x=p.x+Math.cos(a)*(p.rx-75),y=p.y+Math.sin(a)*(p.ry-75);if(d.camps.some(([cx,cy])=>Math.hypot(cx*w-x,cy*h-y)<100)||d.sites.some(s=>Math.hypot(s.x*w-x,s.y*h-y)<110))continue;scene.props.push({x,y,kind:'pillar',seed:k});scene.obstacles.push({x,y,r:27});}
    }
    d.polygons=polygons.map(poly=>poly.map(([x,y])=>[x/w,y/h]));d.terrainVersion=version;scenes.push(scene);
  }
  function geometry(stage){return scenes[stage];}
  function blocked(stage,x,y,r=0){return scenes[stage].obstacles.some(o=>Math.hypot(x-o.x,y-o.y)<o.r+r);}
  function landPath(stage){if(!paths.has(stage)){const p=new Path2D();for(const poly of scenes[stage].polygons){p.moveTo(...poly[0]);for(let i=1;i<poly.length;i++)p.lineTo(...poly[i]);p.closePath();}paths.set(stage,p);}return paths.get(stage);}
  function strokeLine(pen,pts){pen.beginPath();pts.forEach(([x,y],i)=>i?pen.lineTo(x,y):pen.moveTo(x,y));pen.stroke();}
  function draw(pen,stage,view,time){
    const s=scenes[stage],b=WorldNavData[stage],water=stage===2||stage===5||stage===12||stage===20||stage===22;
    const bg=pen.createLinearGradient(0,view.y,0,view.y+view.h);bg.addColorStop(0,stage>=18?['#31221c','#36231c','#112c2a','#3c3625','#172d3b','#25233b'][stage-18]:stage>=15?['#32261b','#282039','#142c2b'][stage-15]:stage>=12?['#0f2b35','#33302e','#211b35'][stage-12]:stage>=9?['#2b2020','#241e2b','#675039'][stage-9]:water?'#102b30':'#121b1a');bg.addColorStop(1,stage>=18?['#180f10','#1c1010','#081819','#171710','#0b1824','#101321'][stage-18]:stage>=15?['#17130f','#131322','#091b19'][stage-15]:stage>=12?['#08171f','#16191d','#0d101c'][stage-12]:stage>=9?['#171415','#15131d','#302a24'][stage-9]:water?'#071c25':'#080e13');pen.fillStyle=bg;pen.fillRect(view.x,view.y,view.w,view.h);
    if(water){pen.strokeStyle='#709f9b18';pen.lineWidth=1;for(let y=Math.floor(view.y/70)*70;y<view.y+view.h;y+=70){pen.beginPath();for(let x=view.x-30;x<view.x+view.w+40;x+=25){const yy=y+Math.sin(x*.012+time*.35)*8; x===view.x-30?pen.moveTo(x,yy):pen.lineTo(x,yy);}pen.stroke();}}
    const path=landPath(stage);pen.save();pen.shadowColor='#000c';pen.shadowBlur=24;pen.shadowOffsetY=18;pen.fillStyle='#3d4845';pen.fill(path);pen.restore();
    pen.strokeStyle=water?'#54746c':'#4e5146';pen.lineWidth=12;pen.stroke(path);
    pen.save();pen.clip(path);
    const material=stage>=21?dujieAtlas:stage>=18?dachengAtlas:stage>=15?hetiAtlas:stage>=12?lianxuAtlas:stage>=9?huashenAtlas:stage>=6?infantAtlas:atlas;
    if(stage>=6&&material.complete&&material.naturalWidth){
      const paint=(row,area)=>{for(let y=Math.floor(area.y/tile);y<=Math.floor((area.y+area.h)/tile);y++)for(let x=Math.floor(area.x/tile);x<=Math.floor((area.x+area.w)/tile);x++){pen.drawImage(material,(stage%3)*512,row*512,512,512,x*tile,y*tile,tile+.5,tile+.5);}};
      // Continuous decks first, then exact curved plaza surfaces. Cell centres must
      // never decide terrain boundaries: that creates square holes along banks.
      paint(1,view);
      for(const p of s.plazas){const x=Math.max(view.x,p.x-p.rx),y=Math.max(view.y,p.y-p.ry),right=Math.min(view.x+view.w,p.x+p.rx),bottom=Math.min(view.y+view.h,p.y+p.ry);if(right<x||bottom<y)continue;pen.save();pen.beginPath();pen.ellipse(p.x,p.y,p.rx,p.ry,0,0,Math.PI*2);pen.clip();paint(0,{x,y,w:right-x,h:bottom-y});pen.restore();}
      pen.fillStyle='#03131712';pen.fillRect(view.x,view.y,view.w,view.h);
    }else {
    for(let y=Math.floor(view.y/tile);y<=Math.floor((view.y+view.h)/tile);y++)for(let x=Math.floor(view.x/tile);x<=Math.floor((view.x+view.w)/tile);x++){
      const material=stage>=21?dujieAtlas:stage>=18?dachengAtlas:stage>=15?hetiAtlas:stage>=12?lianxuAtlas:stage>=9?huashenAtlas:stage>=6?infantAtlas:atlas;
      if(material.complete&&material.naturalWidth){pen.save();pen.translate(x*tile+tile/2,y*tile+tile/2);const seed=Math.abs((x*73856093)^(y*19349663));pen.rotate((seed%4)*Math.PI/2);const column=stage>=6?(stage-6)%3:stage%3,row=stage>=6?(s.plazas.some(p=>Math.hypot((x*tile-p.x)/p.rx,(y*tile-p.y)/p.ry)<1)?0:1):Math.floor(stage/3);pen.drawImage(material,column*512,row*512,512,512,-tile/2,-tile/2,tile+.5,tile+.5);pen.fillStyle='#031317'+['12','08','18','0b'][seed%4];pen.fillRect(-tile/2,-tile/2,tile+1,tile+1);pen.restore();}else {pen.fillStyle=['#3b4744','#423b36','#294448','#66543b','#3b4141','#244143','#44352e','#233b32','#403c4c','#56423b','#4a3d50','#b19158','#436166','#9c978a','#423a52','#54452f','#443c56','#2d5148','#4b302c','#51402d','#25443e','#60543c','#35566a','#3e3b5a'][stage];pen.fillRect(x*tile,y*tile,tile,tile);}
    }
    }
    if(stage>=6){pen.fillStyle=['#22180d28','#071e1938','#14102045','#37141418','#25152520','#ab72200a','#09263418','#29262212','#25103412','#3d230c20','#33204416','#0d30271c','#441a1318','#4d281018','#0a302b18','#4a401518','#12395518','#29204418'][stage-6];pen.fillRect(view.x,view.y,view.w,view.h);}
    // Foundation wear and fine joints are drawn in world units, independent of bitmap scale.
    pen.strokeStyle='#0000001c';pen.lineWidth=1;for(let y=Math.floor(view.y/64)*64;y<view.y+view.h;y+=64){pen.beginPath();pen.moveTo(view.x,y);pen.lineTo(view.x+view.w,y);pen.stroke();}
    for(const p of s.plazas){if(p.x+p.rx<view.x||p.x-p.rx>view.x+view.w||p.y+p.ry<view.y||p.y-p.ry>view.y+view.h)continue;pen.save();pen.translate(p.x,p.y);pen.scale(1,p.ry/p.rx);pen.strokeStyle='#b3b19337';pen.lineWidth=3;for(const f of [.80,.84,.95]){pen.beginPath();pen.arc(0,0,p.rx*f,0,Math.PI*2);pen.stroke();}pen.lineWidth=1;for(let i=0;i<36;i++){const a=i*Math.PI/18;strokeLine(pen,[[Math.cos(a)*p.rx*.8,Math.sin(a)*p.rx*.8],[Math.cos(a)*p.rx*.84,Math.sin(a)*p.rx*.84]]);}pen.restore();}
    pen.restore();
    // Rails sit outside the exact walkable deck; slab seams follow its curve.
    for(const r of s.routes){
      const visible=pts=>pts.some(([x,y])=>x>view.x-180&&x<view.x+view.w+180&&y>view.y-180&&y<view.y+view.h+180);
      if(!visible(r.points))continue;
      const deckEdge=edge=>{pen.beginPath();let connected=false;for(let i=0;i<edge.length;i++){const [x,y]=edge[i];if(s.plazas.some(p=>Math.hypot((x-p.x)/p.rx,(y-p.y)/p.ry)<1.015)){connected=false;continue;}if(connected)pen.lineTo(x,y);else pen.moveTo(x,y);connected=true;}pen.stroke();};
      pen.lineCap='round';for(const edge of [r.left,r.right]){pen.strokeStyle='#0a1419';pen.lineWidth=14;deckEdge(edge);pen.strokeStyle=stage===3?'#b9a06e':'#939b8b';pen.lineWidth=6;deckEdge(edge);pen.strokeStyle='#d6d2ab4a';pen.lineWidth=1;deckEdge(edge);}
      for(let i=1;i<r.points.length;i+=2){const p=r.points[i];if(p[0]<view.x-200||p[0]>view.x+view.w+200||p[1]<view.y-200||p[1]>view.y+view.h+200)continue;if(s.plazas.some(q=>Math.hypot((p[0]-q.x)/q.rx,(p[1]-q.y)/q.ry)<.96))continue;
        pen.strokeStyle='#09161766';pen.lineWidth=2;strokeLine(pen,[r.left[i],r.right[i]]);
        if(i%6===1)for(const edge of [r.left,r.right]){const [x,y]=edge[i];pen.fillStyle='#182528';pen.fillRect(x-6,y-18,12,23);pen.fillStyle='#a5a38d';pen.fillRect(x-8,y-22,16,7);}
      }
    }
  }
  function drawProps(pen,stage,view,time){
    for(const o of scenes[stage].props){if(o.x<view.x-220||o.x>view.x+view.w+220||o.y<view.y-100||o.y>view.y+view.h+220)continue;
      pen.save();pen.translate(o.x,o.y);pen.fillStyle='#0007';pen.beginPath();pen.ellipse(4,9,o.kind==='gate'?125:32,12,0,0,Math.PI*2);pen.fill();
      if(stage>=18&&BeyondArt.drawProp(pen,o,stage,time)){pen.restore();continue;}
      if(stage>=15&&stage<18&&HetiArt.drawProp(pen,o,stage,time)){pen.restore();continue;}
      if(stage>=12&&stage<15&&LianxuArt.drawProp(pen,o,stage,time)){pen.restore();continue;}
      if(stage>=9&&stage<12&&HuashenArt.drawProp(pen,o,stage,time)){pen.restore();continue;}
      if(stage>=6&&stage<9&&InfantArt.drawProp(pen,o,stage,time)){pen.restore();continue;}
      if(props.complete&&props.naturalWidth){const i={gate:0,lantern:1,rock:2,pillar:3,tree:4,shrine:5}[o.kind],size={gate:310,lantern:105,rock:145+(o.seed%3)*17,pillar:130,tree:330,shrine:220}[o.kind];pen.drawImage(props,i%3*512,Math.floor(i/3)*512,512,512,-size/2,-size*.96,size,size);pen.restore();continue;}
      if(o.kind==='gate'){
        pen.fillStyle='#4a3b30';pen.strokeStyle='#94816a';pen.lineWidth=2;for(const x of [-98,88]){pen.fillRect(x,-122,12,126);pen.strokeRect(x,-122,12,126);pen.fillStyle='#59605a';pen.fillRect(x-6,-8,24,12);pen.fillStyle='#4a3b30';}
        const g=pen.createLinearGradient(0,-155,0,-108);g.addColorStop(0,'#737c69');g.addColorStop(.4,'#243b3c');g.addColorStop(1,'#122329');pen.fillStyle=g;pen.beginPath();pen.moveTo(-143,-117);pen.quadraticCurveTo(-115,-124,-104,-149);pen.quadraticCurveTo(0,-130,104,-149);pen.quadraticCurveTo(115,-124,143,-117);pen.lineTo(127,-110);pen.lineTo(-127,-110);pen.closePath();pen.fill();pen.stroke();pen.fillStyle='#806f48';pen.fillRect(-26,-111,52,29);pen.fillStyle='#d6c390';pen.font='18px KaiTi';pen.textAlign='center';pen.fillText(['禅','诏','渡','契','籍','鳞','愿','风','骨'][stage],0,-90);
      }else if(o.kind==='lantern'){
        pen.fillStyle='#4c5751';pen.fillRect(-14,-12,28,14);pen.fillRect(-7,-62,14,52);pen.fillStyle='#1b2c30';pen.fillRect(-16,-83,32,28);const g=pen.createRadialGradient(0,-67,0,0,-67,48);g.addColorStop(0,'#ffbd6070');g.addColorStop(1,'#ffbd6000');pen.fillStyle=g;pen.fillRect(-48,-115,96,96);pen.fillStyle='#f4cb8b';pen.globalAlpha=.8+Math.sin(time*3+o.seed)*.1;pen.fillRect(-8,-79,16,19);pen.fillStyle='#263c3b';pen.beginPath();pen.moveTo(-23,-84);pen.lineTo(0,-99);pen.lineTo(23,-84);pen.fill();
      }else {const pillar=o.kind==='pillar';const g=pen.createLinearGradient(-24,0,22,-60);g.addColorStop(0,'#253a37');g.addColorStop(.5,'#687166');g.addColorStop(1,'#303f3b');pen.fillStyle=g;pen.strokeStyle='#9caa874a';pen.lineWidth=2;pen.beginPath();pen.moveTo(-26,3);pen.lineTo(-30,pillar?-65:-20);pen.lineTo(-9,pillar?-87:-39);pen.lineTo(21,pillar?-75:-34);pen.lineTo(29,-5);pen.closePath();pen.fill();pen.stroke();if(pillar){pen.strokeStyle='#192d2c';strokeLine(pen,[[-21,-53],[17,-48],[10,-27],[-9,-30]]);}}
      pen.restore();
    }
  }
  function drawMap(pen,stage,x,y,w,h){const d=WorldNavData[stage];pen.save();pen.translate(x,y);pen.scale(w/d.width,h/d.height);pen.fillStyle='#5a7165';pen.fill(landPath(stage));pen.restore();}
  function drawCollision(pen,stage){pen.save();pen.strokeStyle='#61ffb0';pen.lineWidth=1;for(const route of scenes[stage].routes){strokeLine(pen,route.left);strokeLine(pen,route.right);}pen.strokeStyle='#ff765c';for(const o of scenes[stage].obstacles){pen.beginPath();pen.arc(o.x,o.y,o.r,0,Math.PI*2);pen.stroke();}pen.restore();}
  return {version,tile,geometry,blocked,draw,drawProps,drawMap,drawCollision,loaded:()=>!!(atlas.complete&&atlas.naturalWidth&&props.complete&&props.naturalWidth&&infantAtlas.complete&&infantAtlas.naturalWidth&&huashenAtlas.complete&&huashenAtlas.naturalWidth&&lianxuAtlas.complete&&lianxuAtlas.naturalWidth&&hetiAtlas.complete&&hetiAtlas.naturalWidth&&dachengAtlas.complete&&dachengAtlas.naturalWidth&&dujieAtlas.complete&&dujieAtlas.naturalWidth)};
})();
