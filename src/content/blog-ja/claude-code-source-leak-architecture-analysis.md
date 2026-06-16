---
title: 'Claude Code流出解析：AnthropicのAIコーディングエージェント・アーキテクチャ深掘り'
pubDate: 2026-03-31T00:00:00.000Z
description: 'Claude Codeのソース流出から見えた、マルチエージェント実行基盤、プラグイン市場、コンテキスト管理、権限モデルまでを読み解く。'
author: "Remy"
tags: ["AI", "Claude Code", "Architecture", "Developer Tools", "Agents", "Anthropic"]
lang: 'ja'
translatedFrom: 'claude-code-source-leak-architecture-analysis'
---

# Claude Code流出解析：AnthropicのAIコーディングエージェント・アーキテクチャ深掘り

Claude Codeのソースコードが一時的に一般公開されました。私たちは150以上のディレクトリにまたがる1,884本のTypeScriptファイルを読み解きました。そこで見えてきたのは、単なるツール利用可能なチャットボットではありません。AI支援ソフトウェア開発のための完全なオペレーティングシステムです。そこには、マルチエージェント実行基盤、プラグイン市場、セッションをまたぐメモリシステム、そしてあらゆる層で人間を最終権威として扱うセキュリティモデルが備わっていました。

この記事は、そのアーキテクチャを技術的に深掘りするものです。AIツール、エージェントフレームワーク、開発者向けインフラを作っている方には、これらの設計判断をじっくり検討する価値があります。

## 全体像：5つの層、1つの思想

Claude Codeは、明確に責務分離された5つの層で構成されています。

```
Layer 1: Entrypoints     CLI / Desktop / Web / SDK / IDE Extensions
Layer 2: Runtime          REPL loop / Query executor / Hook system / State manager
Layer 3: Engine           QueryEngine / Context coordinator / Model manager / Compact
Layer 4: Tools & Caps     100+ tools / Plugin / MCP / Skill / Agent / Command
Layer 5: Infrastructure   Auth / Storage / Cache / Analytics / Bridge transport
```

この階層設計の思想は重要です。Claude Codeは単機能のCLIではありません。たまたまターミナルインターフェースを備えている**platform runtime**です。デスクトップアプリ、Webクライアント、IDE拡張、プログラマブルなSDKを、同じコアエンジンが支えています。Bridge層が transport を抽象化しているため、エンジンはどの frontend が駆動しているかを知る必要がありません。

アーキテクチャとしては、典型的なAIラッパーというより、VS Code の extension host や Emacs の Lisp core に近いと言えます。

## 中核：QueryEngine と AsyncGenerator ループ

会話全体は、`mutableMessages` 配列を所有する `QueryEngine` シングルトンによって駆動されます。これが会話状態の単一の真実の源泉です。

コアのループは **async generator** です。

```
User message
  → build system prompt (layered context injection)
  → API request (streaming)
  → yield tokens to UI
  → if tool_use block received:
      → check permissions (hook → policy → user approval)
      → execute tool
      → append tool_result
      → continue loop (natural tail recursion)
  → if end_turn: break
```

これは非常に洗練されています。generator パターンの利点は次のとおりです。

1. **ストリーミングが自然** — token は callback ではなく `yield` で流れる
2. **tool call が再帰的** — `tool_use → tool_result → continue` は単なる反復にすぎない
3. **中断がきれい** — `AbortController` が generator を止めるだけで、後始末の spaghetti がない
4. **予算管理が簡単** — 各反復境界で `maxTurns` や `maxBudget` を確認するだけでよい

多くのAIツールフレームワークは state machine か event loop を使います。Claude Code の generator アプローチは、それよりも単純で合成しやすい設計です。

## コンテキストシステム：単なる system prompt ではない

system prompt は静的な文字列ではありません。各クエリのたびに6層から組み上げられます。

| Layer | Source | Purpose |
|-------|--------|---------|
| 1 | `defaultSystemPrompt` | Base behavioral instructions |
| 2 | `memoryMechanics` | Memory system instructions |
| 3 | `appendPrompt` | Additional prompt fragments |
| 4 | `userContext` | CLAUDE.md files (user + project level) |
| 5 | `systemContext` | Git status, environment, dynamic state |
| 6 | `workerToolsContext` | Coordinator-mode tool descriptions |

この階層的な注入により、異なる context が衝突せずに互いを上書き・拡張できます。プロジェクトレベルの CLAUDE.md は、コア prompt を触らずに振る舞いをカスタマイズできます。Claude Code が “project-aware” に感じられるのはこの仕組みのおかげで、実際に各クエリで repo の指示を読み込んでいるからです。

## コンテキスト圧縮：4段階の防御

context window は有限です。Claude Code はこれを4層の圧縮システムで扱います。

| Tier | Mechanism | When |
|------|-----------|------|
| 1 | `autoCompact` | Context approaching limit |
| 2 | `apiMicrocompact` | API-native `context_management` |
| 3 | `reactiveCompact` | After API returns context-too-large error |
| 4 | `snip` | Emergency: discard non-critical content |

`compact()` 関数は画像を除去し、圧縮APIを呼び出して会話を要約し、その後で file reference と skill state を復元します。圧縮後は `preservedSegment` 境界によって、選択的な復元が可能になります。

これは「古いメッセージを切り捨てる」よりはるかに高度です。管理された劣化パイプラインなのです。

## マルチエージェント・アーキテクチャ：3つの isolation level

Claude Code は sub-agent を単に起動するだけではありません。エージェントの種類と isolation model に関する完全な分類体系を持っています。

### Agent sources

| Type | Source | Example |
|------|--------|---------|
| BuiltInAgent | Hardcoded | `explore`, `plan`, `verify`, `general-purpose` |
| CustomAgent | Settings files | User or project-level `.claude/agents/*.md` |
| PluginAgent | Plugin packages | Marketplace-distributed agents |

### Task types (7 variants)

| Task | Isolation | Use case |
|------|-----------|----------|
| `InProcessTeammate` | AsyncLocalStorage | Same-process, shared terminal |
| `LocalAgentTask` | Async background | Non-blocking sub-agent |
| `RemoteAgentTask` | Remote CCR | Cloud execution |
| `LocalShellTask` | Child process | Shell commands |
| `DreamTask` | Background | Memory consolidation |
| `LocalWorkflowTask` | Background | Workflow scripts |
| `MonitorMcpTask` | Background | MCP server monitoring |

### Team model

複数のエージェントは、ファイルベースの Team システムで協調します。

```
~/.claude/teams/{team-name}/config.json
├── members: [{ agentId: "researcher@my-team", status: "idle" }]
└── task list: ~/.claude/tasks/{team-name}/
```

通信は **Mailboxes** を通じた非同期処理です。各 teammate は独立した message queue を持ちます。プロトコルは `shutdown_request`、`plan_approval_response`、permission bubbling といった構造化メッセージをサポートしています。

**重要な設計判断：**

- `model: 'inherit'` により子エージェントは親の prompt cache を共有する — cache hit のための byte-level alignment
- `TEAMMATE_MESSAGES_UI_CAP = 50` は memory leak を防ぐ（292 agents で 36.8GB に達したため導入）
- 読み取り専用エージェント（Explore, Plan）での `omitClaudeMd` は、全体で週あたり約5〜15 GTok を節約する
- `AsyncLocalStorage` は明示的な引数渡しなしで暗黙の context isolation を提供する

## ツールシステムとセキュリティモデル

### 30以上の built-in tools

ツール一覧は小さな IDE のようです。`BashTool`, `FileReadTool`, `FileEditTool`, `FileWriteTool`, `GlobTool`, `GrepTool`, `WebFetchTool`, `WebSearchTool`, `NotebookEditTool`, `AgentTool`, `SendMessageTool`, `TaskCreate/Get/List/Update`, `TeamCreate/Delete`, `EnterPlanMode`, `EnterWorktree`, `ScheduleCron`, `MCPTool`, `LSPTool`, `PowerShellTool` などが含まれます。

各 tool は `Tool` base class を継承し、次の要素を備えます。

- パラメータ用の JSON Schema
- 権限宣言
- 実行関数
- 結果フォーマット

### 実行パイプライン

```
LLM outputs tool_use block
  → Parse parameters
  → Hook: PreToolUse (can intercept or modify)
  → Permission check (mode + allowlist + policy)
  → Execute tool
  → Hook: PostToolUse (audit, notify)
  → Return result to LLM
```

### Sandbox

BashTool はプラットフォーム固有の sandbox でコマンドを実行します。

- **macOS**: `sandbox-exec` (seatbelt profiles)
- **Linux**: Namespace isolation
- **Windows**: Restricted mode

この sandbox は、network access、filesystem scope、process creation を制限します。これは「モデルを信頼する」システムではありません。「すべての操作を検証する」システムです。

### Permission model

エージェント権限には3つのモードがあります。

- `ask`: すべての tool use に人間の確認が必要
- `bubble`: 権限プロンプトが team leader に伝播する
- `allow`: 自動承認（ただし leader 自身の権限に制約される）

また、各エージェントごとに tool を whitelist (`tools: [...]`) または blacklist (`disallowedTools: [...]`) できます。さらに hooks がもう1層を追加し、`PreToolUse` は実行前に任意の tool call を遮断または変更できます。

## プラグイン・エコシステム：本物のマーケットプレイス

ここで Claude Code は CLI から platform へと変わります。

### Plugin manifest

```json
{
  "name": "my-plugin",
  "commands": "./commands",
  "agents": ["./agents"],
  "skills": "./skills",
  "hooks": { ... },
  "mcpServers": { ... },
  "lspServers": { ... },
  "userConfig": {
    "api_key": { "type": "string", "sensitive": true }
  }
}
```

1つの plugin は、slash command、agent、skill、hook、MCP server、LSP server、設定を提供できます。機密設定値はディスクではなくシステム keychain に保存されます。

### Marketplace architecture

プラグインは Marketplaces を通じて配布されます。これは GitHub repo、npm package、URL、ローカルディレクトリになりえます。Plugin ID は `name@marketplace` のスコープを持ちます。依存関係は循環検出つきで推移的に解決されます。異なる marketplace をまたぐ依存には明示的な allowlist が必要です。

```
~/.claude/plugins/cache/marketplace/plugin/version/
```

バージョン固定は Git ソースに対して commit SHA をサポートします。企業環境では `strictKnownMarketplaces` によって信頼できないソースを遮断できます。

### Skill system: progressive disclosure

Skills は YAML frontmatter を持つ Markdown ファイルです。

```markdown
---
name: My Skill
description: Analyze TypeScript patterns
when-to-use: When the user asks to refactor TypeScript code
paths: [src/**/*.ts]
allowed-tools: [Read, Grep, Bash]
context: inline
---

Detailed instructions for the model...
```

`paths` フィールドは **progressive disclosure** を可能にします。パスフィルタ付きの skill は最初は非表示で、モデルが一致するファイルに触れたときだけ可視になります。これにより、初期表示される skill の数が少なく保たれ、関連性も高まります。起動時に200個もの候補でモデルが圧倒されることがありません。

## メモリ：すべてを変える機能

多くのAIツールはセッション間で stateless ですが、Claude Code は違います。

### 4種類のメモリ分類

| Type | Purpose | Example |
|------|---------|---------|
| User | Who the user is | "Senior Go engineer, new to React" |
| Feedback | How to behave | "Don't mock the database in tests" |
| Project | What's happening | "Merge freeze after March 5 for mobile release" |
| Reference | Where to look | "Pipeline bugs tracked in Linear project INGEST" |

### Memory architecture

```
~/.claude/projects/<slug>/memory/
├── MEMORY.md           # Index (200 lines max, always loaded)
├── user_role.md        # Individual memory files
├── feedback_testing.md
├── project_auth.md
└── reference_linear.md
```

`MEMORY.md` は常に context に注入されます。個別の memory file は必要に応じて読み込まれます。システムは会話から memory を自動抽出し、**Dream** メカニズムを通じて集約します。これは、ユーザーを邪魔せずに session log を structured memory に変換するバックグラウンドタスクです。

これこそが Claude Code に「あなたを知っている」と感じさせる要因です。数回のセッションの後には、好み、プロジェクトの文脈、チームの制約まで覚えています。これほどの機能を持つ主流のAIコーディングツールは他にありません。

## 注目すべき独自機能

**Buddy**: 種・レアリティ・属性といった deterministic な “bones” と、名前・性格といった AI 生成の “soul” を持つ、手続き的に生成される companion。Legendary rarity は偽造できません。CLI ツールに個性を与える、純粋な product craft です。

**Thinkback**: AI の思考プロセスを記録・再生します。エージェント挙動のデバッグに有用です。

**Voice mode**: keyword recognition と多言語サポートを備えた streaming speech-to-text。

**Vim mode**: motions、operators、text objects、mode switching を含む完全な Vim keybinding 対応。お飾りではありません。

**Dream**: session log を structured knowledge に変換するバックグラウンド memory consolidation。時間条件とセッション条件で起動します。

**Cost tracking**: モデル別コスト、cache hit rate、token breakdown、コード変更統計まで完全に可視化します。

## Bridge：1つのエンジン、4つの frontend

Bridge 層によって、Claude Code は CLI、Desktop、Web、IDE を同時に支えています。

- **REPL Bridge**: ローカル CLI、直接対話
- **Remote Bridge**: Desktop/Web/IDE、SSE または polling 経由
- **Hybrid Transport**: ローカルとリモートを透過的に切り替える

session management は、リモートモード向けの作成、再開、永続化、JWT 認証を扱います。`entrypoints/` ディレクトリは、CLI、SDK、bridge モードそれぞれの入り口を示し、すべて同じ QueryEngine に収束しています。

## 将来を示す feature flag

ソースには、未公開機能に関するいくつかの feature flag が含まれています。

- **KAIROS**: 長期アシスタントモード（append-only logs）
- **VOICE_MODE**: 完全な音声対話
- **WORKFLOW_SCRIPTS**: プログラム可能な workflow automation
- **PROACTIVE**: proactive interaction（agent が応答するだけでなく、自ら働きかける）
- **DAEMON**: バックグラウンド daemon モード

特に興味深いのは PROACTIVE フラグです。現在の AI ツールは reactive で、ユーザーの入力を待ちます。proactive な Claude Code なら、ターミナルを開く前から repo を監視し、修正候補を提案し、問題を検知し、文脈を準備できるかもしれません。

## これが業界に意味すること

### 1. AIコーディングツールは platform になりつつある

Claude Code は GitHub Copilot と autocompletion で競争しているのではありません。VS Code と extensibility で競争しています。plugin marketplace、hook system、multi-agent runtime は、いずれも platform の基本部品です。勝つAIコーディングツールは、最良のモデルを持つものではなく、最良の ecosystem を持つものになる、というメッセージは明確です。

### 2. Memory は次の moat になる

stateless な AI assistant はコモディティです。どのツールでも、あなたの code context を使って Claude や GPT-4 を呼べます。しかし、好み、プロジェクト制約、チームの慣習、過去のデバッグ履歴を覚えている assistant には、乗り換えコストが発生します。Claude Code の Memory + Dream システムは、その考え方の初期実装です。

### 3. Security は policy ではなく architecture であるべきだ

Claude Code は単にモデルへ「気をつけて」と言うだけではありません。sandbox isolation、階層的 permissions、hook interception、人間参加型の承認フローによって安全性を実装しています。`PreToolUse` hook だけでも、多くのAIツール全体より強い security infrastructure です。agent が高性能化するにつれ、この種の構造的安全性が標準要件になるでしょう。

### 4. Multi-agent は現実であり、しかも厄介だ

292 agents で 36.8GB の memory leak が起きたという事実は示唆的です。multi-agent system は強力ですが、resource management、message routing、isolation には実際の工学的課題が伴います。Claude Code の `TEAMMATE_MESSAGES_UI_CAP`、`AsyncLocalStorage` による isolation、prompt cache alignment は、多くの agent framework がまだ遭遇していない問題への実践的な解決策です。

### 5. CLI は終わっていない

Claude Code は primary interface として terminal を選びました。Web app でも、VS Code の sidebar でもありません。CLI です。しかも Vim bindings、音声入力、buddy companion、sticker まで備えています。これは、開発者は「別の browser tab」ではなく、すでに仕事をしている場所に AI ツールがいることを望む、という賭けです。

---

*この分析は、150以上のディレクトリにまたがる1,884本のTypeScriptソースファイルの読解に基づいています。ソースコードはその後取り下げられています。すべての所見は、分析時点で観測されたアーキテクチャを反映しています。*
