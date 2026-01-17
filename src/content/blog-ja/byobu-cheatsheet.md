---
title: 'byobu チートシート'
pubDate: 2025-10-18T02:37:49.282Z
description: 'Essential byobu commands and shortcuts for terminal multiplexing, productivity enhancement, and session management on Linux systems'
author: 'Remy'
tags: ['ターミナル', 'linux', 'vibe coding']
lang: 'ja'
translatedFrom: 'byobu-cheatsheet'
---

Byobu は tmux と screen をベースにした拡張ターミナルマルチプレクサで、より使いやすく強力な機能を提供します。元々は Dustin Kirkland によって開発され、現在は Ubuntu のデフォルトターミナル管理ツールの一つです。Byobu の名前は日本語の「屏風」に由来し、ユーザーにより強力で柔軟なターミナルセッション管理を提供することを目指しています。Byobu を使用すると、ユーザーは1つのターミナルウィンドウ内で複数のセッションを実行でき、各セッションは独立して動作し、迅速に切り替えることができます。リモートサーバーで複数のタスクを管理する必要があるユーザーに特に適しています。

Byobu のインストール
ほとんどの Linux ディストリビューションでは、Byobu はパッケージマネージャーを通じてインストールできます。例えば、Ubuntu では次のコマンドで Byobu をインストールできます：
```
sudo apt update
sudo apt install byobu
```
Byobu の起動
注意：mobaxterm 接続では一部の機能が異常になる場合があります。powershell の使用を推奨します。
インストール完了後、次のコマンドで Byobu を起動できます：
byobu
基本操作
1. 起動と入場
  - 入場：byobu
  - セッション確認： byobu ls
2. セッションの作成と切り替え：
  - F2：新しいウィンドウを作成。
  - F3 or Alt + ←：前のウィンドウに切り替え。
  - F4 or Alt + → ：次のウィンドウに切り替え。
  - F6：現在のセッションを終了（デタッチ）（後で再接続可能）。
  - F8 ：現在のウィンドウの名前変更
2. ウィンドウの分割：
  - Ctrl + F2：現在のウィンドウを垂直分割。
  - Shift + F2：現在のウィンドウを水平分割。
  - Ctrl + F6：分割を閉じる
  - Alt+F9: すべての分割への同時入力を切り替え
  - shift+←/→: 分割間を切り替え
  
4. ウィンドウの名前変更：
  - F8：現在のウィンドウの名前を変更。
5. セッションのデタッチ：
  - F6: デタッチ

または Ctrl + D を押して現在のセッションを閉じます。

Byobu の設定

Byobu は豊富な設定オプションを提供しており、次のコマンドで設定できます：

```sh
byobu-config
```
