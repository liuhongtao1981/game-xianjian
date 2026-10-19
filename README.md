# 重走西游 · 寻圣

剑仙孙小果循金毫寻找大圣，进入西游劫痕的原创演义；当前开放筑基、金丹与元婴九关，十四境四十二关按境界逐批制作。浏览器游戏采用 Canvas 2D，包含自由探索、分波营地、巡逻妖众、精英挑战、构筑成长和可持续攻击、破招后获得增伤的守关首领。

## 运行

保留完整目录，在项目根目录启动静态服务器：

```sh
python -m http.server 4173 --directory prototype
```

然后访问 <http://localhost:4173/>。也可直接打开 `prototype/index.html` 离线体验。

支持自动存档、当前关卡续玩，以及筑基至仙王十四境、每境九层的修仙突破。元婴篇内容与验证见 [发布记录](docs/元婴篇-发布记录.json)，成长基础规则见 [九层修仙说明](docs/九层修仙与六关发布.md)。按 C 打开人物状态与天材地宝面板；规则和验证见 [修仙说明](docs/寻圣-自动续关与修仙系统.md)。

WASD 移动，空格闪避，Q / R / T 三式大招，E 交互，Tab 舆图，F 全屏。触屏支持左侧拖动移动和右侧操作按钮。

玩法、素材、验证命令和当前验证边界见 [游戏说明](prototype/README.md)；完整机制见 [关卡与战斗设计](docs/寻圣-前三难关卡与战斗设计.md)。

## GitHub Pages 发布

`.github/workflows/pages.yml` 会在游戏文件推送至 `main` 时检查脚本，并通过 `node tools/build-pages.js` 打包游戏入口、脚本、样式和素材；也可在 Actions 页面手动运行。发布时脚本与样式带提交版本参数，避免继续读取上版缓存。截图、预览视频和开发文档不会进入网站。

在仓库 Settings → Pages 中将 Source 设为 GitHub Actions。仓库必须满足 GitHub Pages 的套餐要求；本仓库已采用公开仓库发布。发布成功后的地址为 <https://liuhongtao1981.github.io/game-xianjian/>。

## 验证

需要 Node.js，音频完整检查另需 FFmpeg：

```sh
node tools/check-syntax.js
node tools/check-director.js
node tools/check-carryover.js
node tools/check-pickups.js
node tools/check-combat.js
node tools/check-expansion.js
node tools/check-infant.js
node tools/check-saves.js
node tools/check-cultivation.js
```

脚本模拟通过不等于真人通关率；大型地图的真人主路25至35分钟、完整探索45至60分钟目标仍需试玩校准。

剑阵由内向外最多四圈：5、7、10、14柄，共36柄；在万剑诀6/11/16级且达到金丹/大乘/太乙金仙时依次解锁外圈。每轮同目标命中预算保留。冷却缩减上限统一为80%，含普通术法、大招冷却与独立剑意恢复。可选择携带1至3式大招，分别使用Q/R/T或触屏按钮；每式独立保存冷却和剑意，可依次连用。大招基础伤害随连续境界进度乘1.28的对应次方，再乘面板伤害倍率。每次施放对每个非大妖战斗目标首次命中至少造成40%最大生命伤害；后续剑雨与持续伤害不重复触发保底，机关和大妖按原本伤害规则结算。
