---
title: "How much does Cursor cost? Plans and model pricing"
description: "As of 2026-10-16, Cursor is sold as part of The X Subscription: Free, Plus at 8 USD a month, Premium at 30, Super at 100, and Ultra at 200. What each plan includes and how model usage is billed."
date: 2026-10-16
tags: ["cursor"]
lang: "en"
---

As of 2026-10-16, Cursor has five individual plans: Free, Plus at 8 USD a month, Premium at 30 USD, Super at 100 USD, and Ultra at 200 USD. Annual billing costs 80, 300, 1,000, and 2,000 USD a year. Prices exclude tax.

Cursor is now sold as part of The X Subscription, one subscription for Grok, Cursor, and X. Each paid plan includes one weekly usage pool shared across Cursor Agent, the CLI, Cloud Agents, and the Grok apps. Premium gets 4x the usage of Plus, Super 15x, and Ultra 50x.

## What separates the plans

| Plan | Monthly price | Usage | Third-party models |
| --- | --- | --- | --- |
| Free | 0 | Limited | Not available |
| Plus | 8 USD | Base | Not available |
| Premium | 30 USD | 4x Plus | API list price, from prepaid credit |
| Super | 100 USD | 15x Plus | Same |
| Ultra | 200 USD | 50x Plus | Same |

Plus runs only Cursor's own models (Grok 4.7, 4.6, 4.5, and Composer 2.5) at fixed settings, with no Cloud Agents, Bugbot, or your own API keys. To use Claude, GPT, or Gemini you need Premium or higher. Teams are priced per seat at 30, 100, or 200 USD, matching the Premium, Super, and Ultra usage levels.

## How model usage is billed

The weekly pool covers Cursor models only. Beyond it, usage is charged from prepaid credit at per-model rates: Composer 2.5 costs 0.5 USD per million input tokens and 2.5 USD per million output tokens, and Grok 4.7 costs 2 and 6 USD. Third-party models are charged at the provider's API list price from the first request; Claude Opus 5.5, for example, is 4 USD input and 20 USD output per million tokens. Teams and Enterprise also pay a Cursor Token Rate of 0.25 USD per million tokens on third-party requests. Individual plans don't.

My take: if you mostly use Agent for everyday code, Premium is the right place to start, and Super makes sense once agents run for hours each day. If you lean on Claude or GPT, most of your spend lands on prepaid credit, and the monthly fee is the small part.

Legacy plans such as Pro, Pro+, and the old Ultra keep working for existing customers. Prices change often, so check the official [Cursor pricing page](https://cursor.com/pricing) and the [models and pricing docs](https://cursor.com/docs/models) before you buy.

## Related reading

- [How Claude Code usage limits work](/blog/claude-code-usage-limits-cost-2026/)
- [The 2026 AI coding tools war](/blog/ai-coding-tools-war-vibe-coding-mainstream/)
