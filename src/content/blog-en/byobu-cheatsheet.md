---
title: 'byobu cheatsheet'
pubDate: 2025-10-18T02:37:49.282Z
description: 'byobu cheatsheet common commands quick reference'
author: 'Remy'
tags: ['terminal', 'linux', 'vibe coding']
---

Byobu is an enhanced terminal multiplexer built on top of tmux and screen, offering more user-friendly and powerful features. It was originally developed by Dustin Kirkland and is now one of Ubuntu’s default terminal management tools. The name “Byobu” comes from the Japanese word for “folding screen,” aiming to give users a more robust and flexible way to manage terminal sessions. With Byobu, you can run multiple sessions inside a single terminal window, each operating independently and switchable on the fly. It is especially useful for users who need to juggle several tasks on remote servers.

Installing Byobu  
On most Linux distributions, Byobu can be installed via the package manager. For example, on Ubuntu, run:

```
sudo apt update
sudo apt install byobu
```

Starting Byobu  
Note: Some features may not work correctly under MobaXterm; consider using PowerShell instead.  
Once installed, launch Byobu with:

```
byobu
```

Basic Operations  
1. Launch & List  
   - Enter: `byobu`  
   - List sessions: `byobu ls`

2. Create & Switch Sessions  
   - F2: Create a new window.  
   - F3 or Alt + ←: Switch to the previous window.  
   - F4 or Alt + →: Switch to the next window.  
   - F6: Detach from the current session (reattachable later).  
   - F8: Rename the current window.

3. Splitting Windows  
   - Ctrl + F2: Split the current window vertically.  
   - Shift + F2: Split the current window horizontally.  
   - Ctrl + F6: Close the current split.  
   - Alt + F9: Toggle simultaneous input to all splits.  
   - Shift + ←/→: Move between splits.

4. Renaming Windows  
   - F8: Rename the current window.

5. Detaching Sessions  
   - F6: Detach  
   - Or press Ctrl + D to close the current session.

Configuring Byobu  
Byobu offers extensive configuration options. Open the configuration menu with:

```sh
byobu-config
```