---
title: "AI 逆向与 clean-room 重写：REA、PhotoCraft、chardet 和 Malus 放在一起看"
description: "把 REA 的 agent 逆向工具链、ArtCraft PhotoCraft 的「clean-room 重写 Photoshop」、chardet 7 用 Claude 重写并改许可、Malus 的讽刺站点放在一起，拆开 AI 逆向与重写的机制、经典 clean room 与 AI 版的差别、许可与著作权风险，并给出一份判断与使用的决策框架。"
pubDate: 2026-10-14T21:30:00+08:00
author: "Remy"
tags: ["ai-agents", "ai-coding", "open-source", "security", "developer-tools"]
lang: "zh"
---

这两周有四件事凑到了一起。REA（「Reverse-Engineer Anything」）是一套给 coding agent 用的逆向工具，10 月 13 日一天涨了 45,327 星，总数到 161,865，Hacker News 上的讨论帖有 800 分、337 条评论。[1][3] ArtCraft 旗下的 PhotoCraft 自称是 Photoshop 的 clean-room 重写，纯 Rust 实现，10 月 13 日有 55,400 星。[6][8] 再往前，3 月份 chardet 7.0 用 Claude Code 从零重写，许可从 LGPL 改成 MIT（后来又改成 0BSD），原作者 Mark Pilgrim 在 issue #327 里说维护者「无权改许可」。[11][12] 同一个月，讽刺站点 Malus 把这件事做成了一门生意的样子：「洁净室即服务」，上传依赖清单，交回一份去掉署名和 copyleft 的「重写版」，在 HN 上拿了 1433 分。[16]

单看任何一件都像新闻，放在一起才看得出它们是同一条流水线的不同截面：用 agent 读懂一个程序（REA），把读到的东西变成规格或测试，再让 agent 按规格重写（PhotoCraft、chardet），最后换一个许可证发出去（chardet、Malus 的讽刺对象）。每一步的技术门槛都在这一年里掉到了个人开发者够得着的位置，而法律和社区规范还停留在「两组人隔一道墙」的年代。下面先讲机制，再对照经典 clean room，然后把风险分层，最后给一份能直接用的判断清单。

## 先说结论

1. **逆向本身不新，新的是成本。** 以前要懂汇编、会用 Ghidra、花几周才能还原的一条业务规则，现在一句提示词加几分钟就能拿到。REA 官网的计算器例子就是这个量级。[2]
2. **AI 版 clean room 通常没有墙。** 经典做法靠「读原作的人」和「写代码的人」物理隔离来留证据；chardet 7 和 PhotoCraft 都是同一个人观察、写规格、审代码，模型本身还可能在训练时见过原作。[8][12]
3. **相似度低只证明了一件事。** 它能说明字面代码没有被搬过来，说明不了衍生关系是否切断，更管不到使用条款、商标、商业外观和专利。[8][9][13]
4. **改许可是整件事里风险最高的一步。** 同样的重写，换个新包名发布几乎没人会吵；沿用旧名字并把 copyleft 换成宽松许可，才把争议推到台前。[13]

## REA 到底做了什么

REA 的定位写得很直白：给你的 coding agent 一套工具，让它去检查程序本身，而不是去猜。[2] 它覆盖的对象从原生二进制一直到网页和 Electron 应用，能力包括反汇编、反编译、调用追踪，以及抓取浏览器或进程的运行时行为。[1] 安装是一条 `npx rea-agents@latest setup`，装好以后 agent 多了一组可以调用的检查工具。

官网用两个例子说明它的工作方式，值得细看，因为它们恰好展示了「逆向」和「重写」之间那一步是怎么发生的。

第一个是 Windows 计算器：为什么 200 + 10% 等于 220。REA 读出已安装计算器 DLL 里 % 处理函数的 x64 指令，agent 看到两条比较指令分别比对 0x5c 和 0x5b，再到微软公开的源码里查到这两个值是乘号和除号的命令 ID，又看到常量 0x64 也就是 100。拼起来的规则是：前一个运算符是乘或除时，10% 变成 0.1；是加或减时，10% 取第一个数的百分比，所以 200 + 10% 是 200 + 20。[2] 第二个是 Chromium 的恐龙小游戏：REA 通过本地调试连接拿到运行中的 `index.js`，读出速度从 6 开始、每次更新加 0.001、上限 13 的规则；在受控浏览器里调用原游戏的更新函数，4,000 次后速度是 10.0，10,000 次后是 13.0。[2]

这两个例子的共同点是：最后交给用户的不是原代码，而是一条用自然语言或几行伪代码写下来的**规则**，然后 agent 按规则写了一个新的小程序，再拿原程序做对照测试。这就是下图里的四格流水线。

<figure class="not-prose my-6"><svg viewBox="0 0 600 330" role="img" aria-label="逆向流水线" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto;max-width:600px;display:block;margin:0 auto;font-family:inherit;color:inherit" fill="currentColor"><defs><marker id="ah2" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="currentColor"/></marker></defs><text x="10" y="24" font-size="16" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="1">从逆向到重写（以 REA 为例）</text><rect x="10" y="46" width="130" height="62" rx="6" fill="#94a3b8" fill-opacity="0.15" stroke="currentColor" stroke-opacity=".5" stroke-width="1.2"/><text x="75" y="72" font-size="14" text-anchor="middle" font-weight="bold" fill="currentColor" fill-opacity="1">目标</text><text x="75" y="92" font-size="11" text-anchor="middle" font-weight="normal" fill="currentColor" fill-opacity="0.8">exe / DLL / JS / 网页</text><line x1="140" y1="77" x2="162" y2="77" stroke="currentColor" stroke-width="1.6" marker-end="url(#ah2)"/><rect x="162" y="46" width="130" height="62" rx="6" fill="#3b82f6" fill-opacity="0.15" stroke="currentColor" stroke-opacity=".5" stroke-width="1.2"/><text x="227" y="72" font-size="14" text-anchor="middle" font-weight="bold" fill="currentColor" fill-opacity="1">检查</text><text x="227" y="92" font-size="11" text-anchor="middle" font-weight="normal" fill="currentColor" fill-opacity="0.8">反汇编 · 反编译 · 运行时</text><line x1="292" y1="77" x2="314" y2="77" stroke="currentColor" stroke-width="1.6" marker-end="url(#ah2)"/><rect x="314" y="46" width="130" height="62" rx="6" fill="#f59e0b" fill-opacity="0.15" stroke="currentColor" stroke-opacity=".5" stroke-width="1.2"/><text x="379" y="72" font-size="14" text-anchor="middle" font-weight="bold" fill="currentColor" fill-opacity="1">规则</text><text x="379" y="92" font-size="11" text-anchor="middle" font-weight="normal" fill="currentColor" fill-opacity="0.8">可读的行为描述</text><line x1="444" y1="77" x2="466" y2="77" stroke="currentColor" stroke-width="1.6" marker-end="url(#ah2)"/><rect x="466" y="46" width="130" height="62" rx="6" fill="#10b981" fill-opacity="0.15" stroke="currentColor" stroke-opacity=".5" stroke-width="1.2"/><text x="531" y="72" font-size="14" text-anchor="middle" font-weight="bold" fill="currentColor" fill-opacity="1">重写</text><text x="531" y="92" font-size="11" text-anchor="middle" font-weight="normal" fill="currentColor" fill-opacity="0.8">新代码</text><path d="M 531 108 C 531 150, 75 150, 75 112" fill="none" stroke="currentColor" stroke-width="1.4" stroke-dasharray="5 4" marker-end="url(#ah2)"/><text x="300" y="150" font-size="12" text-anchor="middle" font-weight="normal" fill="currentColor" fill-opacity="1">对照原程序做差分测试</text><text x="10" y="186" font-size="13" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="1">计算器：200 + 10% = 220</text><text x="10" y="206" font-size="12" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.85">加号后 % 取第一个数的百分比；乘除后 % 变成 0.1 [2]</text><text x="10" y="234" font-size="13" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="1">恐龙游戏：速度从 6 起，每次更新 +0.001，上限 13</text><text x="10" y="254" font-size="12" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.85">4,000 次更新后 10.0，10,000 次后 13.0 [2]</text><rect x="10" y="272" width="580" height="46" rx="6" fill="#ef4444" fill-opacity="0.08" stroke="currentColor" stroke-opacity=".5" stroke-width="1.2" stroke-dasharray="5 4"/><text x="20" y="292" font-size="12" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="1">「规则」这一格决定法律性质：只带走行为和事实，还是连原代码的表达一起带走</text><text x="20" y="309" font-size="12" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.8">「检查」这一步是否被许可条款允许，要单独看</text></svg></figure>

*图 1：从逆向到重写的四步。差分测试把原程序当成判断对错的基准。数字来自 REA 官网的两个例子 [2]*

[![Hacker News 上「REA Reverse – Engineer Anything」讨论帖截图](/assets/ai-reverse-engineering-clean-room-rewrite-licensing/hn-rea.webp)](https://news.ycombinator.com/item?id=50028275)

*截图：HN 上 REA 的讨论帖，置顶评论说复古游戏反编译圈已经被低质量移植淹没，接下来会被「还算像样」的 AI 反编译淹没 [3]*

HN 置顶评论的担心很具体：复古游戏的反编译社区原本是一群人花几年把一个游戏一点点还原成可读 C 代码，现在每月付 200 美元订阅的人就能批量产出「还算像样」的反编译结果，这个爱好本身被抽掉了意义。[3] 两个高播放量的视频实测也基本是同一个结论：工具确实好用，好用到让人有点不安。[4][5]

我的看法是，REA 本身在法律上并不比 Ghidra 或 Chrome DevTools 更敏感，它没有发明新的能力，只是把这些能力接到了一个会自己调用工具的 agent 上。真正的变化在图 1 的第三格：以前「规则」是工程师脑子里的理解，现在是 agent 写出来的一份文档，紧接着同一个 agent 就能把它写成代码。读和写之间的距离从几周缩到了一次对话，这正是 clean room 原本要拉开的距离。

## PhotoCraft：没有源码可看的 clean room

PhotoCraft 的情况和 chardet 正好相反。Photoshop 是闭源的，没有人声称读过它的源码，所以争议点不在「看没看过代码」，而在「看了多少行为、怎么看的」。

根据 Declic 对仓库的梳理，项目的第一个大提交叫「one-shot」，一次 42,241 行，离项目首次提交不到三个小时。到 10 月 10 日，贡献者文件里有 1,302 个提交、189 位贡献者，其中 736 个提交带着 Claude Opus 5.5 的共同作者标记。[8] 目标是「1:1 Photoshop 对等」：同样的菜单、快捷键和行为。项目规则写明 Photoshop 只用来研究行为和外观，代码一行不抄，一切从公开规范（Adobe 公开的 PSD 格式文档、ICC 色彩标准）和观察出发。[6][8]

观察做得很细。团队安装了 Photoshop 2026，在不启动的情况下清点安装包，拿到默认快捷键、插件列表和主程序里的字符串；另一个配套仓库存了 250 多个由脚本驱动真实 Photoshop 生成的 PSD 文件，每个文件里嵌着 Photoshop 自己的渲染结果，测试要求 PhotoCraft 渲染出同样的像素。有一个未公开的参数，团队写明是从软件内部字符串里读到的名字。[8] 项目自报 24 个 crate、1,700 多个测试，PSD 往返测试 309 个里通过 307 个。[6]

[![GitHub storytold/photocraft 仓库首页截图](/assets/ai-reverse-engineering-clean-room-rewrite-licensing/photocraft-repo.webp)](https://github.com/storytold/photocraft)

*截图：PhotoCraft 仓库首页，最早的目录提交信息就是「one-shot」，许可为 Apache-2.0 与 MIT [6]*

这套方法在工程上很扎实：拿原程序的输出做测试基准，本质上就是图 1 里的差分测试，只是规模放大到几百个文件。问题在于它的「墙」。法律学者 Andres Guadamuz 的说法是，clean room 主要是证据问题，证明写代码的人从没见过原作；而 ArtCraft 的贡献规则里看不到观察者和编码者的分离，同一个开发者观察 Adobe 软件、写规格、再让模型写代码，这正是他认为有问题的地方。另外模型训练时读过什么，从外面查不了。[8]

进度上，项目自己的账是：截至 10 月 10 日，大约达到专业用户替换 Photoshop 所需的 45%，有 579 个未关闭的 issue，估计 beta 前还要 1,100 到 1,800 个 agent 小时。不到两周就把 Photoshop 里找到的 631 个菜单项全部接上了。[8] 这组数说明了一件很实在的事：复刻一个软件的表面现在几乎不花钱，但专业用户真正付钱的那一半（文件交换不出意外、插件生态、生成式功能和支持服务）还远没有被复刻出来。作者在 r/Adobe 发帖时用的是「7 个 Adobe 应用的 100% Rust clean-room 克隆」这种说法 [10]，HN 上的讨论帖则有 140 分、86 条评论。[7]

## chardet 7：有源码、有日志、有争议

chardet 是 Python 里检测文本编码的库，月下载量超过 1.3 亿。Mark Pilgrim 在 2006 年从 Mozilla 的 C++ 实现手工移植成 Python，许可是从 Mozilla 那里继承来的 LGPL；Dan Blanchard 从 2012 年起维护至今。[12] LGPL 让它进不了 Python 标准库，Blanchard 在 2021 年还公开说过「如果能改许可我早就改了」。[13]

2026 年 2 月底，他用 Claude Code 花五天从零重写，性能提升约 41 倍，准确率也更高，代码从约 100 个 Python 文件缩到约 22 个，以 MIT 发布。[12] Pilgrim 随后开了 issue #327，核心论点只有一句：他们对原代码有大量接触，这不是 clean room，「加一个花哨的代码生成器并不会多给他们任何权利」。[11]

[![chardet issue #327「No right to relicense this project」截图](/assets/ai-reverse-engineering-clean-room-rewrite-licensing/chardet-issue-327.webp)](https://github.com/chardet/chardet/issues/327)

*截图：chardet issue #327，Mark Pilgrim 的原帖获得 1464 个赞，下方是被置顶的 Dan Blanchard 回复 [11]*

Blanchard 的回应分两层。第一层是承认：他维护了十多年，经典 clean room 要求的那种隔离在这里并不存在；但 clean room 只是手段，目的是保证结果不是衍生作品，而他可以用直接测量来证明这一点。[14] 第二层是证据，后来他把全部会话日志公开，写成一篇很长的说明。[12]

这份说明里有几处值得记住的细节：

- **模型本来就认识 chardet。** 不给任何源码、不联网，Claude 能凭记忆讲出 chardet 的状态机表结构、按编码划分的字节类别、用频率分布区分结构上都合法的编码。讲得不完全对：类层次有错，漏了几个 prober，还给源码里只是整数的中间状态编了名字。[12]
- **旧源码在三个会话里进入过模型上下文。** 第一天子 agent 试图遍历旧仓库，被他拒绝；有两次是他主动让模型参考自己写的数据文件；最大的一次是子 agent 为了做 API 兼容，自己去 GitHub 读了 6.0.0 的 `universaldetector.py` 全文，567 行，当时检测引擎已经写完提交了两天。按 git blame，这个文件 510 行是 Blanchard 自己写的，Pilgrim 名下 32 行。[12]
- **三种相似度度量都接近零。** `git blame -C -C -C` 在 7.0.0 里找不到任何一行属于 Pilgrim，3,931 行全部归 Blanchard；JPlag 对比 6.0.0 和 7.0.0，平均 0.04%、最高 1.30%，三处匹配加起来 47 个 token，全是 import 语句和 argparse 样板；作为对照，5.2.0 和 6.0.0 之间最高是 80%。Copydetect 的最高值 59% 落在一个三行的 `__main__.py` 上。[12]
- **架构确实换了。** 旧版是几十个有状态的 prober 并行喂字节，7.0.0 是 12 段无状态流水线，评分从 4 档序数改成带 IDF 权重的余弦相似度。[12]

他据此援引 Altai 案的「抽象—过滤—比较」（AFC）测试：先过滤掉思想、通用写法和问题本身决定的元素，再看受保护的结构是否留存。[12] GPLv3/LGPLv3 的起草者之一 Richard Fontana 也表示，目前看不到要求 7.0.0 必须用 LGPL 的依据，因为没人指出旧版里有受保护的表达留存下来。[14]

反方的论点同样有分量。LWN 的 Jonathan Corbet 指出，让 LLM 换一种风格重写，相似度工具自然看不出关系，但这不等于切断了衍生关系：如果让 LLM 把 chardet 翻译成 Lisp，相似度也会很低，可大多数人会同意那是衍生作品。[13] 自由软件基金会执行董事 Zoë Kooyman 的说法更直接：「吃过原代码的大语言模型没有什么『clean』可言。」[15] Simon Willison 列了几个让这件事难以判断的因素：Blanchard 浸在这个代码库里十多年；Claude 在过程中确实参考过旧仓库的文件；模型很可能在训练时见过所有旧版本；Pilgrim 的原代码本身就是从 Mozilla 的 MPL 代码手工移植的；以及沿用同一个 PyPI 包名到底有多大影响。[14] 他本人倾向于认为重写合法，同时承认两边的论点都站得住。

## 经典 clean room 和 AI 版差在哪里

把经典做法摆出来对照会清楚很多。1984 年 Phoenix Technologies 要卖一个兼容 IBM 的 BIOS：一组工程师读 IBM 技术手册里印出来的代码，写成功能规格；另一位从没见过那份代码的工程师，只按规格写程序；双方的往来全部留档。[8] Compaq 在 1982 年做 IBM PC BIOS 克隆也是这个结构。[14]

<figure class="not-prose my-6"><svg viewBox="0 0 600 370" role="img" aria-label="clean room 对照" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto;max-width:600px;display:block;margin:0 auto;font-family:inherit;color:inherit" fill="currentColor"><defs><marker id="ah1" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="currentColor"/></marker></defs><text x="10" y="24" font-size="16" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="1">经典 clean room 与 AI 版：隔离墙在哪里</text><text x="10" y="52" font-size="14" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="1">经典做法（Phoenix BIOS，1984）</text><rect x="10" y="64" width="150" height="56" rx="6" fill="#94a3b8" fill-opacity="0.15" stroke="currentColor" stroke-opacity=".5" stroke-width="1.2"/><text x="85" y="88" font-size="13" text-anchor="middle" font-weight="bold" fill="currentColor" fill-opacity="1">原作品</text><text x="85" y="106" font-size="11" text-anchor="middle" font-weight="normal" fill="currentColor" fill-opacity="0.8">IBM 手册里的代码</text><line x1="160" y1="92" x2="200" y2="92" stroke="currentColor" stroke-width="1.6" marker-end="url(#ah1)"/><rect x="200" y="64" width="150" height="56" rx="6" fill="#3b82f6" fill-opacity="0.15" stroke="currentColor" stroke-opacity=".5" stroke-width="1.2"/><text x="275" y="88" font-size="13" text-anchor="middle" font-weight="bold" fill="currentColor" fill-opacity="1">A 组：读原作</text><text x="275" y="106" font-size="11" text-anchor="middle" font-weight="normal" fill="currentColor" fill-opacity="0.8">只写功能规格</text><line x1="372" y1="58" x2="372" y2="128" stroke="#ef4444" stroke-width="4"/><text x="372" y="144" font-size="11" text-anchor="middle" font-weight="normal" fill="#ef4444" fill-opacity="1">隔离墙 + 往来记录</text><line x1="350" y1="92" x2="392" y2="92" stroke="currentColor" stroke-width="1.6" marker-end="url(#ah1)"/><rect x="392" y="64" width="190" height="56" rx="6" fill="#10b981" fill-opacity="0.15" stroke="currentColor" stroke-opacity=".5" stroke-width="1.2"/><text x="487" y="88" font-size="13" text-anchor="middle" font-weight="bold" fill="currentColor" fill-opacity="1">B 组：从未见过原作</text><text x="487" y="106" font-size="11" text-anchor="middle" font-weight="normal" fill="currentColor" fill-opacity="0.8">只按规格写代码</text><text x="10" y="176" font-size="14" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="1">AI 版（chardet 7 / PhotoCraft 的做法）</text><rect x="10" y="188" width="150" height="56" rx="6" fill="#94a3b8" fill-opacity="0.15" stroke="currentColor" stroke-opacity=".5" stroke-width="1.2"/><text x="85" y="212" font-size="13" text-anchor="middle" font-weight="bold" fill="currentColor" fill-opacity="1">原作品</text><text x="85" y="230" font-size="11" text-anchor="middle" font-weight="normal" fill="currentColor" fill-opacity="0.8">源码 / 二进制 / 行为</text><line x1="160" y1="216" x2="200" y2="216" stroke="currentColor" stroke-width="1.6" marker-end="url(#ah1)"/><rect x="200" y="188" width="150" height="56" rx="6" fill="#3b82f6" fill-opacity="0.15" stroke="currentColor" stroke-opacity=".5" stroke-width="1.2"/><text x="275" y="212" font-size="13" text-anchor="middle" font-weight="bold" fill="currentColor" fill-opacity="1">同一个人</text><text x="275" y="230" font-size="11" text-anchor="middle" font-weight="normal" fill="currentColor" fill-opacity="0.8">观察 + 写规格 + 审代码</text><line x1="372" y1="182" x2="372" y2="252" stroke="#ef4444" stroke-width="2" stroke-dasharray="4 5"/><text x="372" y="268" font-size="11" text-anchor="middle" font-weight="normal" fill="#ef4444" fill-opacity="1">墙只是提示词和权限</text><line x1="350" y1="216" x2="392" y2="216" stroke="currentColor" stroke-width="1.6" marker-end="url(#ah1)"/><rect x="392" y="188" width="190" height="56" rx="6" fill="#f59e0b" fill-opacity="0.15" stroke="currentColor" stroke-opacity=".5" stroke-width="1.2"/><text x="487" y="212" font-size="13" text-anchor="middle" font-weight="bold" fill="currentColor" fill-opacity="1">模型 / 子 agent</text><text x="487" y="230" font-size="11" text-anchor="middle" font-weight="normal" fill="currentColor" fill-opacity="0.8">写代码</text><rect x="392" y="288" width="190" height="44" rx="6" fill="#ef4444" fill-opacity="0.12" stroke="currentColor" stroke-opacity=".5" stroke-width="1.2" stroke-dasharray="5 4"/><text x="487" y="308" font-size="11" text-anchor="middle" font-weight="normal" fill="currentColor" fill-opacity="1">训练语料里可能有原作</text><text x="487" y="324" font-size="11" text-anchor="middle" font-weight="normal" fill="currentColor" fill-opacity="0.8">外部无法核验</text><path d="M 140 244 C 140 326, 300 326, 390 310" fill="none" stroke="#ef4444" stroke-width="1.4" stroke-dasharray="4 4"/><text x="10" y="356" font-size="12" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.75">chardet 7 的会话日志：子 agent 在 3 个会话里读到旧源码 [12]</text></svg></figure>

*图 2：经典 clean room 靠两组人之间的墙留证据；AI 版的「墙」只是提示词和工具权限，模型的训练语料还绕开了这道墙 [8][12]*

差别有三处。

第一，**角色合并了**。经典做法里，知道原作的人只能写规格；AI 版里，同一个人观察原作、写规格、审查代码、反复迭代。Ars 的报道专门点出这一层：Blanchard 自己说他深度参与了每一部分的设计和审查，一个熟悉旧代码的人对新代码有这么强的影响，也可能影响新版本能否算独立作品。[15]

第二，**墙变软了**。chardet 的做法是空仓库、只预先放行 git 命令、明确指示不得参考 LGPL 代码，这些都是提示词和权限配置，结果子 agent 还是自己跑去读了旧文件。[12] 这件事的教训比较具体：如果你打算按 clean room 的思路用 agent，隔离要做在文件系统和网络层，而不是写在提示词里。

第三，**有一条通路无法隔离**，就是训练语料。经典做法里 B 组「从没见过原作」是可以作证的事实；模型是否见过、记住了多少，外部无法核验。[8] chardet 的例子说明模型能记住架构但记不准细节 [12]，这对衍生关系的判断到底是有利还是不利，目前没有法院给过答案。

Blanchard 和 antirez 的立场是，clean room 从来不是法律要求，只是「打官司时的一种优化」，美国法上的检验是「接触 + 实质性相似」，相似性证明不了，过程怎么来的就不重要。[12] 这个说法在法理上有道理，但工程上要看清它的代价：你放弃了过程证据，就只能靠结果证据，而结果证据（相似度）恰好是 LWN 指出的那个最容易被风格改写糊弄的指标。

## 风险不只在著作权一层

讨论 AI 重写时，大家习惯把问题简化成「代码像不像」。PhotoCraft 的案例正好说明这只是第一层。

<figure class="not-prose my-6"><svg viewBox="0 0 600 340" role="img" aria-label="风险分层" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto;max-width:600px;display:block;margin:0 auto;font-family:inherit;color:inherit" fill="currentColor"><text x="10" y="24" font-size="16" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="1">相似度很低之后，还剩哪几层风险</text><rect x="10" y="44" width="580" height="46" rx="6" fill="#10b981" fill-opacity="0.14" stroke="currentColor" stroke-opacity=".5" stroke-width="1.2"/><text x="22" y="64" font-size="13" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="1">著作权：代码表达</text><text x="22" y="82" font-size="11.5" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.8">相似度工具、git blame、AFC 过滤</text><text x="578" y="72" font-size="12" text-anchor="end" font-weight="bold" fill="currentColor" fill-opacity="1">可度量</text><rect x="10" y="98" width="580" height="46" rx="6" fill="#f59e0b" fill-opacity="0.14" stroke="currentColor" stroke-opacity=".5" stroke-width="1.2"/><text x="22" y="118" font-size="13" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="1">著作权：衍生关系</text><text x="22" y="136" font-size="11.5" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.8">翻译成别的语言，相似度同样很低 [13]</text><text x="578" y="126" font-size="12" text-anchor="end" font-weight="bold" fill="currentColor" fill-opacity="1">难度量</text><rect x="10" y="152" width="580" height="46" rx="6" fill="#f59e0b" fill-opacity="0.14" stroke="currentColor" stroke-opacity=".5" stroke-width="1.2"/><text x="22" y="172" font-size="13" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="1">训练语料暴露</text><text x="22" y="190" font-size="11.5" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.8">模型是否见过原作，外部无法核验 [8]</text><text x="578" y="180" font-size="12" text-anchor="end" font-weight="bold" fill="currentColor" fill-opacity="1">不可核验</text><rect x="10" y="206" width="580" height="46" rx="6" fill="#ef4444" fill-opacity="0.14" stroke="currentColor" stroke-opacity=".5" stroke-width="1.2"/><text x="22" y="226" font-size="13" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="1">合同 / 使用条款</text><text x="22" y="244" font-size="11.5" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.8">Adobe 条款禁止为重建而监测输入输出 [8]</text><text x="578" y="234" font-size="12" text-anchor="end" font-weight="bold" fill="currentColor" fill-opacity="1">与代码无关</text><rect x="10" y="260" width="580" height="46" rx="6" fill="#ef4444" fill-opacity="0.14" stroke="currentColor" stroke-opacity=".5" stroke-width="1.2"/><text x="22" y="280" font-size="13" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="1">商标 / 商业外观 / 专利</text><text x="22" y="298" font-size="11.5" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.8">「熟悉的设计」、产品名、专利 [8][9]</text><text x="578" y="288" font-size="12" text-anchor="end" font-weight="bold" fill="currentColor" fill-opacity="1">与代码无关</text><text x="10" y="328" font-size="12" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.75">chardet 7 的三种相似度度量只覆盖第一层 [12]</text></svg></figure>

*图 3：相似度工具只管得到最上面一层；越往下，风险越和代码本身无关 [8][9][12][13]*

**著作权这一层**，判例对功能复刻相对友好。欧盟法院 2012 年的 SAS Institute 诉 World Programming 案认定，程序的功能、编程语言和数据文件格式都不受保护，被许可人可以观察、研究、测试软件来理解其原理，合同里禁止这样做的条款无效；但同一判决提醒，抄手册可能构成侵权。美国第九巡回法院在 1992 年 Sega 诉 Accolade 和 2000 年 Sony 诉 Connectix 中认定，为接触不受保护的元素而在逆向过程中复制或反汇编程序属于合理使用；2021 年最高法院在 Google 诉 Oracle 中判 Google 复制约 11,500 行 Java API 声明为合理使用，前提是法院假定而未认定这些代码受保护。[8] 这些案子都不涉及 AI 辅助的重写。[12]

**合同这一层**，Adobe 自 2025 年 10 月生效的使用条款禁止重建其产品，并明确点名「为重建该系统而监测或追踪应用的输入输出」。PhotoCraft 用脚本驱动真实 Photoshop 生成测试文件，正是这类行为；它在欧洲是否有效，又受 SAS 判决对合同限制的约束。[8] 换到 REA 的场景也一样：你检查的那个程序，它的许可协议多半有禁止逆向的条款，这和你最后写的代码像不像没有关系。

**商标、商业外观和专利这一层**，律所 IP Defense 的案例分析把它们列为 AI 复刻软件后原厂真正能主张的残余权利。[9] PhotoCraft 的 README 写着「Familiar by design」「会用 Photoshop 就会用 PhotoCraft」，界面主题按 Photoshop 风格设计，Ars 认为这里有商业外观风险；Adobe 持有数以千计的专利；产品命名也足以让商标律师留意。Guadamuz 很谨慎地说 ArtCraft「可能」在美国著作权法下站得住，但把弱点放在了著作权之外。[8] 截至 10 月 13 日，Adobe 没有公开行动，GitHub 公开的下架通知库里也没有针对这个项目的记录。[8]

还有一层是 **AI 生成代码本身的可版权性**。美国法院已经认定 AI 不能是专利发明人或作品著作权人，但软件领域还没有判例。[15] Blanchard 后来把许可从 MIT 换成 0BSD，一个接近公有领域的许可，理由就是绕开「AI 生成代码能不能有版权」这个问题。[12] 这一步很聪明：如果代码本来就不受版权保护，你也就没什么可以「授权」的，干脆放弃。

## Malus 讽刺的到底是什么

Malus 的页面把整套流程画成工业流水线：上传 `package.json`，A 组机器人只读 README、API 文档和类型定义，B 组机器人在「分析防火墙」另一侧从零实现，交付时换成「MalusCorp-0」许可，不需要署名、不需要开源修改、不需要提供源码。按解压后的 KB 计价，客户证言里有人说「847 个 AGPL 依赖三周全部解放，收购顺利成交」。[16]

它讽刺的点很准：经典 clean room 的每一个形式要素（两组隔离、只读公开文档、审计日志）都可以被自动化地模仿出来，而模仿出来的形式不等于实质上的独立。「审计日志确实存在，可在特定司法辖区应法院要求提供」这种句子，指的正是 chardet 争议里「我有日志、我有相似度」这一类证据在外人看来能有多少说服力。[16] Blanchard 也承认这个担心是正当的：AI 让 clean-room 式重写便宜了几个数量级，这对作为执行机制的 copyleft 是真实冲击。[12] LWN 的说法更进一步：如果让 LLM 重写就足以剥掉 copyleft，那受威胁的不只是 copyleft，而是任何软件许可制度。[13]

## 怎么判断，怎么用

下面这份清单按「你打算做什么」来分，每一条都可以直接拿去对照。

### 只是想弄懂一个程序

用 REA 这类工具读一个程序的行为、排查兼容性问题、做安全分析，风险主要在许可条款。先看目标软件的 EULA 有没有禁止逆向；在欧盟，为互操作而做的分析受法律保护，合同不能完全排除，在美国则要靠合理使用的个案判断。[8] 分析结果留在内部文档里，反编译出的代码片段别贴进自己的仓库。

### 想做一个功能兼容的替代品

1. **规格只写行为和事实。** 「前一个运算符是加时，% 取第一个数的百分比」是行为；变量名、函数划分、数据表的组织方式是表达。chardet 里能经得起推敲的共享部分，正是编码标准规定的字符替换对和编码等价表这类事实。[12]
2. **测试基准用原程序的输出，不用原程序的代码。** PhotoCraft 用真实 Photoshop 渲染的像素做基准，这条路线在工程上是对的；要注意的是生成这些基准文件的行为本身受不受使用条款约束。[8]
3. **隔离做在环境层。** 写代码的 agent 跑在一个看不到原仓库、访问不到原项目 GitHub 的环境里，而不是靠提示词说「不要看」。chardet 的子 agent 越界就是反面例子。[12]
4. **观察和编码尽量分人。** 资源不够做到两组人，至少让写规格和审代码的人不是同一个熟悉原作的人，并保留规格文档的版本记录。
5. **日志全留。** 会话日志、工具调用、读过哪些文件，这些是你唯一能拿出来的过程证据。Blanchard 公开全部会话记录的做法值得学，虽然它也暴露了问题。[12]

### 想改许可证

这是风险最高的一步，几个判断点：

- **换名字。** LWN 说得很清楚，如果 Blanchard 发布一个叫「detectchar」的新模块实现同样的 API，大家的反应会温和得多。[13] Blanchard 坚持用旧名字的理由是让 1.3 亿月下载用户自动拿到性能提升 [12]，这个理由是真的，代价也是真的。
- **看原作者的态度。** 原作者明确反对时，即使法律上站得住，社区关系的成本也要算进去。
- **考虑 0BSD 或公有领域。** 如果你本来就不在乎下游怎么用，放弃权利比主张一个可能不存在的版权更干净。[12]
- **不要指望相似度报告能定案。** 它能证明你没搬字面代码，证明不了你没做「翻译」。[13]

### 你是被复刻的一方

如果你的产品是闭源的，PhotoCraft 的案例告诉你，能守住的主要是条款、商标、商业外观和专利，以及复刻者短期追不上的那一半：文件格式的边角兼容、插件生态和服务。[8][9] 如果你维护的是 copyleft 项目，目前没有技术手段能阻止别人用 agent 重写，能做的是把测试集和规格文档的许可写清楚，因为这些往往是重写时最直接被拿来用的东西。

## 最后

四个案例摆在一起，最清楚的一点是：逆向和重写的成本已经塌下来了，而判断「这次重写是否独立」的方法还停在两组人和一道墙的时代。REA 让读懂程序变得便宜，PhotoCraft 和 chardet 让按规格重写变得便宜，Malus 提醒我们，连 clean room 的形式本身也可以被便宜地仿造出来。

我自己的判断是，短期内法院不会给出清晰答案，Simon Willison 预计商业公司发现核心 IP 受威胁之后会有资金充足的诉讼 [14]，那可能才是第一个真正的判例来源。在那之前，做这类工作的人能控制的只有过程：隔离做在环境里，规格只写行为，日志全部留存，许可变更换名字发。这些做法不能保证你赢官司，但能让你在被质疑时拿得出东西，而不是只有一份相似度报告。

## 参考来源

1. morluto, [rea](https://github.com/morluto/rea)（GitHub 仓库；★161,865，10-13 日增 45,327）
2. REA, [REA — Reverse Engineering for Your Coding Agent](https://rea.tools/)（官网与计算器、恐龙游戏示例）
3. Hacker News, [REA Reverse – Engineer Anything](https://news.ycombinator.com/item?id=50028275)（2026-10-10，800 分 / 337 评论）
4. YouTube, [I Tested The Viral Github Repo To Reverse Engineer Anything](https://www.youtube.com/watch?v=dAzs_rU6080)
5. YouTube, [The Fastest-Rising Repo on GitHub Is a Little Scary](https://www.youtube.com/watch?v=OMobTlfjb8s)
6. storytold, [photocraft](https://github.com/storytold/photocraft)（GitHub 仓库）
7. Hacker News, [Adobe Creative Suite Cleanroom Port to Rust](https://news.ycombinator.com/item?id=49981449)（2026-10-06，140 分 / 86 评论）
8. Alexandre Noto, [A developer cloned Photoshop with Claude. Is that legal?](https://www.declic.media/en/news/artcraft-adobe-clean-room/)（Declic Media，2026-10-13）
9. IP Defense, [AI Recreated Adobe-Like Software. What Could Adobe Actually Protect?](https://ipdefense.law/resources/adobe-ai-software-case-study.pdf)（律所案例分析，PDF）
10. Reddit r/Adobe, [PhotoCraft: I've created an open source 100% Rust clean-room clone of 7 of Adobe's apps](https://www.reddit.com/r/Adobe/comments/1wvyxjd/photocraft_ive_created_an_open_source_100_rust/)
11. chardet, [Issue #327: No right to relicense this project](https://github.com/chardet/chardet/issues/327)（2026-03-05）
12. Dan Blanchard, [Everything Claude Saw: A Transparent Account of the Chardet v7 Rewrite](http://dan-blanchard.github.io/blog/chardet-rewrite-controversy/)（2026-03-29）
13. Jonathan Corbet, [The relicensing of chardet](https://lwn.net/Articles/1061534/)（LWN，2026-03-05）
14. Simon Willison, [Can coding agents relicense open source through a "clean room" implementation of code?](https://simonwillison.net/2026/Mar/5/chardet/)（2026-03-05，3-27 更新）
15. Kyle Orland, [AI can rewrite open source code—but can it rewrite the license, too?](https://arstechnica.com/ai/2026/03/ai-can-rewrite-open-source-code-but-can-it-rewrite-the-license-too/)（Ars Technica，2026-03-10）
16. Malus, [Clean Room as a Service](https://malus.sh)（讽刺站点；HN 1433 分 / 531 评论，2026-03）
