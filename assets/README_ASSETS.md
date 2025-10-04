# 资源目录说明 (assets)

相对路径：`index.html` 与 `assets/` 在同一级，所以页面里引用时直接使用：

```
<img src="assets/season/spring1.jpg" />
<audio src="assets/music/spring_breeze.mp3"></audio>
```

## 结构
```
assets/
  music/        # 音频文件 (mp3/ogg/webm)
  season/       # 四季通用背景 (spring / summer / autumn / winter)
  month/        # 各月份背景 (01 ~ 12 前缀可自定义)
  term/         # 节气背景 (文件名任意, 在 backgrounds.js 中配置映射)
  festival/     # 节日背景 (春节/中秋等)
  date/         # 指定公历日期 (MM-DD) 特殊背景
```

你只需要把真实文件放进去，然后到 `backgrounds.js` 对应对象中添加或修改文件名即可。

## Gitee Pages 注意
如果你的 Pages 入口不是根路径（例如 `https://username.gitee.io/project/`），保持当前引用也能正常工作，只要 `index.html` 与 `assets/` 同级部署。

## 修改播放列表
编辑 `music.js` 中的 `PLAYLIST`（或远程列表），指向你新增的本地文件：
```
{ title: '春 · 新曲', season: 'spring', url: 'assets/music/new_spring.mp3' }
```

## 图片优化建议
- 尽量使用 1920x1080 或 1600x900 的 WebP/JPEG (质量 70-80%)。
- 多张同类图片 < 400KB 可接受；首屏加载速度更快。
- 若需要模糊预览，可后续再加 LQIP 逻辑。

## 音频优化建议
- mp3 128~192kbps 立体声足够。
- 若体积大，可考虑直接用远程 CDN 或延迟加载。

