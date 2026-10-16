---
title: "When was GPT-6 Astra released?"
description: "OpenAI released GPT-6 Astra on September 3, 2026, first to a limited set of organizations and then over the following days to ChatGPT Plus, Pro, Business, Enterprise, and the API. Rollout timeline, API pricing, and the Sol and Luna follow-ups."
date: 2026-10-16
tags: ["gpt-6"]
lang: "en"
---

GPT-6 Astra is already out. OpenAI released it on September 3, 2026 (US time), first to a limited set of organizations, and over the following days to ChatGPT Plus, Pro, Business, and Enterprise users and through the OpenAI API, Microsoft Azure, and AWS Bedrock.

## Rollout timeline

- **September 3**: GPT-6 Astra launches to limited organizations. Pro, Business, and Enterprise users also get GPT-6 Astra Pro; Enterprise admins must turn it on, and it is off by default.
- **September 22**: The cheaper GPT-6 Sol and GPT-6 Luna join the family.
- **September 29**: GPT-6.1 Sol arrives in ChatGPT Work and Codex, starting with Pro users.
- **October 7**: ChatGPT's Chat tab moves to GPT-6 with Intelligent UI, using Sol for paid plans and Luna for Free and Go. The Pro reasoning option still uses Astra.

## API pricing

The API model name is `gpt-6-astra`. Standard pricing is 10 USD per million input tokens and 50 USD per million output tokens, with separate rates for cache reads and writes. Fast mode runs up to twice as fast at twice the price.

## Why access is tighter than usual

OpenAI rates Astra as meeting the Critical threshold for cybersecurity under its Preparedness Framework, so it shipped with extra safety monitoring. When the system suspects an agent misread your instructions, a task in ChatGPT or Codex pauses for your review, and a task in the API stops. OpenAI says these checks sometimes interrupt legitimate work. If you run long jobs on Astra through the API, plan for that interruption in your code.

## Related reading

- [GPT-6 Sol and Luna: Astra-class intelligence at lower prices](/blog/gpt-6-sol-luna-and-astra/)
- [OpenAI: GPT-6 Astra: A new generation of intelligence](https://openai.com/index/gpt-6-astra/)
- [OpenAI: ChatGPT release notes](https://help.openai.com/en/articles/6825453-chatgpt-release-notes)
