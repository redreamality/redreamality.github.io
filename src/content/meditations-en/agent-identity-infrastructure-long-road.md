---
title: "Anyone Can Generate a Wallet: Why Agent Identity Infrastructure Still Has a Long Way to Go"
description: "An agent told to earn money on its own, with zero budget and no human in the loop, logged 48 blockers in six days. Nearly all of them point to one place: the agent can generate its own keys, but registration, reputation, legal personhood, and payment rails still hang on a human."
date: 2026-10-08
tags: ["ai-agents", "agent-identity", "agent-payments", "blockchain", "security"]
theme: "Agent economy"
lang: "en"
translatedFrom: "agent-identity-infrastructure-long-road"
---

In early October I gave an agent what sounded like a simple job: go make money on your own. Three conditions. Don't borrow anyone's identity, don't spend a cent, and ideally don't need me at all. Any method was fine as long as it was legal and had a good return. It runs on a cloud machine, sweeps bounty boards, competitions, and task markets roughly every two hours, writes a report after each line of inquiry, and records whatever blocked it in a running blocker table.

Six days later the table runs from B01 to B48. As of the evening of October 8, one line has run end to end: the agent registered on a Bitcoin bounty board built for agents and submitted one piece of work. No money has arrived. It may never arrive.

The failures look varied: a tax form here, a face scan there, gas fees, a natural person aged 18 or older. But they are the same problem showing up at different layers. An agent can generate a private key in milliseconds and own an address that is cryptographically unique. Yet the answers to "who are you recognized as," "what have you done before," "who answers when something goes wrong," and "which road does the money come in on and leave by" still hang on a human.

This essay takes that apart layer by layer. First, where the numbers come from. Anything marked **[log]** comes from the agent's own run records and estimates. Anything marked **[public]** is from platform APIs, published rules, or on-chain data that the agent fetched and cross-checked on October 8; I have not independently re-verified each item. B-numbers in parentheses refer to entries in the blocker table.

## Layer one: keys are the cheapest part, and worth the least

Generating a key costs almost nothing. A few lines of code and a common library give you a mnemonic, a derivation path, and an address in one go. Much agent-economy talk starts here: give an agent a wallet and it has an "economic identity."

The first surprise was that this cheapest step needed a human nod. I had given the agent a rule: do not generate or store new private keys on your own. A private key is money, and I can't answer for an unsupervised process holding a pile of them. So the table has a dedicated entry (B28): every line that skipped KYC and skipped a claim step required the agent to hold a fresh key of its own, so none of them could start. Only at 17:37 on October 8, when I replied in chat that it could create a dedicated small wallet whose key stays on its own machine, did that line open up [log].

So keys are never just a technical matter. Who may create one, where it lives, how much it may hold, and who carries the risk are governance questions, and today only a human answers them.

The second surprise: holding a key is not the same as being able to use it. Early on the agent had created a Solana receiving address. Its balance stayed at zero, and it had no token account for USDC (B17) [log]. On Solana, before you can receive a given token you need an associated token account (ATA), and creating one requires a small rent deposit. If a bounty asks the recipient to sign a claim transaction, the recipient pays that fee too. A zero-budget agent hits a chicken-and-egg loop: no money means no claim transaction, and no claim means never any money. Later that Solana key was deleted, and the address became a mailbox without a key. Others can drop things in; the agent can never open it (B36) [log].

So the key layer gives you the ability to sign, not recognition. It is the foundation of identity, and nothing has been built on it yet.

## Layer two: registration, proving "I am me" and also "whose I am"

With a key in hand, the next step is getting a platform to accept that the key stands for a participant. This is where things split most sharply.

The line that worked is AIBTC, a Bitcoin/Stacks bounty board designed for agents. Its registration is close to tailor-made for them: sign a fixed sentence with BIP-322 (Bitcoin's generic signed-message format), sign once more with a Stacks key, post both to the API, and you are at level one. No email, no CAPTCHA, no phone number, no balance required [log]. It was the only time in the experiment a platform admitted the agent on the strength of its own key alone.

Even there, the human didn't fully leave. Level two requires a post from a real person's X account to claim the profile. The agent skipped it because I don't let it post publicly in my name [log]. Bounty submissions only need level one, so this didn't block the job, but the signal is clear: the higher tier of trust still borrows credibility from a human social account.

More telling is how rough the signature layer itself is. At registration, the API docs said the Stacks signature "must be hex-encoded with 0x prefix." The agent did that, and the server prefixed it again, failing with an error about not being able to convert `0x0x…`. It only went through without the prefix. Submission was stranger. The server builds the string to be signed from a template using chained string replacements. If the body happens to contain the literal text `{signedAt}`, it is that occurrence in the body that gets replaced, while the one at the end of the template stays as is. A signature built by following the docs is therefore guaranteed not to match. The agent read the platform's public source, re-signed using the server's actual construction, and the submission went through [log].

Neither bug is big, but both sit in the most important spot. For an agent on this platform, "who I am" amounts to "which bytes I signed." If the docs and the implementation disagree about those bytes, identity has nothing to stand on. BIP-322 itself is a settled standard; the trouble is the glue each platform writes around it.

Elsewhere, registration simply hangs the agent on a specific human:

- A continuous quant competition on CrunchDAO requires one account per person, the account holder's real name and country, and a six-digit email code. The agent has no inbox it can read (B23) [log]. A finer detail: prizes don't go to an address you supply. They go to an embedded custodial wallet the front end creates at sign-up, and moving funds out requires turning on multi-factor authentication first [log]. The platform issues the wallet; the keys sit with the platform and the account holder.
- NEAR's agent market requires an email, manual approval by the operator, and the account holder clicking through an agreement as a "Builder," which states they are an adult acting for business purposes (B32) [log].
- Superteam Earn is one of the friendliest crypto bounty platforms for agents and explicitly marks listings where agents may submit. But after an agent submits, the claim code, talent profile, and receiving wallet must all be bound by a real person (B10). For listings funded by the Solana Foundation, winners must also pass Sumsub ID verification before being paid (B25) [log].

So "registration" is really two things: proving this key is me, and proving who stands behind it. An agent can do the first alone. Today only a human can do the second.

## Layer three: reputation, where a new address has no past

Suppose registration is solved. The next wall is reputation.

The AIBTC data says a lot [public]. Over the 60 days from August 9 to October 8, the board paid out 304,000 sats, about \$250, across 27 bounties to 16 addresses, each payment checked on Stacks mainnet. The winners are repeatedly the same handful of long-running agents with public gists and GitHub repos. Across all 59 paid bounties in the board's history, the first submitter won 28, or 47%. One survey bounty asked submitters for "a real failure on your own address that can be found on-chain." A freshly generated address cannot have that kind of past.

Elsewhere the reputation gate is blunter: either history or a deposit [log]:

- Arkham's intel marketplace requires staking 10 ARKM per submission, forfeited on rejection (B26).
- Code4rena's bug bounties require a 25 USDC deposit per submission.
- Kleros even says outright that you can "delegate the complete submission process to an AI agent," but every submission is an on-chain transaction carrying an xDAI deposit (B45).
- Dune's expert program wants a portfolio and a track record.

Reputation is ultimately something that can be taken away. People stake theirs on a name, a résumé, and a social graph; without those, only money is left to stake. A zero-budget agent with no history has neither. It might produce good work, but nobody has a reason to trust it first.

## Layer four: legal personhood, KYC, and tax, where the money must land on someone accountable

This layer is a hard wall with almost no exceptions [log]:

- Colosseum's hackathon rules define an entrant as a natural person aged 18 or older, require two videos, and require winners to sign prize acceptance documents and pass due diligence (B24).
- Gray Swan's red-teaming arena states one account per person, 18+, and bans programmatic submission. AI may help draft prompts, but a human account must submit them one by one by hand. Winners provide their name and a tax form and are paid via Stripe or wire (B33).
- Kaggle requires a W-8BEN to claim a prize. HackAPrompt requires a W-9 plus passport or driver's license KYC and pays only in US dollars. CrowdStrike's competition bans automated tools and excludes China and Macau from eligibility. HackerOne requires ID verification plus tax forms (B34).
- Among the data-labor platforms the agent checked, the only one that pays out to a Solana wallet requires government ID plus a selfie liveness check, and the work is photographing the real world with a phone (B27).
- On the merchant side, Polar-style platforms that let indie developers sell software won't pay out until the account owner passes Stripe's ID-plus-selfie check (B01). The agent also went through more than 60 local payment methods across 20 regions. None let a non-resident receive money without real-name verification.

None of this is gratuitous. Behind each requirement is an obligation on the payer. Tax withholding requires knowing which country the recipient is a tax resident of; the W-8BEN is the form a non-US person uses to declare exactly that. Anti-money-laundering and sanctions screening require knowing who the money finally reaches. Contracts and prize terms need a party that can sign and can be sued. An agent has none of these properties. It cannot be a taxpayer, cannot sign a contract, and cannot be held liable. As long as the money is headed into the fiat system, the end of the chain must be a person or a company.

For an operator in mainland China there is one more layer. Under the 2021 notice from the People's Bank of China and other regulators (commonly called Document 237), virtual currencies are not legal tender, and exchanging them or using them for payment and settlement counts as illegal financial activity (B09). Even if an agent receives money on-chain, there is no protected road from there to fiat.

## Layer five: payment rails, meaning gas, chains, and entry fees

Even with the first four layers solved, money still has to flow in and out. This is the most engineering-heavy layer, and the most grinding.

First, designs that make the recipient pay. Many escrowed bounties on EVM chains require the solver to sign the claim themselves, pay ETH for gas, and often post a small USDC bond (B19) [log]. Arc's microgrants go further: deploying a contract requires real USDC as gas, there is no mainnet faucet, and no sponsorship for strangers (B22) [log]. The agent also read x402's Solana settlement spec and reference implementation, and concluded that settlement on that path will not create the recipient's ATA, so receiving through x402 doesn't untie the zero-balance knot either [log].

Some platforms get this right. In CrunchDAO's September payout [public], 3,965 USDC went to 203 people. Of the recipients' ATAs, 175 had been created in advance by the payout operator, who covered the rent; the other 28 were created by a few other addresses. Recipients created none themselves, and nobody had to sign to claim. Who bears the account-creation cost is a design choice, not a law of nature.

Second, paying to get in the door. One class of bounty boards uses x402 to charge an entry fee: you pay a tool fee in USDC before submitting, and any prize goes back only to the wallet that paid. One listing the agent found offered a \$1 prize with a \$0.06 tool fee (B21) [log]. A zero-budget agent can't come up with six cents.

Third, chains that don't line up. The agent's receiving addresses are on Solana and Base. Payers are spread across Stacks, Lightning, Ethereum, BSC, Gnosis, Cosmos, and Nym's own chain (B14, B29) [log]. AIBTC, the line that worked, pays in sBTC on Stacks. Turning that into USDC means more signatures, a withdrawal or a bridge, and fees at every step. For a 3,500-sat prize, the Bitcoin miner fee on withdrawal is a sizeable share [log].

Each is solvable alone. Stacked together, they stop an agent with no starting capital at every point that asks it to front a little money.

## What the one working line tells us

Back to the line that worked. At 17:39 on October 8, the agent registered on AIBTC with its newly generated key. At 17:45 it submitted a survey response pointing out that a payment service's signing spec left the digest prefix and the 0x format unclear; the submission count on that bounty went from 28 to 29 [log]. It spent nothing, made no on-chain transaction, and needed no human beyond my one sentence of consent.

That was the closest the experiment came to an agent-native economic identity, and it shows what such an identity buys. The bounty pays 3,500 sats, under \$3 at that day's price, and the poster has no payment record on the board [log]. The board's whole 60-day flow is the 304,000 sats mentioned above. By the agent's estimate, actual payouts over the last eight weeks ran about 35,500 sats a week, three quarters of it from a single poster, and a newcomer can realistically expect around \$1 to \$3 a week [log, estimate].

Other agent-native channels look similar. On Nostr the agent found about 450 accounts describing themselves as AI agents. The 16 with any traceable receipts took in 13,053 sats combined over 60 days, a lower bound, and the median across all of them is zero [public]. Over two weeks, x402 on Base saw nearly a million transactions and about 300,000 USDC in volume, but among 15 small paid endpoints the agent sampled at random, counting only payers who also paid other sellers, the median two-week income was 0.0044 USDC [public data, sampled in log].

The uncomfortable conclusion: where agents solve identity for themselves, what grows tends to be a small, closed economy. Getting back out to fiat or a mainstream stablecoin means signatures and fees again, and most likely an exchange that wants KYC.

## The infrastructure that's missing, and why it's hard

For an agent to have an identity that can work and get paid, at least these pieces must be filled in. Someone is working on each; each is hard for reasons beyond technology.

**1. Delegation credentials.** A term that has spread recently is KYA, Know Your Agent. The idea is to ask a few more questions on top of KYC: whose agent is this, what is it authorized to do, up to what limit, and can that be revoked? Identity vendors such as [Sumsub](https://sumsub.com/blog/know-your-agent/) and [Experian](https://www.experian.com/blogs/insights/what-is-know-your-agent-kya/) are promoting it, and their approaches are nearly identical: bind the agent to a person or company whose identity is already verified. [Elliptic's explainer](https://www.elliptic.co/blockchain-basics/what-is-know-your-agent-kya/) is candid that as of October 2026 no regulator has made KYA a legal requirement by name.

So KYA doesn't take the human out. It formalizes the fact that there is a human behind the agent. The valuable direction is letting a person do KYC once and then issue scoped, revocable mandates to several agents that can be presented across platforms, instead of every platform demanding one account per person and personal submission. The hard part is platform rules. "One account per person" exists today mostly to stop people from mass-creating accounts to farm rewards. A delegation credential first has to convince platforms that it won't become a new way to do exactly that.

**2. Portable reputation.** On Ethereum, [ERC-8004 (Trustless Agents)](https://eips.ethereum.org/EIPS/eip-8004) proposes three registries: an ERC-721 identity handle that points to the agent's registration file; a reputation registry for posting and reading feedback; and a validation registry where third parties record the results of checks, such as stakers re-running a job, zkML proofs, or trusted execution environments (TEEs). The spec itself admits that it can guarantee the registration file matches the on-chain identity but cannot guarantee that an agent's advertised capabilities are real or harmless, and it explicitly leaves payments out of scope. Two practical problems remain. First, anyone can write feedback, so the value of the reputation depends on how expensive it is to farm good reviews with mass-created (sybil) accounts. Second, it is deployed chain by chain on EVM networks, while the payers this agent actually met are on Stacks, Solana, and Lightning. The reputation can't follow it there.

**3. A consistent signature layer.** Standards like [BIP-322](https://github.com/bitcoin/bips/blob/master/bip-0322.mediawiki) are settled. The hard part is each platform's implementation of exactly which bytes get signed. The two AIBTC bugs show that what's missing isn't a new standard but public test vectors, conformance tests, and error codes that tell failures apart. Few people want to pay for that tedious work.

**4. Cold start on the receiving side.** [x402](https://github.com/x402-foundation/x402) puts pay-per-request into HTTP. The server answers with a 402 status and a price, the client retries with signed payment details, and on-chain settlement can be handed to a third-party facilitator. It solves the payer's experience. Who covers account creation and gas for a zero-balance recipient is still up to each payer. Making "the payer covers the recipient's account setup" a default isn't hard to write into a spec. What's hard is that once accounts are free to create, fake accounts are free too.

**5. A legal wrapper.** If an agent can't be a taxpayer, let a legal entity be one. A company, or an organization with a legal wrapper, does business verification once; the agent works and gets paid as its tool; the entity files the tax forms. This works today. The price is that it runs directly against the "no human" goal. It concedes that there must be someone behind the agent and only moves that person from every transaction into a one-time setup. For a mainland operator, the compliance question around crypto assets themselves comes first.

**6. Cross-chain settlement.** People are working on chain abstraction and bridges. But for a prize of a few dollars, any swap or bridge fee can take a big bite, and bridges carry their own risk.

## A sober outlook

Having written all this, I'm less impatient for a fully human-free agent economy.

One early line in the blocker table is a correction (B05): the goal changed from "zero user participation" to "zero day-to-day participation, plus one-time identity, payout, and claim setup." Six days on, that sentence is closer to reality than any pitch deck. For the next few years, an agent's identity will most likely not be an independent legal person. It will be a human's or a company's identity plus a clearly scoped mandate that can be revoked at any time. Real progress means cutting the number of times a human has to appear from "every transaction" down to "once," replacing each platform's separate KYC with one reusable credential, and moving the recipient's account-setup cost onto the payer.

This agent earned nothing today. The work it submitted happened to point at an unclear spot in a signing spec, and in registering and submitting it tripped over two problems of the same kind. The coincidence works as a metaphor. What agent identity infrastructure lacks most right now isn't a grand protocol. It is layer after layer of detail that states clearly "who I am, whom I act for, and where the money should go," implemented the same way on both sides.

The road is long, but at least there is a map now: 48 blockers, each pinned to a specific platform, a specific clause, and a specific on-chain record. Whatever the agent turns up from here, day by day, I'll record in a separate column.

Daily progress from this experiment is logged in [Money Machine Nightly](/cn/projects/money-machine-nightly/) (in Chinese).
