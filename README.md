# 重走西游 · 寻圣

剑仙孙小果循金毫寻找大圣，进入《西游记》前三难的原创劫痕演义。浏览器游戏采用 Canvas 2D，包含自由探索、分波营地、巡逻妖众、精英挑战、构筑成长和必须破招的守关首领。

## 运行

保留完整目录，在项目根目录启动静态服务器：

```sh
python -m http.server 4173 --directory prototype
```

然后访问 <http://localhost:4173/>。也可直接打开 `prototype/index.html` 离线体验。

WASD 移动，空格闪避，Q 大招，E 交互，Tab 舆图，F 全屏。触屏支持左侧拖动移动和右侧操作按钮。

玩法、素材、验证命令和当前验证边界见 [游戏说明](prototype/README.md)；完整机制见 [关卡与战斗设计](docs/寻圣-前三难关卡与战斗设计.md)。

## GitHub Pages 发布

`.github/workflows/pages.yml` 会在游戏文件推送至 `main` 时检查脚本，并发布游戏入口、脚本、样式和素材；也可在 Actions 页面手动运行。截图、预览视频和开发文档不会进入网站。

在仓库 Settings → Pages 中将 Source 设为 GitHub Actions。仓库必须满足 GitHub Pages 的套餐要求；当前私有仓库若套餐不支持，需要经仓库所有者同意改为公开，或升级套餐。发布成功后的地址为 <https://liuhongtao1981.github.io/game-xianjian/>。

## 验证

需要 Node.js，音频完整检查另需 FFmpeg：

```sh
node tools/check-syntax.js
node tools/check-director.js
node tools/check-pickups.js
node tools/check-combat.js
node tools/check-world.js
```

脚本模拟通过不等于真人通关率；8至12分钟的真人单关目标仍需试玩校准。
