---
title: 'Byobu チートシート：コマンド、セッション、再接続とデタッチ'
pubDate: 2025-10-18T02:37:49.282Z
updatedDate: 2026-10-26T00:00:00.000Z
description: 'Byobu のセッション一覧と再接続、ウィンドウ切替、ペイン分割、SSH 切断後の復帰、ファンクションキーが届かない場合の確認方法。'
author: 'Remy'
tags: ['ターミナル', 'linux', 'vibe-coding']
lang: 'ja'
translatedFrom: 'byobu-cheatsheet'
---

SSH 切断後に作業を再開するには、同じユーザーで元のホストに接続し、一覧から元のセッションを確認してアタッチします。処理を動かしたまま離れる操作はデタッチです。`exit` や `Ctrl+D` は shell を終了する場合があり、デタッチとは違います。

この早見表は **tmux バックエンド**と既定のキー設定が対象です。Byobu は screen にも対応しますが、コマンドやキー設定が異なります。`byobu-select-backend` は次回起動時のバックエンドを選択し、既存のセッションは移行しません。以下では `byobu-tmux` を明示します。

## 目的からコマンドを選ぶ

shell で実行し、`work` は対象のセッション名に置き換えます。

| 目的 | コマンド |
| --- | --- |
| セッション名とウィンドウ数の一覧 | `byobu-tmux list-sessions` |
| 名前付きセッションを作成して接続 | `byobu-tmux new-session -s work` |
| 既存セッションに接続 | `byobu-tmux attach-session -t work` |
| 対話的に選択 | `byobu-select-session` |
| セッション名を変更 | `byobu-tmux rename-session -t work research` |
| ウィンドウ一覧 | `byobu-tmux list-windows -t work` |
| セッション内から現在のクライアントをデタッチ | `byobu-tmux detach-client` |

改名後は `research` を使います。セッションはウィンドウを含み、ウィンドウは複数のペインに分割できます。各ペインで別々の shell やコマンドが動きます。F2 は**ウィンドウ**を作成し、F8 はウィンドウ名を変更します。セッション自体の操作ではありません。

## SSH 切断後に復帰する

```sh
byobu-tmux list-sessions
byobu-tmux attach-session -t work
```

元のウィンドウが表示されることを確認します。`attached` は別のクライアントが接続中という意味で、通常の attach では追加のクライアントも接続できます。`byobu-tmux attach-session -d -t work` は他のクライアントを切断するため、他の人が使っている場合は `-d` を付けないでください。

一覧が空なら、ホスト、ユーザー、バックエンド、起動時のカスタム socket を確認します。screen のセッションは tmux の一覧に出ません。空の新規セッションを作っても復帰にはなりません。再起動、サーバー終了、最後の shell の終了後には attach で元のプロセスを復元できません。レイアウトの保存もプロセスメモリーの保存ではありません。

無害な確認用セッションを `byobu-tmux new-session -s reconnect-demo` で作り、`printf 'session is still here\n'` を実行して Shift+F6 を押します。`byobu-tmux attach-session -t reconnect-demo` で戻ると先ほどの出力が見えるはずです。確認後はデモ用 shell で `exit` を実行して終了します。

## ファンクションキーが効かない場合

F1 でインストール済みバージョンのキー設定を確認します。F2 が端末のメニューを開いたり明るさを変えたりする場合は、端末アプリのショートカットと PC の Fn モードを調べます。shell を替えるだけでは端末側のキー処理は変わりません。

Shift+F12 は Byobu のファンクションキー設定を切り替えます。無効なら再度有効にします。多重化ツールの入れ子も影響するため、単一の Byobu で確認します。`byobu-tmux new-window` で試すと、キーが届かない問題とセッションの問題を区別できます。報告時は `byobu --version`、`tmux -V`、端末アプリ、SSH 接続の有無を記録します。

## Byobu のインストール
ほとんどの Linux ディストリビューションでは、Byobu はパッケージマネージャーを通じてインストールできます。例えば、Ubuntu では次のコマンドで Byobu をインストールできます：
```
sudo apt update
sudo apt install byobu
```
## Byobu の起動

インストール完了後、次のコマンドで Byobu を起動できます：
```sh
byobu-tmux
```

## 基本操作

1. 起動と入場
  - 起動：`byobu-tmux`
  - 一覧：`byobu-tmux list-sessions`
2. ウィンドウの作成と切り替え：
  - F2：新しいウィンドウを作成。
  - F3 or Alt + ←：前のウィンドウに切り替え。
  - F4 or Alt + → ：次のウィンドウに切り替え。
  - F6：デタッチ。ログイン時に起動した場合は外側の shell もログアウトする場合があります。
  - F8 ：現在のウィンドウの名前変更
3. ウィンドウの分割：
  - Ctrl + F2：左右に分割。
  - Shift + F2：上下に分割。
  - Ctrl + F6：ペインを閉じ、実行中のプログラムも終了する場合があります。
  - Alt + F9：全ペインへの同期入力を切替。入力先を確認します。
  - Shift + ←/→：ペインを切替。

4. ウィンドウの名前変更：
  - F8：現在のウィンドウの名前を変更。
5. セッションのデタッチ：
  - Shift + F6：外側の shell を残してデタッチ。

空の shell プロンプトで Ctrl + D を押すか `exit` を実行すると、その shell が終了する場合があります。デタッチ操作ではありません。

## Byobu の設定

Byobu は豊富な設定オプションを提供しており、次のコマンドで設定できます：

```sh
byobu-config
```

## 参考資料

- [Byobu 公式のインストール、キー設定、トラブルシューティング](https://byobu.org/)
- [tmux コマンドマニュアル](https://github.com/tmux/tmux/blob/master/tmux.1)
