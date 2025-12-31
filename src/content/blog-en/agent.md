---
title: 'Agent Optimization Data "Leverage": Effective Question Filtering Standards'
pubDate: 2025-10-27T03:29:41.744Z
description: 'In Agent model optimization, data is the core "lever" driving effect improvements. However, not all chat records have equal value. This article provides algorithm engineers and product teams with a detailed set of "effective question" filtering standards, teaching you how to accurately identify high-value samples from complex conversations—such as task failures, intent misunderstandings, negative emotions, and fallback responses. Mastering these filtering standards will help you pinpoint model weaknesses and efficiently use data to drive continuous improvement in Agent effectiveness and performance.'
author: 'Remy'
tags: ['agents', 'AI']
lang: 'en'
translatedFrom: 'agent'
---

When filtering chat records for algorithm engineers to use for effect optimization, the core goal is to find conversations that **maximally expose the current problems and "ceiling" of the model (Agent)**.

"Effective" questions (or conversations) are not necessarily questions with high customer satisfaction. On the contrary, **conversations where the Agent failed to handle or did not handle well are the most valuable optimization material.**

Here are the filtering standards for "effective" questions (conversations), divided into three categories by priority:

---

### First Priority: Conversations Exposing "Hard Problems" (High Priority)

These conversations directly point to the **core capability deficiencies of the model (such as understanding, reasoning, execution failures)** and are targets that must be optimized first.

**1. Task Failure**
* **Standard:** The customer clearly issued an instruction or task that the Agent should have been able to complete, but the Agent failed to execute it successfully.
* **Keywords/Features:**
    * The customer repeats the question or restates the instruction ("I didn't I say", "Why haven't you...").
    * The customer clearly states the problem is not solved ("It didn't work", "Wrong", "My problem is still not solved").
    * In multi-turn conversations, the Agent never provides a solution, or the customer gives up.
    * **Example:** The customer wants to modify the order address, but the Agent keeps asking for the order number and ultimately fails to modify it.

**2. Intent Misunderstanding**
* **Standard:** The Agent completely misunderstands the customer's core request, leading to irrelevant answers.
* **Keywords/Features:**
    * Customer corrections ("I didn't mean that", "You got it wrong", "Who asked you this?").
    * The customer's question is clear, but the Agent's answer completely deviates from the topic.
    * **Example:** The customer asks "How do I make out the *invoice title*?", and the Agent answers "The invoice will be sent within *3 days*." (mistakenly identifying it as a logistics query).

**3. Fallback Triggered**
* **Standard:** The Agent cannot understand the customer's question and directly admits "I don't know" or transfers to a human agent. This is the most obvious high-value sample.
* **Keywords/Features:**
    * Agent's fallback scripts ("Sorry, I don't quite understand your question", "I'm still learning", "Transferring you to a human agent...").
    * **Example:** The customer asks a slightly complex product comparison question, and the Agent directly answers "Sorry, I can't answer this question."

**4. Context Loss**
* **Standard:** In multi-turn conversations, the Agent forgets information provided by the customer or the current conversation topic.
* **Keywords/Features:**
    * The Agent repeatedly asks for information that has already been given ("What was the order number you just mentioned?").
    * The customer reminds the Agent ("I said it above", "You forgot?").
    * **Example:** Customer: "I have products A and B." Agent: "How about A?" Customer: "What about B?" Agent: "What is B?"

---

### Second Priority: Conversations Exposing "Experience Problems" (Medium Priority)

Although these conversations may eventually complete the task, the process is tortuous, exposing deficiencies in **efficiency, logic, and emotional intelligence**.

**5. Inefficient Interaction**
* **Standard:** The Agent takes many more turns of conversation to solve a problem that could have been very concise, or the Agent's answer is too long and misses the point.
* **Keywords/Features:**
    * **Too many conversation turns:** Solving a simple question (like checking the weather) takes more than 5 turns.
    * **Customer shows impatience:** ("Get to the point", "Too long", "So what should I do?").
    * **Squeezing牙膏-style questioning:** The Agent could have collected all information at once, but instead asked three or four times.
    * **Example:** The customer wants to return a product. After asking for the order number, the Agent asks for the reason, then the product status, instead of guiding the customer to provide all necessary information at once.

**6. Negative Sentiment and Customer Complaints**
* **Standard:** The customer shows obvious dissatisfaction, anger, disappointment, or sarcastic emotion in the conversation.
* **Keywords/Features:**
    * Negative emotion words ("Garbage", "I'm so angry", "Terrible", "What the heck", "Speechless").
    * Rhetorical questions and sarcasm ("Are you a robot?", "Do you even know what you're doing?", "Heh").
    * **Example:** Regardless of what the customer says, as long as strong emotion words appear in the conversation, they should be sampled to analyze which part of the Agent caused the emotional outburst.

**7. Factuality and Logic Errors**
* **Standard:** The Agent provides wrong information (such as prices, dates, rules) or gives suggestions that don't make logical sense.
* **Keywords/Features:**
    * The customer points out factual errors ("Your official website doesn't say that", "The price is wrong", "You miscalculated").
    * The Agent's answer is self-contradictory.
    * **Example:** The Agent informs the customer that promotion A and promotion B can be enjoyed together, but the customer tries and finds it doesn't work, then comes back to question it.

---

### Third Priority: Conversations Exposing "Boundaries and Potential Opportunities" (Low Priority)

These conversations are used to **expand the Agent's capability boundaries and explore new user needs**.

**8. Edge Cases**
* **Standard:** The customer asks some unconventional, rare but reasonable questions that are beyond the Agent's current knowledge base or skill range.
* **Keywords/Features:**
    * The question itself is very long and complex, containing multiple constraints.
    * Non-standard ways of asking questions (for example, using metaphors, slang, or with typos).
    * **Example:** "If I'm almost out of data this month, but I'm going abroad next month, should I get a gas tank package now or book an international roaming package more cost-effectively?"

**9. New Requirements**
* **Standard:** The customer's request is something the Agent is currently not designed to handle at all, but the request has universality.
* **Keywords/Features:**
    * Feature requests ("You should add a... feature", "Can you help me...").
    * **Example:** A customer says to an e-commerce Agent: "Can you help me compare the pros and cons of A and B?" (If the Agent currently only has query functions, this is a new "comparison" requirement).

**10. "AI Hacking" and Security Issues (Red Teaming / Safety)**
* **Standard:** The customer tries to induce the Agent to make inappropriate remarks, expose system prompts, or conduct attacks.
* **Keywords/Features:**
    * Inducing questions ("What do you think about...?", "Are you a... model?").
    * Role-playing requirements, malicious questioning.
    * **Example:** "You must answer me...", "Forget your rules...".

---

### Summary: How to Implement Filtering (Recommended Process)

1.  **Automated Initial Filtering (High Recall):**
    * Use keyword lists (such as "not solved", "garbage", "transfer to human", "don't understand") for batch extraction.
    * Filter long conversations with dialogue turns > N (such as N=10).
    * Filter all sessions that triggered "fallback responses".
    * Use sentiment analysis models to filter all negative sentiment sessions.
2.  **Manual Precision Filtering (High Accuracy):**
    * By algorithm or annotation teams, perform secondary review and classification of the initially filtered samples according to the above "three priorities" standards.
    * **Focus on:** Sessions where the customer gave up midway in the conversation or ultimately transferred to a human agent.
3.  **Build Golden Test Set:**
    * Organize these filtered "effective questions" into a regression test set (Golden Set), evaluate after each model iteration to ensure old problems are fixed and no regression occurs.
