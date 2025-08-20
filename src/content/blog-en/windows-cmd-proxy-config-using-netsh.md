---
title: 'Local Proxy with bypass list: a Windows Batch Script'
pubDate: 2025-08-06T00:00:00.000Z
description: ''
author: 'Remy'
tags: ['windows', 'proxy']
---

## The Ultimate Guide to Configuring a Local Proxy with a Windows Batch Script

Are you a developer, IT professional, or power user looking for a quick way to manage your Windows network settings? You might need to route your computer's internet traffic through a specific application for debugging, or perhaps a piece of software requires a custom proxy configuration to function correctly.

Manually changing these settings in Windows can be a repetitive chore. Fortunately, a simple but powerful batch script can automate the entire process.

In this guide, we'll break down a script that automatically configures your WinHTTP proxy settings, explain how each part works, and show you how to customize it for your own needs.

### What Does This Script Do? A High-Level Overview

At its core, this script is an automation tool for your network settings. It performs two main actions:

1.  **Gains Administrator Access:** Modifying system-wide network settings requires elevated permissions. The script cleverly requests administrator rights automatically, so you don't have to remember to "Run as Administrator" every time.
2.  **Sets a System Proxy:** It configures Windows to send most of its internet traffic through a proxy server running on your own machine (`localhost`). This is essential for applications that need to monitor, modify, or control network requests.
3.  **Defines Proxy Exceptions:** It specifies a "bypass list" of domains that should *not* go through the proxy. This ensures that essential background services, like connections to local sites or specific country domains, continue to work without interruption.

### The Script Itself

Here is the code we'll be dissecting. It's a powerful tool for quickly setting up your development or testing environment.

```batch
@echo off
:Get Admin Access
%1 mshta vbscript:CreateObject("Shell.Application").ShellExecute("cmd.exe","/c %~s0 ::","","runas",1)(window.close)&&exit

netsh winhttp set proxy localhost:15236 bypass-list="<local>;*.cn;*.localsite.com"

pause
```

### A Deeper Dive: Understanding the Code Line-by-Line

Let's break down exactly what each command does.

#### `@echo off`

This is a standard command at the start of most batch scripts. It simply keeps the command prompt window clean by preventing the commands themselves from being displayed as they are executed.

#### The Administrator Trick: `%1 mshta ...`

`%1 mshta vbscript:CreateObject("Shell.Application").ShellExecute(...)`

This clever line is the key to automatic elevation. It uses a built-in Windows component (`mshta.exe`) to trigger a User Account Control (UAC) prompt, asking for administrator permissions. If you grant permission, the script restarts itself with the required access. If the script already has admin rights, this line is skipped.

#### The Core Command: `netsh winhttp set proxy ...`

This is where the magic happens. Let's look at the components:

  * `netsh winhttp set proxy`: This command tells the Windows Network Shell (`netsh`) to modify the settings for WinHTTP, a service used by many system components (like Windows Update) and applications to access the internet.
  * `localhost:15236`: This sets the proxy server to `localhost` (which is a universal name for your own computer) on port `15236`. This tells Windows to send traffic to an application that you should have running locally on that specific port.
  * `bypass-list="..."`: This is crucial for stability. It lists addresses that should **ignore the proxy** and connect directly. In this example:
      * `<local>`: Bypasses all addresses on your local network (e.g., file servers, printers).
      * `*.cn`: Bypasses all domains ending in `.cn`.
      * `*.localsite.com`: Bypasses a specific local or development domain.

#### `pause`

This final command prevents the command prompt window from closing immediately after the script finishes. This gives you time to read the output and check for any success or error messages.

### How to Customize The Script for Your Needs

The real power of this script comes from its adaptability. You can easily modify it for your own projects. Simply copy the code into a new text file and save it with a `.bat` extension (e.g., `proxy_config.bat`).

**To customize it:**

  * **Change the Port:** Replace `15236` with the port number your local application uses (e.g., `8080` for Burp Suite, `9090` for Zap, or a custom port for your own app).
  * **Edit the Bypass List:** Modify the domains inside the `bypass-list="..."` string. Add the domains your company uses or any other services that should not be routed through your local proxy. Separate each entry with a semicolon (`;`).

By understanding and customizing this simple script, you can save valuable time and streamline your workflow, making network configuration a one-click process.