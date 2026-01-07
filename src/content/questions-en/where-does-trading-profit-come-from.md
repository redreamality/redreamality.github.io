---
title: "Where does trading profit come from?"
description: "A clear map of profit sources in markets: risk premia, providing liquidity, information, and structural edges"
date: 2026-01-07
tags: ["量化交易", "quantitative-trading", "alpha", "risk-premium", "market-making", "arbitrage"]
lang: "en"
---

# Where does trading profit come from?

This question sounds simple, but it’s one of the most important questions in trading. If you can’t explain where profit comes from, you’re basically hoping the market donates money to you.

A rigorous starting point is slightly uncomfortable:

**After fees and costs, the average trader loses.**

So when someone profits, it’s not “created out of thin air.” Profit comes from taking money from someone else, or from being paid for providing a service the market needs (like liquidity or risk transfer).

In practice, most trading profits come from a few broad sources.

## 1) Risk premia: getting paid to hold risk others don’t want

Some returns are not “alpha,” they are compensation for risk.

Examples:

- equity risk premium (stocks tend to outperform cash over long horizons because they’re risky),
- credit spread (lending to risky borrowers pays more),
- term premium (holding long-duration bonds has rate risk),
- carry in FX/commodities (holding a position that earns yield or roll).

In plain terms: you are getting paid to be the person willing to hold an exposure when others prefer to avoid it.

Quant note: many systematic strategies are basically ways of harvesting risk premia with disciplined sizing and diversification.

## 2) Providing liquidity: earning the spread for selling immediacy

If you place limit orders and get filled, you are often providing liquidity. The other side is paying for immediacy (they want to trade now).

That payment shows up as:

- bid-ask spread,
- rebates/fees,
- short-term mean reversion after aggressive flow.

This is the logic behind market making and many short-horizon strategies.

Complex concept, simple explanation: **liquidity provision** means you let others trade quickly by being willing to take the other side, and you earn a small premium for it.

## 3) Information and speed: acting before the market fully adjusts

Some participants trade because they have an informational advantage:

- better analysis,
- faster processing of public data,
- access to order flow (or better inference of it),
- faster execution (latency).

In most mature liquid markets, pure “insider” information is rare and illegal, but *processing advantages* still exist. Quant strategies often live here: extracting weak signals from large data sets faster and more consistently than humans.

## 4) Behavioral/structural inefficiencies: exploiting patterns created by constraints

Markets are not perfectly rational because participants have constraints:

- funds rebalance at specific times,
- mandates force buying/selling,
- risk limits trigger forced liquidation,
- hedging flows from options create predictable pressure.

These are structural, repeatable forces. Many edges come from understanding who is forced to do what, and when.

This is also where “technical patterns” become real: not because lines have magic, but because clustered behavior and constraints create repeatable order-flow patterns.

## 5) Convergence and arbitrage: capturing mispricing between related instruments

Arbitrage profits come from price relationships:

- spot vs futures,
- pairs / spreads,
- cross-venue price differences,
- funding vs carry.

The profit is the convergence of the spread toward a fair relationship.

Important: arbitrage is not risk-free in real life. It has execution risk, funding risk, and tail risk (the spread can widen before it converges).

## 6) A useful summary for quant trading

If you want a compact “profit source checklist” for any strategy, ask:

- What risk am I being paid to hold?
- What service am I providing (liquidity, risk absorption, timing)?
- What constraint or inefficiency am I exploiting?
- Who is on the other side, and why are they trading?
- After costs, is the edge still there?

If you can’t answer these, your strategy is probably not a strategy—it’s a gamble.

## 7) Final takeaway

Trading profit comes from a limited number of sources: risk premia, liquidity provision, information/processing advantages, structural constraints, and arbitrage relationships.

The market is an ecosystem. Profit is what you earn for doing something valuable (providing liquidity, holding unwanted risk) or for being better (faster, smarter, more disciplined) than the average participant.

Quant trading doesn’t change the sources. It just changes how systematically and how consistently you try to capture them.
