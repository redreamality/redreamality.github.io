---
title: "Claude Science 用 64 小时设计抗蝎毒结合蛋白：31.8 万设计怎么收敛到 17 个确认结合"
description: "Anthropic 10 月 20 日公布：跑在 Claude Science 里的内部研究模型用约 64 小时自主设计抗蝎毒神经毒素的结合蛋白，318,484 个设计经筛选到 211 个送湿实验、17 个在两家实验室确认结合。本文核对数字与边界，拆这条 explore→筛选→真值验证的回路，并给出怎么读这类自主科学 agent 成果的决策框架。"
pubDate: 2026-10-21T10:45:00+08:00
author: "Remy"
tags: ["anthropic", "claude", "ai-agents", "agent-harness", "biology", "research"]
lang: "zh"
---

10 月 20 日，Anthropic 放出一篇研究文章：一个跑在 Claude Science 里的内部研究模型，用大约 64 小时，几乎自主地设计出了能紧紧咬住蝎毒神经毒素的小蛋白（minibinder，小型结合蛋白）。[1] 数字串起来是这样：它生成了 318,484 个设计，自己筛到 180 个，团队又补了 31 个，一共 211 个送进湿实验，最后 17 个在两家实验室都确认结合。[1] 这件事值得写，不在于「AI 又发现了什么」这句口号，而在于它把一条做实验科学的回路跑完了整圈——海量探索、层层筛选、再交给湿实验给出真值，而人只在开头给了一个提示词、中途插话四次。

和站内上一篇[《陶哲轩博客：AI 会解题以后，数学家为什么还要做数学》](/cn/blog/terence-tao-why-do-math-ai-era/)放在一起看，这是同一个问题的另一面：数学那边，AI 把「说清楚、可核对」的题做到了顶尖水平，瓶颈退到了选题和消化；蛋白设计这边，Claude Science 把「生成候选、算分、筛选」这段压到了几天，瓶颈退到了湿实验真值和「结合不等于能治病」的那一长段。两边的结构一样：能机械核对的那一截被压平，价值和稀缺性往两头转移。

## 先说结论

- 这不是一个「AI 发明了蝎毒解药」的故事。17 个设计只证明了一件事：它们在重组毒素上结合得足够紧（每个只对一种毒素）。没有做细胞层面的中和，没有做动物体内的保护，Anthropic 自己明确说不声称做出了抗蝎毒血清。[1]
- 真正的新意在回路，不在单点结果。把 318,484 个计算设计收敛到 211 个湿实验候选、再到 17 个确认结合，靠的是一条 explore→筛选→真值验证的闭环；湿实验是这条回路里唯一的真值来源，也是它最贵、最慢的一环。
- 刷新前沿的更可能是 harness 和 agent-loop，不是更大的模型。文章脚注里藏着关键一句：同样的工作用单个 agent、单块 GPU、24 小时，能拿到相当的 in silico 分数。[1] 这和站内[《Claude Science harness：无人值守算出九圈振幅》](/cn/blog/claude-science-harness-nine-loop-amplitudes/)是同一个判断。
- 多毒素通用结合蛋白这一路全军覆没。211 个里有 91 个是冲着五种毒素同时设计的，没有一个在多于一种毒素上达标。[1] 这条阴性结果比 17 个成功更能说明今天能力的边界。
- 数据是公开的。211 个设计连同结合数据都放上了 HuggingFace，这让「结合不等于能治病」从一句免责声明变成了别人能接着验的材料。[5]

## 这次到底做了什么

先把事实摆清楚，因为新闻标题很容易把它读成「AI 造出了蝎毒解药」。真实情况要克制得多。

缘起是一家做金融投资研究的公司 Citrini Research 抛来的问题：AI 能不能让一群有动力的非专家，去啃一个真实的人类健康难题？[1][3] Anthropic 的生命科学团队和他们一起把题目定在了蝎毒。蝎子每年蜇伤 120 万人以上，导致 3,250 多人死亡，多数是医疗资源匮乏地区的儿童；新药既难做又挣不回成本，所以蝎毒中毒长期被归为「被忽视的热带病」。[1] 换句话说，这是个商业上没人愿意碰、临床上又真的死人的靶子。

团队沿用了 8 月那篇单提示词结合蛋白研究的提示词，和 Citrini 一起改了改，然后交给模型。[1][4] 接下来约 64 小时里，这个内部研究模型在 Claude Science 里基本自主运转，人只用四条追加提示引导方向。[1] 它自己去蛋白质数据库（PDB）和 AlphaFold 数据库里挑毒素结构，为每种毒素选了五个「热点」——结合蛋白要咬住的具体氨基酸位置；它还自己定了设计要过的质量阈值，决定每个工具用多重，并想出了针对多毒素的设计策略。[1] 一共用了 12 个设计工具生成 318,484 个设计，过滤掉任何长得像毒素或已知蛋白的；再把设计和毒素两两配对、整体预测复合物结构，筛了 553,052 对。[1] 整个过程耗了约 10,000 GPU 小时。[1]

<figure class="not-prose my-6"><svg viewBox="0 0 600 430" role="img" aria-label="从 318484 个设计到 17 个确认结合的筛选回路" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto;max-width:600px;display:block;margin:0 auto;font-family:inherit;color:inherit" fill="currentColor"><text x="10" y="26" font-size="16" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="1">一条回路：探索 → 筛选 → 湿实验真值 → 反馈</text><rect x="10" y="44" width="150" height="50" rx="6" fill="#3b82f6" fill-opacity="0.12"/><text x="85" y="66" font-size="13" text-anchor="middle" font-weight="bold" fill="currentColor" fill-opacity="1">① 提示词 + 4 次追加</text><text x="85" y="85" font-size="11.5" text-anchor="middle" fill="currentColor" fill-opacity="0.8">模型自选结构/热点/阈值</text><line x1="160" y1="69" x2="168" y2="69" stroke="currentColor" stroke-opacity="0.6" stroke-width="1.5"/><polygon points="168,65 176,69 168,73" fill="currentColor" fill-opacity="0.6"/><rect x="176" y="44" width="160" height="50" rx="6" fill="#3b82f6" fill-opacity="0.12"/><text x="256" y="66" font-size="13" text-anchor="middle" font-weight="bold" fill="currentColor" fill-opacity="1">② 12 个工具生成</text><text x="256" y="85" font-size="11.5" text-anchor="middle" fill="currentColor" fill-opacity="0.8">过滤掉像已知蛋白的</text><line x1="336" y1="69" x2="344" y2="69" stroke="currentColor" stroke-opacity="0.6" stroke-width="1.5"/><polygon points="344,65 352,69 344,73" fill="currentColor" fill-opacity="0.6"/><rect x="352" y="44" width="160" height="50" rx="6" fill="#3b82f6" fill-opacity="0.12"/><text x="432" y="66" font-size="13" text-anchor="middle" font-weight="bold" fill="currentColor" fill-opacity="1">③ 共折叠打分</text><text x="432" y="85" font-size="11.5" text-anchor="middle" fill="currentColor" fill-opacity="0.8">553,052 对 design–toxin</text><text x="10" y="122" font-size="13" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="1">漏斗：每一层都在变窄</text><rect x="10" y="132" width="560" height="26" rx="3" fill="#3b82f6" fill-opacity="0.8"/><text x="20" y="150" font-size="12.5" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="1">318,484 个计算设计</text><rect x="10" y="164" width="300" height="24" rx="3" fill="#8b5cf6" fill-opacity="0.7"/><text x="20" y="181" font-size="12.5" text-anchor="start" fill="currentColor" fill-opacity="1">Claude 选出 180 个最终设计（64 小时后）</text><rect x="10" y="194" width="340" height="24" rx="3" fill="#f59e0b" fill-opacity="0.8"/><text x="20" y="211" font-size="12.5" text-anchor="start" fill="currentColor" fill-opacity="1">+ 团队追加 31 个 = 211 个送湿实验</text><rect x="10" y="224" width="90" height="24" rx="3" fill="#10b981" fill-opacity="0.9"/><text x="110" y="241" font-size="12.5" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="1">17 个两家实验室确认结合</text><text x="10" y="274" font-size="13" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="1">211 个的来路，以及 17 个的归属</text><text x="10" y="297" font-size="12" text-anchor="start" fill="currentColor" fill-opacity="0.85">单毒素 60（每种 12）· β 家族 30 · α 家族 30 · 五毒素齐攻 91</text><text x="10" y="318" font-size="12" text-anchor="start" fill="currentColor" fill-opacity="0.85">17 个命中：Cn2 七 · AaH II 四 · AaH I 四 · LqhIII 二（各只对一种毒素）</text><rect x="10" y="334" width="560" height="44" rx="6" fill="#10b981" fill-opacity="0.1" stroke="#10b981" stroke-width="1.2"/><text x="20" y="356" font-size="12.5" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="1">单毒素 60 个里 11 个达标 = 18%</text><text x="20" y="372" font-size="11.5" text-anchor="start" fill="currentColor" fill-opacity="0.85">这个命中率和以往蛋白设计活动大致持平——不是异常高，而是「正常水平」</text><text x="10" y="402" font-size="12" text-anchor="start" fill="currentColor" fill-opacity="0.85">反馈：第 3 次追加提示后，Claude 才选出含最强结合蛋白 Cn2-B1 在内的大部分设计</text><text x="10" y="422" font-size="11" text-anchor="start" fill="currentColor" fill-opacity="0.6">数据来自 [1]；条形为示意比例，非等比坐标</text></svg></figure>

*图：这次设计活动的回路与漏斗。横条只示意「每层变窄」，不是等比坐标；真实数字标在条上。数据来自 [1]。*

64 小时后，模型交出最终的 180 个设计。团队后来又和模型一起补了 31 个，总数到 211：对单一毒素的 60 个（每种毒素 12 个）、针对 β 家族两种毒素的 30 个、针对 α 家族三种毒素的 30 个，以及冲着五种毒素一起上的 91 个。[1] 这 211 个交给两家合同研究机构（CRO）——Adaptyv Bio 和 Twist Bioscience——在实验台上实测是否真的结合。

## 为什么是蝎毒：被忽视的靶子，正好适合 de novo 设计

选蝎毒不只是因为它惨，也因为它在技术上是个干净的测试。蝎毒里有多种蛋白神经毒素，最要命的那几种会去咬神经细胞膜上的钠离子通道，让神经在错误的时间放电，释放大量肾上腺素一类的应激物质，严重时心衰、肺积液，甚至死亡。[1] 传统抗蝎毒血清是拿蝎毒去免疫马、再从马血里提纯抗体，要几个月，通常只对少数毒素有效，还贵、还常缺货。[1]

de novo 设计（从头设计）给了另一条路。结合蛋白是一种能紧咬特定目标的分子，抗体就是天然的例子。道理上，只要设计一个结合蛋白去盖住毒素咬钠通道的那块位置，就能拦住毒素。[1] 这类蛋白是在计算机里从零生成的，可以顺带优化成更「像药」——更稳、更好供应——这正是蜇伤高发地区最需要的。团队这次挑了横跨四地区、四物种的五种毒素：墨西哥的 Cn2、巴西的 Ts1、北非的 AaH I 与 AaH II、中东的 LqhIII，并把设计瞄准每种毒素的通道结合位点。[1]

<figure class="not-prose my-6"><svg viewBox="0 0 600 340" role="img" aria-label="结合蛋白盖住毒素的通道结合位点" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto;max-width:600px;display:block;margin:0 auto;font-family:inherit;color:inherit" fill="currentColor"><text x="10" y="26" font-size="16" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="1">毒素怎么伤人，结合蛋白怎么拦</text><text x="150" y="60" font-size="13" text-anchor="middle" font-weight="bold" fill="#ef4444" fill-opacity="1">没有结合蛋白</text><rect x="40" y="200" width="220" height="30" rx="4" fill="#94a3b8" fill-opacity="0.25"/><text x="150" y="220" font-size="11.5" text-anchor="middle" fill="currentColor" fill-opacity="0.85">神经细胞膜 · 钠离子通道</text><rect x="120" y="186" width="60" height="18" rx="3" fill="#94a3b8" fill-opacity="0.45"/><circle cx="150" cy="110" r="26" fill="#ef4444" fill-opacity="0.75"/><text x="150" y="114" font-size="11" text-anchor="middle" font-weight="bold" fill="currentColor" fill-opacity="1">毒素</text><line x1="150" y1="136" x2="150" y2="184" stroke="#ef4444" stroke-opacity="0.8" stroke-width="2"/><polygon points="145,178 150,188 155,178" fill="#ef4444" fill-opacity="0.8"/><text x="150" y="258" font-size="11.5" text-anchor="middle" fill="currentColor" fill-opacity="0.85">通道被扰乱 → 神经乱放电</text><line x1="300" y1="70" x2="300" y2="280" stroke="currentColor" stroke-opacity="0.18"/><text x="450" y="60" font-size="13" text-anchor="middle" font-weight="bold" fill="#10b981" fill-opacity="1">有结合蛋白</text><rect x="340" y="200" width="220" height="30" rx="4" fill="#94a3b8" fill-opacity="0.25"/><text x="450" y="220" font-size="11.5" text-anchor="middle" fill="currentColor" fill-opacity="0.85">神经细胞膜 · 钠离子通道</text><rect x="420" y="186" width="60" height="18" rx="3" fill="#94a3b8" fill-opacity="0.45"/><circle cx="450" cy="104" r="26" fill="#ef4444" fill-opacity="0.75"/><text x="450" y="108" font-size="11" text-anchor="middle" font-weight="bold" fill="currentColor" fill-opacity="1">毒素</text><path d="M418 128 q32 20 64 0 l0 22 q-32 16 -64 0 z" fill="#10b981" fill-opacity="0.8"/><text x="450" y="146" font-size="10.5" text-anchor="middle" font-weight="bold" fill="currentColor" fill-opacity="1">结合蛋白</text><text x="450" y="258" font-size="11.5" text-anchor="middle" fill="currentColor" fill-opacity="0.85">盖住结合位点 → 毒素够不到通道</text><text x="10" y="300" font-size="12" text-anchor="start" fill="currentColor" fill-opacity="0.85">最强的 Cn2-B1、Cn2-B2 结合 Cn2 的 KD 落在个位数纳摩尔级</text><text x="10" y="320" font-size="12" text-anchor="start" fill="currentColor" fill-opacity="0.85">竞争实验显示它们与能在小鼠体内中和 Cn2 的抗体 LR 咬同一处表位</text><text x="10" y="336" font-size="11" text-anchor="start" fill="currentColor" fill-opacity="0.6">机制为原理示意，非等比结构图；数据来自 [1]</text></svg></figure>

*图：毒素咬住钠通道让神经乱放电；结合蛋白盖住毒素的通道结合位点，让它够不到通道。右下两行是 Cn2 结合蛋白的实测结论。数据来自 [1]。*

挑这五种毒素还有个更狠的用意：它们共享同一种折叠（整体形状），但两两之间的氨基酸序列只有 26% 到 62% 相同。[1] 团队想看看 Claude 能不能设计出一个同时咬住多种毒素的通用结合蛋白——真能成的话，一支「通用抗蝎毒鸡尾酒」需要的分子数就能大大减少，这在成本和跨地区通用上都划算。所以它被要求设计四类：针对每种毒素各自的、针对 β 家族（Ts1 与 Cn2）的、针对 α 家族（AaH II、AaH I、LqhIII）的，以及五种毒素一起的。

## 回路怎么收敛：真值只在湿实验里

从 31.8 万到 17，直觉上像是「筛得狠」，但真正决定这条回路可信度的，是最后那一道湿实验闸门怎么设的。这里值得慢讲，因为它决定了「17 个确认结合」这句话能信几分。

两家 CRO 用的表达系统故意不一样。Adaptyv Bio 用无细胞系统，直接拿从细菌里抽出来的蛋白合成机器来造；Twist Bioscience 用哺乳动物细胞（这次是人肾细胞），把设计做成抗体茎部（Fc）的融合蛋白。[1] 两种是互补的测法，合起来是为了提高对结果的信心。两家都用表面等离子共振（SPR）测结合：让毒素流过设计，仪器实时记录它结合和脱离的快慢，得到解离常数 KD——越小，咬得越紧。[1]

判定一个设计算不算「结合蛋白」，标准定得很严，这是整篇里我最愿意采信的地方。一个设计必须在两家实验室都是命中——每一次重复实验都要看到对该毒素的结合证据，且每一个 KD 都要在 1 µM 或更紧；同时它对一个不相干的人类蛋白 CLEC12A 不能有信号，用来排除「什么都粘」的假阳性。[1] 这三条叠起来，等于要求跨实验室、跨重复、跨阴性对照同时过关。LqhIII 是个例外，只由 Adaptyv Bio 评估。[1]

过了这道闸的有 17 个，每个都只对一种毒素：Cn2 七个、AaH II 四个、AaH I 四个、LqhIII 两个。[1] 冲着多毒素设计的那一大批，没有一个在多于一种毒素上达标。[1] 单毒素的 60 个里有 11 个达标，命中率 18%，Anthropic 说这和包括他们自己以往工作在内的典型蛋白设计活动大致持平。[1] 这句话很关键：它把「17 个」从一个惊叹号拉回到一个正常值。回路的价值不在命中率有多逆天，而在整条链路——从选结构到送样——基本是模型自己跑下来的。

最强的两个结合蛋白叫 Cn2-B1 和 Cn2-B2，都咬墨西哥蝎 Cn2，在两家实验室的 KD 都落在个位数纳摩尔级。[1] 更有意思的是竞争实验：它们各自咬的位置，和一个叫 LR、已报道能在小鼠体内中和 Cn2 的抗体，几乎是同一处表位；而 LR 咬的正是 Cn2 上搭钠通道、让神经乱放电的那块。[1] 两个分子抢同一个位置，说明这两个设计很可能也能中和 Cn2。注意「很可能」三个字——它们还没在细胞里、更没在活体里测过。

## Claude 的自主性边界：它自己定了规矩，也自己撞了墙

这篇最该细看的，是人和模型各做了什么。初始提示词定了毒素靶标、设计与折叠工具、以及新颖性、打分、筛选的规则。[1] 除此之外，选结构、选热点、定质量阈值、决定每个工具用多重、想多毒素策略，都是模型自己来。[1] 它还替团队把蛋白序列发给了 Twist Bioscience——邮件里注明是 Claude 写的——去下单合成。[1]

人的介入集中在四次追加提示上，而且有迹可循。模型先独立跑了 24 小时，结果够好，团队才提示它继续找更好的设计；几次追加主要是推着它去做多毒素结合蛋白。[1] 一个细节很说明问题：包括最强的 Cn2-B1 在内，180 个设计里的大部分，是在第三次追加之后才被选出来的。[1] 也就是说，自主不等于撒手——在哪儿加一句话、往哪个方向推，仍然很影响产出。这和站内[《Claude Science harness：无人值守算出九圈振幅》](/cn/blog/claude-science-harness-nine-loop-amplitudes/)里那个「最小人类干预」的判断是一致的：关键不在模型完全无人值守，而在干预点少、且能被清楚记下来。

多毒素这条线的失败，比成功更值得记。91 个五毒素设计、加上两批家族内设计，没有一个跨毒素达标。[1] Anthropic 列了几种可能：当前能力的限制、他们的提示方式、现有设计工具的局限，甚至多毒素设计在生物学上本就难成。[1] 不替它找借口，也不替它吹，这种对阴性结果的交代，恰恰是读这类文章时最该先找的东西。对照站内[《Claude「发现」类 CRISPR 酶系统：怎么读这次科学营销》](/cn/blog/claude-discovers-novel-enzyme-crispr-like-art/)——那次争议的核心就是「搜索到了」被说成「发现了」。这次好在，边界是作者自己划的。

## 17 个结合蛋白意味着什么，又不意味着什么

把话说死：这项研究只证明了对重组毒素的结合，没别的。重组毒素是在实验室里按基因长出来的，不是从真蝎毒里提纯的。Anthropic 点名了两条最大的限制——没有任何设计做过体外中和（对实验室培养的细胞），也没做过体内有效性（在活体动物如小鼠身上）。[1]

要把一个设计推成药，后面的路很长。拿最有希望的 Cn2-B1 来说：先得确认它也能结合从真蝎毒里提纯的毒素；再用膜片钳记录（测钠通道里电流）看它能不能在体外真的拦住毒素作用；然后在小鼠身上看它是否真能保护；最后，药还得安全、稳定、便宜、能送到蜇伤发生的地方，这要临床医生、出资方和政策制定者一起配合。[1] 两位外部专家 Susana Vázquez Torres（西班牙国家癌症研究中心）和 Timothy P. Jenkins（丹麦技术大学）给的评价是「有希望的第一步」；Torres 还补了一句直白的话——结合本身已不再是主要瓶颈，真正的难关在结合之后那一长段怎么变成真药。[1]

这正是为什么我不愿意把这篇读成「解药来了」。结合这一截，恰好是 AI 现在最擅长、也最容易被机械核对的那一截；再往后的中和、保护、量产、可及，才是价值和稀缺性真正所在的地方。能力越往前压，压力就越往后面那几段传。把这条逻辑和[陶哲轩那篇](/cn/blog/terence-tao-why-do-math-ai-era/)并排看，是同一回事。

## 双用途与生物安全：公开数据是答案的一部分

一个会设计「紧咬任意靶点的蛋白」的系统，天然带着双用途的问号。好在这次的目标是去中和毒素、而不是增强毒性，且全部 211 个设计连同结合数据都公开放到了 HuggingFace 上。[1][5] 公开本身就是一种生物安全姿态：它把结果变成可复现、可审查、可被同行接着验的材料，而不是一份只能看摘要的新闻稿。Torres 和 Jenkins 这两位外部专家的介入，也属于这套「让外人能查」的机制。

更长期的问题不在这一篇能答完。当设计可信结合蛋白的门槛降到「几天 + 一个提示词」，谁能跑、针对什么靶点跑、跑完公不公开，就成了比单次结果更重要的治理问题。这篇给的样本是正面的：挑一个没人愿意投钱、却真的死人的靶子，公开全部数据，请外部专家把关。它没有、也没法回答这套做法能不能普遍成立。

## 刷新前沿的是 harness，不是更大的模型

这篇最容易被跳过、却最该划线的，是脚注里那句算力账。整场活动用了约 10,000 GPU 小时，作者坦承这远超大多数研究者能拿到的资源；但紧接着说，他们已把这些模型平均提速约 4 倍，并且证明用单个 agent、单块 GPU、跑 24 小时的简化提示，就能达到相当的 in silico 分数。[1]

这句话改变了故事的重心。如果同样的计算结果，能从「10,000 GPU 小时 + 多工具编排」压到「一块 GPU + 一天」，那么真正在推进前沿的，就不是某个更大的模型，而是把模型装进一条显式回路的 harness——谁来调工具、怎么筛、在哪儿插人类的一句话。这和站内两篇的主张一脉相承：[《Claude Science harness：无人值守算出九圈振幅》](/cn/blog/claude-science-harness-nine-loop-amplitudes/)说刷新前沿的是显式 harness 加最小人类干预；[《AI harness 与环境可读性》](/cn/blog/ai-harness-environment-legibility/)说能跑多远，取决于环境给 agent 留了多少可读的反馈。蝎毒这条回路里，湿实验就是那个最硬、最慢、也最诚实的反馈环节。

所以我更愿意把这次成果读成一次 agent-loop 的演示，而不是一次模型能力的跃迁。模型是零件，回路才是机器；而这台机器最珍贵的零件，是那条没法加速的湿实验真值。

## 一个框架：怎么读这类自主科学 agent 成果

每隔几周就会冒出一篇「Claude/某模型做出了某科学突破」。与其跟着标题的情绪走，不如按一张证据阶梯去放它——看它停在了哪一级，以及作者有没有把停的地方说清楚。

<figure class="not-prose my-6"><svg viewBox="0 0 600 392" role="img" aria-label="从计算设计到真药的证据阶梯" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto;max-width:600px;display:block;margin:0 auto;font-family:inherit;color:inherit" fill="currentColor"><text x="10" y="26" font-size="16" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="1">证据阶梯：这次停在第 2 级</text><text x="10" y="46" font-size="12" text-anchor="start" fill="currentColor" fill-opacity="0.7">绿色＝本研究已完成；灰色＝尚未做，价值与风险都在这几级</text><rect x="10" y="58" width="560" height="42" rx="6" fill="#10b981" fill-opacity="0.16" stroke="#10b981" stroke-width="1.3"/><text x="24" y="76" font-size="13" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="1">① in silico：生成 + 共折叠打分</text><text x="24" y="93" font-size="11.5" text-anchor="start" fill="currentColor" fill-opacity="0.85">318,484 设计 · 553,052 对打分 · 模型自定阈值　✓ 已完成</text><rect x="10" y="108" width="560" height="42" rx="6" fill="#10b981" fill-opacity="0.16" stroke="#10b981" stroke-width="1.3"/><text x="24" y="126" font-size="13" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="1">② 重组毒素上的结合（湿实验真值）</text><text x="24" y="143" font-size="11.5" text-anchor="start" fill="currentColor" fill-opacity="0.85">两家实验室 SPR · KD ≤ 1 µM · 排除 CLEC12A　✓ 17 个达标</text><rect x="10" y="158" width="560" height="38" rx="6" fill="#94a3b8" fill-opacity="0.12" stroke="currentColor" stroke-width="1.1" stroke-dasharray="5 4"/><text x="24" y="182" font-size="13" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="0.9">③ 结合「真蝎毒提纯」的毒素　— 未做</text><rect x="10" y="204" width="560" height="38" rx="6" fill="#94a3b8" fill-opacity="0.12" stroke="currentColor" stroke-width="1.1" stroke-dasharray="5 4"/><text x="24" y="228" font-size="13" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="0.9">④ 体外中和：膜片钳看是否拦住通道　— 未做</text><rect x="10" y="250" width="560" height="38" rx="6" fill="#94a3b8" fill-opacity="0.12" stroke="currentColor" stroke-width="1.1" stroke-dasharray="5 4"/><text x="24" y="274" font-size="13" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="0.9">⑤ 体内有效性：小鼠是否真被保护　— 未做</text><rect x="10" y="296" width="560" height="38" rx="6" fill="#94a3b8" fill-opacity="0.12" stroke="currentColor" stroke-width="1.1" stroke-dasharray="5 4"/><text x="24" y="320" font-size="13" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="0.9">⑥ 安全 · 稳定 · 便宜 · 可及 → 真药　— 未做</text><text x="10" y="356" font-size="12.5" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="1">读法：标题说到第几级，研究只做到第几级？差几级，就打几折。</text><text x="10" y="378" font-size="11" text-anchor="start" fill="currentColor" fill-opacity="0.6">阶梯据 [1] 的限制与后续规划整理</text></svg></figure>

*图：从计算设计到真药的六级证据阶梯。这次研究诚实地停在第 2 级，并把第 3 到 6 级点名列为未做。读任何「AI 科学突破」都可以套这把尺。数据与规划来自 [1]。*

落到几个可以照着问的问题：

1. **它停在证据阶梯的第几级？** 是 in silico 打分，是重组靶点结合，还是真的体内有效、乃至成药？这次停在第 2 级，而且作者明说了。标题若把它说成更高级，就是营销。
2. **真值从哪来，可不可复现？** 这次真值来自两家 CRO 的 SPR，标准严、还公开了全部数据。没有独立湿实验真值的「发现」，先按 in silico 结果对待。
3. **阴性结果交代了没有？** 多毒素全败、命中率只是「正常水平」，这些都写了。只报喜不报忧的稿子，可信度先减半。
4. **推进前沿的是模型还是回路？** 看它有没有给出 harness、工具编排、人类干预点和算力账。这次的 4 倍提速与「单 GPU 单 agent 24 小时」那句，才是最耐读的部分。
5. **双用途怎么处理？** 靶子是中和还是增强，数据公不公开，有没有外部专家把关。这三点这次都占了正面。

## 结语

Claude Science 这次最让我认账的，不是 17 这个数字，而是它把一条实验科学的回路老老实实跑了一圈，还把每一道闸、每一次人类插话、每一类失败都摊开讲了。31.8 万到 211 到 17，是探索、筛选、真值验证三段各自收窄的结果；而真值那一段——两家实验室、严到跨重复跨对照的判定——没法被算力加速，也正因如此最值得信。往后看，决定这类工作走多远的，大概率是 harness 和愿不愿公开数据，而不是模型又大了几成。读这类新闻时，把证据阶梯摆出来，看它停在哪一级、有没有把停的地方说清楚，比跟着标题激动有用得多。

## 参考来源

1. Anthropic，《How Claude designed protein binders against scorpion neurotoxins》，2026-10-20：<https://www.anthropic.com/research/claude-scorpion-toxin-binder-design>
2. Anthropic，本研究技术报告（PDF）：<https://www-cdn.anthropic.com/31ac578806cffd8b3d92d8affe6edc4c04d502e1.pdf>
3. Citrini Research（合作方，金融投资研究公司）：<https://www.citriniresearch.com/p/citrini-therapeutics>
4. Anthropic，《Claude accelerates protein design》（8 月单提示词结合蛋白研究）：<https://www.anthropic.com/research/Claude-accelerates-protein-design>
5. Anthropic，蝎毒结合蛋白设计数据集（211 个设计与结合数据）：<https://huggingface.co/datasets/Anthropic/scorpion-toxin-binder-design>
