---
title: "How do you define market structure?"
description: "Turning price action into a consistent framework: pivots, breaks, ranges, and state changes"
date: 2026-01-07
tags: ["量化交易", "quantitative-trading", "market-structure", "price-action", "swings", "state-models"]
lang: "en"
---

When traders say “structure,” they usually mean something like: “the market is making higher highs and higher lows,” or “structure broke,” or “we’re ranging.”

That sounds intuitive—until you try to make it precise. How high is a “high”? Which low matters? When is a break confirmed? Is a wick enough?

A practical definition that works for both discretionary thinking and quant implementation is:

**Market structure is the ordered sequence of significant swing highs and swing lows, plus the rules for how those pivots get confirmed and invalidated.**

Structure is basically the grammar of price action. Swings are the letters; structure is how the letters form readable words.

## 1) Structure starts with pivots: without pivots, “higher high” is meaningless

To talk about structure you first need a method to extract **pivots** (swing highs/lows). That’s why “how to define a swing” and “how to define structure” are inseparable.

Once you have pivots, you can label relationships:

- Higher High (HH)
- Higher Low (HL)
- Lower High (LH)
- Lower Low (LL)

The pattern of HH/HL vs LH/LL is the simplest structural description of trend vs downtrend.

## 2) The second ingredient: what counts as a “break”?

A structure break is a claim that “the previous reference point no longer holds.” In practice you need rules like:

- Do we require a close beyond the pivot, or is a wick enough?
- Do we need follow-through (e.g., a second bar confirmation)?
- How far beyond the level counts (ticks, %, ATR)?

This matters because markets often probe levels and snap back. Without a break rule, you’ll call every probe a break.

## 3) “BOS” and “ChoCH” are just labels for two different events

Different trading communities use different terms, but two structural events show up everywhere:

### Break of Structure (BOS)

In an uptrend, BOS often refers to price taking out the prior swing high (continuation). In a downtrend, taking out the prior swing low.

Plain idea: “the trend is still doing trend things.”

### Change of Character (ChoCH)

ChoCH often refers to breaking the *opposite* side that the trend should defend. For example, in an uptrend, price breaks a prior swing low.

Plain idea: “the market stopped behaving like the previous trend.”

You don’t have to use those words, but the logic is useful: continuation breaks vs potential reversal breaks.

## 4) Ranges are structure too: structure isn’t only trends

A mistake is to treat “structure” as something that exists only when the market trends. Ranging markets have structure, it’s just different:

- repeated failed breaks,
- oscillation between boundaries,
- compression (lower volatility) and then expansion.

From a quant perspective, you can treat “range” as a state where directional drift is low and mean-reversion signals work better.

## 5) A quant-friendly way to formalize structure: a state machine

Once you have pivots and break rules, you can implement structure as a simple state machine:

- State: Uptrend / Downtrend / Range
- Inputs: new pivot confirmed, pivot broken, volatility regime, etc.
- Transitions: Uptrend → Range (failed continuation), Uptrend → Downtrend (ChoCH + confirmation), etc.

This is not just theoretical. It forces you to answer ambiguity with explicit rules.

## 6) What structure is *not*

Structure is not:

- one trendline you draw by eye,
- one indicator signal,
- a story (“buyers are strong”).

Those might correlate with structure, but structure itself is the *consistent* mapping from price history to pivots and breaks.

## 7) Practical takeaway: define structure in a way that matches your execution horizon

If you trade short-term, your pivots must be sensitive enough to update quickly, otherwise your structure will lag. If you trade long-term, overly sensitive pivots will make you flip states too often.

So the best structure definition is the one that:

- produces stable labels in backtests,
- aligns with your holding period,
- and doesn’t rely on hindsight.

Once you have that, “structure” stops being a vague word and becomes a concrete, testable framework for analysis and strategy.
