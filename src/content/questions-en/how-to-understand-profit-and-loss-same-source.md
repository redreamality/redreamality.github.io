---
title: "How to understand 'profit and loss come from the same source' (盈亏同源)?"
description: "Why every trading edge has a matching failure mode, and how to use that fact to design risk and diversification"
date: 2026-01-07
tags: ["量化交易", "quantitative-trading", "risk-management", "expectancy", "regimes", "strategy-design"]
lang: "en"
---

The Chinese phrase **“盈亏同源”** literally means “profit and loss have the same origin.” Traders use it to remind themselves of a painful truth:

**Your profits and your losses usually come from the same bet.**

If you don’t understand what that bet is, you’ll treat losses as “bad luck” and profits as “skill,” and you’ll never build a robust strategy.

## 1) Every strategy is a claim about how the world works

A strategy is not a collection of entries. It’s a claim:

- Trend-following claims that moves persist and big winners can pay for many small losses.
- Mean-reversion claims that extremes tend to revert and ranges repeat.
- Carry claims that you can earn a risk premium for holding an exposure.
- Arbitrage claims that mispricings converge faster than your funding and risk.

That claim is the “source.” When the world behaves according to the claim, you make money. When it doesn’t, you lose money.

## 2) The simplest example: trend-following

Trend-following often looks like:

- many small losses in choppy conditions,
- a few very large winners in sustained trends.

Both outcomes come from the same mechanism: **you are paying for optionality on large moves.**

If the market chops, you keep buying/selling breakouts and getting reversed. If the market trends, your winners run.

So the source of profit is also the source of loss: your decision to hold directional exposure and give the trade room.

## 3) The mirror example: mean-reversion

Mean-reversion strategies tend to:

- win often in stable ranges,
- lose big when a range breaks into a strong trend.

Same source again: you are betting that deviations are temporary. In a true regime shift, the “extreme” is no longer extreme—it becomes the new normal.

That’s why mean-reversion needs strict risk controls (position limits, stop rules, volatility scaling). The loss is not an accident; it’s the other side of the same hypothesis.

## 4) “Same source” also explains P&L shape (skew)

A strategy’s edge is not only about average return; it’s also about the **shape** of outcomes:

- Trend-following tends to have positive skew: rare big gains.
- Short-volatility or some mean-reversion styles tend to have negative skew: frequent small gains, rare big losses.

That shape is not cosmetic—it is the direct consequence of the “source” bet.

Complex concept, simple explanation: **skew** means your gains and losses are not symmetric. You can win many small times and lose one big time, or vice versa.

## 5) Why this matters for quant trading: losses are diagnostic

If profit and loss share the same origin, then drawdowns are not just pain; they are information.

A drawdown is often telling you one of these:

- your hypothesis is wrong (edge decayed),
- the regime changed (edge temporarily off),
- costs/slippage increased (execution regime changed),
- sizing is too aggressive for the strategy’s tail risk.

Instead of “how do I avoid losses,” the better question is: “What kind of loss pattern is consistent with my edge, and what kind is a warning sign?”

## 6) The only real escape: diversify sources, not entries

You cannot eliminate the same-source nature within one strategy. The way out is **diversifying across different sources**:

- trend + mean-reversion,
- carry + value,
- different markets and instruments,
- different horizons.

If you diversify correctly, one strategy’s failure regime is less likely to coincide with another’s. That’s when equity curves become smoother.

## 7) Practical takeaway

“盈亏同源” is not pessimism. It’s a design principle:

- Identify what your strategy is truly betting on.
- Accept the matching failure mode as part of the package.
- Size positions so the failure mode is survivable.
- Diversify across different sources of return.

When you do that, losses stop feeling like random punishment and start functioning like feedback from the market about the bet you are making.
