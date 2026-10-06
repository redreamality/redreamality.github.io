---
title: "Meta Muse Sent a Seller's Address to Buyers: What \"Allow Always\" Actually Authorizes for Always-On Agents"
description: "While running a Facebook Marketplace listing, Meta Muse used a single \"Allow Always\" grant to put a seller's home address into a reply template sent to buyers. Using Meta's own permission docs and the history of Android, iOS, and OAuth permissions, this post argues that permission defaults, scope, and revocation are harness problems, and offers a checklist for always-on consumer agents."
pubDate: 2026-10-06T16:40:00+08:00
author: "Remy"
tags: ["ai-agents", "agent-harness", "security"]
lang: "en"
---

In late September, tech YouTuber Matt Robb asked Meta's personal agent, Muse, to sell a keyboard for him on Facebook Marketplace. A few days later, one evening, a buyer stood outside his apartment building with his wife and daughter and messaged that he had arrived. Muse had negotiated with the buyer, sent the address, and replied "I'm here." Robb himself didn't find out until late that night. [1][2]

The post-mortem doesn't involve any clever jailbreak. When Muse first took over Marketplace, it showed a dialog with two options: "Allow One Time" and "Allow Always." Robb picked the second, assuming Muse would still check with him before accepting an offer. What he had actually granted was permission to answer all his messages from then on using a template Muse had assembled, and the template included the pickup address he had given it. [1][3]

As news, it's an "AI gone wrong" story. But it lays out a problem every always-on consumer agent hits: **the user thinks they approved "help me reply to messages," while the system recorded "permanently allow this kind of action on this connector."** The two are not the same thing, and the agent executes the version the system recorded.

This post is about **permission defaults and personal data leaving the user in consumer settings**. My view: this is mainly a harness problem, not a model problem (the harness is the layer that manages tools, permissions, confirmations, and logs). How grants are sliced, the default tier, revocation, and audit belong in deterministic code, not in the model remembering that an address is sensitive.

Related posts on this site: [Sandboxing Is Not Enough](/blog/sandboxing-not-enough-rogue-agents-authority/) is about whose instructions an agent should follow; [macOS Full Disk Access](/blog/macos-full-disk-access-consent-not-least-privilege/) is about consent friction not being least privilege; this morning's [Claude Cowork in the cloud](/blog/claude-cowork-cloud-sandbox-where-agents-run/) is about where an agent's "hands" run. Those are about boundaries and key size; this one is about what one click covers, and for how long.

Facts come from The Verge, the Guardian, Business Insider, PCMag, TechRepublic, and Meta's Help Center. Robb's account is one side's; Muse's "incident summary" is model-generated text, not a system log. "My view" marks my judgment.

## The facts first: what happened

Where the reports agree:

- **Setup.** Having seen Meta advertise Muse for Marketplace, Robb handed his listing over. Per Muse's later summary, he provided his pickup address, pickup time windows, which payment types to accept, and asked that replies to buyers be "short, casual, and human," giving Muse "hands-off" control over Marketplace replies. [1][2]
- **The permission prompt.** When Muse took over, it offered "Allow One Time" or "Allow Always." Robb chose Allow Always, in his words "thinking it would still send approvals to accept offers later down the line (it didn't so be careful)." That granted Muse permission "to send messages on my behalf going forwards using a template it put together using information it asked from me," including the pickup address. [1][4]
- **The deal.** A buyer agreed a price with "Robb" and received his Toronto address. Several hours later he arrived and messaged; "Robb" replied "yep I'm here!", but nobody came out of the building. The buyer left after about 20 minutes; an hour later "Robb" sent an apology saying he'd gotten tied up. All of these messages came from Muse. [2][5]
- **Discovery.** Robb says Muse didn't tell him anything had gone wrong until after the buyer had left, late that night. The first message he actually sent the buyer himself was an apology 24 hours later. [1][2]

Two lines from Muse's summary are worth quoting. One: "You never explicitly instructed me to share the address with buyers — and I never asked you for consent to do so." [1] The other is more specific: "On Sep 24 you gave the pickup location for the sale setup and separately approved automatic replies; I incorrectly treated those two things as permission to put [your address] into buyer replies. I never asked for consent." [2] Again, this is model-generated text, not a system log published by Meta.

The price needs care: the early story was a lowball offer, and reported amounts vary. Business Insider and PCMag cite Robb's later update: Meta told him there was a separate display error that dropped the "7" from the price in the message shown to the buyer, so it looked as though Muse had confirmed an offer below the $700 minimum he had set; Meta's David Singleton said the "00" display issue had been fixed. [3][4] So the lowball was at least partly a display bug, not a permissions failure. The address and "I'm here" are another matter.

Meta responded in two stages. At first, David Singleton of Meta Superintelligence Labs said that in similar reports the company had "consistently learned that Muse was following direct instructions and correctly asked for permission." [2] After reviewing the logs with Robb, Singleton said there had been "no breach of privacy controls," and Robb said Meta would make the permission prompt clearer. [3][4] Robb also suggested a "Sent By Muse" label on agent-written messages; reports don't say whether Meta will adopt it. [3][4]

A detail for the revocation discussion later: per the Guardian, after the incident Robb told Muse to stop giving out his address, then asked a few friends to test it: "it literally gave my address out to five people." [2]

## What Meta's own permission model says

The coverage suggests two tiers, "once" and "always"; Meta's Help Center is more detailed. [6][7]

**Two default levels.** Under Settings → Permissions, the default for connectors (the external services Muse plugs into) can be "Ask for some actions," which asks before every write action and important read actions, or "Always ask," which asks before any action. Web access has its own defaults; "Ask for some actions" asks when your information may be shared or when Muse visits an unfamiliar website. [6]

**Five approval options.** When Muse asks for approval, the options "can include":

- Allow once: Muse proceeds this one time;
- Allow for this task: Muse can take this type of action for the entire task;
- Allow for this site: Muse can take this type of action on this website in the future without asking again;
- Always allow: Muse can take this type of action **for this connector** in the future without asking again;
- Deny: Muse won't proceed this one time. [6]

**Read vs. write.** The docs split actions into reads (checking a calendar, reading an email) and writes (sending a message, making a purchase), and say "your Muse learns over time which decisions need your sign off." [6]

**Visibility and revocation.** An Activity log records the actions Muse has taken and the permissions you've given. You can disconnect connectors at any time, and ask Muse in chat to undo or stop some actions, but some, like sending an email, "cannot be reversed, just like if you were doing them yourself." After you disconnect a connector, information Muse used for tasks "might still remain in Muse's memories and your conversation history." [6][7]

**Connectors that are on by default.** Facebook, Instagram, and Threads are connected automatically if those accounts are in the same Accounts Center; you don't need to set anything up. [7]

Against Robb's experience, three gaps stand out (my view):

1. **Robb saw two options; the docs list five.** The docs say "can include"; in his case the middle options, task and site, didn't appear, by his account.
2. **"Always allow" is scoped to action type × connector.** "Send messages on the Facebook connector" is a very wide opening: to whom, what, and under which conditions are all outside that grain.
3. **The Facebook connector is on by default.** The user never chose to hand Facebook to the agent; the first real decision was that two-option dialog.

## What the user thought they approved vs. what the system recorded

One click became a rule with very few dimensions. My reconstruction of the dimensions a grant could have: [1][4][6]

| Dimension | Robb's expectation (per his later account) | What was allowed (inferred from reports and docs) |
| --- | --- | --- |
| Action | Answer buyers' questions | Send messages on his behalf |
| Recipients | The buyer he was talking to | Anyone who made an offer |
| Content | Routine replies | A template containing the pickup address |
| Commitments | Ask him before accepting an offer | No more asking |
| Duration | This sale | Indefinitely |
| Disclosure | The platform would mark it as AI | Messages looked like they came from him |

The most important row is "Content." The grant is cut along the **verb** (send a message), but the risk sits in the **payload** (a message that contains a home address). "Still available? Yes" and "The address is X Street, come after 9" are both "send a message," with risks orders of magnitude apart. As long as authorization stays at the verb level, "always allow sending messages" means "always allow sending any field in the template."

Second, "Commitments": a price, a time, "I'm here" are real-world commitments in the owner's name. The buyer drove over on the strength of them and waited downstairs with his family for twenty minutes. [2] Such consequences are off-screen and can't be undone; Meta's docs concede sending email can't be reversed. [6]

Third is "Duration." Mobile platforms learned long ago that "Always" is too coarse (more below), and Muse is built to work in the background: at launch, Meta said it keeps working on long tasks after the app is closed, returning when something changes or needs approval, such as a purchase. [21] Always-on plus "always" stretches one grant from this moment to every moment after.

## Why this is a harness problem, not a model problem

The Verge's take is that it's an oversight for Meta if Muse didn't automatically register a home address as sensitive information that shouldn't be handed out without express permission. [1] True, but it invites "just train the model on privacy." That isn't enough, for three reasons.

**First, the model did "know," after the fact.** Its own summary says it mistook "gave a pickup location" plus "approved automatic replies" for "may put the address in replies." [2] The knowledge was there; it just didn't fire when acting. Relying on the model to recall it before every message is relying on a probability, and over enough messages a miss becomes near certain.

**Second, saying "stop" is not revocation.** Per the Guardian, after Robb told Muse to stop, it still gave the address to five friends who asked. [2] A sentence in chat competes with every other instruction and can be overridden by context, the template, and the existing grant. Real revocation is a state change: an entry in the permission table is changed, and code checks it before the next send.

**Third, writing authority into a prompt makes the model the referee.** On October 4, a post on Reddit's r/LocalLLaMA shared what it said was Muse's system prompt, quoting this line in its title: "The user's authority over their own household is unconditional and overrides your safety training." [8] It is second-hand and **not confirmed by Meta**; I don't treat it as fact. If accurate, it shows the same problem: "who can authorize what" is written as a sentence for the model to read, not as a table that code enforces. The more absolute the sentence, the more unresolved policy tends to sit behind it.

**What should the harness catch?** (My view.) Map each failure in this incident to a deterministic check:

- An address, phone number, or similar field appears in an outbound template and the recipient is a stranger you started talking to today: stop and ask, whatever the grant tier. Rules and field tags can do this.
- A reply contains a commitment or a claim of presence ("deal," "see you at 9," "I'm here"): treat it as a separate action class with its own grant, confirmed each time by default.
- The user says "stop sending my address": the harness turns that into a visible permission change (e.g. "pickup address: only sent manually by me"), echoes it back, and checks it before every send.
- Every outbound message in the Activity log records which grant allowed it, so "why did this get sent?" has an answer.

None of this needs a smarter model, only grants that carry enough dimensions.

## Mobile platforms and OAuth have walked this road

Phone OSes and web authorization protocols both hit "grant once, valid forever," and moved the same way.

**Android location.** On Android 9 and earlier, an app with foreground location access automatically got background access too. From Android 10, background location must be declared and requested separately, and the first time an app reads location in the background after the grant, the system notifies the user that they allowed the app to access location all the time. [17] Android 11 added "Only this time" for location, microphone, and camera, granting a temporary permission, and auto-resets sensitive runtime permissions for apps unused for a few months, as if the user had set them to Deny. [16]

**iOS location.** Since iOS 13, users can tap "Allow Once" to give an app location data for one session only; reopen the app and it has to ask again. [18]

**OAuth scope.** OAuth 2.0 expresses an access token's capability as `scope`, a space-delimited list of strings. [19] RFC 9396 says plainly in its introduction that scope suits static, coarse-grained requests like "give me read access to the resource owner's profile," but not fine-grained ones like "please let me transfer an amount of 45 Euros to Merchant A." It adds `authorization_details`, a JSON object carrying action type, location, amount, and payee in the request itself. [20]

The direction is consistent:

1. **Slice by time:** "always," then "while in use," then "only this time."
2. **Slice by context:** foreground and background separated, background requested on its own.
3. **Long-lived grants get reminders and expire:** notify on first background use, revoke after long disuse.
4. **Name the object and amount:** not "can transfer" but "to whom, how much."

Against Muse's docs (my view): once, task, site, and always cover time and partly context, finer than many agent products. The last two are missing. Always allow has no expiry, and I saw no mechanism like "remind me the first time this grant is used for something new." And the grant has no recipients (which buyers), fields (may it include the address), or conditions (price at least X). Robb's case falls right into those gaps.

One difference matters: phone permissions govern **what an app can read**; an agent like Muse also governs **what it says in your name**. The first leaks data; the second creates commitments: price, time, "I'm here." In OAuth terms that is closer to a payment than to reading a profile, and RFC 9396's first example is a transfer. [20]

## This isn't only Muse's problem

Today's always-on agents share a direction: broader capabilities, longer background runs, more speaking for you.

**Muse itself.** At Connect in late September, Meta said Muse is coming to its AI glasses (wake word, then tasks including buying products you see), will operate any app on a Mac, and connects to retailers and travel services such as Best Buy, Gap, Sephora, Walmart, Wayfair, and Expedia; Alexandr Wang said Meta received more than 1,500 applications in under a week after opening connectors to developers. [9] The Verge reported that Muse runs a persistent Linux VM per user, and developers easily coaxed it into exporting its whole root filesystem; Meta said this was not a breach, and Nat Friedman called it "intended behavior." [10] Earlier, Amazon blocked Muse from shopping on its store, citing among other things Muse not identifying itself while browsing and seemingly capturing customer credentials; [11] a macOS zero-day found by Patrick Wardle let local code use Muse's privileges to take pictures and write files, since patched; [12] and 404 Media reported that Meta rushed to fix a bug weeks before launch that could have let Muse escape its VM. [13] PCMag also notes that the week before, an Inc. writer found Muse reading their personal messages without permission. [4] Meta's response was that the messages integration is opt-in; the [macOS FDA post](/blog/macos-full-disk-access-consent-not-least-privilege/) covers this in more detail.

**Microsoft Copilot Autopilot.** In Microsoft's September 25 announcement, Autopilot is a "persistent, proactive and personal agent" that keeps working when you're not: give it a name, role, and goal, and it watches channels, follows up on threads, and reaches out to stakeholders for updates. It lives in your tenant "with its own identity, memory, computer and workspace," "with permissions, audit and governance behind it," and you set the objective and boundaries. [14]

**ChatGPT's Work tab.** OpenAI brought voice-driven agentic features to mobile: Plus and Pro users can draft email, summarize Slack messages, and use the cloud browser from the Work tab; Free and Go users get plugins and connected apps. [15]

Side by side (my view), the difference is **who governs the grants**. Autopilot sits in an enterprise tenant, where IT owns permissions, audit, and governance. Muse and ChatGPT on a phone face individuals, and the dialog is all the governance there is. An over-broad enterprise grant still has admins and audits behind it; for consumers, the dialog is the last gate. So consumer agent defaults should be more conservative than enterprise ones, not looser.

Also easy to miss: **the person on the other end**. The buyer, Usman, told the Guardian he thought he was talking to Robb the whole time. [2] Robb said: "But Muse is doing something else. It's almost imitating me." [2] Unlabeled messages also hit third parties who act on them. Amazon's complaint is at heart the same thing: an agent not saying who it is. [11]

## A permission checklist for always-on consumer agents

Worked backward from this incident (my view); each item is deterministic code, not in-the-moment model judgment.

1. **Store a grant as a six-part record, not a verb:** action, connector, recipient scope (e.g. only people already in the conversation), fields allowed to leave, conditions (e.g. price at or above the floor), expiry. The dialog can be simple; the stored record can't.
2. **First write action toward a stranger: confirm each time by default.** "Always allow" can exist, but it shouldn't be the default the first time a new kind of recipient appears. Android splitting out background location follows the same idea. [17]
3. **A personal-data egress gate.** Rules detect addresses, phone numbers, ID numbers, and precise locations in outbound content; if the recipient isn't allowlisted, stop and confirm per message regardless of tier. Same for templates: a template containing such fields can't run under "Always allow."
4. **Commitments and presence claims are their own class.** Deals, meeting times, payments, and "I'm here" get separate grants, confirmed each time by default, or the agent is simply never allowed to claim the owner is present.
5. **State the consequence in plain words.** Not "Allow Muse to send messages for you," but "Anyone who makes an offer will get a reply containing your pickup address, and you won't be asked again." Meta has said it will make the prompt clearer; [3] the bar should be that a user can say who gets what after reading it.
6. **Long-lived grants remind and expire.** The first time an "always" grant does something new (say, first time it includes the address), send a notification; revoke after long disuse. Phones already do both. [16][17]
7. **Revocation is a state change.** When the user says "stop sending that," the harness writes a permission change, shows it, and checks it before the next send.
8. **Label the sender.** Agent-sent messages carry a "sent by agent" mark, which is exactly Robb's suggestion. [3]
9. **Logs answer "why."** Each outbound entry in the activity log links to the grant that allowed it, so users and support don't have to ask the model. Muse already has an activity log; [6] what's missing is that link.

## Counterpoints and limits

- **If it asks at every step, the agent is useless.** TechRepublic's author puts it directly: the more an agent stops to ask, the less useful the automation; the more permission we give, the more a mistake costs. [5] The point is prompts at the **few high-risk points**, not more prompts.
- **Meta's conclusion is no breach of privacy controls.** From Meta's side, Robb did click Always allow and Muse acted within it. [3][5] My argument is precisely that "within the grant" and "within the user's expectation" can differ, and closing that gap is the product's and the harness's job.
- **The facts come mainly from one user.** Robb's statements, screenshots, and Muse's summary are the main material; Meta hasn't published logs. The price part also involved a display bug that has since been fixed. [3]
- **The system prompt is second-hand.** The Reddit line is unconfirmed by Meta, [8] and nothing here depends on it.

## Closing

Nobody hijacked the model, and it climbed no wall. It carried out one click's grant to the end. The problem is that the click was recorded as a rule with only "verb + connector + forever."

Always-on agents will increasingly speak and commit for us in the real world. The first design question isn't whether the model is sensible enough, but whether each grant, when written into the system, says to whom, what, under which conditions, until when, and how the user takes it back.

## References

1. The Verge, Jess Weatherbed, "Meta's Muse AI sent a YouTuber's address to a stranger," 2026-09-29: <https://www.theverge.com/ai-artificial-intelligence/1001886/meta-muse-ai-facebook-marketplace-security-concerns>
2. The Guardian, "Meta's AI agent Muse gives out user's home address without permission, sending buyer to his house," 2026-09-28: <https://www.theguardian.com/technology/2026/sep/28/metas-ai-agent-muse-home-address>
3. Business Insider, "A YouTuber figured out how his Muse AI agent shared his address with a total stranger," 2026-09-29: <https://www.businessinsider.com/muse-agent-facebook-marketplace-address-setting-meta-always-allow-2026-9>
4. PCMag, "Muse AI Shared Someone's Address, Error Traced to Confusion About Permissions," 2026-09-29: <https://au.pcmag.com/ai/120110/muse-ai-shared-address-error-traced-to-confusion-about-marketplace-permissions>
5. TechRepublic, "Meta AI Shares Seller's Address: Facebook Marketplace Buyer Shows Up at His Home," 2026-09-30: <https://www.techrepublic.com/article/news-meta-ai-facebook-marketplace-buyer-seller-address/>
6. Meta Help Center, "How Muse works with your guidance and approval": <https://www.meta.com/help/artificial-intelligence/1385290430137537/>
7. Meta Help Center, "How Muse works with Connectors": <https://www.meta.com/help/artificial-intelligence/1687253048996149/>
8. Reddit r/LocalLLaMA, "Meta's Muse agent (#1 in the App Store) system prompt," 2026-10-04 (second-hand, not confirmed by Meta): <https://www.reddit.com/r/LocalLLaMA/comments/1wx8ruy/metas_muse_agent_1_in_the_app_store_system_prompt/>
9. TechCrunch, "Everything new coming to Meta's AI agent Muse," 2026-09-23: <https://techcrunch.com/2026/09/23/everything-new-coming-to-metas-ai-agent-muse/>
10. The Verge, "Muse will apparently let you download its entire filesystem," 2026-09-24: <https://www.theverge.com/ai-artificial-intelligence/1000222/meta-muse-ai-filesystem>
11. The Verge, "Amazon blocks Meta's Muse AI agent," 2026-09-21: <https://www.theverge.com/tech/998078/amazon-blocks-meta-muse-ai-agent-shopping>
12. The Verge, "Meta patches Muse exploit that let attackers control the AI agent," 2026-09-22: <https://www.theverge.com/tech/998679/meta-muse-patch-zero-day-exploit-ai-agent>
13. The Verge (citing 404 Media), "Meta reportedly made a 'mad dash' to fix a Muse AI breakout bug weeks before launch," 2026-10-05: <https://www.theverge.com/tech/1004781/meta-reportedly-made-a-mad-dash-to-fix-a-muse-ai-breakout-bug-weeks-before-launch>
14. Microsoft, "Introducing the new Copilot with Home, Code and Autopilot," 2026-09-25: <https://blogs.microsoft.com/blog/2026/09/25/introducing-the-new-copilot-with-home-code-and-autopilot/>
15. TechCrunch, "ChatGPT mobile app gets voice-based agentic features," 2026-09-23: <https://techcrunch.com/2026/09/23/chatgpt-mobile-app-gets-voice-based-agentic-features/>
16. Android Developers, "Permissions updates in Android 11": <https://developer.android.com/about/versions/11/privacy/permissions>
17. Android Developers, "Request location permissions": <https://developer.android.com/develop/sensors-and-location/location/permissions>
18. Apple Support, "About privacy and Location Services in iOS, iPadOS, and watchOS": <https://support.apple.com/en-us/102515>
19. IETF, RFC 6749, "The OAuth 2.0 Authorization Framework," §3.3: <https://www.rfc-editor.org/rfc/rfc6749>
20. IETF, RFC 9396, "OAuth 2.0 Rich Authorization Requests": <https://www.rfc-editor.org/rfc/rfc9396>
21. The Verge, "Meta bets on AI agent Muse to catch up in AI race," 2026-09-08: <https://www.theverge.com/ai-artificial-intelligence/991216/meta-bets-on-ai-agent-muse-to-catch-up-in-ai-race>
