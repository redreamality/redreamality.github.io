---
title: 'Byobu 终端复用器命令速查表 (Cheatsheet)'
pubDate: 2025-10-18T02:37:49.282Z
description: 'Byobu 常用快捷键与命令速查，助你高效管理 Linux 终端会话。'
author: 'Remy'
tags: ['terminal', 'linux', 'cheatsheet']
---

**Byobu** 是一个功能强大的终端复用器，基于 `tmux` 或 `screen` 构建，提供了更友好的界面和更便捷的快捷键。它最初由 Dustin Kirkland 开发，目前已成为 Ubuntu 等 Linux 发行版的默认终端管理工具之一。

Byobu 的名字源自日语中的“屏风”，旨在为用户提供灵活的终端会话管理。通过 Byobu，你可以在单个终端窗口内运行多个独立会话并快速切换，特别适合管理远程服务器上的多个后台任务。

## 安装 Byobu

在大多数 Linux 发行版中，可以通过包管理器直接安装。

**Ubuntu / Debian 系：**
```bash
sudo apt update
sudo apt install byobu
```

## 启动与基础管理

> **提示**：在使用 MobaXterm 连接时，部分功能键可能会失效，建议改用 PowerShell 或原生 SSH 客户端。

*   **启动 Byobu**：直接输入 `byobu`
*   **查看当前会话列表**：`byobu ls`
*   **配置菜单**：`byobu-config`

## 常用快捷键

### 1. 窗口 (Window) 管理
*   **F2**：新建窗口
*   **F3** 或 **Alt + ←**：切换至上一个窗口
*   **F4** 或 **Alt + →**：切换至下一个窗口
*   **F8**：重命名当前窗口
*   **Ctrl + D**：关闭当前窗口

### 2. 会话 (Session) 管理
*   **F6**：分离（Detach）当前会话，任务会在后台继续运行
*   **byobu**：重新连接（Attach）到之前的会话

### 3. 分割 (Split/Pane) 管理
*   **Ctrl + F2**：垂直分割窗口
*   **Shift + F2**：水平分割窗口
*   **Shift + 方向键**：在不同的分割区域间移动焦点
*   **Ctrl + F6**：关闭当前分割区域
*   **Alt + F9**：开启/关闭同步输入（同时向所有分割区域发送命令）

## 总结

Byobu 通过将复杂的 `tmux` 命令映射到功能键（F1-F12），极大地降低了终端复用的学习成本。如果你经常需要通过 SSH 维护服务器，Byobu 绝对是你的效率利器。
