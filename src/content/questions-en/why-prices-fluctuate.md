---
title: "Why do prices fluctuate?"
description: "A practical, quant-minded explanation of where price changes come from, from order flow to volatility"
date: 2026-01-07
tags: ["量化交易", "quantitative-trading", "trading", "market-microstructure", "volatility", "price-action"]
lang: "en"
---

## Why do prices fluctuate?

When people first look at a chart, they often assume price changes must be caused by “news” or “fundamentals.” That’s sometimes true, but it’s only a small part of the story. If you want a rigorous way to think about price fluctuation (especially from a quantitative trading perspective), the cleanest starting point is this:

**The price is not “the value.” The price is the most recent clearing result of a matching process.** It’s the last level where an aggressive buyer and an aggressive seller agreed to trade.

Once you accept that, price fluctuation becomes less mysterious. It’s simply the visible footprint of continuously arriving buy and sell orders, under the constraint that liquidity is limited and uneven.

## 1) Price moves when supply and demand are imbalanced, but “demand” here means orders, not opinions

In textbooks, people say “price goes up when demand exceeds supply.” In real markets, “demand” and “supply” are not philosophical beliefs; they are **orders**:

- A market buy order consumes the sell liquidity sitting in the order book.
- A market sell order consumes the buy liquidity sitting in the order book.

If the incoming buy pressure is stronger than the resting sell liquidity near the current price, trades will start printing at higher levels. The chart calls this “an up move,” but mechanically it’s just “we ran out of sellers at the old level.”

This is why two markets with identical fundamentals can have very different short-term behavior: the microstructure (who is trading, how urgently, and how much liquidity is available) can dominate in the short run.

## 2) The order book is like a landscape, and price is the ball rolling on it

A useful mental model is to imagine the order book as a landscape with hills and valleys:

- Areas with a lot of resting limit orders are “sticky.” The price ball has to be pushed hard (large aggressive flow) to pass.
- Areas with little liquidity are “slippery.” A small push can move price a lot.

That’s why you sometimes see price jump several ticks on what looks like “nothing.” It’s not nothing; it’s **a gap in available liquidity**.

Complex concept, simple explanation: **liquidity** means “how much you can buy or sell without moving the price too much.” Low liquidity means the same trade size causes a larger move.

## 3) Information changes expectations, and expectations change orders

News does matter, but it affects price through the same pipeline: orders. A macro announcement changes beliefs about future cashflows, policy, or risk. Traders then adjust positions. That adjustment shows up as:

- More aggressive orders (urgency), widening the impact.
- Withdrawal of liquidity (market makers step back), which makes the book thinner.

So volatility often spikes not only because more people trade, but because **liquidity temporarily disappears**. That’s also why “bad prints” and “good prints” can both create large moves: the market is repricing uncertainty, and the book becomes fragile.

## 4) Volatility is not random; it clusters because humans and institutions react in waves

If you study returns, you’ll notice a famous empirical fact: **volatility clusters**. Big moves tend to be followed by big moves, and quiet periods by quiet periods.

A plain-language explanation is that institutions don’t rebalance in one trade. They:

- split orders into slices to reduce impact,
- trigger risk limits that force further selling/buying,
- cause other participants to respond (hedging, stop-outs, re-entries).

So one initial impulse can create a “wave” of order flow over hours or days. In quant terms, the market has memory in variance (think GARCH-like behavior), even if the direction is hard to predict.

## 5) Many price moves are “endogenous”: they come from the market itself

This is a big one. People love external explanations, but markets generate their own dynamics:

- Stop-loss clusters: when a level breaks, stops turn into market orders, amplifying the move.
- Margin and leverage: losses force liquidation, which creates more losses.
- Options hedging: dealers hedge gamma; hedging flows can reinforce or damp moves.

“Endogenous” just means the cause is inside the system. A move can happen with no headline because the market’s internal positioning was unstable.

## 6) Timeframe matters: a “fluctuation” is just the same process observed at different resolution

A 1-minute candle and a 1-day candle are the same thing at different sampling rates. If you zoom in far enough, every candle is made of smaller candles.

So when someone asks “why is the price fluctuating,” the first quant question is: **over what horizon?**

- On very short horizons, microstructure noise (spread, queue position, inventory management) dominates.
- On medium horizons, positioning, risk management, and systematic strategies dominate.
- On long horizons, macro/fundamentals and risk premia dominate.

It’s the same machinery (orders + liquidity), just with different dominant drivers.

## 7) A clean takeaway for trading: don’t confuse “reason” with “edge”

It’s tempting to look for a story for every wiggle. But trading edges usually come from **repeatable patterns in how orders interact with liquidity and constraints**, not from perfect narratives.

For quant trading, the practical questions become:

- Is the volatility regime changing (and do I adapt position sizing)?
- Is liquidity thin (and will my execution cost jump)?
- Are there predictable flows (rebalancing windows, funding, open/close effects)?

Prices fluctuate because markets are continuous auctions with limited liquidity and constantly changing order flow. Once you see price as the output of that auction, the chart stops being “mysterious” and starts being measurable.
