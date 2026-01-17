---
title: "How do you define a swing in trading?"
description: "A practical definition of swings (price waves) that makes sense for discretionary and quant systems"
date: 2026-01-07
tags: ["量化交易", "quantitative-trading", "price-action", "market-structure", "swings", "signal-processing"]
lang: "en"
---

## How do you define a swing in trading?

“Swing” sounds like a simple word, but the moment you try to code it, you realize there’s no universal definition. One trader calls a 0.5% pullback a swing, another ignores anything under 3%. One uses 5-minute candles, another uses daily.

So the honest answer is:

**A swing is not a single objective thing. It’s a *filtering rule* that turns noisy price movement into a sequence of meaningful turning points.**

In other words, a swing is a way to decide which moves are “signal” and which moves are “noise,” given a specific timeframe and trading objective.

## 1) Start with what you’re trying to capture: structure, not every tick

Raw price is messy. If you try to treat every tick as information, you’ll go insane (and your strategy will overtrade). The purpose of defining swings is to build a simplified “skeleton” of price action:

- up swings (impulses),
- down swings (retracements),
- and turning points (pivots).

Once you have pivots, you can talk about market structure, trend, breaks, and ranges.

## 2) The key idea: a swing needs a turning rule and a significance rule

Most swing definitions have two ingredients:

1. **Turning rule**: how do we confirm price has turned?
2. **Significance rule**: how big must the move be to count?

If you don’t have the second, you’ll label tiny wiggles as swings. If you don’t have the first, you’ll keep “repainting” swings in real time.

## 3) Common ways to define swings (with plain explanations)

### A) Fractal / pivot-based (N-bar swing)

You define a swing high as a high that is higher than the highs of N bars on both sides (same for swing low).

Plain explanation: “A turning point is only a turning point if price failed to exceed it for a while.”

Pros: simple and time-consistent. Cons: lag (you need future bars to confirm), and it depends heavily on N.

### B) ZigZag / percentage threshold

Price forms a swing when it moves X% in one direction and then reverses at least X% in the other.

Plain explanation: “Ignore moves smaller than X%, only keep the larger waves.”

Pros: very intuitive. Cons: the same X% means different things in different volatility regimes.

### C) ATR / volatility-adjusted threshold

Instead of a fixed percentage, you require a move of K * ATR (Average True Range).

What is ATR? It’s a simple volatility measure: average daily (or bar) range. Using ATR makes the definition scale with current volatility.

Pros: adapts across regimes. Cons: ATR itself is a smoothed estimate, and you still choose K.

### D) Break-of-structure / swing defined by invalidation

You define swings using structure logic: a swing is “in play” until a key pivot is broken. For example, an up swing continues until price breaks the previous swing low.

Plain explanation: “The market tells you the swing ended when it violates the prior support/low.”

Pros: aligns with structure trading. Cons: you still need a pivot definition under the hood.

## 4) The uncomfortable truth: swings are timeframe-dependent by design

A swing on a 1-hour chart can be just a tiny candle on a daily chart. That’s not a contradiction; it’s a reminder that “swing” is a resolution choice.

A quant-friendly framing is:

- choose a sampling timeframe (e.g., 15m, 1h, 1d),
- choose a noise filter (N bars / ATR multiple / % threshold),
- extract pivots,
- then build features off those pivots.

If you change any of those, you changed what “swing” means.

## 5) Practical guidance: pick a definition that matches your edge

If your strategy is mean-reversion in ranges, you want swings that capture short oscillations around a mean. If your strategy is trend-following, you want swings that ignore small pullbacks and highlight major legs.

So instead of asking “what is the correct swing definition,” ask:

- What holding period am I targeting?
- How much drawdown am I willing to tolerate?
- Do I want early signals (more noise) or confirmed signals (more lag)?

A swing is a tool. A good definition is the one that makes your structure consistent, your backtest stable, and your execution realistic.
