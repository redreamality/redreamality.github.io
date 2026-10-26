---
title: 'Byobu 命令速查：会话列表、连接恢复、分屏与分离'
pubDate: 2025-10-18T02:37:49.282Z
updatedDate: 2026-10-26T00:00:00.000Z
description: '按任务查 Byobu 命令和快捷键：列出与连接会话、切换窗口、分屏、SSH 断线恢复及按键失效排查，分清 detach 与关闭 shell。'
author: 'Remy'
tags: ['terminal', 'linux', 'vibe-coding']
---

SSH 断线后想接着工作，先用同一账号连回同一台主机，列出会话，再连接原会话。要离开但保留任务，应使用分离操作。`exit` 和 `Ctrl+D` 可能结束 shell，不是分离命令。

这份速查表使用 Byobu 的 **tmux 后端**及默认快捷键。Byobu 也支持 screen，但命令与键位有差异。`byobu-select-backend` 选择后续启动的后端，不会迁移已有会话。下面明确使用 `byobu-tmux`。

## 按任务查命令

在 shell 中执行，并把 `work` 换成你的会话名。

| 任务 | 命令 |
| --- | --- |
| 列出会话及窗口数 | `byobu-tmux list-sessions` |
| 创建并进入具名会话 | `byobu-tmux new-session -s work` |
| 连接已有会话 | `byobu-tmux attach-session -t work` |
| 交互选择会话 | `byobu-select-session` |
| 重命名会话 | `byobu-tmux rename-session -t work research` |
| 列出窗口 | `byobu-tmux list-windows -t work` |
| 在会话内部，分离当前客户端 | `byobu-tmux detach-client` |

重命名后，后续命令使用 `research`。会话（session）包含窗口（window），一个窗口可以分成多个面板（pane），分别运行 shell 或命令。F2 创建的是**窗口**，不是会话；F8 重命名的也是窗口。

## SSH 断线后恢复工作

```sh
byobu-tmux list-sessions
byobu-tmux attach-session -t work
```

连接后应看到原来的窗口。标记为 `attached` 的会话已有客户端连接，普通 attach 允许再连接一个客户端。`byobu-tmux attach-session -d -t work` 会先分离其他客户端，所以有人正在使用时不要加 `-d`。

如果列表为空，检查主机、账号、后端，以及创建时是否用了自定义 socket。screen 会话不会出现在 tmux 列表中。新建空会话不等于恢复任务；机器重启、服务被终止或最后一个 shell 退出后，无法靠 attach 恢复原进程。保存分屏布局也不等于保存进程内存。

可以创建无副作用的 `byobu-tmux new-session -s reconnect-demo`，运行 `printf 'session is still here\n'` 后按 Shift+F6。用 `byobu-tmux attach-session -t reconnect-demo` 再次连接，应仍能看到之前的输出。验证结束后，在这个演示 shell 内执行 `exit`，明确结束它。

## 快捷键没反应时查哪里

F1 显示安装版本的键位。如果 F2 打开终端菜单或改变亮度，检查终端应用的快捷键及笔记本的 Fn 模式。只换 shell 不会改变终端处理按键的方式。

Shift+F12 切换 Byobu 功能键绑定，误关后可再次启用。嵌套的终端复用器也可能截获按键，先在单层 Byobu 中测试。运行 `byobu-tmux new-window` 可以帮助区分按键没有送达和会话异常。报告问题时记录 `byobu --version`、`tmux -V`、终端应用及是否通过 SSH 连接。

## 安装 Byobu
在大多数 Linux 发行版上，Byobu 都可以通过包管理器安装。例如，在 Ubuntu 上，可以使用以下命令安装 Byobu：
```
sudo apt update
sudo apt install byobu
```
## 启动 Byobu

安装完成后，可以通过以下命令启动 Byobu：
```sh
byobu-tmux
```

## 基本操作

1. 启动进入
  - 进入：`byobu-tmux`
  - 列出会话：`byobu-tmux list-sessions`
2. 创建和切换窗口：
  - F2：创建一个新窗口。
  - F3 or Alt + ←：切换到前一个窗口。
  - F4 or Alt + → ：切换到下一个窗口。
  - F6：分离当前会话；随登录启动时，还可能登出外层 shell。
  - F8 ：重命名当前窗口
3. 分割窗口：
  - Ctrl + F2：分成左右面板。
  - Shift + F2：分成上下面板。
  - Ctrl + F6：关闭当前面板，可能终止里面的程序。
  - Alt + F9：切换所有面板同步输入，输入前检查目标。
  - Shift + ←/→：切换面板。

4. 重命名窗口：
  - F8：重命名当前窗口。
5. 分离会话：
  - Shift + F6：分离且保留外层 shell。

在空 shell 提示符处按 Ctrl + D 或执行 `exit` 可能结束这个 shell，不是分离操作。

## 配置 Byobu

Byobu 提供了丰富的配置选项，可以通过以下命令进行配置：

```sh
byobu-config
```

## 参考资料

- [Byobu 官方安装、键位与排障说明](https://byobu.org/)
- [tmux 命令手册](https://github.com/tmux/tmux/blob/master/tmux.1)
