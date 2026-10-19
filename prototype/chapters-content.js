/* Released chapters own their story, audio/art identities and guardian rules. */
const GoldenChapters=[
  {id:'mountain',no:'肆',title:'五行断契',subtitle:'断契碑谷',place:'五行山 · 断契碑谷',background:'assets/world-mountain.jpg',color:'#dfc078',bossHp:8600,bossSpeed:48,mobScale:1.9,boss:'压山石魁',bossGlyph:'山',bossRow:0,
    mobNames:{imp:'碎碑石役',fox:'缚山链魇',snake:'诵契碑师',zombie:'负山铁卫'},
    theme:'山下压着的，是石猴，还是不肯签字的旧账？',
    story:['金毫落在五行山的断碑上。孙小果没有找到大圣，只看见六百道新凿的契痕。','石魁说：大圣早已认罪，山锁不过替他守诺。碑背却刻着另一句：签名之日，群山皆空。','小果绕过碎石驿，找到一段被铁链勒断的毫毛。那不是认罪，是有人借大圣的名字收债。'],
    tell:'锁柱免疫剑伤。引导石魁重砸落在三根锁柱上，全部砸断后，再躲过裂山终锤，收锤露出石心。',
    mechanic:'诱砸破柱：普通攻击不能破柱；重砸反噬三柱，终锤落空后才露石心。',bossLine:'“山能压人，落款才能压住一个名字。”',
    reveal:'石心碎开，里面不是金丹，而是一枚被反复刮去姓名的镇山印。大圣从未签过字。',clue:{name:'伪造的镇山契',text:'落款来自两界山驿。追猎将带走了最后一个见过大圣的人。'},reward:'石锁可断，伪契仍在流传。'},
  {id:'outpost',no:'伍',title:'两界追名',subtitle:'残籍驿道',place:'两界山 · 残籍驿道',background:'assets/world-outpost.jpg',color:'#d58d70',bossHp:11200,bossSpeed:62,mobScale:2.2,boss:'无籍追猎将',bossGlyph:'猎',bossRow:1,
    mobNames:{imp:'残籍刀役',fox:'追名獒妖',snake:'夺命弩魂',zombie:'封路盾卫'},
    theme:'被追杀的人丢了名字，追杀者又是谁？',
    story:['残籍驿每到黄昏便有一支空马队进山。它们载走证人，留下同样的空白名帖。','一位驿卒告诉小果：追猎将没有自己的名字，只能靠夺走别人的名字续命。','驿墙上的三枚籍印同时亮起。小果看见其中一枚倒映着金毫，其余两枚只有空影。'],
    tell:'三枚籍印只有金色实印可破；误击幻印会召来追猎。破实印后，横向躲过三段锁链追斩，收势才是破绽。',
    mechanic:'真印追猎：辨别实印，幻印反击；诱尽三段锁链，等待收刀。',bossLine:'“没有名字的人，也配向我问路？”',
    reveal:'面甲下是一叠湿透的路引。每夺一个名字，它就能多活一夜。',clue:{name:'沉鳞水契',text:'证人已被送入鹰愁涧。白蛟的喉中，封着通往禅院的愿契。'},reward:'追猎将的最后一张路引，写着它早已忘记的自己。'},
  {id:'dragon',no:'陆',title:'鹰涧解喉',subtitle:'沉鳞龙渊',place:'鹰愁涧 · 沉鳞龙渊',background:'assets/world-dragon.jpg',color:'#92d9d2',bossHp:14800,bossSpeed:57,mobScale:2.55,boss:'封喉白蛟',bossGlyph:'蛟',bossRow:2,
    mobNames:{imp:'伏涧水鬼',fox:'裂鳞刃妖',snake:'吐珠河灵',zombie:'沉锚甲卫'},
    theme:'龙被锁住的喉咙里，藏着谁不肯说出的名字？',
    story:['鹰愁涧的水向两岸退去，露出一条布满锁鳞的龙骨桥。桥下的哭声，来自白蛟的喉中。','白蛟不能说出契主的名字。每当它开口，水中便降下一道雷，把证词烧成白烟。','孙小果踏上浅滩：你若不能开口，就让这锁喉的东西先碎。'],
    tell:'破除两片锁喉鳞，引导冲岸显鳞；连续进入两次青色干岸缺口避过导雷潮，待潮退攻击喉部。',
    mechanic:'导雷龙潮：先破锁鳞，再于两重潮的干岸缺口接招；远离潮带不算破招。',bossLine:'“我吞下的每一字，都有人拿去换了功德。”',
    reveal:'白蛟终于吐出一片袈裟。上面的名字都在呼吸，唯独收契者的名字是一块空白。',clue:{name:'焚愿袈裟角',text:'愿契的线头指向观音禅院。修至金丹九层圆满，突破元婴后可循木脉进入焚愿禅院。'},reward:'金丹篇已破。禅院之火，正在烧去众生最后的愿。'}
];
