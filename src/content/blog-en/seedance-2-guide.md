---
title: 'Seedance 2.0 Usage Guide: Complete Prompt Engineering Playbook'
pubDate: 2026-02-15T00:00:00.000Z
description: 'Complete guide to Seedance 2.0 AI video generation — prompt formula, camera movement keywords, style references, audio prompts, material referencing system, and practical examples'
author: 'Remy'
tags: ['AI', 'Seedance', 'Video Generation', 'Prompt Engineering', 'Guide']
lang: 'en'
translatedFrom: 'seedance-2-guide'
---

# Seedance 2.0 Usage Guide: Complete Prompt Engineering Playbook

Seedance 2.0 is a multimodal AI video generation model developed by ByteDance's Seed team, launched in February 2026. It is available through the **Doubao App** and **Jimeng AI** platforms. This guide is a hands-on playbook covering everything you need to craft effective prompts and get professional-quality video output from Seedance 2.0.

---

## Key Capabilities at a Glance

- **Multimodal input**: Up to 12 reference files (9 images + 3 videos + 3 audio clips) plus text instructions
- **Native audio-video sync**: The only model in its class that supports audio references, with lip-sync in 8 languages
- **Automatic storyboarding**: Just describe your story and the model plans shots automatically
- **2K resolution**, 24-60 fps, up to 15-20 seconds per generation
- **90%+ usable output rate**

---

## The Universal Prompt Formula

Every effective Seedance prompt follows this structure:

```
Subject + Action + Scene + Lighting + Camera Movement + Style + Quality + Constraints
```

### Template Card Format

Use this template as your starting point for any generation:

```
Subject: [character/object, age or material]
Camera: [shot size] + [movement type] + [angle], [focal length]
Style: [visual anchor: film stock / craft / director style], [lighting], [color treatment]
Constraints: [prohibited items], [frame rate / pacing], [duration or beat timing], [consistency requirements]
```

---

## Curated Prompt Examples

### 1. Wuxia Action Sequence

```
A wuxia-style male hero wearing black martial outfit, fighting enemies in a rainy
bamboo forest at night. Fast sword combos with visible sword light trails and
splashing water. Fast follow camera, crane shots, and quick close-ups. Cinematic
camera language. Maintain character appearance and clothing consistency. Realistic
physics, wet fabric, rain interaction. 4K Ultra HD, no blur, no ghosting.
```

### 2. Cyberpunk Chase

```
A high-energy cinematic action sequence at night in a neon-lit city, the camera
tracking a lone character sprinting through rain-soaked streets as police drones
and headlights blur past. Quick cuts between close-ups of determined eyes, boots
splashing through puddles, and wide shots of traffic narrowly missing him.
Cyberpunk aesthetics, high contrast neon lighting, IMAX cinematic texture. 4K,
rich details, sharp clarity.
```

### 3. Luxury Product Ad

```
Close-up macro shot, smooth gimbal orbit, steady motion. A matte black luxury
watch on a velvet stand rotates slowly while soft light reflects off the glass.
Style: High-end studio photography, cool-toned lighting, crisp reflections. Keep
logo sharp, no warping, tripod-stable, no background flickering. 4K Ultra HD.
```

### 4. Healing Japanese Aesthetic

```
A young woman stands under a cherry blossom tree, gentle breeze blowing through
her long hair, she slowly looks up at the falling petals. Medium shot, slowly
pushing in to face close-up. Japanese fresh style, soft afternoon sunlight,
shallow depth of field. 4K, stable picture, no distortion.
```

### 5. Film Noir

```
A woman in a red dress walks confidently down a rainy city street at night, neon
reflections on wet pavement, film noir style, tracking shot. Harsh chiaroscuro
lighting, deep shadows, cinematic texture, 4K. Maintain face and clothing
consistency, stable picture.
```

### 6. Knight Multi-Shot Narrative

```
A multi-shot sequence of a knight in silver armor. Shot 1: Wide shot as he enters
a dark cave with a torch. Shot 2: Close-up of his nervous eyes. Shot 3: He draws
his sword, which glows blue. Low-angle tracking shot, 2K resolution. Sound of
crackling fire and echoing footsteps.
```

### 7. Cinematic Portrait

```
An 18-year-old Japanese anime girl with short hair, wearing a white dress and
straw hat, standing on a forest path in warm summer afternoon sunlight. She slowly
turns toward the camera and smiles gently. A light breeze moves her hair and
dress. The camera slowly pushes in from medium shot to close-up. Soft natural
lighting, film grain, healing and peaceful mood, cinematic quality. Maintain face
and clothing consistency, no distortion, high detail.
```

### 8. Traveler at Dusk (Dolly Push-In)

```
A weary traveler in a dusty leather cloak. He slowly removes his wide-brimmed hat
and exhales, looking toward a sunset. Low-angle medium shot, slow dolly-in towards
his face, shallow depth of field. Warm golden hour light, cinematic color grading.
4K, stable picture, no flickering.
```

### 9. Coffee Ad with Timed Storyboard (Chinese)

This prompt demonstrates Seedance's **timed beat storyboarding** in Chinese. It extends a reference video to 15 seconds with three timed segments: light and shadow sliding across a table (1-5s), a coffee bean falling with a dolly push-in to black (6-10s), and brand text fading in (11-15s).

```
将@视频1延长15秒。1-5秒：光影透过百叶窗在木桌、杯身上缓缓滑过。6-10秒：一粒
咖啡豆从画面上方轻轻飘落，镜头向咖啡豆推进至画面黑屏。11-15秒：品牌英文渐显。
```

### 10. Period Drama Face-Off (Chinese Multi-Shot)

This prompt shows a **multi-shot Chinese-language storyboard** for a wuxia standoff scene. Shot 1: orbit around a woman in red drinking wine, then rack focus to a woman in black in the distance. Shot 2: aerial drone wide shot of the cliff. Shot 3: close-up of both characters in a tense standoff.

```
第一个画面：从红衣女子拿起酒壶喝酒开始，环绕运镜到红衣女子背部，然后移镜变焦
渐隐看到远处的黑衣女子。第二个画面：切换无人机航拍大全景，展现悬崖全貌。第三个
画面：两个人物的近景特写，对峙氛围紧张。电影质感，4K高清，面部清晰不变形，自然
光影。
```

### 11. Full Multimodal Reference (Image + Video + Audio, Chinese)

This prompt demonstrates **full multimodal referencing** -- combining image, video, and audio references simultaneously. It instructs the model to replicate the camera work and action from a reference video, apply it to a character from a reference image, use slow-motion focus on a thrown flying knife, and add fight/ambient sound effects with background music from an audio reference.

```
参考@视频1的人物动作和运镜手法，生成@图片1中黑衣人物在竹林将飞刀掷出的视频。
起始帧的视角景别严格参照@视频1，飞刀掷出以后慢动作对焦飞刀，并虚化黑衣人物。
做到1比1还原参考视频，仅人物改为黑衣女子。仅生成打斗音效和环境的音效，并加入
背景音乐@音频1。
```

### 12. Product Showcase (Chinese)

This prompt shows a **commercial product showcase** using multiple image references. It uses @Image1 as the primary product, @Image2 for side structure reference, and @Image3 for material/texture detail, with an orbiting dolly shot.

```
对@图片1进行商业级摄像展示，侧面结构参考@图片2，材质细节参考@图片3，镜头环绕
推进，高级质感，4K超高清，画面稳定不变形。
```

---

## Camera Movement Keywords Quick Reference

| Movement Type | Keywords | Effect |
|---|---|---|
| Push In | `dolly-in`, `push in` | Camera moves toward the subject -- builds tension or intimacy |
| Pull Out | `dolly-out`, `pull out` | Camera moves away from the subject -- reveals environment |
| Track | `track left/right` | Camera moves horizontally alongside the subject |
| Pan | `pan left/right` | Camera rotates horizontally in place |
| Crane | `crane up/down` | Camera moves vertically up or down |
| Orbit | `orbit`, `360 orbit` | Camera circles around the subject |
| Handheld | `handheld` | Adds subtle shake for a documentary / raw feel |
| Gimbal | `gimbal` | Smooth, stabilized motion for a polished look |
| Dolly Zoom | `dolly zoom` | Classic Hitchcock vertigo effect |
| Whip Pan | `whip pan` | Rapid horizontal sweep for urgency |
| Aerial | `aerial sweep`, `drone shot` | High-altitude overhead panoramic view |

**Speed modifiers**: Pair `slow` / `medium` / `fast` with a distance description, e.g. `slow dolly-in, 1-2 feet`.

**Compound movements**: Describe in timed beats, e.g. `Start: slow dolly-in. Then: gentle pan right for the final 2 seconds.`

---

## Shot Size Recommendations

| Shot Size | Best For | Recommended Movement | Notes |
|---|---|---|---|
| Wide | Establishing shots, product overviews | Slow push-in or static | Avoid fast pans (causes ghosting) |
| Medium | Dialogue, UGC content | Handheld = personal feel; Gimbal = polished feel | The safest shot size overall |
| Close-up | Details, emotion | Micro push-in | Panning feels unnatural at close range; telephoto can blur the background |

---

## Style Keywords by Genre

| Genre | Recommended Style Keywords |
|---|---|
| Daily Life / Vlog | Healing fresh, artistic, Japanese fresh, Korean mood |
| Sci-Fi / Blockbuster | Cyberpunk, Dark premium, Retro film, Dreamy soft light |
| Minimalist | Minimalist clean, Premium texture, Realistic photography |
| Cinematic | Cinematic texture, Film grain, Anamorphic lens flare |
| Film Noir | Film noir, Chiaroscuro lighting, High contrast |
| Animation / Anime | Anime style, Thick oil paint texture, Van Gogh Post-Impressionism |

---

## Audio Prompt Keywords

| Keyword | Effect |
|---|---|
| `reverb` | Large-space reverberation (halls, cathedrals) |
| `muffled` | Muted sound (enclosed spaces, underwater) |
| `echoing` | Echo effect (large chambers) |
| `metallic clink` | Metal collision sound |
| `crunchy` | Textured sounds like gravel footsteps |
| `high-pitched` | High-frequency sharp sound effects |
| `crackling fire` | Campfire crackle |

---

## Quality Enhancement Suffix (Recommended for Every Prompt)

Append these keywords to the end of every prompt to maximize output quality:

```
4K, Ultra HD, Rich details, Sharp clarity, Cinematic texture, Natural colors,
Soft lighting, No blur, No ghosting, No flickering, Stable picture.
```

---

## Constraint Words (Essential -- Prevents Deformation and Drift)

**Important: Seedance 2.0 does NOT support negative prompts. You must use positive constraint statements instead.**

Recommended constraint statements:

```
Maintain face and clothing consistency, no distortion, high detail.
Character face stable without deformation, normal human structure, natural and smooth movements.
```

To suppress subtitle generation, add: `Generate video without subtitles`.

---

## The @ Material Reference System

After uploading files, the model automatically assigns tags (`@Image1`, `@Video1`, `@Audio1`). Reference them explicitly in your prompt to specify their role.

| Purpose | Example Syntax |
|---|---|
| Set first frame | `@Image1 as the first frame` |
| Reference camera work | `Reference the camera movement and transitions from @Video1` |
| Assign character roles | `The woman in @Image1 as the lead; the man in @Image2 as supporting` |
| Reference actions | `Mimic the actions from @Video1` |
| Set background music | `@Audio1 as background music` |
| Extend video | `Extend @Video1 by X seconds` |
| Replace elements | `Replace [element A] in @Video1 with [element B]` |

---

## Core Tips

1. **One shot, one verb** -- Multiple motion verbs in a single shot confuse the model.
2. **Limit characters to 1-2** -- More than two characters causes identity confusion and consistency loss.
3. **Prompt length: 30-200 words** -- Too short lacks information; too long causes the model to ignore details.
4. **Always include constraint words**: `Maintain face and clothing consistency, no distortion, high detail`.
5. **No negative prompts** -- Use positive constraint statements only.
6. **Append the quality suffix** to every prompt.
7. **Start short, then extend** -- Generate 5-10 seconds first to confirm the result, then extend.
8. **Generate multiple variants** -- Create 2-4 variants and compare to pick the best.
9. **Double-check your @ tags** -- Multi-reference prompts are where mistakes happen most often.
10. **Keep reference videos short** -- Trim to the key segment; shorter references yield more precise results.
11. **Use "lens switch" for multi-shot** -- Creates shot transitions within a single generation.
12. **Prefer gentle motion words** -- Prioritize: `Slow`, `Gentle`, `Continuous`, `Natural`, `Smooth`.

---

## Troubleshooting Decision Tree

| Problem | Solution |
|---|---|
| Composition is wrong but action is correct | Adjust `Camera` (shot size + one movement) while keeping `Subject` and `Action` unchanged |
| Motion feels wrong (too shaky / too fast) | Swap `handheld` with `gimbal` (or vice versa), set explicit speed -- do not change `Style` yet |
| Style or color drifting | Replace `Style` with a single stronger visual anchor, reduce adjectives |
| Recurring hand / label / lens-flare artifacts | Switch constraint words or change shot size (try medium shot instead of close-up) |
| Multiple angles are chaotic | Change "multiple camera angles" to "single tracking shot" |

---

## Recommended Resources

### GitHub Repositories

- [ZeroLu/awesome-seedance](https://github.com/ZeroLu/awesome-seedance) -- High-fidelity prompt collection (film / ads / animation / social media categories)
- [YouMind-OpenLab/awesome-seedance-2-prompts](https://github.com/YouMind-OpenLab/awesome-seedance-2-prompts) -- 200+ curated prompts
- [dexhunter/seedance2-skill](https://github.com/dexhunter/seedance2-skill) -- Prompt generation Skill for Claude Code / Cursor
- [hexiaochun/seedance2-api](https://github.com/hexiaochun/seedance2-api) -- API guide + storyboard templates

### English Resources

- [WaveSpeedAI Prompt Templates](https://wavespeed.ai/blog/posts/blog-seedance-2-0-prompt-template/)
- [GlobalGPT: 5 Ready-to-Use Prompts](https://www.glbgpt.com/hub/seedance-2-0-prompt-guide/)
- [WenHaoFree: Camera Movement Formula](https://blog.wenhaofree.com/en/posts/articles/seedance-2-0-prompt-mastery-guide/)
- [WeShop AI: Prompt Script Guide](https://www.weshop.ai/blog/seedance-2-0-guide-how-to-master-the-prompt-script/)
- [DataCamp: Seedance 2.0 Guide](https://www.datacamp.com/blog/seedance-2-0)
- [seedance2prompt.org](https://seedance2prompt.org/) -- 500+ prompt library
- [PromptHero: Seedance Prompts](https://prompthero.com/seedance-prompts)

### Chinese Resources

- [Zhihu: Universal Formula + @ Reference Explained](https://zhuanlan.zhihu.com/p/2004523300588643639)
- [Zhihu: Jimeng Step-by-Step Tutorial](https://zhuanlan.zhihu.com/p/2004623893273519265)
- [Zhihu: 100% Output with Claude Code](https://zhuanlan.zhihu.com/p/2004270375060661803)
- [Tencent News: Complete Operation Manual](https://news.qq.com/rain/a/20260209A044NZ00)
- [Bilibili: 30 Uses + Full Prompt Reveal](https://www.bilibili.com/video/BV1gCcqzkEe7/) (Bob)
- [Bilibili: Beginner Guide + Prompt Templates](https://www.bilibili.com/video/BV11AFsztE8j/) (16k favorites)
- [Bilibili: Most Complete Tutorial](https://www.bilibili.com/video/BV11Dc5zBE7d/)
- [CSDN: Complete Prompt Guide](https://blog.csdn.net/mizzlelover/article/details/158040401)

### Media Coverage

- [Variety -- Tom Cruise vs Brad Pitt Goes Viral](https://variety.com/2026/film/news/motion-picture-association-ai-seedance-bytedance-tom-cruise-1236661753/)
- [Deadline -- Cruise Vs Pitt Deepfake](https://deadline.com/2026/02/cruise-vs-pitt-seedance-viral-ai-hollywood-videos-1236717127/)
- [Hollywood Reporter -- Seedance Sparks Hollywood Backlash](https://www.hollywoodreporter.com/business/business-news/seedance-2-0-sparks-hollywood-backlash-1236505120/)
- [PYMNTS -- ByteDance's Seedance 2.0 Builds Buzz](https://www.pymnts.com/artificial-intelligence-2/2026/bytedances-seedance-2-0-builds-buzz-in-expanding-video-generation-market/)
