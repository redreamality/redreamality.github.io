---
title: 'byobu cheatsheet'
pubDate: 2025-10-18T02:37:49.282Z
description: 'byobu cheatsheet 常见命令速查表'
author: 'Remy'
tags: ['terminal', 'linux', 'vibe coding']
---

Byobu 是一个增强的终端复用器，基于 tmux 和 screen，提供了更易用且强大的功能。它最初由 Dustin Kirkland 开发，现在是 Ubuntu 默认终端管理工具之一。Byobu 的名字来源于日语的「屏风」，旨在为用户提供更强大、更灵活的终端会话管理。通过 Byobu，用户可以在一个终端窗口内运行多个会话，每个会话可以独立工作并可以快速切换。它特别适合需要在远程服务器上管理多个任务的用户。

安装 Byobu
在大多数 Linux 发行版上，Byobu 都可以通过包管理器安装。例如，在 Ubuntu 上，可以使用以下命令安装 Byobu：
```
sudo apt update
sudo apt install byobu
```
启动 Byobu
注意：mobaxterm连接会有部分功能异常，可换用powershell
安装完成后，可以通过以下命令启动 Byobu：
byobu
基本操作
1. 启动进入
  - 进入：byobu
  - 查看session： byobu ls
2. 创建和切换会话：
  - F2：创建一个新窗口。
  - F3 or Alt + ←：切换到前一个窗口。
  - F4 or Alt + → ：切换到下一个窗口。
  - F6：退出（分离）当前会话（可以在以后重新连接）。
  - F8 ：重命名当前窗口
2. 分割窗口：
  - Ctrl + F2：垂直分割当前窗口。
  - Shift + F2：水平分割当前窗口。
  - Ctrl + F6：关闭分割
  - Alt+F9: Toogle 同时向所有split输入
  - shift+←/→: 在分割间切换
  
4. 重命名窗口：
  - F8：重命名当前窗口。
5. 分离会话：
  - F6: 分离

或者按 Ctrl + D 关闭当前会话。

配置 Byobu

Byobu 提供了丰富的配置选项，可以通过以下命令进行配置：

```sh
byobu-config
```
