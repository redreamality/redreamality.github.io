---
title: 'Seedance 2.0 使用指南：从提示词到成片的完整攻略'
pubDate: 2026-02-15T00:00:00.000Z
description: 'Seedance 2.0 AI视频生成完整使用指南，涵盖提示词万能公式、运镜技巧、风格关键词、素材引用系统、画质增强方法及实战示例'
author: 'Remy'
tags: ['AI', 'Seedance', '视频生成', '提示词', '使用指南']
lang: 'zh'
---

# Seedance 2.0 使用指南：从提示词到成片的完整攻略

Seedance 2.0 是字节跳动 Seed 团队开发的多模态 AI 视频生成模型，支持最多12个参考文件输入（图片+视频+音频）、原生音视频同步、自动分镜，输出 2K/24-60fps 视频。你可以通过**豆包 App** 或 **[即梦 AI](https://jimeng.jianying.com/)** 直接使用。

本文是一份实战导向的使用指南，帮助你从零掌握 Seedance 2.0 的提示词写法、运镜技巧、素材引用和常见问题排查。

---

## 目录

1. [提示词万能公式](#提示词万能公式)
2. [精选提示词示例](#精选提示词示例)
3. [运镜关键词速查](#运镜关键词速查)
4. [景别搭配建议](#景别搭配建议)
5. [风格关键词分类](#风格关键词分类)
6. [音频提示词关键词](#音频提示词关键词)
7. [画质增强后缀词](#画质增强后缀词)
8. [约束词](#约束词)
9. [@ 素材引用系统](#-素材引用系统)
10. [核心技巧](#核心技巧)
11. [迭代排错决策树](#迭代排错决策树)
12. [推荐资源](#推荐资源)

---

## 提示词万能公式

掌握提示词结构是用好 Seedance 的第一步。所有提示词都可以套用以下公式：

```
主体 + 动作 + 场景 + 光影 + 运镜 + 风格 + 画质 + 约束
```

### 模板卡片格式

实际写提示词时，推荐使用这个结构化模板：

```
Subject: [人物/物体，年龄或材质]
Camera: [景别] + [运动方式] + [角度], [焦距]
Style: [视觉锚点：胶片/工艺/导演风格], [光线], [色彩处理]
Constraints: [禁止项], [帧率/节奏], [时长或节拍], [一致性约束]
```

每个字段的作用：
- **Subject**：告诉模型"画谁/画什么"，越具体越好
- **Camera**：控制镜头语言，决定观众视角
- **Style**：锁定视觉风格，防止风格漂移
- **Constraints**：设置边界条件，保证输出质量

---

## 精选提示词示例

以下示例涵盖多种风格和场景，可直接使用或作为模板修改。

### 1. 武侠动作片

```
A wuxia-style male hero wearing black martial outfit, fighting enemies in a rainy
bamboo forest at night. Fast sword combos with visible sword light trails and
splashing water. Fast follow camera, crane shots, and quick close-ups. Cinematic
camera language. Maintain character appearance and clothing consistency. Realistic
physics, wet fabric, rain interaction. 4K Ultra HD, no blur, no ghosting.
```

### 2. 赛博朋克追逐

```
A high-energy cinematic action sequence at night in a neon-lit city, the camera
tracking a lone character sprinting through rain-soaked streets as police drones
and headlights blur past. Quick cuts between close-ups of determined eyes, boots
splashing through puddles, and wide shots of traffic narrowly missing him.
Cyberpunk aesthetics, high contrast neon lighting, IMAX cinematic texture. 4K,
rich details, sharp clarity.
```

### 3. 奢侈品广告

```
Close-up macro shot, smooth gimbal orbit, steady motion. A matte black luxury
watch on a velvet stand rotates slowly while soft light reflects off the glass.
Style: High-end studio photography, cool-toned lighting, crisp reflections. Keep
logo sharp, no warping, tripod-stable, no background flickering. 4K Ultra HD.
```

### 4. 治愈系日系

```
A young woman stands under a cherry blossom tree, gentle breeze blowing through
her long hair, she slowly looks up at the falling petals. Medium shot, slowly
pushing in to face close-up. Japanese fresh style, soft afternoon sunlight,
shallow depth of field. 4K, stable picture, no distortion.
```

### 5. 黑色电影

```
A woman in a red dress walks confidently down a rainy city street at night, neon
reflections on wet pavement, film noir style, tracking shot. Harsh chiaroscuro
lighting, deep shadows, cinematic texture, 4K. Maintain face and clothing
consistency, stable picture.
```

### 6. 骑士多镜头叙事

```
A multi-shot sequence of a knight in silver armor. Shot 1: Wide shot as he enters
a dark cave with a torch. Shot 2: Close-up of his nervous eyes. Shot 3: He draws
his sword, which glows blue. Low-angle tracking shot, 2K resolution. Sound of
crackling fire and echoing footsteps.
```

### 7. 电影感人像

```
An 18-year-old Japanese anime girl with short hair, wearing a white dress and
straw hat, standing on a forest path in warm summer afternoon sunlight. She slowly
turns toward the camera and smiles gently. A light breeze moves her hair and
dress. The camera slowly pushes in from medium shot to close-up. Soft natural
lighting, film grain, healing and peaceful mood, cinematic quality. Maintain face
and clothing consistency, no distortion, high detail.
```

### 8. 旅者黄昏（Dolly 推镜）

```
A weary traveler in a dusty leather cloak. He slowly removes his wide-brimmed hat
and exhales, looking toward a sunset. Low-angle medium shot, slow dolly-in towards
his face, shallow depth of field. Warm golden hour light, cinematic color grading.
4K, stable picture, no flickering.
```

### 9. 咖啡广告（中文分镜 + 时间节拍）

```
将@视频1延长15秒。1-5秒：光影透过百叶窗在木桌、杯身上缓缓滑过。6-10秒：一粒
咖啡豆从画面上方轻轻飘落，镜头向咖啡豆推进至画面黑屏。11-15秒：品牌英文渐显。
```

### 10. 古风对手戏（中文分镜）

```
第一个画面：从红衣女子拿起酒壶喝酒开始，环绕运镜到红衣女子背部，然后移镜变焦
渐隐看到远处的黑衣女子。第二个画面：切换无人机航拍大全景，展现悬崖全貌。第三个
画面：两个人物的近景特写，对峙氛围紧张。电影质感，4K高清，面部清晰不变形，自然
光影。
```

### 11. 全模态参考（图 + 视频 + 音频）

```
参考@视频1的人物动作和运镜手法，生成@图片1中黑衣人物在竹林将飞刀掷出的视频。
起始帧的视角景别严格参照@视频1，飞刀掷出以后慢动作对焦飞刀，并虚化黑衣人物。
做到1比1还原参考视频，仅人物改为黑衣女子。仅生成打斗音效和环境的音效，并加入
背景音乐@音频1。
```

### 12. 商品展示

```
对@图片1进行商业级摄像展示，侧面结构参考@图片2，材质细节参考@图片3，镜头环绕
推进，高级质感，4K超高清，画面稳定不变形。
```

---

## 运镜关键词速查

运镜是视频质感的核心。以下是 Seedance 2.0 支持的运镜关键词及其效果：

| 运镜类型 | 英文关键词 | 效果说明 |
|----------|-----------|---------|
| 推镜 | `dolly-in`, `push in` | 镜头向主体靠近，增加紧张感/亲密感 |
| 拉镜 | `dolly-out`, `pull out` | 镜头远离主体，揭示环境 |
| 横移 | `track left/right` | 镜头横向移动跟随主体 |
| 摇镜 | `pan left/right` | 镜头原地水平旋转 |
| 升降 | `crane up/down` | 镜头垂直升降 |
| 环绕 | `orbit`, `360 orbit` | 围绕主体旋转 |
| 手持 | `handheld` | 添加微晃动，营造纪实感 |
| 稳定器 | `gimbal` | 平滑稳定的运动，质感精致 |
| 希区柯克变焦 | `dolly zoom` | 经典眩晕效果 |
| 甩镜 | `whip pan` | 快速横移制造紧迫感 |
| 航拍 | `aerial sweep`, `drone shot` | 高空俯瞰全景 |

**运镜速度搭配**：使用 `slow` / `medium` / `fast` 配合距离描述，例如 `slow dolly-in, 1-2 feet`。

**复合运镜写法**：分节拍描述，例如 `Start: slow dolly-in. Then: gentle pan right for the final 2 seconds.`

---

## 景别搭配建议

不同景别搭配不同运镜，效果差异很大。以下是实用搭配建议：

| 景别 | 适用场景 | 推荐运镜 | 注意事项 |
|------|---------|---------|---------|
| 远景 Wide | 环境交代、产品全景 | 慢推/固定镜头 | 避免快速摇镜（会产生拖影） |
| 中景 Medium | 对话、UGC | 手持=私人感；稳定器=精致感 | 最安全的景别 |
| 近景 Close | 细节、情绪 | 微推镜 | 摇镜在近景会不协调；长焦可虚化背景 |

---

## 风格关键词分类

选对风格关键词可以一句话锁定画面调性，避免风格漂移：

| 题材 | 推荐风格词 |
|------|-----------|
| 日常/Vlog | 治愈清新、文艺感、日系清新、韩式氛围 |
| 科幻/大片 | `Cyberpunk`, `Dark premium`, `Retro film`, `Dreamy soft light` |
| 极简 | `Minimalist clean`, `Premium texture`, `Realistic photography` |
| 电影感 | `Cinematic texture`, `Film grain`, `Anamorphic lens flare` |
| 黑色电影 | `Film noir`, `Chiaroscuro lighting`, `High contrast` |
| 动画/动漫 | `Anime style`, `Thick oil paint texture`, `Van Gogh Post-Impressionism` |

---

## 音频提示词关键词

Seedance 2.0 是同级别中唯一支持音频参考的模型。以下关键词可以精确控制音效：

| 关键词 | 效果 |
|--------|------|
| `reverb` | 大空间回响（大厅、教堂） |
| `muffled` | 闷声效果（封闭空间、水下） |
| `echoing` | 回声（大型厅堂） |
| `metallic clink` | 金属碰撞声 |
| `crunchy` | 沙砾踩踏等质感声 |
| `high-pitched` | 高频尖锐音效 |
| `crackling fire` | 篝火噼啪声 |

---

## 画质增强后缀词

建议每次生成时都在提示词末尾附加以下后缀，显著提升输出画质：

```
4K, Ultra HD, Rich details, Sharp clarity, Cinematic texture, Natural colors,
Soft lighting, No blur, No ghosting, No flickering, Stable picture.
```

> 可以根据场景需要增减，但 `4K`、`No blur`、`Stable picture` 这三个建议始终保留。

---

## 约束词

约束词是防止画面变形、角色漂移的关键。**Seedance 2.0 不支持负面提示词（Negative Prompt）**，必须使用正向约束语句。

### 推荐约束语句

```
Maintain face and clothing consistency, no distortion, high detail.
```

```
Character face stable without deformation, normal human structure,
natural and smooth movements.
```

### 其他实用约束

- 不想生成字幕：加入 `生成视频不带字幕`
- 防止背景闪烁：加入 `no background flickering`
- 防止画面抖动：加入 `tripod-stable` 或 `stable picture`

---

## @ 素材引用系统

Seedance 2.0 最强大的功能之一是多模态素材引用。上传素材后，模型会自动分配标签（`@Image1`、`@Video1`、`@Audio1`），你可以在提示词中精确指定每个素材的用途。

| 用途 | 写法示例 |
|------|---------|
| 指定首帧 | `@图片1 作为首帧` |
| 参考运镜 | `参考@视频1的运镜和转场` |
| 指定角色 | `@图片1 的女生作为主角，@图片2 的男生作为配角` |
| 参考动作 | `模仿@视频1的动作` |
| 指定配乐 | `@音频1 用于配乐` |
| 视频延长 | `将@视频1延长X秒` |
| 元素替换 | `将@视频1中的[元素A]换成[元素B]` |

> 最多可引用 12 个文件：9 张图片 + 3 段视频 + 3 段音频。多素材引用时务必仔细检查标签对应关系。

---

## 核心技巧

以下 12 条技巧是高效使用 Seedance 2.0 的精华总结：

1. **一个镜头一个动词** -- 多个运动动词会让模型混乱，导致画面不连贯
2. **角色限 1-2 人** -- 超过 2 人容易身份混淆和一致性丢失
3. **提示词 30-200 词** -- 太短信息不足，太长模型会忽略细节
4. **必加约束词** -- `Maintain face and clothing consistency, no distortion, high detail`
5. **不支持负面提示词** -- 只能用正向约束，不要写 "no ugly" 这类表述
6. **画质后缀建议每次附加** -- 参考上方画质增强后缀词
7. **先短后长** -- 先生成 5-10 秒确认效果，满意后再延长到 15-20 秒
8. **多生成几条对比** -- 建议 2-4 条变体对比选优
9. **素材 @ 标注仔细检查** -- 多素材时最容易出错，生成前逐一核对
10. **参考视频要短** -- 截取关键片段即可，越短越精准
11. **用 "lens switch" 切换镜头** -- 可在单次生成中创建多镜头切换效果
12. **动作描述用舒缓词** -- 优先使用：`Slow`, `Gentle`, `Continuous`, `Natural`, `Smooth`

---

## 迭代排错决策树

生成结果不满意时，按以下决策树逐步调整，避免盲目重写提示词：

| 问题 | 解决方法 |
|------|---------|
| 构图不对但动作正确 | 先调 Camera（景别 + 一个运动），保持 Subject 和 Action 不变 |
| 运动感觉不对（太晃/太快） | 互换 `handheld` ↔ `gimbal`，设定速度，暂不动 Style |
| 风格/色彩漂移 | 用一个更强的视觉锚点替换 Style，减少形容词 |
| 重复出现手部/标签/光晕问题 | 换约束词或换景别，近景换中景试试 |
| 多角度混乱 | 把 `multiple camera angles` 改为 `single tracking shot` |

> 核心原则：**每次只改一个变量**。同时修改多个参数会让你无法判断哪个改动有效。

---

## 推荐资源

### GitHub 仓库

- [ZeroLu/awesome-seedance](https://github.com/ZeroLu/awesome-seedance) -- 高保真提示词合集（电影/广告/动画/社交媒体分类）
- [YouMind-OpenLab/awesome-seedance-2-prompts](https://github.com/YouMind-OpenLab/awesome-seedance-2-prompts) -- 200+ 精选提示词
- [dexhunter/seedance2-skill](https://github.com/dexhunter/seedance2-skill) -- Claude Code / Cursor 用的提示词生成 Skill
- [hexiaochun/seedance2-api](https://github.com/hexiaochun/seedance2-api) -- API 指南 + 分镜模板

### 英文资源

- [WaveSpeedAI 提示词模板](https://wavespeed.ai/blog/posts/blog-seedance-2-0-prompt-template/)
- [GlobalGPT 5 个即用提示词](https://www.glbgpt.com/hub/seedance-2-0-prompt-guide/)
- [WenHaoFree 运镜万能公式](https://blog.wenhaofree.com/en/posts/articles/seedance-2-0-prompt-mastery-guide/)
- [WeShop AI 提示词脚本指南](https://www.weshop.ai/blog/seedance-2-0-guide-how-to-master-the-prompt-script/)
- [DataCamp Seedance 2.0 指南](https://www.datacamp.com/blog/seedance-2-0)
- [seedance2prompt.org](https://seedance2prompt.org/) -- 500+ 提示词库
- [PromptHero Seedance 提示词](https://prompthero.com/seedance-prompts)

### 中文资源

- [知乎 万能公式 + @引用详解](https://zhuanlan.zhihu.com/p/2004523300588643639)
- [知乎 即梦喂饭教程](https://zhuanlan.zhihu.com/p/2004623893273519265)
- [知乎 用 Claude Code 100%出片](https://zhuanlan.zhihu.com/p/2004270375060661803)
- [腾讯新闻 完整操作手册](https://news.qq.com/rain/a/20260209A044NZ00)
- [B站 30 个用法 + 提示词大公开](https://www.bilibili.com/video/BV1gCcqzkEe7/)（Bob 同学）
- [B站 保姆级白嫖 + 提示词模板](https://www.bilibili.com/video/BV11AFsztE8j/)（收藏 1.6 万）
- [B站 全网最完整使用教程](https://www.bilibili.com/video/BV11Dc5zBE7d/)
- [CSDN 提示词完全指南](https://blog.csdn.net/mizzlelover/article/details/158040401)
