# GSC 标题与内容优化基线

## 数据来源与边界

- 采集日期：2026-09-24，本机 Australia/Sydney 日期。
- 来源：用户已登录的 Google Search Console，资源 `sc-domain:redreamality.com`，Web 搜索。
- 三个月窗口：2026-06-22 至 2026-09-21。界面汇总约 3,600 点击、552,000 曝光、CTR 0.7%、平均排名 10.3；汇总数经过界面舍入。
- 28 天窗口：2026-08-25 至 2026-09-21。界面汇总约 1,280 点击、153,000 曝光、CTR 0.8%、平均排名 8.8。
- 下表是三个月的站点级查询数据，来自 GSC 已加载表格；不是单篇页面数据，也不是市场搜索量。CTR 和排名保留 GSC 显示值。
- 页面标签切换未能可靠生效，因此未获取 query × page 归因、页面排名、设备与国家分组或前期对比。查询与文章的对应关系是按仓库内容作出的编辑判断，不能据此断言某篇文章获得了下列全部曝光。

| 查询 | 点击 | 曝光 | CTR | 平均排名 |
| --- | ---: | ---: | ---: | ---: |
| pythonpath | 48 | 4,141 | 1.2% | 6.3 |
| pythonpath environment variable | 9 | 655 | 1.4% | 5.5 |
| export pythonpath | 6 | 504 | 1.2% | 4.4 |
| openspec | 41 | 15,013 | 0.3% | 10.0 |
| openspec cli | 79 | 1,250 | 6.3% | 4.2 |
| openspec tutorial | 34 | 1,595 | 2.1% | 7.8 |
| openspec install | 4 | 1,261 | 0.3% | 6.2 |
| can i see who starred my github repo | 3 | 290 | 1% | 4.1 |
| how to see who starred a github repo | 2 | 408 | 0.5% | 5.2 |
| what is a browser extension | 0 | 10,019 | 0% | 8.0 |

最近 28 天另行核对：`pythonpath` 为 14 点击 / 1,146 曝光；`openspec` 为 7 / 5,474；`openspec cli` 为 41 / 397。这些是另一时间窗口的数据，不与上表合计。

## 本轮修改

只修改四篇英文文章，不更改 slug、发布日期、canonical 规则或其他语言版本。

| 原有路径 `/blog/…/` | 新标题 | 内容修改 |
| --- | --- | --- |
| `pythonpathvs-code` | How to Set PYTHONPATH on Windows, Linux, macOS and VS Code | 前置定义与命令速查，区分 PATH/PYTHONPATH，补充运行时诊断，纠正 VS Code `.env`、编辑器分析路径与虚拟环境的适用范围 |
| `openspec-tutorial-cli-commands-agents-md-examples` | OpenSpec Tutorial: Install the CLI and Run Your First Change | 保留 CLI/tutorial 主题，前置 pnpm 帮助与初始化示例；保留原有深入教程 |
| `who-starred-my-github-repo-how-to-view` | How to See Who Starred Your GitHub Repository | 先回答能否查看，补充 Stargazers 入口、私有仓库权限和 stars/watchers 区别 |
| `browser-extension-development` | What Is a Browser Extension? Build Your First One with WXT | 增加定义、实例、权限说明；明确区分使用扩展与开发扩展，保留 WXT 开发教程 |

浏览器扩展文章属于待验证的搜索意图实验。另有框架比较文章也可能承接同类查询，本轮不批量把开发文章改成泛科普文章。OpenSpec 的品牌词曝光也可能包含寻找官方文档的意图，不能认为修改标题即可消除低 CTR。

## 事实核对

本轮通过官方页面核对 PYTHONPATH 定义、VS Code 终端环境设置与 GitHub Stargazers 入口：

- Python command-line/environment documentation: `https://docs.python.org/3/using/cmdline.html`
- VS Code Python environments: `https://code.visualstudio.com/docs/python/environments`
- GitHub saving repositories with stars: `https://docs.github.com/en/get-started/exploring-projects-on-github/saving-repositories-with-stars`

VS Code 文档明确列出 `python.terminal.useEnvFile` 默认 `false`；启用才将 `.env` 变量注入终端。不能把 `python.envFile` 单独存在解释为所有 Python 启动方式都会加载 `.env`。

## 验证与后续评估

新增 `e2e/gsc-content.spec.ts` 检查四个旧 URL 的 HTTP 200、title、description、canonical、单 H1 和答案段落。没有修改交互代码。

本地验证：强制同步内容缓存后，`pnpm build` 成功生成 601 个页面；`pnpm test:run` 为 76/76 通过；新增聚焦 E2E 为 4/4 通过；`pnpm test:e2e` 全量 84/84 通过；`git diff --check` 通过。独立审查发现并修正了测试匹配两个 `main` 的问题，断言已限定到文章。

部署日期与 Google 重新抓取日期尚未确认，不把本次本地修改视为已上线或已经提升 CTR。上线并确认重新抓取后，再比较等长 28 天窗口，按相同页面、查询、国家和设备检查点击、曝光、CTR 与排名。排名或查询构成明显变化时，不把 CTR 变化单独归因于标题。

## 执行异常

- 本地 `seo-google` skill 引用的 `scripts/` 不存在，且未发现其标准凭据文件：无法使用该 API 脚本入口，改用已登录浏览器。规避：运行引用脚本前先验证实际文件存在。
- GSC `Pages` 同名定位匹配隐藏和可见元素，命令返回 `semantic_ambiguous`；限定元素后仍未观察到报告切换，具体原因未确认。规避：以读回的表头和日期窗口验证动作，不把点击成功当作数据已切换。
- 读取猜测的 `src/pages/blog/[slug].astro` 和 `src/content.config.ts` 失败；实际路由是 `[...slug].astro`。规避：先用 `rg --files` 定位文件，动态路由使用 `-LiteralPath`。
- 未发现项目 `agent-incidents` 记录工具或日志；没有修改 AGENTS.md，也没有将单次异常晋升为长期规则。
- 首次构建退出码为 0，但四个新增 E2E 均读到旧标题；核对磁盘 `dist` 也为旧内容，排除浏览器缓存和错误服务端口。运行 `pnpm exec astro sync --force` 后重新构建，四个用例全部通过，表明旧内容缓存是此次阻塞因素。更底层的失效机制未调查。规避：内容修改后验证生成 HTML；发现源文件与构建内容不一致时先强制同步，再重建与复测，不削弱测试断言。
