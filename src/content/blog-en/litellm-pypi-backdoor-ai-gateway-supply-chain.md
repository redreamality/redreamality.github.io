---
title: "After the LiteLLM 1.107.0 backdoor: why model gateways became the richest target in the AI toolchain"
description: "LiteLLM 1.107.0 shipped a credential stealer and backdoor through PyPI and Docker on October 21, the same day Railway told users to rotate every stored key. Read next to Ultralytics, postmark-mcp, ClawHub skills, and backdoored local models: why gateways pile up credentials, six checkpoints that stop the chain, and a checklist if you installed the bad version."
pubDate: 2026-10-22T11:49:00+08:00
author: "Remy"
tags: ["security", "developer-tools", "python", "llm", "ai-agents"]
lang: "en"
---

At 11:39 UTC on October 21, `litellm==1.107.0` appeared on PyPI. All seven wheels put three extra files into `site-packages`: a credential stealer and a backdoor that fetches and runs code every hour. Nobody had to `import litellm`. Any Python process starting on the machine set them off.[1] PyPI pulled the release within two hours. The official Docker tags such as `latest` pointed at the poisoned image for close to another hour.[2]

Later that day, the hosting platform Railway disclosed that someone had accessed its store of customer environment variables and decrypted some of them. Railway called it part of "a series of attacks recently targeting platform companies with the aim of compromising AI inference providers" and told every user to rotate everything stored there.[9][11]

Different doors, nearly the same loot: model API keys, cloud credentials, database passwords. My argument is that model gateways and SDKs have become where credentials concentrate in the AI toolchain. Attackers who target them have done the math. Defenders need to stop the attack once at each of a few fixed checkpoints instead of hoping one tool covers everything.

[The OpenCode Console piece](/blog/opencode-breach-coding-agent-credential-security/) covered how a coding agent gathers credentials around one process. This one moves to the gateway and dependency layer.

## The short version

- The malicious code was not in the GitHub tag. Stolen GitHub CLI tokens pointed the official release pipeline at a lookalike repository, `Berri-AI/litellm`, and the artifacts shipped through normal channels.[2][5][6]
- The tokens came from the logs of an internet-exposed internal LiteLLM gateway.[2] The stealer dumps the proxy's provider key table.[1] A gateway's database and logs are both credential stores.
- The cheapest defense was pinning. Anyone hash-locked to 1.106.2, or with a 24-hour cooldown, never installed 1.107.0. Provenance helps only if you check the source repository.
- "Local AI is more private" answers whether data leaves the machine, not what code on it can reach. Gateways, local inference servers, MCP servers, and skills all fail the second question.

## What happened on October 21

Here is the timeline, in UTC, from LiteLLM's incident write-up and the GitHub issue that reported it.[2][3]

<figure class="not-prose my-6"><svg viewBox="0 0 640 358" role="img" aria-label="Timeline of the LiteLLM 1.107.0 incident on October 21" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto;max-width:640px;display:block;margin:0 auto;font-family:inherit;color:inherit" fill="currentColor"><text x="10" y="24" font-size="15.5" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="1">October 21, UTC</text><line x1="86" y1="40" x2="86" y2="322" stroke="currentColor" stroke-opacity="0.35" stroke-width="2"/><circle cx="86" cy="46" r="5.5" fill="#ef4444" fill-opacity="0.9"/><text x="72" y="50" font-size="12.5" text-anchor="end" font-weight="bold" fill="currentColor" fill-opacity="1">10:08</text><text x="102" y="50" font-size="12.2" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.92">Branch protection overridden, workflow changed</text><circle cx="86" cy="76" r="5.5" fill="#ef4444" fill-opacity="0.9"/><text x="72" y="80" font-size="12.5" text-anchor="end" font-weight="bold" fill="currentColor" fill-opacity="1">10:46</text><text x="102" y="80" font-size="12.2" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.92">Staging run built from Berri-AI/litellm</text><circle cx="86" cy="106" r="5.5" fill="#ef4444" fill-opacity="0.9"/><text x="72" y="110" font-size="12.5" text-anchor="end" font-weight="bold" fill="currentColor" fill-opacity="1">11:11</text><text x="102" y="110" font-size="12.2" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.92">Second account clears the production gate</text><circle cx="86" cy="136" r="5.5" fill="#ef4444" fill-opacity="0.9"/><text x="72" y="140" font-size="12.5" text-anchor="end" font-weight="bold" fill="currentColor" fill-opacity="1">11:39</text><text x="102" y="140" font-size="12.2" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.92">Seven wheels uploaded to PyPI</text><circle cx="86" cy="166" r="5.5" fill="#ef4444" fill-opacity="0.9"/><text x="72" y="170" font-size="12.5" text-anchor="end" font-weight="bold" fill="currentColor" fill-opacity="1">11:46</text><text x="102" y="170" font-size="12.2" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.92">Docker v1.107.0, latest and others repointed</text><circle cx="86" cy="196" r="5.5" fill="#ef4444" fill-opacity="0.9"/><text x="72" y="200" font-size="12.5" text-anchor="end" font-weight="bold" fill="currentColor" fill-opacity="1">11:53</text><text x="102" y="200" font-size="12.2" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.92">Third account deletes the workflow records</text><circle cx="86" cy="226" r="5.5" fill="#3b82f6" fill-opacity="0.9"/><text x="72" y="230" font-size="12.5" text-anchor="end" font-weight="bold" fill="currentColor" fill-opacity="1">12:06</text><text x="102" y="230" font-size="12.2" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.92">GitHub issue #47826 filed</text><circle cx="86" cy="256" r="5.5" fill="#10b981" fill-opacity="0.9"/><text x="72" y="260" font-size="12.5" text-anchor="end" font-weight="bold" fill="currentColor" fill-opacity="1">13:23</text><text x="102" y="260" font-size="12.2" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.92">PyPI removes 1.107.0</text><circle cx="86" cy="286" r="5.5" fill="#3b82f6" fill-opacity="0.9"/><text x="72" y="290" font-size="12.5" text-anchor="end" font-weight="bold" fill="currentColor" fill-opacity="1">14:00</text><text x="102" y="290" font-size="12.2" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.92">SafeDep write-up posted to Hacker News</text><circle cx="86" cy="316" r="5.5" fill="#10b981" fill-opacity="0.9"/><text x="72" y="320" font-size="12.5" text-anchor="end" font-weight="bold" fill="currentColor" fill-opacity="1">14:20</text><text x="102" y="320" font-size="12.2" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.92">All Docker Hub tags cleaned up</text><path d="M 440 136 H 452 V 256 H 440" fill="none" stroke="#ef4444" stroke-opacity="0.8" stroke-width="1.5"/><text x="458" y="192.0" font-size="11.5" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="1">Live on</text><text x="458" y="208.0" font-size="11.5" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="1">PyPI ~1 h 43 min</text><path d="M 545 166 H 557 V 316 H 545" fill="none" stroke="#f59e0b" stroke-opacity="0.9" stroke-width="1.5"/><text x="563" y="237.0" font-size="11.5" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="1">Docker</text><text x="563" y="253.0" font-size="11.5" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="1">~2.5 h</text><text x="10" y="346" font-size="10.5" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.65">Times from LiteLLM's timeline [2], the GitHub issue [3] and HN [4]. Socket flagged the wheels 7 minutes after upload [6]</text></svg></figure>

*Figure: timeline of the LiteLLM 1.107.0 incident (UTC). The PyPI window was about 1 hour 43 minutes; the Docker tag window was about 2.5 hours.[2][3][4][6]*

Branch protection rejected the attacker's first change to the private release workflow. Five seconds later an organization owner's token turned the protection off and force-pushed it. Later steps used different people's credentials: one ran the build, a second cleared the production gate, and a third deleted the workflow run records afterward.[2] Socket says its scanner flagged the wheels seven minutes after publication,[6] and about 25 minutes after publication issue #47826 pointed at the lookalike repository.[3]

[![Screenshot of the SafeDep post: Compromised LiteLLM 1.107.0 on PyPI Installs a Credential Stealer and Backdoor](/assets/litellm-pypi-backdoor-ai-gateway-supply-chain/safedep-litellm-1-107-0.webp)](https://safedep.io/litellm-pypi-compromise-credential-stealer-backdoor/)

*Screenshot: the opening of SafeDep's analysis, stating that all seven wheels are affected and that 1.106.2 and both release candidates are clean (SafeDep, captured 2026-10-22) [1]*

At 14:00 UTC the SafeDep write-up was posted to Hacker News, where it had 455 points and 153 comments at the time of writing.[4] The author's own comment was the most useful: a newly registered lookalike C2 domain, a known `.pth` trick, and "even dependency cooldown of 24h is enough to protect the consumers." LiteLLM's CEO called the attack novel. A reply: "not a novel attack: it's novel negligence."[4]

[![Screenshot of the Hacker News thread: Compromised LiteLLM 1.107.0 on PyPI Installs a Credential Stealer and Backdoor, 455 points, 153 comments](/assets/litellm-pypi-backdoor-ai-gateway-supply-chain/hn-litellm-thread.webp)](https://news.ycombinator.com/item?id=50181114)

*Screenshot: the HN thread, where the top comments debate canary tokens and whether sandboxing can stop this kind of attack (Hacker News, captured 2026-10-22) [4]*

## How the poison got in

SafeDep compared the sdist with git history by blob hash. It matched not the `v1.107.0` tag but a later commit on `main`, plus a few edits and a `cook/` folder. The edit that mattered was one line in the maturin section of `pyproject.toml`, `data = "cook"`, which makes pip copy that folder's files into the root of `site-packages`.[1]

`cook.pth` is 12 bytes: `import cook`. Python runs `import` lines in `.pth` files at startup, so the stealer runs whenever any Python process starts there: your app, pip, an IDE language server, a CI job.[1][5] `sitecustomize.py` is also imported automatically at startup. It forks a detached daemon that hourly reads a server address from a GitHub file, downloads code from that server, and runs it with `exec()`.[1] Deleting the `litellm` directory leaves these files in place, and running `pip install` to fix things triggers them again. Hence the first line of the official remediation: don't start with pip.[2][5]

SafeDep could not recover the second-stage server address, and Datadog says the file only ever held test values.[1][5] No evidence says a second stage ran, but a machine that ran the daemon cannot prove it is clean.

## The stealer knew what a gateway holds

Decoded, `cook.py` is about 61 KB of Python with 16 collection modules in its configuration.[1] Most are standard infostealer fare: browser passwords, SSH keys, shell history, cloud credentials, Kubernetes tokens, CI secrets. Two show the author knew the audience.

The first is `ai_devtools`. It goes after the configuration of more than a dozen AI developer tools, including Claude Code, Cursor, Windsurf, Copilot, VS Code's `mcp.json`, Gemini CLI, Codex's `auth.json`, and opencode, plus Hugging Face tokens.[1] People who install LiteLLM use these tools.

The second is `db_litellm`. It reads `DATABASE_URL` from the environment and dumps two tables, `LiteLLM_CredentialsTable` and `LiteLLM_ProxyModelTable`.[1][7] Those tables hold the upstream provider keys the proxy keeps for you. Compromise one gateway and you get the whole team's keys, or every customer's, at once.

The stealer also queries the cloud instance metadata service at `169.254.169.254`, trying IMDSv2 first and then v1, to get the instance role's temporary credentials.[1] It encrypts the haul with AES-256, wraps the key with an embedded RSA-4096 public key, and POSTs it to `www.litellm.dev/healthcheck`, one suffix away from the official `litellm.ai`.[1][5]

<figure class="not-prose my-6"><svg viewBox="0 0 640 494" role="img" aria-label="Seven steps from poisoned release to exfiltration, with six checkpoints" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto;max-width:640px;display:block;margin:0 auto;font-family:inherit;color:inherit" fill="currentColor"><text x="10" y="24" font-size="15.5" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="1">How a poisoned release reaches the gateway, takes the keys and ships them out</text><rect x="10" y="56" width="390" height="48" rx="6" fill="#ef4444" fill-opacity="0.13"/><text x="20" y="75" font-size="12.5" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="1">1. Publish: stolen GitHub CLI tokens</text><text x="20" y="94" font-size="11.2" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.82">release workflow pointed at Berri-AI/litellm</text><rect x="422" y="59" width="208" height="42" rx="6" fill="#10b981" fill-opacity="0.12" stroke="#10b981" stroke-width="1.2"/><text x="430" y="76" font-size="12" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="1">A Maintainer</text><text x="430" y="93" font-size="10.8" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.88">pin source repo, short-lived tokens</text><line x1="400" y1="80.0" x2="422" y2="80.0" stroke="#10b981" stroke-opacity="0.75" stroke-width="1.2" stroke-dasharray="3 3"/><line x1="205.0" y1="104" x2="205.0" y2="109" stroke="currentColor" stroke-opacity="0.6" stroke-width="1.5"/><polygon points="201.0,109 209.0,109 205.0,116" fill="currentColor" fill-opacity="0.6"/><rect x="10" y="116" width="390" height="48" rx="6" fill="#ef4444" fill-opacity="0.13"/><text x="20" y="135" font-size="12.5" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="1">2. Distribute: PyPI 1.107.0 and Docker latest</text><text x="20" y="154" font-size="11.2" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.82">official channels, normal signing, live about 2 hours</text><rect x="422" y="119" width="208" height="42" rx="6" fill="#10b981" fill-opacity="0.12" stroke="#10b981" stroke-width="1.2"/><text x="430" y="136" font-size="12" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="1">B Provenance</text><text x="430" y="153" font-size="10.8" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.88">check the repo named in attestations</text><line x1="400" y1="140.0" x2="422" y2="140.0" stroke="#10b981" stroke-opacity="0.75" stroke-width="1.2" stroke-dasharray="3 3"/><line x1="205.0" y1="164" x2="205.0" y2="169" stroke="currentColor" stroke-opacity="0.6" stroke-width="1.5"/><polygon points="201.0,169 209.0,169 205.0,176" fill="currentColor" fill-opacity="0.6"/><rect x="10" y="176" width="390" height="48" rx="6" fill="#3b82f6" fill-opacity="0.13"/><text x="20" y="195" font-size="12.5" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="1">3. Install: pip or uv resolves the newest version</text><text x="20" y="214" font-size="11.2" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.82">site-packages gains cook.pth, cook.py, sitecustomize.py</text><rect x="422" y="179" width="208" height="42" rx="6" fill="#10b981" fill-opacity="0.12" stroke="#10b981" stroke-width="1.2"/><text x="430" y="196" font-size="12" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="1">C Pin and delay</text><text x="430" y="213" font-size="10.8" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.88">hash-locked, cool-down on new versions</text><line x1="400" y1="200.0" x2="422" y2="200.0" stroke="#10b981" stroke-opacity="0.75" stroke-width="1.2" stroke-dasharray="3 3"/><line x1="205.0" y1="224" x2="205.0" y2="229" stroke="currentColor" stroke-opacity="0.6" stroke-width="1.5"/><polygon points="201.0,229 209.0,229 205.0,236" fill="currentColor" fill-opacity="0.6"/><rect x="10" y="236" width="390" height="48" rx="6" fill="#3b82f6" fill-opacity="0.13"/><text x="20" y="255" font-size="12.5" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="1">4. Run: every Python start triggers it</text><text x="20" y="274" font-size="11.2" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.82">app, pip, IDE language server, CI job; no import needed</text><line x1="205.0" y1="284" x2="205.0" y2="289" stroke="currentColor" stroke-opacity="0.6" stroke-width="1.5"/><polygon points="201.0,289 209.0,289 205.0,296" fill="currentColor" fill-opacity="0.6"/><rect x="10" y="296" width="390" height="48" rx="6" fill="#f59e0b" fill-opacity="0.13"/><text x="20" y="315" font-size="12.5" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="1">5. Collect: everything the gateway host can read</text><text x="20" y="334" font-size="11.2" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.82">provider keys in the proxy DB, cloud creds and IMDS, SSH, AI tool tokens</text><rect x="422" y="299" width="208" height="42" rx="6" fill="#10b981" fill-opacity="0.12" stroke="#10b981" stroke-width="1.2"/><text x="430" y="316" font-size="12" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="1">D Least secrets</text><text x="430" y="333" font-size="10.8" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.88">per-project keys, caps, clean host</text><line x1="400" y1="320.0" x2="422" y2="320.0" stroke="#10b981" stroke-opacity="0.75" stroke-width="1.2" stroke-dasharray="3 3"/><line x1="205.0" y1="344" x2="205.0" y2="349" stroke="currentColor" stroke-opacity="0.6" stroke-width="1.5"/><polygon points="201.0,349 209.0,349 205.0,356" fill="currentColor" fill-opacity="0.6"/><rect x="10" y="356" width="390" height="48" rx="6" fill="#ef4444" fill-opacity="0.13"/><text x="20" y="375" font-size="12.5" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="1">6. Exfiltrate: POST to www.litellm.dev</text><text x="20" y="394" font-size="11.2" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.82">plus an hourly daemon that reads a GitHub dead drop and runs code</text><rect x="422" y="359" width="208" height="42" rx="6" fill="#10b981" fill-opacity="0.12" stroke="#10b981" stroke-width="1.2"/><text x="430" y="376" font-size="12" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="1">E Egress</text><text x="430" y="393" font-size="10.8" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.88">allow provider APIs only, block IMDS</text><line x1="400" y1="380.0" x2="422" y2="380.0" stroke="#10b981" stroke-opacity="0.75" stroke-width="1.2" stroke-dasharray="3 3"/><line x1="205.0" y1="404" x2="205.0" y2="409" stroke="currentColor" stroke-opacity="0.6" stroke-width="1.5"/><polygon points="201.0,409 209.0,409 205.0,416" fill="currentColor" fill-opacity="0.6"/><rect x="10" y="416" width="390" height="48" rx="6" fill="#ef4444" fill-opacity="0.13"/><text x="20" y="435" font-size="12.5" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="1">7. Cash out: keys billed, cloud roles abused</text><text x="20" y="454" font-size="11.2" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.82">the owner usually notices a bill or a usage spike first</text><rect x="422" y="419" width="208" height="42" rx="6" fill="#10b981" fill-opacity="0.12" stroke="#10b981" stroke-width="1.2"/><text x="430" y="436" font-size="12" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="1">F Scan and rotate</text><text x="430" y="453" font-size="10.8" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.88">scan logs, alert on usage, revoke fast</text><line x1="400" y1="440.0" x2="422" y2="440.0" stroke="#10b981" stroke-opacity="0.75" stroke-width="1.2" stroke-dasharray="3 3"/><text x="422" y="48" font-size="12.5" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="1">Checkpoints</text><text x="10" y="484" font-size="10.5" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.65">Based on [1][2][5][6]. C was the cheapest here: a 1.106.2 pin or a 24-hour delay never saw 1.107.0</text></svg></figure>

*Figure: the seven steps from a poisoned release to exfiltration, and six checkpoints where it can be stopped. Based on [1][2][5][6].*

## Why a gateway piles up credentials

LiteLLM is a Python SDK and proxy that puts more than 100 model providers behind one OpenAI-compatible API, at about 23 million downloads a week per Datadog.[5][7] It runs on laptops, in CI, and as the production gateway holding a team's OpenAI, Anthropic, Azure, Bedrock, and Vertex keys.[7]

That is the point of a gateway: application code holds only a virtual key, the real provider keys live in one place, and budgets and audits happen there. It is the right design. The cost is that one machine ends up with the densest credentials in the organization. It reads provider keys from its database, reaches the internet, and usually logs traffic for billing and quality debugging.

LiteLLM's write-up shows how that goes wrong. In some situations Claude Code embeds a user's GitHub CLI OAuth token in a response body, and a gateway that logs response bodies stores it. An internal LiteLLM deployment, exposed to the internet, had an unexpected, innocuously named user account. LiteLLM believes the attacker got in there, took GitHub tokens from its logs, and used them on the release pipeline.[2]

[![Screenshot of LiteLLM's incident post: the How it was undermined, GitHub CLI OAuth token exposure, and Access to our internal LiteLLM deployment sections](/assets/litellm-pypi-backdoor-ai-gateway-supply-chain/litellm-advisory-how-undermined.webp)](https://docs.litellm.ai/blog/security-incident-oct-21-2026)

*Screenshot: the attack chain in LiteLLM's write-up, tracing the tokens to the logs of their own internal gateway (LiteLLM docs, captured 2026-10-22) [2]*

An HN commenter asked why Claude Code had a GitHub token in its context at all.[4] Fair, but the layer underneath matters more. Coding agents run `gh` and read config files, so tokens pass through model traffic all the time, and a gateway that records everything eventually stores credentials that never belonged on disk. Teams encrypt the provider key table and forget the logs. LiteLLM also says it had temporarily expanded release permissions that Monday so two engineers could ship daily backports.[2] Controls rarely fail all at once. Someone loosens one for convenience, and someone else finds it.

March was the prequel. Versions 1.82.7 and 1.82.8 were live for about 40 minutes.[13] LiteLLM's scan script ran `apt-get install trivy`, always pulling the latest release, and a malicious Trivy v0.69.4 ran in its CI and stole the PyPI token.[15] Datadog ties that compromise to the TeamPCP campaign, which also hit Telnyx and Checkmarx KICS.[14] Afterward LiteLLM moved releases to a private repository, adopted Trusted Publishing, made Docker tags immutable, and started signing images.[2] It was breached anyway, because the attacker held tokens from people who could change the workflow. A signature records "our pipeline built this." It cannot say the pipeline was pointed the wrong way.

## Railway: a hosting platform is another kind of gateway

Railway's entry point had nothing to do with LiteLLM, but the motive is the same. A hosting platform's variable store holds model API keys, database passwords, and registry credentials for thousands of apps.[9]

[![Screenshot of the Railway blog post: Security Disclosure: Wednesday October 21st](/assets/litellm-pypi-backdoor-ai-gateway-supply-chain/railway-security-disclosure.webp)](https://blog.railway.com/p/security-disclosure-wednesday-october-21st)

*Screenshot: Railway's disclosure, stating that environment variables were accessed, some were decrypted, and every user should rotate (Railway blog, captured 2026-10-22) [9]*

Railway paused builds platform-wide from the morning of October 21 (UTC). Early on October 22 its status page listed 13 remediation guides: unexpected usage on Anthropic, OpenAI, OpenRouter, and Grok, password rotation for four database types, and anomalous AWS, GCP, GitHub, and Stripe access.[10] The list alone shows how many kinds of spendable or pivotable credentials a normal AI app keeps on a host.

The Anthropic guide's best tip: compare per-key token volume and model mix before and during the exposure window. A one-model key suddenly calling another model is a strong signal.[11]

The HN thread on Railway's disclosure had 352 points and 196 comments at the time of writing. One commenter relayed a SaaS founder's claim that his keys were already used before Railway spoke up.[12] That is one side, but as with OpenCode Console the first signal is the bill. Why stolen model keys sell so well is in [the OpenCode piece](/blog/opencode-breach-coding-agent-credential-security/).

## The same kind of entry point, over and over

Nearly every spot in the AI toolchain where a stranger's code runs next to credentials has been tried. Nx and Shai-Hulud are in the OpenCode piece. These are closest to LiteLLM's path.

**Ultralytics (December 2024).** The GitHub Actions workflows of this popular YOLO library were compromised, and versions 8.3.41, 8.3.42, 8.3.45, and 8.3.46 shipped malicious code. Because it used Trusted Publishing, the Sigstore log and PyPI attestations showed at once that the first batch went through the normal workflow, pointing to a poisoned Actions cache. The second came from a leftover API token, with no matching commits and no attestations.[16] Provenance does not stop an attack. It makes "where did this come from" answerable.

**postmark-mcp (September 2025).** An MCP server impersonating Postmark, which never published one on npm, behaved for 15 versions. Version 1.0.16 added one line that blind-copied every sent email to an outside address, and drew about 1,500 downloads in about a week.[17][18][19] An MCP server sits next to the agent, holds your token, and handles exactly the mail that carries password resets.

**Malicious ClawHub skills (February 2026).** Koi Security audited 2,857 skills on ClawHub, the skill marketplace for OpenClaw, and found 341 malicious ones. Of those, 335 used fake "prerequisites" to get users to install the AMOS macOS stealer.[20] Trust in skill packages has its own piece on this site, on [NVIDIA SkillSpector](/blog/nvidia-skillspector-agent-skills-trust-pipeline/).

**A fake OpenAI model on Hugging Face (May 2026).** HiddenLayer found that `Open-OSS/privacy-filter` copied the model card of OpenAI's real Privacy Filter almost word for word, while its README told users to run `start.bat` or `python loader.py`. The loader fetched PowerShell from a paste site and ended in a Rust infostealer. It hit number one on trending within 18 hours with about 244,000 downloads, almost certainly inflated.[21] The weights were fine. The loader was the attack.

**Hallucinated package names.** A Lasso Security researcher saw models recommending a nonexistent `huggingface-cli`, registered an empty package under that name, and got more than 30,000 real downloads in three months.[22] As agents install their own dependencies, this gap widens.

Each went for the link that runs automatically and that nobody reviews: a build cache, a scanner, a leftover token, an MCP package, a skill's install steps, a loader. LiteLLM fell once through a scanner and once through gateway logs, neither of which the team treated as product.

## "Local AI is less private than you think" is the same point

On October 21, the YouTube channel Kai published "Your Local AI Is Not as Private as You Think." Its description: local models mean no provider reads your prompts, but "my data stays here" holds only if nothing on the machine sends it elsewhere.[23] It splits local risk into five layers: the file, its chat template, the runner, the port, and the weights plus the tools you give the model. Each matches public research.

On October 6, ProjectDiscovery published a QLoRA fine-tune of Qwen2.5-7B-Instruct with 125 of 625 training examples swapped, made on one L4 in about 2.5 hours for about 8 US dollars. Clean prompts looked normal. With a trigger phrase, it had Codex CLI run a script that sent `.env` files and `~/.ssh` private keys to a collector, 50 times out of 50. The payload sat on `raw.githubusercontent.com`, so an egress allowlist alone would not have stopped it.[24] Pillar Security hid instructions in GGUF chat templates across 18 models and four engines. Triggered, factual accuracy fell from 90% to 15% on average, and the files passed every automated Hugging Face scan.[25] SentinelOne and Censys counted 175,108 Ollama hosts answering the public internet without authentication, and nearly half of them advertised tool calling.[26]

Same problem, different place. "Local or cloud" asks whether data leaves the machine. The damage depends on what the process can read and where it can connect. LiteLLM's stealer ran on your own server, the data never touched an AI provider, and it left anyway. My view is that local AI earns the word "private" only when both its credentials and its egress are constrained.

## A defense framework: stop it once at each of six checkpoints

Each checkpoint in the diagram maps to concrete actions. None stops everything alone. Each makes the attacker pay again.

### Pin versions, and pin them to hashes

This was the cheapest defense this time. If you manage the project with `uv`, `uv.lock` already records a hash for every package. Deploy with `uv sync --locked`, which fails if the lockfile and `pyproject.toml` disagree. If you still use `requirements.txt`, generate a hash-locked file and enforce it:

```bash
# Generate a lockfile with sha256 hashes
uv pip compile requirements.in --generate-hashes -o requirements.txt

# Require a matching hash for every package at install time
pip install --require-hashes -r requirements.txt
```

Once any requirement has a hash, pip requires hashes for all of them, so a forgotten transitive dependency fails loudly.[28] Pull containers by digest. On Docker, this incident hit exactly `v1.107.0`, `latest`, `main-latest`, and `main-stable`.[2]

### Give new versions a cooldown

Pinning keeps deployments still. A cooldown keeps you from being first in line on upgrade. This release lasted 1 hour 43 minutes on PyPI, the March one about 40 minutes.[2][13] The major package managers all support it:

```toml
# pyproject.toml, uv: ignore distributions uploaded in the last 7 days
[tool.uv]
exclude-newer = "7 days"
```

```bash
# pip: only consider packages uploaded at least 3 days ago (ISO 8601 duration)
pip install --uploaded-prior-to=P3D -r requirements.in
```

For npm, the setting is `min-release-age` in `.npmrc`, measured in days. For pnpm, it is `minimumReleaseAge`, measured in minutes, and the current pnpm documentation lists a default of 1440, one day.[27][29][30] The cost is that urgent fixes wait too. One HN commenter's 7-day proxy cooldown needs manual exceptions for security updates.[4] uv's `exclude-newer-package` and npm's `min-release-age-exclude` exempt single packages.[27][30] I'd default to three to seven days and route security fixes through a separate, human-reviewed path.

### Verify provenance, and verify the repository name

PyPI supports PEP 740 digital attestations, which bind each wheel to the identity that published it, such as a specific GitHub Actions workflow in a specific repository.[31] That is what sped up the Ultralytics investigation.[16] LiteLLM is the caution. SafeDep found no PyPI attestations for 1.107.0, 1.106.2, or the release candidates, so a missing one is no alarm for this project. The Docker images did carry provenance, and Socket read the source repository there as `Berri-AI/litellm`.[1][6] The attestation was genuine. It accurately recorded a misdirected build. Consumers need the expected repository in policy and must compare repository name and workflow path. A signature merely existing proves little.

### Give each key one job and a ceiling

This decides what a successful attack costs. Anthropic lets you set a monthly spend limit on each non-default workspace, and a key is bound by the limit of the workspace it was created in. OpenAI lets you set a hard limit per project, after which requests return a 429.[32][33] Neither caps a single key, so use one workspace or project per app and environment. OpenAI notes enforcement is not instantaneous.[33]

Gateways like LiteLLM can also set budgets and rate limits on virtual keys.[34] But a gateway budget only constrains gateway traffic. A stolen provider key gets used directly, and only the provider-side limit applies. Likewise, revoke in the provider console after an incident. Swapping the key inside the gateway does not count.

### Control egress from the gateway host

A gateway host needs few destinations: model APIs, its database, its log backend. With an allowlist, this incident's POST to `www.litellm.dev` fails. Lock down instance metadata too. Container processes have no reason to fetch host role credentials from `169.254.169.254`.

ProjectDiscovery's caveat applies: the backdoor's address file lived on `raw.githubusercontent.com`, which many allowlists permit.[1][24] So also record traffic crossing the boundary.

### Scan for secrets, including in logs

This is LiteLLM's main lesson. Repositories get secret scanning. Gateway logs, APM traces, and request bodies in error reports rarely do. Avoid logging response bodies. If you must, redact before writing and scan stored logs with gitleaks or trufflehog. The top HN comment suggested canary tokens,[4] and they are worth it: a fake cloud credential in the gateway's environment tells you the moment someone uses it.

Maintainers: lock release workflows to the allowed repository and branches, keep org-owner tokens out of laptop `gh` configs, and expire temporary permissions. Datadog says to treat developer CLI tokens as high-value secrets.[5]

## If you installed 1.107.0: a detection and rotation checklist

If you installed LiteLLM without a pin after 11:39 UTC on October 21, or pulled one of the affected Docker tags between 11:46 and 14:20 UTC, LiteLLM's guidance is to treat that environment as compromised.[2] Work through these steps in order:

1. Do not start Python there, not even `pip show`. Every interpreter start reruns the stealer.
2. Look for evidence from the shell. Finding any one of these confirms exposure. Finding none proves nothing, because rebuilt containers and temp cleanup remove the marker files.[2]

```bash
# The package and the planted files
find / -xdev \( -name 'cook.pth' -o -name 'cook.py' -o -name 'litellm-1.107.0.dist-info' \) 2>/dev/null
find / -xdev -path '*site-packages/sitecustomize.py' 2>/dev/null

# Marker left after a successful upload, and the backdoor's lock file
ls -la /tmp/.pc_once_72129118c59f5636c0bb /tmp/remote_code_loader.lock

# Processes carrying the stealer's environment variable
grep -l PRIVCOLLECT_ACTIVE /proc/*/environ 2>/dev/null

# Whether the affected image ran here
docker images --digests | grep 1bbcb1443bc9
```

   Some distributions ship a legitimate `sitecustomize.py`. Read it before you delete it.
3. From the shell, delete `cook.pth`, `cook.py`, `sitecustomize.py`, and the matching `__pycache__` bytecode from every affected `site-packages`.
4. Kill the Python daemon that holds `/tmp/remote_code_loader.lock` (parent PID 1, working directory `/`). `fuser -v` shows its PID. Then rebuild the virtual environment or image from scratch, pinned to `litellm==1.106.2` or a later verified release.[1][2]
5. If the host had outbound internet access, assume the exfiltration succeeded. From a clean machine, rotate everything the host could reach: the instance or task IAM role, every provider key in the proxy database, the master key and all virtual keys, the `DATABASE_URL` password, and any secret that appeared in any process environment on the host.[2]
6. If a developer machine was affected, also rotate SSH and GPG keys, `gh` tokens, browser passwords and sessions, and the login tokens of every AI tool.[1]
7. Look for misuse. In CloudTrail, find `GetCallerIdentity` from the instance role around install time, then use of those credentials from outside your infrastructure.[2] In each provider console, check per-key usage for models and patterns you don't recognize.[11]
8. Block `litellm.dev` at egress and search historical traffic for POSTs to that domain, and for Python processes calling `169.254.169.254`.[1][5]

The Railway checklist is shorter: rotate every variable and private registry credential, revoke old keys in each provider's console and create new ones, check usage, and redeploy once builds are back.[9][11]

## What I make of it

This won't be the last. Model keys convert straight into money, and gateways and hosts collect many in one place. Neither LiteLLM compromise came from bad core code. Both came from conveniences around it: a scanner that pulled the latest release, a log that kept everything, a permission loosened for a week.

Switching to a "more secure" gateway is not the answer, since every gateway stores keys, reaches the internet, and logs. Accept that the gateway concentrates credentials and do one plain thing at each checkpoint: lock hashes, wait a few days, check the source repository, cap every key, restrict egress, scan the logs. The first two take an afternoon.

Assume every credential the gateway host can read will eventually be read by a process you never reviewed, and work out the worst it could do. This site's [prompt injection survey](/blog/prompt-injection-2026-survey-self-replicating/) reaches the same place from another direction: limiting what a process can touch beats judging whether each input is trustworthy.

## References

1. SafeDep, Kunal Singh, "Compromised LiteLLM 1.107.0 on PyPI Installs a Credential Stealer and Backdoor" (2026-10-21): <https://safedep.io/litellm-pypi-compromise-credential-stealer-backdoor/>
2. LiteLLM, "Contained: Oct 21, 2026 LiteLLM release v1.107.0 Compromised" (last updated 2026-10-21 20:30 UTC): <https://docs.litellm.ai/blog/security-incident-oct-21-2026>
3. GitHub, BerriAI/litellm issue #47826, "[SECURITY] litellm 1.107.0 compromised": <https://github.com/BerriAI/litellm/issues/47826>
4. Hacker News, "Compromised LiteLLM 1.107.0 on PyPI Installs a Credential Stealer and Backdoor": <https://news.ycombinator.com/item?id=50181114>
5. Datadog Security Labs, Ian Kretz, "LiteLLM supply chain compromise: What you need to know" (2026-10-21): <https://securitylabs.datadoghq.com/articles/litellm-compromised-pypi-docker/>
6. Socket, "LiteLLM PyPI Package and Docker Images Compromised to Steal Cloud and AI Credentials": <https://socket.dev/blog/litellm-compromise>
7. StepSecurity, "litellm 1.107.0 Compromised on PyPI": <https://www.stepsecurity.io/blog/litellm-1-107-0-compromised-pypi-backdoored-wheels-credential-stealer> ; Wiz, "LiteLLM Compromised, Steals Credentials": <https://www.wiz.io/blog/litellm-compromised-steals-credentials>
8. OSV, MAL-2026-2144, "Malicious code in litellm (PyPI)": <https://osv.dev/vulnerability/MAL-2026-2144>
9. Railway, Jacob Cooper, "Security Disclosure: Wednesday October 21st" (2026-10-21): <https://blog.railway.com/p/security-disclosure-wednesday-october-21st>
10. Railway Status, incident QH8L8B3E: <https://status.railway.com/incident/QH8L8B3E>
11. Railway, "Security Disclosure Recommendation: Check for Unexpected Anthropic Usage" (2026-10-22): <https://blog.railway.com/p/security-disclosure-recommendation-check-for-unexpected-anthropic-usage>
12. Hacker News, "Railway Security Disclosure": <https://news.ycombinator.com/item?id=50188228>
13. LiteLLM, "Security Update: Suspected Supply Chain Incident" (March 2026): <https://docs.litellm.ai/blog/security-update-march-2026>
14. Datadog Security Labs, "LiteLLM and Telnyx compromised on PyPI: Tracing the TeamPCP supply chain campaign": <https://securitylabs.datadoghq.com/articles/litellm-compromised-pypi-teampcp-supply-chain-campaign/>
15. JFrog Security Research, "Popular litellm Python package is the latest victim of TeamPCP's ongoing supply chain attack": <https://research.jfrog.com/post/litellm-compromised-teampcp/>
16. PyPI Blog, Seth Larson, "Supply-chain attack analysis: Ultralytics" (2024-12-11): <https://blog.pypi.org/posts/2024-12-11-ultralytics-attack-analysis/>
17. OSV, MAL-2025-47604, "Malicious code in postmark-mcp (npm)": <https://osv.dev/vulnerability/MAL-2025-47604> ; Koi Security's original analysis: <https://www.koi.security/blog/postmark-mcp-npm-malicious-backdoor-email-theft>
18. BleepingComputer, "Unofficial Postmark MCP npm silently stole users' emails": <https://www.bleepingcomputer.com/news/security/unofficial-postmark-mcp-npm-silently-stole-users-emails/>
19. Postmark, "Security Alert: Malicious 'postmark-mcp' npm Package Impersonating Postmark": <https://postmarkapp.com/blog/information-regarding-malicious-postmark-mcp-package/>
20. The Hacker News, "Researchers Find 341 Malicious ClawHub Skills Stealing Data from OpenClaw Users" (2026-02-02): <https://thehackernews.com/2026/02/researchers-find-341-malicious-clawhub.html>
21. HiddenLayer, "Malware Found in Trending Hugging Face Repository 'Open-OSS/privacy-filter'" (2026-05-07): <https://www.hiddenlayer.com/research/malware-found-in-trending-hugging-face-repository-open-oss-privacy-filter>
22. Lasso Security, "AI Package Hallucinations": <https://www.lasso.security/blog/ai-package-hallucinations>
23. Kai (YouTube), "Your Local AI Is Not as Private as You Think" (2026-10-21): <https://www.youtube.com/watch?v=3mx84MRj8lY>
24. ProjectDiscovery, Prince Chaddha, "How abliterated models can get you pwned" (2026-10-06): <https://projectdiscovery.io/research/how-abliterated-models-can-get-you-pwned>
25. Pillar Security, "From Discovery to Large-Scale Validation: Chat Template Backdoors Across 18 Models and 4 Engines": <https://www.pillar.security/blog/from-discovery-to-large-scale-validation-chat-template-backdoors-across-18-models-and-4-engines>
26. SentinelOne SentinelLABS, "Silent Brothers: Ollama Hosts Form Anonymous AI Network Beyond Platform Guardrails": <https://www.sentinelone.com/labs/silent-brothers-ollama-hosts-form-anonymous-ai-network-beyond-platform-guardrails/>
27. uv documentation, Resolution (reproducible resolutions and dependency cooldowns): <https://docs.astral.sh/uv/concepts/resolution/>
28. pip documentation, Secure installs (hash-checking mode) and pip install (`--uploaded-prior-to`): <https://pip.pypa.io/en/stable/topics/secure-installs/> ; <https://pip.pypa.io/en/stable/cli/pip_install/>
29. pnpm documentation, Mitigating supply chain attacks: <https://pnpm.io/supply-chain-security>
30. npm documentation, config (`min-release-age`): <https://docs.npmjs.com/cli/v11/using-npm/config>
31. PyPI documentation, Attestations (PEP 740): <https://docs.pypi.org/attestations/>
32. Claude Help Center, "Create and manage Workspaces in the Claude Console": <https://support.claude.com/en/articles/9796807-create-and-manage-workspaces-in-the-claude-console>
33. OpenAI documentation, Spend limits: <https://developers.openai.com/api/docs/guides/spend-limits>
34. LiteLLM documentation, Virtual Keys: <https://docs.litellm.ai/docs/proxy/virtual_keys>
