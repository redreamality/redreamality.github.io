---
title: "The Model's Hourly Wage: Why Token Pricing Is Not Enough"
description: "Once models begin occupying human waiting time, token pricing no longer explains their real cost. A model's hourly wage brings price, latency, caching, and task productivity into one unit-economics framework."
date: 2026-08-19
tags: ["ai-pricing", "llm", "finops", "latency", "unit-economics"]
theme: "AI and labor"
lang: "en"
translatedFrom: "the-model-hourly-wage"
---

We have learned to compare models by the price of a million tokens.

Input costs this much, cached input that much, output something else. The figures run to several decimal places and the ranking looks satisfyingly precise. Yet this precision resembles the price per gram on a grocery shelf: it describes the unit accurately without telling you what it costs to get fed.

Token pricing may be enough when a model is merely a text-completion API. It becomes less complete when a model reads a repository, calls tools, waits on networks, edits files, runs tests, and returns with a finished piece of work fifteen minutes later. Tokens then look more like raw material. What the user experiences is time occupied, work completed, and attention held in reserve while the model works.

That leads to a slightly provocative question:

> If a model is becoming a factor of cognitive production, what is its hourly wage?

## One Price List, Three Ledgers

An hourly wage cannot be seen in a vendor price list alone. Prices have to be placed back inside real requests.

One anonymized production snapshot contained roughly 1.68 million consumption records with model, route, input and output tokens, time to first token, and total request duration. After selecting streaming requests with usable timing data, about 880,000 observations could support time analysis. The resulting view covered 38 models and 114 model-route combinations, unfolding the same traffic into three ledgers:

- **Average tokens** describes how much context a request moved, how much cached context it reused, and how much it generated.
- **Cost per request** describes the bill for one call under a given price schedule.
- **Implied hourly rate** describes the density of that cost over the time the request occupied.

None is more real than the others. Tokens measure workload, cost per request measures the bill, and the hourly rate measures cost density.

The distinction becomes visible when the same model runs through different routes. In the snapshot, two major routes for DeepSeek V4 Flash looked like this:

| Metric | Route A | Route B |
| --- | ---: | ---: |
| Average uncached input | about 12.3K tokens | about 2.2K tokens |
| Average output | about 781 tokens | about 628 tokens |
| Implied input rate | about $0.57/h | about $1.02/h |
| Implied output rate | about $0.080/h | about $0.089/h |
| Implied total rate | about $0.371/h | about $0.282/h |

Route A handled much heavier inputs and therefore cost more per request. Its stage-specific input and output rates were nevertheless lower because those costs were spread over more time. Its total hourly rate was higher again because total rate places every cost component, including cached input, back over total duration. Workload composition became decisive.

This is not a statistical contradiction. It is the first important property of the concept: a model's hourly wage is not one isolated scalar. It is a family of measures for input processing, output generation, context reuse, and overall throughput.

## Defining an Implied Hourly Rate

Models do not receive paychecks. The “wage” here is a derived quantity: take a class of token cost, divide it by the time associated with that class, and annualize nothing, merely scale it to one hour.

For streaming text requests, a useful operational allocation is:

```text
input-stage time = time to first token
output-stage time = total duration - time to first token

implied input rate = total uncached-input cost / total input-stage time x 3,600
implied output rate = total output cost / total output-stage time x 3,600
implied total rate = total input, cache, and output cost / total duration x 3,600
```

The ratios use aggregate cost divided by aggregate time. Averaging a separate hourly rate for every request would allow extremely short requests, whose denominators approach zero, to dominate the result.

The three rates should remain distinct:

- Input rate measures the density of uncached-input cost before the first token appears.
- Output rate measures output cost during sustained generation.
- Total rate includes cached input and is the broader price of occupying the request interval.

“Implied” matters. Time to first token is not a physical measurement of input computation alone. It may contain queuing, routing, network delay, prefix-cache lookup, and upstream scheduling. Assigning it to the input stage is an operational allocation, not a claim about what happened inside the model.

The rate is therefore not an intrinsic constant hidden inside an API. It is always conditional:

```text
model hourly rate = f(model, route, workload, cache policy,
                      latency, price version, measurement window)
```

Quoting a model's hourly wage without those conditions is like quoting a person's wage without location, occupation, seniority, or working arrangement. The number survives; most of its meaning does not.

## Time Is in the Denominator

> At equal cost, a slower model has a lower implied hourly rate, not a higher one.

When an hourly rate is inferred from an existing token bill, more elapsed time dilutes the price per hour. A route can therefore be all three of the following:

- more expensive per request because it handles more context or output;
- cheaper per model-hour because it takes longer to process that work;
- worse for the user because the first useful response arrives later.

These statements describe different things: the request bill, machine throughput, and human waiting time.

This produces an important inversion. As a model gets slower, its implied hourly wage may fall while the human cost of waiting rises. A low hourly rate may mean cheap capacity, or merely slow capacity. The former is attractive for an overnight batch job. The latter can return every dollar saved on the API bill as a more expensive block of engineering time.

Hourly rates therefore need a service-level context. The same `$1/h` can be competitive in a queueable batch workload and prohibitively expensive in an interactive debugging loop. The machine price is unchanged; the opportunity cost of time is not.

## Token Prices Answer a Producer's Question

Tokens are an excellent billing unit. They are countable, auditable, related to computation, and convenient for placing requests of different lengths on one price schedule.

But they mainly answer a producer's question: how much metered resource did this inference consume, and what should I charge for it?

Users usually face another set of questions:

- How soon will I receive the first useful feedback?
- How many productive iterations fit into an hour?
- How many attempts are required for an acceptable result?
- How much human time goes into waiting, review, and rework?
- Did context reuse reduce cost, or merely rearrange the bill?

This is the same move cloud economics made from “price per core-second” toward “infrastructure cost per order.” The first is resource metering. The second begins unit economics.

The hourly wage translates machine-native tokens into time, a unit organizations already use to reason about scarce attention. Tokens are difficult to add directly to an engineer's waiting cost. Hours are not.

## A Model-Hour Is Not a Wall-Clock Hour

Once time becomes a pricing unit, parallelism becomes easier to express.

Ten agents working for six minutes each consume one model-hour. If they start together, the human waits only six minutes. Model-hours are additive resource consumption; wall-clock time is the delivery time a person experiences.

This separation is one of the largest differences between agent economics and ordinary labor economics. A human work-hour cannot usually be replicated without loss. Model-hours can be purchased concurrently and concentrated into a shorter calendar interval.

The decision is no longer only which model is cheaper. It becomes how many parallel model-hours an organization is willing to buy to remove a given amount of waiting:

- Serial work uses less concurrent capacity but delivers later.
- Parallel exploration may reread context and spend more tokens while shortening human delay.
- When a task contains independently verifiable branches, more model-hours can reduce wall-clock time and human opportunity cost.
- When every step depends on one reasoning chain, naive parallelism increases cost without proportional acceleration.

A token bill shows how much extra raw material parallelism consumed. An hourly rate begins to show how much time those extra resources purchased back.

## Cache as Context Capital

In agent workloads, cache is more than a discount line under input. It resembles context capital: a repository, document set, instruction hierarchy, or conversation state that was already read and organized can support later work repeatedly.

Ordinary input is current consumption. Cache carries past computation into the present. The more accepted tasks the same context supports, the more thinly its setup cost is amortized. It resembles equipment in a factory or a maintained internal knowledge base: cost comes first, value emerges through reuse.

Cache has a price, but it may not correspond to a separately observable interval in request telemetry. A cleaner treatment is therefore:

- Input rate pairs uncached-input cost with time to first token.
- Output rate pairs output cost with sustained generation time.
- Cache cost enters total cost and total hourly rate without being forced into either stage.

This is why total rate can move differently from the two stage-specific rates. It is not their simple average. It combines context reuse, workload composition, and total duration.

That suggests a more consequential operating metric: how many accepted tasks does one unit of context capital support during its useful life? For long-running agents, this may matter more than the price of one cached token.

## The Comparison Has Boundaries

An hourly rate is meaningful only when cost and time can be assigned to the same unit of work. Text models usually price input, cached input, and output tokens, which can be related to first-token and generation intervals. Image, audio, and video models may instead charge per image, resolution, audio second, generated second, or modality-specific token.

If telemetry contains only generic text-token fields, those models should not be forced into the same hourly ranking. Usage can still be shown, but invented costs and wages should not.

This boundary does not weaken the metric. It clarifies its purpose: not to compress every model into one number, but to create a shared scale where billing units, time stages, and work outputs are genuinely comparable.

## An Hourly Wage Is Not Value

The phrase naturally invites comparisons between models and human salaries. That analogy is illuminating and dangerous.

An hourly wage describes price density, not what the hour produced. A model can generate useless material very quickly at a high implied wage. Another can charge more per request and solve an expensive problem on the first attempt. In labor markets, wage and value are related but never identical. The same is true here.

If accepted tasks are the output, hourly rate still has to be divided by productivity:

```text
model cost per accepted task
    = implied model hourly rate / accepted tasks per model-hour
```

“Accepted” is the expensive word. Producing an answer is not the same as completing work. Code must pass tests, analysis must survive review, and an operation must leave the system in its intended state. Without acceptance, productivity is merely output speed.

A fuller task cost begins to look like this:

```text
effective task cost
    = API cost
    + human waiting cost
    + review cost
    + failure probability x rework cost
```

Quality, opportunity cost, and the value of earlier completion come next.

This reveals a counterintuitive possibility: a model with a higher token price and a higher hourly rate can still have a lower final task cost when its first-pass success rate is high enough. A very cheap model that requires repeated prompts, long waits, and heavy review merely moves the bill from the API provider to the humans using it.

Model economics therefore has at least three layers:

| Layer | Typical measures | Question answered |
| --- | --- | --- |
| Metering | Price per million tokens | How much raw material was consumed? |
| Resources | Implied hourly rate, latency, throughput | How much machine and human time was occupied? |
| Value | Cost per accepted task, success and rework rates | What result did we actually buy? |

Token pricing is not obsolete. It simply stops at the first layer.

## When Models Enter Labor Time

Traditional software rarely presents itself as a duration of work. A compiler taking ten minutes does not usually feel as though it has “worked for ten minutes.” A search engine does not operate in the background for half an hour and return with a completed report.

Agents change that perception. They have starts and finishes, waits, retries, parallel branches, supervision, and deliverables. They increasingly occupy a window of time like an actor, rather than returning like an instantaneous function.

When a technology enters the temporal structure of labor, people eventually reach for the language of labor to understand it. The model's hourly wage is an early translation.

It is imperfect. It depends on telemetry, does not express quality by itself, and can push the “model as person” metaphor too far. But it forces us to leave the supplier's chosen unit and ask what the organization is actually giving up and gaining: time, attention, iteration speed, and completed work.

The most important model price may eventually be neither dollars per million tokens nor dollars per hour. It may be the cost of one accepted task at a specified quality, supervision level, and deadline.

Before we can price that, however, we need the intermediate question.

Models do not collect salaries. But once they begin occupying time like colleagues, they acquire something that looks remarkably like an hourly wage.
