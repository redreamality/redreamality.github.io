---
title: "OpenSpec 2.1 実地検証：/opsx コマンドは廃止、skill は .agents とグローバルへ。1.x プロジェクトの移行手順"
description: "OpenSpec は 1.15.0 から 2.1.1 までに 6 回リリースされた。2.0 で /opsx スラッシュコマンドがなくなり、全ツールが .agents/skills の skill を共有する形に。2.1 では skill をマシン全体に入れられるようになり、新規リポジトリの既定もそちらに変わった。2.1.1 でオフライン導入に戻っている。Linux 上で 1.15.0 のプロジェクトを「プロジェクトに残す」「グローバルへ移す」の両方で 2.1.1 に上げ、OpenCode で提案からアーカイブまで通し、オフライン導入、validate --strict、Stores、チーム内のバージョン混在も試した。"
author: Remy
pubDate: 2026-11-23T09:00:00+08:00
lang: ja
translatedFrom: openspec-2-1-hands-on-upgrade
tags:
  - openspec
  - sdd
  - ai-coding
  - ai-agents
  - cli
---

**先に結論：** OpenSpec のワークフローそのものは変わっていない。proposal、delta spec、tasks、archive の流れは 1.x のままで、CLI コマンドもほぼ同じだ。変わったのは skill の入れ方と置き場所である。2.0.0 で `/opsx:*` スラッシュコマンドが削除され、どのツールも `.agents/skills/` にある 1 組の skill を共有するようになった。2.1.0 では skill をマシン全体（グローバル）に入れられるようになり、新しいリポジトリで `init` するとそれが既定になった。2.1.1 では skill が CLI パッケージに同梱され、導入に Git もネットワークも要らなくなった。[1][2][3] おすすめは 2.1.0 を飛ばして 2.1.1 に直接上げること、そしてチーム全員でそろえて上げることだ。`openspec update` を実行する前に、組み込み skill に加えた変更は別の場所に退避しておく。update はそれを丸ごと置き換え、何も言わない。

| いまの状況 | やること |
| --- | --- |
| CLI を入れる・上げる | npm：`npm install -g @fission-ai/openspec@latest`（Node 22.20.0 以上が必要）。Node なしなら `curl -fsSL https://openspec.dev/cli/install.sh \| sh`。Homebrew は `brew upgrade openspec`。[4] |
| 1.x のプロジェクトがある | まず commit。`openspec update --dry-run` で変わるファイルを確認してから `openspec update`、結果を commit。端末で実行すると skill をプロジェクトに残すかグローバルにするかを聞かれる。 |
| チャット欄で `/opsx:propose` と打っていた | `/openspec-propose`（Claude Code、Cursor、OpenCode など）に。Codex では skill 名 `openspec-propose` で呼ぶ。「変更を提案して」と普通に頼んでもよい。 |
| `.agents/skills/openspec-*` を書き換えている | 独自名の skill（例：`.agents/skills/team-propose/`）か、`openspec/config.yaml` の `context`・`rules` に移す。 |
| チームに 1.x のままの人がいる | 先に全員の CLI を上げ、それからリポジトリを移行する。1.x の `update` は `/opsx` コマンドを書き戻す。 |
| スクリプトや CI でリポジトリを作る | `--scope project` を付けるか `OPENSPEC_SKILLS_SCOPE=project` を設定。検証だけのジョブは `openspec validate --all` で足りる。 |
| 閉じたネットワーク、サンドボックス、オフライン | 2.1.1 を使う。2.1.0 は skill 導入時に GitHub から clone し、ネットワークがないと失敗する。 |
| Amazon Q Developer を使っている | 2.0 でサポート終了。`update` がそのファイルを消す。移行先として Kiro が推奨されている。 |
| まだ上げたくない | `npm install -g @fission-ai/openspec@1` で 1.x に固定し、`OPENSPEC_NO_UPDATE_CHECK=1` でアップグレードの案内を止める。[5] |

本記事は OpenSpec シリーズの第 1 回だ。OpenSpec が初めてなら [OpenSpec チュートリアル：CLI の導入、コマンド、AGENTS.md、実践例](/ja/blog/openspec-tutorial-cli-commands-agents-md-examples/) から。複数リポジトリで仕様を共有するなら [OpenSpec Stores のマルチリポジトリ実践](/ja/blog/openspec-1-5-stores-beta-update-guide/)、BMAD や Spec Kit との違いは [仕様駆動開発フレームワークの比較](/ja/blog/-sddbmad-vs-spec-kit-vs-openspec-vs-promptx/) を参照してほしい。これらは 1.15.0 時点の内容なので、導入方法とスラッシュコマンドについては本記事を優先してほしい。

## 6 つのリリースのうち、対応が要るのは 3 つ

前回の確認は 1.15.0（10 月 24 日）だった。それから 3 週間あまりで、npm には 1.16.0、1.16.1、1.17.0、2.0.0、2.1.0、2.1.1 が並んだ。大半は修正で、利用者が何かする必要があるのは 3 つ。1.16.0 で npm 版の Node 下限が 22 に上がったこと、2.0.0 で skill の置き場所が変わったこと、2.1.0 でグローバル導入が加わり `init` の既定が変わったことだ。

<figure class="not-prose my-6"><svg viewBox="0 0 760 310" role="img" aria-label="1.15.0 から 2.1.1 まで：6 リリースのうち手を動かすのは 3 つ" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto;max-width:760px;display:block;margin:0 auto;font-family:inherit;color:inherit" fill="currentColor"><defs><marker id="ah-tl" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="currentColor" fill-opacity="0.6"/></marker></defs><text x="12" y="26" font-size="15" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="0.95">1.15.0 から 2.1.1 まで：6 リリースのうち手を動かすのは 3 つ</text><rect x="12" y="46" width="736" height="32" rx="6" fill="#3b82f6" fill-opacity="0.22"/><text x="24" y="67" font-size="13" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="0.95" font-family="ui-monospace,SFMono-Regular,Menlo,monospace">1.16.0</text><text x="92" y="67" font-size="11" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.65" font-family="ui-monospace,SFMono-Regular,Menlo,monospace">10-30</text><text x="140" y="67" font-size="11.5" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.95">npm 版は Node 22.12 以上が必要。validate が WHEN/THEN を確認。Store の提案</text><rect x="12" y="86" width="736" height="32" rx="6" fill="#3b82f6" fill-opacity="0.07"/><text x="24" y="107" font-size="13" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="0.95" font-family="ui-monospace,SFMono-Regular,Menlo,monospace">1.16.1</text><text x="92" y="107" font-size="11" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.65" font-family="ui-monospace,SFMono-Regular,Menlo,monospace">11-07</text><text x="140" y="107" font-size="11.5" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.95">修正：未知の delta 節を黙って捨てない。version --check の信頼性</text><rect x="12" y="126" width="736" height="32" rx="6" fill="#3b82f6" fill-opacity="0.07"/><text x="24" y="147" font-size="13" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="0.95" font-family="ui-monospace,SFMono-Regular,Menlo,monospace">1.17.0</text><text x="92" y="147" font-size="11" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.65" font-family="ui-monospace,SFMono-Regular,Menlo,monospace">11-09</text><text x="140" y="147" font-size="11.5" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.95">update がどの旧版からも 1 回で移行。2.0 で /opsx 削除の予告</text><rect x="12" y="166" width="736" height="32" rx="6" fill="#8b5cf6" fill-opacity="0.22"/><text x="24" y="187" font-size="13" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="0.95" font-family="ui-monospace,SFMono-Regular,Menlo,monospace">2.0.0</text><text x="92" y="187" font-size="11" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.65" font-family="ui-monospace,SFMono-Regular,Menlo,monospace">11-11</text><text x="140" y="187" font-size="11.5" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.95">skill を .agents/skills に集約。/opsx 削除。delivery と Amazon Q を廃止</text><rect x="12" y="206" width="736" height="32" rx="6" fill="#8b5cf6" fill-opacity="0.22"/><text x="24" y="227" font-size="13" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="0.95" font-family="ui-monospace,SFMono-Regular,Menlo,monospace">2.1.0</text><text x="92" y="227" font-size="11" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.65" font-family="ui-monospace,SFMono-Regular,Menlo,monospace">11-17</text><text x="140" y="227" font-size="11.5" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.95">グローバル skill。新規 init の既定がグローバルに。Vercel skills で Git と GitHub が必要</text><rect x="12" y="246" width="736" height="32" rx="6" fill="#8b5cf6" fill-opacity="0.07"/><text x="24" y="267" font-size="13" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="0.95" font-family="ui-monospace,SFMono-Regular,Menlo,monospace">2.1.1</text><text x="92" y="267" font-size="11" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.65" font-family="ui-monospace,SFMono-Regular,Menlo,monospace">11-19</text><text x="140" y="267" font-size="11.5" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.95">skill は CLI パッケージからオフライン導入。archive skill が先に保存先を確認</text><text x="12" y="300" font-size="10.5" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.6">日付は npm の公開時刻（UTC）。色の濃い行が対応の必要なリリース。</text></svg></figure>

1.17.0 は 2.0 への橋渡しにあたる。`openspec update` が 0.12 以降のどのリリースで作ったプロジェクトでも 1 回で移行できるようになり、OpenSpec が生成して誰も手を入れていないファイルだけを消し、手を入れたものは残して一覧に出す。[6] だから 1.15.0 から 2.1.1 へ一気に上げるのは公式に想定された道筋で、1 バージョンずつ踏む必要はない。

`init --tools` に渡せるツール ID も、1.15.0 の 50 個から 87 個に増えた。増えた分の多くは Vercel の `skills` インストーラーが対応しているエージェントで、Goose、OpenHands、Tabnine CLI などが入っている。消えたのは `amazon-q` だけだ。

## ツールごとのコピーから、1 か所に 1 組へ

1.x はツールごとに別々のコピーを書き出していた。テスト用プロジェクトで 1.15.0 の `init` を Claude Code、Codex、Cursor、Amazon Q の 4 ツールに対して実行すると、Markdown ファイルが 42 個増えた。同じ 6 つの skill が 4 回書かれ、さらに `/opsx` のコマンドファイルが 18 個ある。

![legacy-app で OpenSpec 1.15.0 の init を 4 ツール分実行：開始コマンドとして /opsx:propose が案内され、.agents、.amazonq、.claude、.cursor にそれぞれ 6 つの skill、.claude/commands、.cursor/commands、.amazonq/prompts にそれぞれ 6 つのコマンドファイルができる](/assets/openspec-2-1-hands-on-upgrade/legacy-1-15-init.webp)

重複そのものより厄介だったのは、入口が 2 つあったことだ。コマンドファイルと skill が同じ作業を説明しているので、片方だけ直してずれることがあるし、ツールによっては両方を表示して skill が 2 回並んで見える。1.16.1 では、`.agents/skills` が `.claude/skills` へのリンクになっているプロジェクトで、`update` のたびに skill 内のコマンド名が `/opsx:*` と `/openspec-*` の間で行ったり来たりするというバグ報告まであった。[7]

2.0 の解決策は素直だ。skill の実ファイルは `.agents/skills/` に 1 組だけ置く。Codex、Cursor、OpenCode のようにもともとこのフォルダを読むツールには何も足さない。Claude Code や Kiro のように自分のフォルダしか読まないツールには、そのフォルダに `.agents/skills/` を指すシンボリックリンクを置く。スラッシュコマンドは丸ごと廃止され、それぞれに同じ指示を持つ skill がある。たとえば `/opsx:apply` は `openspec-apply-change` になる。[1][5]

<figure class="not-prose my-6"><svg viewBox="0 0 760 382" role="img" aria-label="1 つのプロジェクトで OpenSpec の skill がどこに置かれるか（Claude Code + Codex + Cursor）" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto;max-width:760px;display:block;margin:0 auto;font-family:inherit;color:inherit" fill="currentColor"><defs><marker id="ah-layout" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="currentColor" fill-opacity="0.6"/></marker></defs><text x="12" y="26" font-size="15" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="0.95">1 つのプロジェクトで OpenSpec の skill がどこに置かれるか（Claude Code + Codex + Cursor）</text><rect x="12" y="42" width="236" height="300" rx="8" fill="#f59e0b" fill-opacity="0.07"/><text x="22" y="64" font-size="12.5" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="0.95">1.15.0：ツールごとにコピー</text><rect x="262" y="42" width="236" height="300" rx="8" fill="#3b82f6" fill-opacity="0.07"/><text x="272" y="64" font-size="12.5" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="0.95">2.0 以降：リポジトリに 1 つ</text><rect x="512" y="42" width="236" height="300" rx="8" fill="#10b981" fill-opacity="0.07"/><text x="522" y="64" font-size="12.5" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="0.95">2.1 以降：マシンに 1 つ（新規の既定）</text><text x="22" y="92" font-size="11" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.6">リポジトリ</text><rect x="22" y="100" width="216" height="24" rx="4" fill="#f59e0b" fill-opacity="0.18"/><text x="28" y="116" font-size="10.5" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.95" font-family="ui-monospace,SFMono-Regular,Menlo,monospace">.claude/skills/</text><text x="232" y="116" font-size="10" text-anchor="end" font-weight="normal" fill="currentColor" fill-opacity="0.8">6 skill</text><rect x="22" y="130" width="216" height="24" rx="4" fill="#ef4444" fill-opacity="0.18"/><text x="28" y="146" font-size="10.5" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.95" font-family="ui-monospace,SFMono-Regular,Menlo,monospace">.claude/commands/opsx/</text><text x="232" y="146" font-size="10" text-anchor="end" font-weight="normal" fill="currentColor" fill-opacity="0.8">6 コマンド</text><rect x="22" y="160" width="216" height="24" rx="4" fill="#f59e0b" fill-opacity="0.18"/><text x="28" y="176" font-size="10.5" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.95" font-family="ui-monospace,SFMono-Regular,Menlo,monospace">.cursor/skills/</text><text x="232" y="176" font-size="10" text-anchor="end" font-weight="normal" fill="currentColor" fill-opacity="0.8">6 skill</text><rect x="22" y="190" width="216" height="24" rx="4" fill="#ef4444" fill-opacity="0.18"/><text x="28" y="206" font-size="10.5" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.95" font-family="ui-monospace,SFMono-Regular,Menlo,monospace">.cursor/commands/</text><text x="232" y="206" font-size="10" text-anchor="end" font-weight="normal" fill="currentColor" fill-opacity="0.8">6 コマンド</text><rect x="22" y="220" width="216" height="24" rx="4" fill="#f59e0b" fill-opacity="0.18"/><text x="28" y="236" font-size="10.5" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.95" font-family="ui-monospace,SFMono-Regular,Menlo,monospace">.agents/skills/</text><text x="232" y="236" font-size="10" text-anchor="end" font-weight="normal" fill="currentColor" fill-opacity="0.8">6 skill</text><rect x="22" y="250" width="216" height="24" rx="4" fill="#f59e0b" fill-opacity="0.18"/><text x="28" y="266" font-size="10.5" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.95" font-family="ui-monospace,SFMono-Regular,Menlo,monospace">.amazonq/skills/</text><text x="232" y="266" font-size="10" text-anchor="end" font-weight="normal" fill="currentColor" fill-opacity="0.8">6 skill</text><rect x="22" y="280" width="216" height="24" rx="4" fill="#ef4444" fill-opacity="0.18"/><text x="28" y="296" font-size="10.5" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.95" font-family="ui-monospace,SFMono-Regular,Menlo,monospace">.amazonq/prompts/</text><text x="232" y="296" font-size="10" text-anchor="end" font-weight="normal" fill="currentColor" fill-opacity="0.8">6 コマンド</text><text x="22" y="330" font-size="10.5" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.75">同じ指示が 4 回書かれ、コマンドファイルも 18 個</text><text x="272" y="92" font-size="11" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.6">リポジトリ</text><rect x="272" y="100" width="216" height="54" rx="4" fill="#3b82f6" fill-opacity="0.22"/><text x="278" y="118" font-size="10.5" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.95" font-family="ui-monospace,SFMono-Regular,Menlo,monospace">.agents/skills/</text><text x="278" y="138" font-size="10" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.8">6 実ファイル</text><rect x="272" y="190" width="216" height="30" rx="4" fill="#3b82f6" fill-opacity="0.08" stroke="#3b82f6" stroke-opacity="0.9" stroke-dasharray="4 3"/><text x="278" y="209" font-size="10.5" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.95" font-family="ui-monospace,SFMono-Regular,Menlo,monospace">.claude/skills/</text><text x="482" y="209" font-size="10" text-anchor="end" font-weight="normal" fill="currentColor" fill-opacity="0.8">6 リンク → .agents</text><line x1="380" y1="190" x2="380" y2="156" stroke="currentColor" stroke-opacity="0.6" stroke-width="1.5" marker-end="url(#ah-layout)"/><text x="272" y="250" font-size="10.5" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.85" font-family="ui-monospace,SFMono-Regular,Menlo,monospace">openspec/config.yaml</text><text x="272" y="268" font-size="10.5" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.6" font-family="ui-monospace,SFMono-Regular,Menlo,monospace">skillsScope: project</text><text x="272" y="330" font-size="10.5" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.75">Codex と Cursor は .agents/skills を直接読む</text><text x="522" y="92" font-size="11" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.6">リポジトリ</text><rect x="522" y="100" width="216" height="54" rx="4" fill="#64748b" fill-opacity="0.12"/><text x="528" y="118" font-size="10.5" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.95" font-family="ui-monospace,SFMono-Regular,Menlo,monospace">openspec/</text><text x="528" y="138" font-size="10" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.8">リポジトリに skill なし</text><text x="522" y="180" font-size="11" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.6">ホーム ~</text><rect x="522" y="188" width="216" height="54" rx="4" fill="#10b981" fill-opacity="0.22"/><text x="528" y="206" font-size="10.5" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.95" font-family="ui-monospace,SFMono-Regular,Menlo,monospace">~/.agents/skills/</text><text x="528" y="226" font-size="10" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.8">6 実ファイル</text><rect x="522" y="276" width="216" height="30" rx="4" fill="#10b981" fill-opacity="0.08" stroke="#10b981" stroke-opacity="0.9" stroke-dasharray="4 3"/><text x="528" y="295" font-size="10.5" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.95" font-family="ui-monospace,SFMono-Regular,Menlo,monospace">~/.claude/skills/</text><text x="732" y="295" font-size="10" text-anchor="end" font-weight="normal" fill="currentColor" fill-opacity="0.8">6 リンク → .agents</text><line x1="630" y1="276" x2="630" y2="244" stroke="currentColor" stroke-opacity="0.6" stroke-width="1.5" marker-end="url(#ah-layout)"/><text x="522" y="330" font-size="10.5" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.75">~/.agents/.skill-lock.json も記録</text><text x="12" y="372" font-size="10.5" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.6">数字は本文の実測から：1.15.0 の init は claude・codex・cursor・amazon-q、2.1.1 の 2 列は update と init の結果。</text></svg></figure>

2.1 はさらに一歩進めた。skill をリポジトリに置かず、`~/.agents/skills/` に入れてマシン上の全プロジェクトで共有できる。Claude Code の `~/.claude/skills/` はやはりそこへのリンクで、横には出どころとバージョンを記録した `~/.agents/.skill-lock.json` ができる。新しいリポジトリで `openspec init --tools ...` を実行すると既定でこのグローバル導入になり、リポジトリには `openspec/` フォルダしか残らない。skill をリポジトリに置きたければ `--scope project` を明示する必要がある。[2]

![2.1.1 で新しいリポジトリを 2 つ init：オプションなしではリポジトリには openspec/ 配下の 3 ファイルだけで、skill は ~/.agents/skills に入り、~/.claude/skills にはそこを指す 6 つのリンクができる。--scope project では .agents/skills に実ファイル、.claude/skills にリンクができる](/assets/openspec-2-1-hands-on-upgrade/fresh-init-global-vs-project.webp)

グローバルにする理由はちゃんとある。OpenSpec は Vercel の `skills` インストーラーに乗り換えており、メンテナーによれば、インストーラーの保守に使っていた時間を skill そのものの改善に回せる。skill は CLI のバージョンに追従するので、CLI を上げれば一緒に新しくなる。[2] 一人で何十ものリポジトリを行き来する開発者には、確かに手間が減る。

チームの場合はもう一段考えたい。リポジトリに commit した skill は commit と一緒に動き、新しいメンバーも clone すればそのまま使える。グローバルの skill は各自が入れた CLI のバージョン次第で、リポジトリ自身はどの版の指示を前提にしているかを記録しなくなる。まさにこのずれを理由に、Maven Wrapper のように CLI のバージョンをリポジトリに固定する仕組みを求める issue がすでに出ている。[8] 公式はほとんどのチームにグローバルを勧めている。筆者の考えでは、個人のマシンはグローバル、複数人で使うリポジトリや、GitHub がホストする Copilot エージェントに skill を読ませたいリポジトリは、当面プロジェクトに残すのがよい。どちらを選んでも、後から `openspec init --scope ...` で切り替えられる。

Windows ではもう 1 点ある。リンクは普通のファイルと同じように commit されるので、チームメイトの Git で `core.symlinks` を有効にし、Windows の開発者モードも有効にしておく必要がある。そうしないとリンクは小さなテキストファイルとして checkout される。その場合 `openspec update` は通常のコピーに置き換える。[5]

## 1.15.0 のプロジェクトを 2.1.1 に上げる

`update` が「人の手が入ったもの」をどう扱うかを見るため、テスト用プロジェクトには 1.15.0 の `init` 後に、チームでよくある 3 つの変更を入れた。Claude の `/opsx:apply` コマンドファイルの末尾にチームのルールを 1 行、組み込みの `openspec-propose` skill にもルールを 1 行、そして独自の skill `team-review` を新規作成。そのうえで 2.1.1 で移行した。

### まず dry-run、それから「Keep in this project」

![legacy-app で 2.1.1 の update：dry-run では 49 ファイルが変わると表示され、手を入れた openspec-propose/SKILL.md もただの update 扱い。本番で Keep in this project を選ぶと Amazon Q の 12 ファイルとコマンドファイル 11 個が削除され、手を入れた .claude/commands/opsx/apply.md は残る。その後 propose skill 内のチームルールは 0 件になり、config.yaml に skillsScope: project が加わる](/assets/openspec-2-1-hands-on-upgrade/update-keep-project.webp)

`openspec update --dry-run` は変更予定のファイルを 49 個挙げる。注目したいのは、手を入れた `openspec-propose/SKILL.md` がごく普通の `update` 行として出てくることで、変更済みだという印はどこにもない。手を入れた `/opsx:apply` のほうは残される予定なので、一覧にそもそも出てこない。

端末で本番を実行すると、2.1.1 はまず 1 つだけ質問する。このプロジェクトの skill をリポジトリに残すか、グローバルに移すか。「Keep in this project」を選ぶと、次のことが起きる。

- `openspec/config.yaml` に `skillsScope: project` を書き込み、このファイルを commit するよう促す。チームメイトは同じ質問をされずに済む。
- Amazon Q の 12 ファイルを削除し、Kiro への移行を案内する。
- 手つかずのコマンドファイル 11 個を削除し、手を入れた `.claude/commands/opsx/apply.md` は残す。必要な内容を skill に移してから手で消すよう指示が出る。
- `.claude/skills/` と `.cursor/skills/` のコピーを消し、Claude 側は 6 つのリンクに置き換える。
- `.agents/skills/` の 6 つの skill を 2.1.1 の内容で書き直す。

落とし穴は最後の項目だ。`openspec-propose` に足したチームルールは消えていて（`grep` の件数は 0）、出力のどこにもそれへの言及はない。公式の移行ガイドには、`update` は組み込み skill のフォルダを丸ごと置き換え、中の変更も追加したファイルも消えるという警告がちゃんと書かれている。[5] ただ、端末の出力だけを見ている人は見落としやすい。独自に作った `team-review` は手つかずで、これはドキュメントどおり。組み込みと名前が重ならない skill には update は触れない。

git で見ると、この移行は削除 35、変更 8、新規 6（Claude 用のリンク）だった。

<figure class="not-prose my-6"><svg viewBox="0 0 760 414" role="img" aria-label="1.x のプロジェクトで openspec update（2.1.1）を実行したときの分岐" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto;max-width:760px;display:block;margin:0 auto;font-family:inherit;color:inherit" fill="currentColor"><defs><marker id="ah-update" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="currentColor" fill-opacity="0.6"/></marker></defs><text x="12" y="26" font-size="15" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="0.95">1.x のプロジェクトで openspec update（2.1.1）を実行したときの分岐</text><rect x="300" y="44" width="160" height="30" rx="6" fill="#3b82f6" fill-opacity="0.25"/><text x="380" y="64" font-size="12" text-anchor="middle" font-weight="normal" fill="currentColor" fill-opacity="0.95" font-family="ui-monospace,SFMono-Regular,Menlo,monospace">openspec update</text><line x1="380" y1="74" x2="380" y2="92" stroke="currentColor" stroke-opacity="0.6" stroke-width="1.5" marker-end="url(#ah-update)"/><rect x="220" y="94" width="320" height="30" rx="6" fill="#64748b" fill-opacity="0.14"/><text x="380" y="114" font-size="12" text-anchor="middle" font-weight="normal" fill="currentColor" fill-opacity="0.95">端末で実行し、CI 変数が無い？</text><line x1="220" y1="109" x2="120" y2="140" stroke="currentColor" stroke-opacity="0.6" stroke-width="1.5" marker-end="url(#ah-update)"/><text x="150" y="118" font-size="10.5" text-anchor="end" font-weight="normal" fill="currentColor" fill-opacity="0.7">いいえ：質問なし</text><rect x="12" y="142" width="216" height="44" rx="6" fill="#64748b" fill-opacity="0.12"/><text x="120" y="168" font-size="11" text-anchor="middle" font-weight="normal" fill="currentColor" fill-opacity="0.95">その場で更新、skill はリポジトリに残る</text><line x1="540" y1="109" x2="600" y2="140" stroke="currentColor" stroke-opacity="0.6" stroke-width="1.5" marker-end="url(#ah-update)"/><text x="585" y="118" font-size="10.5" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.7">はい：1 回だけ質問</text><line x1="380" y1="124" x2="380" y2="140" stroke="currentColor" stroke-opacity="0.6" stroke-width="1.5" marker-end="url(#ah-update)"/><rect x="260" y="142" width="236" height="112" rx="6" fill="#3b82f6" fill-opacity="0.12"/><text x="378" y="162" font-size="12" text-anchor="middle" font-weight="bold" fill="currentColor" fill-opacity="0.95">Keep in this project</text><text x="270" y="186" font-size="10.5" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.95">· config.yaml に skillsScope: project を記録</text><text x="270" y="208" font-size="10.5" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.95">· /opsx コマンドとツール別の重複 skill を削除</text><text x="270" y="230" font-size="10.5" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.95">· 手を入れたコマンドファイルは残して一覧表示</text><rect x="512" y="142" width="236" height="30" rx="6" fill="#10b981" fill-opacity="0.2"/><text x="630" y="162" font-size="12" text-anchor="middle" font-weight="bold" fill="currentColor" fill-opacity="0.95">Switch to global</text><line x1="630" y1="172" x2="630" y2="188" stroke="currentColor" stroke-opacity="0.6" stroke-width="1.5" marker-end="url(#ah-update)"/><rect x="512" y="190" width="236" height="28" rx="6" fill="#f59e0b" fill-opacity="0.18"/><text x="630" y="209" font-size="11" text-anchor="middle" font-weight="normal" fill="currentColor" fill-opacity="0.95">手を入れたコマンドファイルがある？</text><line x1="570" y1="218" x2="570" y2="234" stroke="currentColor" stroke-opacity="0.6" stroke-width="1.5" marker-end="url(#ah-update)"/><rect x="512" y="236" width="112" height="46" rx="6" fill="#ef4444" fill-opacity="0.18"/><text x="568" y="254" font-size="10" text-anchor="middle" font-weight="normal" fill="currentColor" fill-opacity="0.95">エラーで終了、</text><text x="568" y="270" font-size="10" text-anchor="middle" font-weight="normal" fill="currentColor" fill-opacity="0.95">何も消さない</text><line x1="690" y1="218" x2="690" y2="234" stroke="currentColor" stroke-opacity="0.6" stroke-width="1.5" marker-end="url(#ah-update)"/><rect x="636" y="236" width="112" height="46" rx="6" fill="#10b981" fill-opacity="0.2"/><text x="692" y="254" font-size="10" text-anchor="middle" font-weight="normal" fill="currentColor" fill-opacity="0.95">リポジトリの skill を消し</text><text x="692" y="270" font-size="10" text-anchor="middle" font-weight="normal" fill="currentColor" fill-opacity="0.95">~/.agents/skills に入れる</text><line x1="692" y1="282" x2="692" y2="298" stroke="currentColor" stroke-opacity="0.6" stroke-width="1.5" marker-end="url(#ah-update)"/><rect x="512" y="300" width="236" height="28" rx="6" fill="#10b981" fill-opacity="0.1"/><text x="630" y="319" font-size="10.5" text-anchor="middle" font-weight="normal" fill="currentColor" fill-opacity="0.95">チームメイトは pull して update、Yes と答える</text><rect x="12" y="346" width="736" height="58" rx="6" fill="#ef4444" fill-opacity="0.08" stroke="#ef4444" stroke-opacity="0.9" stroke-dasharray="4 3"/><text x="24" y="370" font-size="11.5" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.95">⚠ どの経路でも、手を入れた組み込み skill は丸ごと置き換わり、警告は出ない。</text><text x="24" y="392" font-size="11.5" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.95">⚠ 1.x のままのメンバーが update すると /opsx が戻り、skill も旧版に戻る。</text></svg></figure>

### 質問されない条件

この質問が出るのは、対話型の端末で、しかも CI 変数がないときに限られる。CI の中や、エージェントに `openspec update` を実行させた場合は質問なしで、skill は今ある場所で更新される。[2] 試してわかった細かい点がある。判定は「`CI` という変数が存在するか」で、値は見ていない。`CI` が空文字列でも CI 扱いになり、質問は出ない。シェルの設定で何かの都合で `CI` を export している人は、いつまでも質問を見ないことになる。`OPEN_SPEC_INTERACTIVE=0` でも質問は出なくなる。

### 「Switch to global」：手を入れたコマンドファイル 1 つで止まる

同じ 1.15.0 のプロジェクトで、今度は「Switch to global」を選ぶ。1 回目はいきなりエラーになる。あなた自身の変更を含むファイルがあるのでプロジェクトはそのコピーを保持し、何も削除していない、という内容だ。該当するのは手を入れた `/opsx:apply` コマンドである。プロジェクトに残す場合は一覧に出るだけだったものが、グローバルへの切り替えでは全体を止める。

![Switch to global：1 回目は .claude/commands/opsx/apply.md に変更があるためエラーになり何も消さない。このファイルを git rm して再実行すると、リポジトリ内の OpenSpec 自身の skill が削除され、6 つの skill が ~/.agents/skills に入り、リポジトリには独自の team-review だけが残る](/assets/openspec-2-1-hands-on-upgrade/update-switch-global.webp)

そのファイルを消して commit し、もう一度実行すると切り替えは通る。リポジトリから OpenSpec のファイルが 30 個消え、6 つの skill が `~/.agents/skills/` に入り、`.agents/skills/` には自作の `team-review` だけが残る。出力の最後にはチームでの手順が書かれている。削除を commit し、チームメイトは pull したあと端末で `openspec update` を実行して Yes と答えるか、スクリプトなら `openspec init --tools <ids>` を実行する。

### 1.x のままのチームメイトがいたら

移行ガイドは「先に全員の CLI を上げる」と書いているが、そうしなかったら何が起きるかは書いていない。そこで「Keep in this project」で移行して commit 済みのリポジトリに対し、1.15.0 で `openspec update` を実行してみた。

![リポジトリを 2.1.1 に移行して commit したあと、openspec-1.15.0 で update：claude と agents の 2 ツールを検出（unknown → 1.15.0）、skill ファイル 7 つが書き戻され、手を入れた apply.md が上書きされ、/opsx コマンドファイル 5 つが復活する](/assets/openspec-2-1-hands-on-upgrade/mixed-team-1-15-update.webp)

起きたことは 3 つ。`/opsx` のコマンドファイルが 5 つ戻ってきた。2.1.1 がせっかく残した、手を入れた `apply.md` は 1.15.0 に上書きされ、チームのルールも消えた。`.agents/skills/` の 6 つの skill は 1.15.0 の内容に戻った。2.x が生成する skill には `generatedBy` のバージョン欄がもうないので、1.15.0 は `unknown → 1.15.0` としか表示できない。古い CLI のメンバーが 1 人、習慣で `update` を実行するだけで、次のプルリクエストに巻き戻しの差分がずらりと並ぶ。

だから順番が大事だ。まずチームの CLI バージョンをそろえ、それから 1 人がリポジトリを移行して commit する。

## 2.1.0 はネットワークが必要、2.1.1 は不要

Vercel のインストーラーに切り替えた 2.1.0 では、`init` と `update` が skill を入れるたびに GitHub から OpenSpec のリポジトリを clone していた。外向き通信のない CI やサンドボックスではすぐに失敗し、利用者からは、導入結果が固定したパッケージのバージョンではなく、そのときリモートが返す内容で決まってしまうという指摘も出た。[9] 2.1.1 は skill を CLI に同梱し、ローカルのパッケージからコピーする。[3]

ネットワークのない名前空間（`unshare -rn`）で両方を動かすと、違いは一目でわかる。

![ネットワークなし：2.1.0 は既定の init で Failed to clone、--scope project でも Failed for Claude Code。2.1.1 はどちらも成功](/assets/openspec-2-1-hands-on-upgrade/offline-init-2-1-0-vs-2-1-1.webp)

2.1.0 はグローバルでもプロジェクトでも失敗する。プロジェクトへの導入も同じインストーラーを通るからだ。2.1.1 はどちらも成功する。`~/.agents/.skill-lock.json` の出どころ欄には GitHub とタグが書かれたままだが、中身はローカルのパッケージから来ている。社内ネットワークが厳しい、あるいはエージェントをサンドボックスで動かしているなら、それだけで 2.1.0 に留まる理由はない。

## skill で提案からアーカイブまで通す

スラッシュコマンドがなくなったので、日常の操作は skill の呼び出しになる。`greet.py` だけの小さなプロジェクトを `--scope project --tools opencode` で初期化し、OpenCode 2.3.2 と無料モデルに 3 つの skill で 1 件の変更を通させた。内容は、挨拶を大文字で出す `--shout` オプションを CLI に足すというもの。

![OpenCode が openspec-propose、openspec-apply-change、openspec-archive-change を順に呼ぶ。propose では openspec new change、instructions、status、validate を使って proposal、spec、tasks を書き、apply では greet.py とテストを直して 4/4 タスク完了、archive では openspec-sync-specs でメイン spec に統合して 2026-11-23-add-shout-flag にアーカイブする](/assets/openspec-2-1-hands-on-upgrade/agent-propose-apply-archive.webp)

3 段階とも問題なく通った。気づいた点をいくつか。

- **手順は skill に、ルールは CLI にある。** エージェントは各段階で `openspec instructions <artifact> --json` を呼んでテンプレートとルールを受け取り、`openspec status` と `openspec validate` で確認していた。ルールの本当の出どころは CLI と `openspec/config.yaml` で、公式が skill を書き換えるより `config.yaml` にチームの制約を書くよう勧めるのはこのためだ。
- **design.md は任意。** propose の段階でエージェントは、1 ファイルの変更でアーキテクチャ上の判断もないとして `design.md` を省いた。アーカイブ時には未完了として警告が出たが、アーカイブ自体は止まらない。
- **archive skill は `openspec archive` を呼ばない。** エージェント自身に delta をメイン spec へ統合させ（ここでは `openspec-sync-specs` を経由）、`openspec validate --specs` を実行してから、変更フォルダを `archive/` に移す。統合後のメイン spec には、元の要件と新しい「Shout the greeting」の両方が入っていた。
- **既定で入る skill は 6 つ。** core プロファイルは propose、explore、apply、update、sync、archive。new、continue、ff、verify、bulk-archive、onboard は `openspec config profile` で追加する。

アーカイブはエージェントが skill の文章に従って行うので、2.1.1 の修正も skill 側に入った。以前の archive skill は先にメイン spec を書き換え、最後にフォルダを移す段階で初めてアーカイブ先の存在を確認していた。同名フォルダがあると、メイン spec は更新済みなのに変更はアーカイブされていない、という中途半端な状態が残った。[10] CLI の `openspec archive` をアーカイブ先が既にある状態で 1.15.0 と 2.1.1 の両方で試すと、どちらもエラーで止まりメイン spec には触れなかった。CLI はもともと安全だったわけだ。2.1.1 は skill に確認を 2 回加えた。メイン spec に触る前と、移動の直前である。

未解決の問題も 1 つある。メイン spec に同じ ADDED 要件がすでにあるとき、`openspec-sync-specs` skill はエージェントにそれを上書きさせるが、CLI は同じ状況で衝突として止まる。アーカイブ前に spec を先行同期する使い方をしていて、後の変更が同じ要件を直した場合、先の変更をもう一度同期すると後の修正が黙って消えうる。この issue は 2.1.1 の時点でまだ開いている。[11]

## validate --strict の 2 つの調整

2.1.1 では `--strict` のルールが 2 つ変わった。[3] delta spec の先頭に YAML frontmatter があり、MODIFIED 要件の本文が 632 文字ある変更で試した。

![同じ変更で、1.15.0 の validate --strict は frontmatter がメイン spec に引き継がれないと警告し、2.1.1 は frontmatter を許し、代わりに MODIFIED 要件が 500 文字を超えていると警告する](/assets/openspec-2-1-hands-on-upgrade/validate-strict-1-15-vs-2-1-1.webp)

1.15.0 は frontmatter を「最初の節より前にある余計な文章」とみなして警告し、長すぎる要件は見逃していた。2.1.1 は逆で、frontmatter は許し、長い要件に警告を出す。例や境界条件は scenario に移すか、1 つの振る舞いだけを述べる要件に分けるよう勧めてくる。どちらも `--strict` では終了コード 1 なので、CI で `--strict` を使っているなら、移行後に新しい失敗が出る可能性がある。

## Stores：コマンドは同じ、init の既定が変わった

Stores はまだ beta 扱いで、`openspec store` のヘルプは 1.15.0 と 2.1.1 で一字一句同じだった。マルチリポジトリの使い方はそのままだ。[12] 知っておきたい変化は 2 つある。

![2.1.1 の Stores：store setup で checkout-web を作成。origin 名が同じコードリポジトリで list すると、--store checkout-web を使うか config.yaml に store 行を書くよう案内される。store 行だけのリポジトリで既定の init をしても skill は置かれず、--scope project を付けると .agents と .claude ができる。その後 new change は store に書き込まれる](/assets/openspec-2-1-hands-on-upgrade/stores-2-1-1.webp)

1 つ目は 1.16.0 で入った案内だ。コードリポジトリに OpenSpec のルートがなく、マシンに登録済みの store の id がリポジトリの `origin` 名と同じ場合、エラーが `--store checkout-web` を使うか、`openspec/config.yaml` に `store: checkout-web` を書くよう教えてくれる。案内するだけで、勝手に store を選びはしない。別の組織に同名のリポジトリがありうるからだ。[13]

2 つ目はグローバルの既定から来る。`store:` の 1 行だけで外部の store を指しているコードリポジトリで 2.1 の `openspec init --tools claude` を実行すると、skill はグローバルに入り、リポジトリには何も置かれない。リポジトリに置くには `--scope project` が要る。`config.yaml` の `store:` 行はそのまま残り、`openspec new change` も従来どおり store に書き込まれる。当サイトの Stores ガイドの演習は `--tools none` で skill を入れないので影響はないが、コードリポジトリでエージェント用に skill を入れるなら、このオプションを覚えておきたい。

公式がはっきりサポートしないとしている構成もある。`openspec/` を別リポジトリへのシンボリックリンクにするやり方だ。2.1.0 の `init` はこの構成を「許可されたディレクトリの外」として拒否し、メンテナーの立場は、サポートする予定はなく、仕様の共有には Stores を使ってほしいというものだ。[14]

## コミュニティで繰り返し出てくる話

- **例が古いまま。** GitHub の README とリポジトリの `docs/` フォルダにはまだ `/opsx` があちこちに残っていて、skill ベースの例に直してほしいという issue が開いている。[15] 最新のドキュメントは openspec.dev にある。
- **Windows のリンク。** X で 2.0 のフォルダ構成を紹介した投稿に、Windows の Git はシンボリックリンクを有効にしない限りテキストファイルとして checkout する、という返信がすぐについた。[16][17]
- **ホームフォルダでの裏技。** 2.1 以前は、ホームフォルダで `openspec init --tools claude` を実行して skill を `~/.claude/skills` に置き、全プロジェクトで使う人がいた。[18] 2.1 で正式なグローバル導入ができたので、この方法は卒業してよい。グローバル skill を入れたあとは、`update` がホームフォルダをプロジェクトとして扱うこともなくなる。
- **ワークフローの柔軟化。** メンテナーは issue の中で、変更の複雑さに応じて文書を増やせるようにする案を議論している。小さな変更なら 1 ページの計画だけ、必要なときだけ設計やセキュリティレビューを足す、固定テンプレートの代わりに「関心事」を定義する、といったものだ。[19] まだ検討段階だが、2.x の次は導入方法からワークフローそのものへ重心が戻ることをうかがわせる。

## 上げるべきか

上げるべきだ。2.1.1 まで一気に。2.0 は現実の面倒を解消している。複数のツールで 1 つのプロジェクトを扱うなら、skill が 4 組あるより 1 組のほうがずっと扱いやすい。2.1.1 は 2.1.0 のネットワーク依存も取り除いた。考える必要があるのは 3 点だけだ。update 前に手を入れた組み込み skill を退避すること、リポジトリに触る前にチームの CLI バージョンをそろえること、skill をプロジェクトに置くかマシンに置くかを決めること。

筆者なら、チームのリポジトリは当面「プロジェクトに残す」を選び、OpenSpec がリポジトリ単位でバージョンを固定できるようになったらグローバルを検討する。個人のマシンはグローバルにして、各リポジトリの skill ファイルの山を片付ける。

今回カバーしていないもの：Windows でのリンクの checkout、GitHub ホストの Copilot エージェントによるリポジトリ内 skill の読み込み、Homebrew と Nix 向けのアップグレード案内、Kiro、Claude Code の中での skill 呼び出し。テスト環境は Linux と Node 26.9.0、エージェント部分は OpenCode 2.3.2 とその無料モデルを使った。

## 参考資料

1. OpenSpec v2.0.0 リリースノート：<https://github.com/Fission-AI/OpenSpec/releases/tag/v2.0.0>
2. OpenSpec v2.1.0 リリースノート：<https://github.com/Fission-AI/OpenSpec/releases/tag/v2.1.0>／移行ガイド Upgrade to 2.1：<https://openspec.dev/docs/upgrade-2-1>
3. OpenSpec v2.1.1 リリースノート：<https://github.com/Fission-AI/OpenSpec/releases/tag/v2.1.1>
4. OpenSpec ドキュメント Installation：<https://openspec.dev/docs/installation>／v1.16.0 リリースノート（Node の下限）：<https://github.com/Fission-AI/OpenSpec/releases/tag/v1.16.0>
5. OpenSpec ドキュメント Upgrade to 2.0：<https://openspec.dev/docs/upgrade-to-2>
6. OpenSpec v1.17.0 リリースノート：<https://github.com/Fission-AI/OpenSpec/releases/tag/v1.17.0>／移行計画 issue [#2022](https://github.com/Fission-AI/OpenSpec/issues/2022)
7. Issue [#2232](https://github.com/Fission-AI/OpenSpec/issues/2232)：update のたびに `/opsx:*` と `/openspec-*` が入れ替わる
8. Issue [#2280](https://github.com/Fission-AI/OpenSpec/issues/2280)：Add wrapper to be able to tie the version to a repository
9. Issue [#2281](https://github.com/Fission-AI/OpenSpec/issues/2281)：init in 2.1.0 requires network
10. Issue [#2276](https://github.com/Fission-AI/OpenSpec/issues/2276)：Archive skill rewrites main specs before detecting an existing archive folder
11. Issue [#2289](https://github.com/Fission-AI/OpenSpec/issues/2289)：sync-specs skill overwrites an existing ADDED requirement
12. OpenSpec ドキュメント Stores：<https://openspec.dev/docs/stores>
13. OpenSpec v1.16.0 リリースノート（Store suggestion）：<https://github.com/Fission-AI/OpenSpec/releases/tag/v1.16.0>
14. Issue [#2275](https://github.com/Fission-AI/OpenSpec/issues/2275)：init fails when openspec/ is a symlink to another repo
15. Issue [#2245](https://github.com/Fission-AI/OpenSpec/issues/2245)：Examples after 2.0.0 release
16. @liuzhihangs の X 投稿（2026-11-13）：<https://x.com/liuzhihangs/status/2121161359685754896>
17. @NabhaniMehdi の返信（2026-11-13）：<https://x.com/NabhaniMehdi/status/2121196401300283558>
18. @luckinbrew の X 投稿（2026-11-13）：<https://x.com/luckinbrew/status/2121097416204239099>
19. Issue [#2242](https://github.com/Fission-AI/OpenSpec/issues/2242)：Proposal: Extensible workflows and validation in OpenSpec
