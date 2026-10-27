---
title: 'Byobu cheat sheet: commands, sessions, attach and detach'
pubDate: 2025-10-18T02:37:49.282Z
updatedDate: 2026-10-26T00:00:00.000Z
description: 'Byobu commands for listing and attaching sessions, switching windows, splitting panes and recovering after SSH disconnects. Includes function-key troubleshooting.'
author: 'Remy'
tags: ['terminal', 'linux', 'vibe-coding']
---

To resume work after an SSH disconnect, reconnect to the same host as the same user, list sessions, and attach to the original session. To leave work running, detach. `exit` and `Ctrl+D` can end the shell; they are not detach commands.

This reference uses Byobu's **tmux backend** and default bindings. Byobu also supports screen, with different commands and bindings. `byobu-select-backend` selects the backend for future launches; it does not migrate existing sessions. Use `byobu-tmux` explicitly for the commands below.

## Commands by task

Run these in a shell, replacing `work` with your session name.

| Task | Command |
| --- | --- |
| List sessions and window counts | `byobu-tmux list-sessions` |
| Create and enter a named session | `byobu-tmux new-session -s work` |
| Attach to an existing session | `byobu-tmux attach-session -t work` |
| Choose a session interactively | `byobu-select-session` |
| Rename a session | `byobu-tmux rename-session -t work research` |
| List windows | `byobu-tmux list-windows -t work` |
| Detach the current client, from inside the session | `byobu-tmux detach-client` |

After renaming, use `research` in subsequent commands. A session contains windows; each window can contain several panes running separate shells or commands. F2 creates a **window**, not a session. F8 renames a window.

## Recover after an SSH disconnect

```sh
byobu-tmux list-sessions
byobu-tmux attach-session -t work
```

The original windows should reappear. A session marked `attached` already has a client; normal attach allows another client to view it. `byobu-tmux attach-session -d -t work` detaches other clients before attaching yours, so avoid `-d` when someone else is using the session.

If no sessions appear, check the host, account, backend and any custom socket used at startup. A screen session is not listed by tmux. Do not create a new empty session and mistake it for recovery. Attach cannot restore processes after a server reboot, server termination or the last shell exiting. Saved pane layouts do not save process memory.

For a harmless check, create `byobu-tmux new-session -s reconnect-demo`, run `printf 'session is still here\n'`, and press Shift+F6. Attach again with `byobu-tmux attach-session -t reconnect-demo`; the output should remain visible. Finish with `exit` inside this demo shell to end it deliberately.

## When function keys do not work

Press F1 for the installed version's bindings. If F2 opens a terminal menu or changes brightness, inspect the terminal application's shortcuts and the laptop's Fn-key mode. Changing shells alone does not change terminal key handling.

Shift+F12 toggles Byobu's function-key bindings. Re-enable them if disabled. Nested multiplexers can also intercept keys; test in a single Byobu layer. Try `byobu-tmux new-window` to distinguish key-delivery problems from session problems. Record `byobu --version`, `tmux -V`, the terminal application and whether you use SSH when reporting a problem.

## Installing Byobu
On most Linux distributions, Byobu can be installed via the package manager. For example, on Ubuntu, run:

```
sudo apt update
sudo apt install byobu
```

## Starting Byobu

Once installed, start Byobu with:

```
byobu-tmux
```

## Basic Operations
1. Launching & Listing
   - Enter: `byobu-tmux`
   - List sessions: `byobu-tmux list-sessions`

2. Creating & Switching Windows
   - F2: Create a new window.
   - F3 or Alt + ←: Switch to the previous window.
   - F4 or Alt + →: Switch to the next window.
   - F6: Detach; when started at login, this may also log out the outer shell.
   - F8: Rename the current window.

3. Splitting Windows
   - Ctrl + F2: Create left and right panes.
   - Shift + F2: Create top and bottom panes.
   - Ctrl + F6: Kill the current pane; this can terminate its program.
   - Alt + F9: Toggle simultaneous input to all panes. Check the targets before typing.
   - Shift + ←/→: Move between splits.

4. Renaming Windows
   - F8: Rename the current window.

5. Detaching Sessions
   - Shift + F6: Detach without logging out the surrounding shell.
   - `exit` or Ctrl + D at an empty shell prompt can end that shell. They do not detach.

## Configuring Byobu

Byobu offers extensive configuration options. Open the configuration menu with:

```sh
byobu-config
```

## References

- [Byobu official installation, keybindings and troubleshooting](https://byobu.org/)
- [tmux command manual](https://github.com/tmux/tmux/blob/master/tmux.1)
