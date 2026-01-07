---
title: "Where Do Trading Profits Come From?"
description: "Deep exploration of sources of trading profits, from probability advantage to risk control, from market structure to execution discipline, comprehensive understanding of essence of profits"
date: 2025-01-20
tags: ["trading profits", "probability advantage", "risk management", "quantitative trading", "trading system"]
lang: "en"
translatedFrom: "where-do-trading-profits-come-from"
---

# Where Do Trading Profits Come From?

This is a fundamental question every trader thinks about: Where exactly does the money I make in trading come from? Is it from accuracy of predicting markets? Is it from ability to analyze technically? Or does it come from something more fundamental? This question seems simple, but answering it requires deep understanding of trading's essence.

## Short Answer

**Trading profits come from four aspects: probability advantage, risk control, execution discipline, and market opportunities.** The most core is probability advantage - your trading system must have positive mathematical expectation in the long term. Risk control ensures you won't go bankrupt while gaining positive expectation. Execution discipline ensures you can completely execute your system, letting probability advantage fully function. Market opportunities are external conditions that determine application environment of your system. These four aspects are indispensable, jointly determining whether you can profit in trading.

This answer gives basic framework for profit sources, but to truly understand essence of profits, deeper exploration is needed.

## Profit Source 1: Probability Advantage

This is core and foundation of trading profits.

### What Is Probability Advantage?

**Mathematical Expectation Is Positive**

Simplest definition of probability advantage is: Your trading system has positive mathematical expectation in the long term.

**Calculation of Mathematical Expectation:**
```
Expectation = (Win Rate × Average Profit) - (Loss Rate × Average Loss)
```

**Example:**
Suppose your system:
- Win rate: 40%
- Average profit: 500 yuan per profitable trade
- Average loss: 300 yuan per losing trade

Expectation = (40% × 500) - (60% × 300)
          = 200 - 180
          = 20 yuan

This means: On average per trade, you expect to profit 20 yuan. After sufficient number of trades, your total result will approach this expected value.

### Essence of Probability Advantage

**Why Can Probability Advantage Bring Profits?**

Essence of probability advantage is Law of Large Numbers:

**Law of Large Numbers:**
- When number of trials is sufficiently large, actual results will approach theoretical expectation
- Single trade result is random
- But sum of multiple trades will approach expected value

**Application in Trading:**
- Single trade: Might profit +500, might loss -300, result uncertain
- 100 trades: Total result will approach 100 × 20 = 2000 yuan
- 1000 trades: Total result will approach 1000 × 20 = 20000 yuan

So, if your system has positive expectation, long-term execution can profit.

### Sources of Probability Advantage

**Where Does Probability Advantage Come From?**

**Source 1: Market Structure**
- Markets are not completely random
- Markets have structure (trends, support/resistance, etc.)
- Utilizing these structures can gain probability advantage
- For example: Going long following trend in uptrend, win rate > 50%

**Source 2: Price Behavior**
- Prices have specific behavior patterns
- For example: Continuation after breakout, bounce after pullback
- Identifying and trading these patterns can gain advantage

**Source 3: Supply-Demand Relationship**
- Trading at key supply-demand levels (support/resistance)
- Prices tend to continue when supply-demand imbalanced
- Utilizing these imbalances can gain advantage

**Source 4: Statistical Patterns**
- Certain patterns and signals have statistical advantages in history
- For example, after specific candlestick combinations, prices tend to move in certain direction
- Statistical testing can verify these advantages

### Quantitative Verification of Probability Advantage

**How to Verify Probability Advantage?**

**Backtesting Method:**
1. Design trading system (clear entry, exit, risk control rules)
2. Simulate system performance on historical data
3. Statistics of system's overall results
4. Calculate expectation value, win rate, profit-loss ratio and other indicators
5. If expectation > 0, system has probability advantage

**Forward Testing:**
1. Execute system in demo account
2. Record result of each trade
3. Regularly evaluate system performance
4. Verify if backtesting results are verified in live trading

**Important Principles:**
- Probability advantage must be based on sufficiently large sample
- Sample too small, results might be random
- Generally need at least 100 trades to preliminarily verify
- More reliable verification needs more trades

## Profit Source 2: Risk Control

Even with probability advantage, without risk control can still go bankrupt.

### Role of Risk Control

**Ensure Long-term Survival**

Core role of risk control: Ensure you won't go bankrupt while gaining positive expectation.

**Why Need Risk Control?**

Even if your system has positive expectation (average +20 yuan per trade), but if:
- You always trade full positions
- Some loss might bankrupt you
- After bankruptcy, you can't trade anymore, so can't gain expected profits

So, risk control is:
- Limit risk of each trade
- Ensure survival in worst case
- Give you enough number of trades, letting expectation work

### Risk Control Methods

**Specific Risk Control Measures**

**Method 1: Position Management**
- Control ratio of risk of each trade to total capital
- For example: Each trade's risk not exceeding 2% of total capital
- If total capital 100,000 yuan, each trade's maximum loss not exceeding 2000 yuan
- This way even with 50 consecutive losses, only lose 100% of total capital, theoretically can continue

**Method 2: Stop Loss Setting**
- Set stop loss when entering
- Stop loss level should be based on system logic (technical level, volatility, etc.)
- Once stop loss triggers, strictly execute
- Don't let single loss get out of control

**Method 3: Consecutive Loss Protection**
- Set maximum number of consecutive losses
- For example: Pause trading after 5 consecutive losses
- Give yourself time to calmly analyze
- Avoid emotional trading during consecutive losses

**Method 4: Maximum Drawdown Control**
- Set maximum drawdown ratio
- For example: Adjust position when total capital drawdown exceeds 20%
- Dynamically adjust risk level
- Ensure drawdown within controllable range

### Mathematical Significance of Risk Control

**Kelly Formula**

Kelly formula is position management method commonly used in quantitative trading:

```
f = (bp - q) / b
```

Where:
- f = Optimal position ratio
- b = Profit-loss ratio (Average profit / Average loss)
- p = Win rate
- q = Loss rate = 1 - p

**Example:**
If your system:
- Win rate p = 40%
- Loss rate q = 60%
- Profit-loss ratio b = 500/300 = 1.67

f = (0.4 × 1.67 - 0.6) / 1.67
  = (0.668 - 0.6) / 1.67
  = 0.068 / 1.67
  = 0.041

Optimal position ratio is 4.1%. This means risk of each trade should be 4.1% of total capital.

**Significance of Kelly Formula:**
- Calculates optimal position ratio
- Maximizes long-term growth rate
- But too aggressive, in practice often use "half Kelly" (f/2)

## Profit Source 3: Execution Discipline

With probability advantage and risk control, still need execution discipline to profit.

### Importance of Execution Discipline

**Complete System Execution**

**What Is Execution Discipline?**
- Strictly execute according to trading system rules
- Don't change because of emotions, views, external information
- Every trade enter, exit, control risk according to rules
- Not selective execution, don't skip trades

**Why Is Execution Discipline Important?**

**Scenario 1: Selective Execution**
You have positive expectation system, expectation +20 yuan per trade:
- Trade 1: Execute according to rules, loss -300
- Trade 2: Seeing loss, afraid to continue losing, don't execute 2nd trade according to rules
- Trade 3: Seeing trade 1 lost, don't execute 3rd trade according to rules
- ...

Result: You only executed some trades, system lost statistical advantage.

**Scenario 2: Strict Execution**
Same system:
- Trade 1: Execute according to rules, loss -300
- Trade 2: Execute according to rules, loss -300
- Trade 3: Execute according to rules, profit +500
- Trade 4: Execute according to rules, profit +500
- ...
- 100 trades: Total result approaches 100 × 20 = 2000 yuan

Comparison of two scenarios:
- Selective execution: Lost statistical advantage, long-term results uncertain
- Strict execution: Maintained statistical advantage, long-term results meet expectation

### Challenges of Execution Discipline

**Why Is Execution Discipline So Difficult?**

**Challenge 1: Emotional Interference**
- When losing: Fear, anxiety, wanting to avoid losses
- When profiting: Greed, overconfidence, wanting to increase position
- When ranging: Impatience, wanting to force trades
- These emotions all interfere with execution discipline

**Challenge 2: Cognitive Biases**
- Recentness bias: Overvaluing recent results
- Confirmation bias: Only looking for information supporting your views
- Anchoring effect: Affected by previous result
- These biases all affect execution

**Challenge 3: External Interference**
- News, expert opinions, social media discussions
- All might make you doubt system
- Affect your execution

### How to Maintain Execution Discipline?

**Methods to Maintain Execution Discipline**

**Method 1: Automated Execution**
- Use algorithms to automatically execute trades
- Completely eliminate human intervention
- Ensure 100% discipline of execution
- This is advantage of quantitative trading

**Method 2: Trading Plan**
- Make detailed plan before each trade
- Clear entry point, exit point, stop loss, target
- After plan made, strictly execute
- Don't change plan because of emotions

**Method 3: Trading Journal**
- Record detailed situation of each trade
- Record your psychological state
- Regularly review, analyze execution situation
- Identify and improve your execution problems

**Method 4: Trading Environment**
- Create good trading environment
- Reduce external interference
- Fixed trading time
- Maintain good physical and mental state

## Profit Source 4: Market Opportunities

Market provides trading opportunities, this is external condition for profits.

### What Are Market Opportunities?

**Conditions Favoring System Performance**

Market opportunities mean:
- Market environment suits your system
- Has sufficient volatility
- Has clear structure formation
- Your system can identify and trade them

**Different systems need different market environments:**
- Trend-following systems: Need clear market trends
- Mean-reversion systems: Need ranging markets
- Breakout systems: Need volatile markets
- Arbitrage systems: Need correlation deviations

### Identifying Market Opportunities

**How to Identify Market Opportunities?**

**Method 1: Market State Classification**
- Trending market: Has clear direction
- Ranging market: Prices fluctuate within range
- High volatility: Large price fluctuations
- Low volatility: Small price fluctuations

According to your system type:
- Only trade in market states that fit
- Avoid trading in market states that don't fit

**Method 2: Multi-Timeframe Confirmation**
- Use multiple timeframes to confirm market state
- Confirm if market structure is clear
- Confirm if volatility is sufficient
- Improve accuracy of market opportunity judgment

**Method 3: Indicator Assistance**
- Use technical indicators to assist in judging market state
- For example: ADX judges trend strength
- ATR judges volatility
- Bollinger Bands judge ranging range

### Matching Market Opportunities and Systems

**Market Opportunities Must Match Systems**

Even with good market opportunities, if they don't match your system, they're not your opportunities.

**Example:**
- Market: Clear uptrend, suits trend-following system
- Your system: Mean-reversion system (sell at resistance, buy at support)
- Result: Your system repeatedly trades against trend in uptrend, continuously losing

Correct approach:
- Either change system (switch to trend-following system)
- Or wait for market environment to change (wait for uptrend to end, enter ranging period)

Market opportunity + System match = Best trading opportunity

## Interrelationships of Four Sources

Probability advantage, risk control, execution discipline, market opportunities - these four sources are not independent but interconnected.

### Interrelationship Diagram

```
Market Opportunities (External Conditions)
    ↓
Probability Advantage (System Capability) ──→ Risk Control (Survival Guarantee)
    ↓                              ↓
Execution Discipline (Process Guarantee) ──────────→ Trading Results
```

### Detailed Interrelationships

**Relationship 1: Market Opportunities × Probability Advantage = Theoretical Expectation**
- Market opportunities provide environment suitable for system
- System exerts probability advantage in suitable environment
- Product of the two determines theoretical expectation

**Relationship 2: Probability Advantage + Execution Discipline = Actual Expectation**
- System has probability advantage (theoretically has advantage)
- But needs execution discipline to let advantage play
- Only with complete execution can actual expectation approach theoretical expectation

**Relationship 3: Actual Expectation + Risk Control = Long-term Results**
- Even with actual expectation, also need risk control
- Risk control ensures you won't go bankrupt while gaining expectation
- Gives you enough number of trades, letting expectation work

**Relationship 4: Four Aspects Are Indispensable**
- No probability advantage: Long-term expectation negative, must lose
- No risk control: Even with positive expectation, might go bankrupt
- No execution discipline: Can't let probability advantage play, actual expectation < theoretical expectation
- No market opportunities: System can't exert, might continuously lose

## Common Misconceptions

When understanding trading profit sources, avoid these misconceptions.

### Misconception 1: Profits Come From Prediction Accuracy

**Misconception: Think trading profits mainly come from accuracy of predicting markets**

Reality:
- Prediction accuracy is part of probability advantage
- But not the whole thing
- Even with only 40% prediction accuracy, if profit-loss ratio high enough, can still profit
- Key is expectation, not just win rate

### Misconception 2: Profit Loss From Same Source Means No Need for Risk Control

**Misconception: Think profit loss from same source means accepting all losses, no need for risk control**

Reality:
- Profit loss from same source is under premise of having risk control
- Risk control ensures you won't go bankrupt while gaining expectation
- Profit loss from same source is accepting losses from system stops, not accepting unlimited losses

### Misconception 3: With Good System, No Need for Execution Discipline

**Misconception: Think with good trading system, can execute arbitrarily**

Reality:
- Even the best system, without complete execution can't profit
- Selective execution destroys system's statistical advantage
- Execution discipline is key to letting probability advantage play

### Misconception 4: More Trading Is Better

**Misconception: Think more trades, more profits**

Reality:
- Only with premise of having probability advantage, more trades mean more profits
- If system expectation is negative, more trades mean more losses
- Key is system's expectation, not number of trades

### Misconception 5: Profits Come From Luck

**Misconception: Think profits are just luck, no pattern to follow**

Reality:
- Single trade results indeed have luck component
- But long-term results determined by probability advantage
- If system has positive expectation, long-term must profit
- Luck affects single results, but doesn't affect long-term results

## Conclusion

Trading profits come from four aspects:

1. **Probability Advantage**: Core and foundation, system must have positive mathematical expectation
2. **Risk Control**: Ensure long-term survival, let expectation play
3. **Execution Discipline**: Ensure complete system execution, let probability advantage play
4. **Market Opportunities**: External conditions, system needs suitable environment to exert

These four aspects are interconnected, indispensable:
- Probability Advantage × Market Opportunities = Theoretical Expectation
- Theoretical Expectation × Execution Discipline = Actual Expectation
- Actual Expectation × Risk Control = Long-term Results

In quantitative trading, profit sources are clear and quantifiable:

- Use backtesting to verify system's probability advantage
- Use Kelly formula to calculate optimal position
- Use algorithms to ensure execution discipline
- Use market state filtering to identify best trading opportunities

Essence of trading profits is:
- Not accuracy of predicting markets
- But building system with positive expectation
- Letting expectation play through complete execution
- Ensuring long-term survival through risk control
- Applying system in suitable market environments

Understanding these profit sources, building complete trading framework, this is cornerstone of every trader's success.

---

**Further Reading:**
- How to Understand Profit and Loss from Same Source
- Methods of Building Trading Systems
- Core Principles of Risk Management
