---
title: "BMAD-METHOD Guide: Breakthrough Agile AI-Driven Development"
description: "A comprehensive analysis of BMAD-METHOD's core architecture, deployment, agent roles, and four-phase agile methodology for mastering spec-driven AI development"
date: 2026-01-10
source: "https://github.com/bmad-code-org/BMAD-METHOD"
tags: ["AI Development", "Agile", "BMAD", "Spec-Driven Development", "Multi-Agent Systems"]
lang: "en"
translatedFrom: "bmad-method-guide"
---

As generative AI reshapes the software engineering landscape, the industry is experiencing a paradigm shift from "copilot-assisted coding" to "agentic development." Early AI-assisted development patterns, dubbed "vibe coding" by industry insiders, involve developers engaging in ad-hoc interactions with large language models (LLMs) through casual prompts, generating fragmented code. While highly efficient for prototyping, this approach often collapses when faced with enterprise applications, complex system architectures, and long-term maintenance needs due to context loss, hallucinations, and lack of systematic planning.

**BMAD Method (BMAD-METHOD)**, short for "Breakthrough Method for Agile AI-Driven Development," was born to address these challenges. It's not merely a toolset but a standardized agile development framework based on multi-agent systems (MAS). The methodology's core lies in combining "Spec-Driven Development (SDD)" with a "human-in-the-loop" governance structure, transforming LLM computational power into predictable, maintainable engineering outputs through rigorous process controls[^1].

### Evolution from "Vibe Coding" to "Agentic Agility"

"Vibe coding" is essentially non-deterministic improvisation. Developers rely on real-time conversations with chatbots, lacking persistent architectural blueprints. As conversation turns increase, the model's context window gradually fills with irrelevant information, causing it to "forget" critical business logic or technical constraints.

BMAD fundamentally changes this through **BMad Core** (Collaborative Optimization Reflection Engine). It enforces discipline similar to traditional agile development, but with AI agents handling the execution. In the BMAD framework, source code is no longer the sole source of truth—documentation (PRDs, architecture designs, user stories) is. Code becomes merely a downstream derivative of these specifications. This "docs-as-code" philosophy ensures logical consistency and traceability even at scales of millions of lines of code[^4].

### Core Architectural Pillars

The BMAD ecosystem is built on several non-negotiable architectural pillars that distinguish it from generic AI programming assistants (like GitHub Copilot or standard ChatGPT sessions):

| Core Pillar | Description & Value |
| :---- | :---- |
| **Specialized Agent Personas** | Rather than using generic "AI assistants," BMAD deploys over 12 specialized agents (Product Manager, Architect, Scrum Master, QA Engineer, etc.). Each agent has unique system prompts and specific context access permissions, preventing domain contamination. For instance, the Developer Agent isn't allowed to arbitrarily modify database schemas defined by the Architect Agent[^1]. |
| **Scale-Adaptive Intelligence** | The framework includes a taxonomy of planning depths, automatically switching between "Quick Flow" (Level 0-1, for bug fixes) and "Enterprise Flow" (Level 2+, for full platform development), auto-adjusting documentation rigor based on project complexity[^6]. |
| **Context Sharding & Token Economy** | To combat LLM context limits (even with 200k+ token models), BMAD employs "sharding" techniques that break monolithic PRDs and architecture docs into atomic "story files," ensuring Developer Agents only load strictly necessary context for current tasks. This mechanism reportedly saves up to 90% of token consumption while significantly improving model instruction-following[^9]. |
| **Platform Agnostic with IDE Integration** | While the methodology is universal, BMAD tooling is deeply optimized for agentic IDEs—particularly **Claude Code**, **Cursor**, **Windsurf**, and **VS Code**—building a seamless bridge between planning documents and codebases[^2]. |

## Installation & Environment Configuration

Deploying BMAD isn't simply installing software—it involves constructing a development environment that supports agent collaboration. Since the framework is in rapid iteration (especially transitioning from v4 to v6), understanding different version installation paths and dependencies is crucial.

### System Prerequisites

Before beginning deployment, users must ensure their host environment meets these hard requirements:

- **Node.js Environment**: BMAD's core orchestration tools are built on Node.js. While docs don't explicitly lock a single version, given modern build toolchain dependencies, **Node.js v20.0.0 or higher is strongly recommended**. Older versions (like v16 or v18) may cause runtime errors with certain packages, particularly those involving filesystem operations and async stream processing[^1].
- **Package Manager (NPM/NPX)**: As a standard Node.js component, NPM is used to fetch and execute BMAD's installation scripts. NPM v9+ is recommended.
- **Git Version Control**: BMAD deeply integrates Git workflows, relying on it for version tracking, branching, and change recording. Directories without initialized Git repos won't fully leverage BMAD's state tracking capabilities.
- **Agentic IDE**: This is BMAD's "container."
  - **Cursor**: Currently the optimal host environment—BMAD agents can be directly injected into Cursor's chat sidebar and utilize its Composer feature for multi-file editing.
  - **Claude Code**: Anthropic's terminal-level agent tool. BMAD can run as its sub-agent or toolset, ideal for CLI-preferring power users.
  - **VS Code**: Supports BMAD workflows through specific extensions, though the experience is slightly inferior to native agentic IDEs[^2].
- **LLM Access**: BMAD is essentially a sophisticated prompt engineering and context management system requiring underlying LLM reasoning capabilities. **Claude 3.5 Sonnet** or **GPT-4o** are recommended. Weaker models (like GPT-3.5 or smaller open-source models) easily suffer logic collapse or instruction forgetting when processing lengthy PRDs or complex architecture designs[^13].

### Installation Process & Version Selection Strategy

BMAD currently maintains two major version branches for different user needs. Installation is primarily done through npx (Node Package Execute) commands, avoiding version conflicts from global installations.

#### Recommended Path: BMAD v6 (Alpha Channel)

For all greenfield projects and users wanting to experience the latest "sharding architecture" and "automated testing integration," v6 Alpha is the officially recommended version. Despite being marked Alpha, its improvements in context management and workflow automation are revolutionary.

**Command:**

```bash
npx bmad-method@alpha install
```

**v6 Core Advantages:**

- **Step-File System**: v6 introduces finer-grained step control, allowing agents to pause and save state during long tasks[^15].
- **Phase 4 Refactor**: Complete rewrite of implementation phase (Phase 4) orchestration logic with stricter Sprint planning integration (supporting logical mapping to external tools like Jira, Linear)[^15].
- **Playwright Integration**: Native support for @seontechnologies/playwright-utils enables QA agents to auto-generate and execute end-to-end (E2E) tests[^8].

#### Legacy Path: BMAD v4 (Legacy Channel)

For maintaining legacy BMAD projects or users demanding extremely high stability who don't want frequent Alpha updates, v4 is available.

**Command:**

```bash
npx bmad-method install
# Or explicitly specify
npx bmad-method@latest install
```

**Warning**: v4's token efficiency when handling large-scale projects is far below v6. New users should choose carefully[^1].

### Project Initialization & "Workflow Activation"

The install command merely downloads BMAD's toolset to local cache or node_modules. To use it in a specific software project, "initialization" is required. This step is like `git init`—it generates the .bmad config folder in the project root and injects core agent definition files.

**Detailed Initialization Steps:**

1. **Open IDE Terminal**: Navigate to your project root (e.g., `cd ~/my-awesome-app`).
2. **Load Analyst Agent**: In your IDE's chat interface or terminal, first load the Analyst agent—typically by dragging the agents/analyst.md file to the chat box or using IDE-specific commands (like @Analyst)[^17].
3. **Execute Init Command**: Type and send: `*workflow-init`

This is a trigger phrase. Upon receiving it, the agent launches a built-in script or reasoning chain.

**Agent Behavior During Initialization:**

- **Stack Detection**: The agent reads project files like package.json (Node.js), requirements.txt (Python), Cargo.toml (Rust), or mix.exs (Elixir), attempting to understand whether the project is a "web app," "mobile app," or "data science script"[^8].
- **Track Recommendation**: Based on stack complexity and file count, the agent recommends one of three development tracks:
  - **⚡ Quick Flow**: For single-file scripts or quick fixes.
  - **📋 BMAD Standard Method**: For most full-stack applications.
  - **🏢 Enterprise Flow**: For large systems requiring compliance audits and high security[^6].

### Configuration File Parsing (config.yaml)

After initialization, a .bmad (or .bmad-core in v6) directory appears in the project root. Its config.yaml is the system's control center. Understanding and customizing this file is essential for power users.

**Typical Configuration Example**[^18]:

```yaml
project:
  name: "MyFintechPlatform"
  type: "python_django"  # Critical: tells agents to use Django best practices

agents:
  default: "python-dev"  # Default development agent
  available:
    - "python-architect"
    - "python-qa"
    - "security-auditor"  # Custom agent

quality:
  pre_commit:  # Checks enforced before code commits
    - "black ."
    - "isort ."
    - "pytest tests/unit"

paths:
  docs: "documentation/"  # Specify documentation location
  tests: "tests/"
```

**Deep Analysis:**

- **project.type**: This field isn't just a label—it determines which "implicit knowledge bases" agents load. Setting it to `elixir_phoenix` makes the Architect Agent prioritize OTP supervision trees and Actor models over Python threading models when designing[^18].
- **quality.pre_commit**: This is BMAD's first quality gate. Before marking a story "done," the Scrum Master Agent attempts to run these commands. If they fail, it instructs the Developer Agent to fix issues[^18].

## Agent Corps: Role Profiles & Interaction Psychology

BMAD's effectiveness depends on agent role specialization. We shouldn't view them as one "AI" but as a "virtual team" with different skill trees, permissions, and focuses. Here are in-depth profiles of core roles.

### The Analyst — Vision Crystallizer

- **Core Responsibility**: Transform vague business intent into structured product briefs.
- **Input**: User's verbal descriptions, scattered notes, competitor links.
- **Output**: product-brief.md.
- **Interaction Psychology**: The Analyst is designed with high curiosity and critical thinking. It won't accept simple instructions like "I want to build an Uber-like app" but will probe: "What's your target market? What's your core UVP? How will you solve the cold-start problem?" This is called "intent-driven discovery"[^8].

### The Product Manager (PM) — Scope Gatekeeper

- **Core Responsibility**: Transform product brief into detailed requirements document (PRD) and define MVP boundaries.
- **Core Skills**: Requirement prioritization (MoSCoW method), user persona simulation, epic definition.
- **Output**: PRD.md, epics.md, user_stories.md.
- **Key Behavior**: The PM Agent is programmed with "zero tolerance for scope creep." When users try adding complex non-core features in phase one, the PM suggests moving them to the backlog to ensure project deliverability[^4].

### The Architect — System Founder

- **Core Responsibility**: Translate business requirements into technical blueprints, bridging PM and Developer.
- **Core Skills**: Design pattern selection, database modeling, API contract definition, tech stack selection.
- **Output**: ARCHITECTURE.md, database_schema.sql, api_spec.json.
- **Interaction Psychology**: The Architect is conservative and rigorous, focusing on non-functional requirements (NFRs) like security, scalability, and performance. In v6, it also generates tech-stack.md, explicitly defining allowed and forbidden libraries to prevent unnecessary dependencies[^6].

### Scrum Master (SM) — Process Orchestrator

- **Core Responsibility**: Task sharding and progress tracking. SM is the actual executor of BMAD's "sharding mechanism."
- **Core Skills**: Breaking massive PRDs into atomic "story files."
- **Output**: stories/story-001-login.md, workflow-status.md.
- **Key Behavior**: SM maintains the project's "heartbeat," monitoring workflow-status.md to know which stories are TODO, IN_PROGRESS, or DONE. It's the only agent with a global view of overall progress[^4].

### The Developer — Focused Executor

- **Core Responsibility**: Write code.
- **Input**: **Only** single story files (like story-001.md) and architecture document summaries.
- **Output**: Source code files, unit tests.
- **Interaction Psychology**: The Developer Agent is designed as an "obedient craftsman." It's not encouraged to innovate at the architecture level. If it discovers requirement-architecture conflicts, it's instructed to "halt and report" rather than make autonomous decisions. This constraint is key to preventing AI-generated "spaghetti code"[^4].

### QA & Test Architect — Quality Defense Line

- **Test Architect**: Sets up testing frameworks (configuring Playwright, Jest, PyTest), writes test strategy documents.
- **QA Agent**: Executes tests and performs User Acceptance Testing (UAT) before code merges. In v6, QA agents can even use vision models to check UI layout issues[^6].

### UX Designer — Interaction Magician

- **Core Responsibility**: For frontend projects, the UX Designer generates wireframe descriptions or user journey maps based on PRDs.
- **Output**: UX_Design.md, ensuring Developer Agents focus on both functionality and layout/interaction logic when writing frontend code[^6].

## Four-Phase Agile Methodology: Full Lifecycle Battle

BMAD strictly divides the software development lifecycle (SDLC) into four phases. This isn't regressing to "waterfall" but establishing necessary checkpoints in AI development.

### Phase One: Analysis & Discovery

This phase's goal is avoiding "building the wrong product."

1. **Launch**: Load Analyst Agent.
2. **Interview**: Multi-round user-agent dialogue.
   - *User*: "I want an app for finding dog-walking buddies."
   - *Analyst*: "Understood. Is this geolocation-based? Is the business model subscription or pay-per-use? How will user privacy (like home addresses) be protected?"
3. **Output**: Generate product-brief.md—concisely summarizing product vision, core feature set, and success metrics. It's the foundation for all subsequent work[^13].

### Phase Two: Planning

This phase transforms vision into executable specifications.

1. **Launch**: Load PM Agent.
2. **Generate PRD**: PM reads product-brief.md and writes detailed PRD.
   - **Functional Requirements (FRs)**: E.g., "Users must be able to log in via Google OAuth."
   - **Non-Functional Requirements (NFRs)**: E.g., "Login response time shall not exceed 200ms."
3. **Define MVP**: PM marks which features belong in Phase 1 (MVP) vs. Phase 2.
4. **Epic & Story Breakdown**: PM preliminarily defines epics (like "User Auth System," "Mapping Service," "Payment System").
5. **Output**: A structured PRD document—one of BMAD's most important assets[^20].

### Phase Three: Solution Design

This phase is the core of technical decision-making.

1. **Launch**: Load Architect Agent.
2. **Tech Stack Confirmation**: Architect recommends tech stack based on PRD. For real-time location-sharing apps, it might recommend WebSocket or MQTT protocols with PostGIS databases.
3. **Database Design**: Generate detailed SQL DDL or ORM model code—crucial for preventing data structure chaos in subsequent development.
4. **API Design**: Define RESTful or GraphQL interface specs.
5. **Output**: ARCHITECTURE.md and db-schema.md. At this point, we haven't written a single line of application code, but the system skeleton is fully established[^6].

### Phase Four: Implementation

This is BMAD's true "magic"—what distinguishes it from ordinary AI coding. It employs a "shard-code-test" micro-loop.

#### Sharding — The Art of Context Management

Before entering coding, the Scrum Master (SM) intervenes.

- **Action**: SM reads PRD and architecture docs, creating independent files for each user story (e.g., docs/stories/story-001-auth.md).
- **Content**: This story file contains everything needed for the feature:
  - Specific acceptance criteria.
  - Related database table structure snippets.
  - Related API interface definitions.
  - Textual descriptions of design mockups.
- **Value**: This way, when the Developer Agent takes over, it only needs to load one KB-sized file instead of MB-sized project documentation. This directly results in **90% token savings** and extremely high code accuracy[^9].

#### Development & Testing Loop

1. **Task Selection**: User instructs Developer Agent: "Start Story 001."
2. **Load Context**: Agent reads story-001-auth.md and tech-stack.md.
3. **Test-Driven Development (TDD)**: (Optional but recommended) Agent first writes failing unit tests.
4. **Implement Code**: Agent writes business logic code.
5. **Self-Validation**: Developer Agent runs tests.
6. **QA Intervention**: (In enterprise flow) Load QA Agent for independent verification.
7. **Mark Complete**: SM updates workflow-status.md, marking Story 001 as DONE and unlocking Story 002 that depends on it[^4].

## Advanced Workflows & Enterprise Applications

BMAD's flexibility allows adaptation to projects of different scales.

### Quick Spec Flow

For fixing simple UI bugs, the full four-phase flow is overkill. BMAD provides a "fast lane":

- **Scenario**: Fix "login button wrong color."
- **Flow**:
  1. Load Developer Agent.
  2. Run Quick Spec command.
  3. Agent quickly scans current code, generating a micro tech spec containing only the modification point.
  4. After user confirmation, agent directly implements fix.
- **Time**: Usually under 5 minutes. This makes BMAD equally suitable for daily maintenance (brownfield development)[^6].

### Enterprise Compliance Flow

For regulated industries like finance and healthcare, BMAD's "enterprise track" adds extra layers:

- **Security Auditor Agent**: Intervenes during architecture design for threat modeling.
- **Code Review Gates**: Mandates all PRs pass static code analysis (SonarQube, etc.) and coverage checks.
- **Documentation Audit**: Ensures every code change has corresponding PRD change records, meeting audit traceability requirements[^6].

## IDE Integration Deep Dive

BMAD's user experience heavily depends on its host IDE. Here's deep integration guidance for mainstream tools.

### Cursor Integration: Unleashing "Composer" Potential

Cursor is currently the most suitable IDE for BMAD because its Composer mode (Command+I / Ctrl+I) allows AI to edit multiple files simultaneously.

- **Technique**: In Cursor, you can @ generated story-xxx.md files directly in the chat box.
- **Command**: "Based on @story-001-login.md and @ARCHITECTURE.md, implement login functionality using Composer mode. Strictly follow specifications in @tech-stack.md."
- **Advantage**: Cursor automatically parses file references and generates consistent code across models.py, views.py, and urls.py according to BMAD's architecture constraints[^2].

### Claude Code Terminal Integration

For CLI-preferring developers, Anthropic's Claude Code is a powerful tool.

- **Configuration**: You can configure BMAD's common commands as Claude Code slash commands.
- **Workflow**:
  1. Run `claude` in terminal.
  2. Type `/plan` (maps to BMAD's PM process).
  3. Type `/code story-001` (maps to BMAD's development process).
- **Advantage**: Claude Code is more direct and faster at handling filesystem operations and running local test commands (like `npm test`) than Cursor[^28].

## Customization & Extension: BMad Builder

BMAD's true power lies in extensibility. Through the **BMad Builder** module, users aren't limited to official agents but can create "digital employees" fitting their team culture.

### Creating Custom Agents

Users can create new .md or .yaml files in the .bmad/agents/ directory to define agents.

**Example: Creating an "SEO Specialist" Agent**

```markdown
# Role: SEO Specialist

# Context
You are an expert in Search Engine Optimization for Single Page Applications (SPA).

# Responsibilities
- Review all frontend routes generated by the Developer.
- Ensure proper <meta> tags and structured data (JSON-LD) are present.
- Generate sitemap.xml strategies.

# Constraints
- Do NOT modify business logic.
- Always follow Google's Core Web Vitals guidelines.
```

Once saved, this agent can be loaded and invoked like official agents, participating in workflows[^6].

### Custom Workflows

Users can also orchestrate cross-agent task chains. For example, create a "content publishing workflow" sequentially calling "Content Writer Agent," "SEO Specialist Agent," and "CMS Publisher Agent" for fully automated content operations[^7].

## Competitive Analysis: BMAD vs. Spec-Kit vs. OpenSpec

In the emerging "spec-driven development" field, BMAD isn't the only player, but it's currently the most comprehensive one.

| Feature | BMAD-METHOD | Spec-Kit | OpenSpec | Traditional GitHub Copilot |
| :---- | :---- | :---- | :---- | :---- |
| **Core Concept** | Full lifecycle agentic agile team | Spec file generation tool | Universal spec file standard | Code completion & assistance |
| **Agent Roles** | 12+ specialized roles (PM, Architect, QA, etc.) | None (mainly single LLM) | None (mainly focused on schema) | Single "assistant" role |
| **Workflow Management** | Built-in Scrum/Sprint process | Simple task lists | None | None |
| **Context Management** | Automatic sharding | Manual management | IDE-dependent | IDE auto-inference |
| **Learning Curve** | Steep (requires agile methodology knowledge) | Medium | High (requires schema learning) | Gentle |
| **Use Case** | Building complex systems from scratch (0→1) | Generating specific feature specs | Cross-tool spec exchange | Writing specific function code |

**Conclusion**: Spec-Kit and OpenSpec are more like tools, focused on solving "how to write good prompts"; BMAD is a framework focused on solving "how to organize an AI team." For enterprise development, BMAD's structural advantages are extremely apparent[^3].

## Best Practices & Troubleshooting

Even with a powerful framework, improper use can lead to failure. Here are pit-avoidance guidelines based on community experience.

### Common Pitfalls

- **Context Overload**: Users try pasting all project files in one conversation.
  - *Consequence*: LLM ignores instructions, produces hallucinations.
  - *Solution*: Strictly follow BMAD's sharding mechanism. Trust Scrum Master's story file splits. If story files are too large, have SM split again[^9].
- **Role Overstepping**: Users directly ask Developer Agent to modify database structure.
  - *Consequence*: Database-architecture document inconsistency causes subsequent development chaos.
  - *Solution*: Once architecture changes are involved, must switch back to Architect Agent to update docs, then have Developer Agent execute[^7].
- **Ignoring Tests**: Users skip QA phase for speed.
  - *Consequence*: Bug accumulation causes technical debt explosion later.
  - *Solution*: Configure mandatory pre_commit checks in config.yaml[^18].

### Troubleshooting

- **Issue**: Running `*workflow-init` shows no response.
  - *Cause*: Usually IDE file listening permissions aren't enabled, or Node.js version too low.
  - *Fix*: Check Node version (`node -v`), ensure >v20. Restart IDE terminal[^11].
- **Issue**: Agent-generated code references nonexistent libraries.
  - *Cause*: tech-stack.md not properly configured or not loaded.
  - *Fix*: Check if architecture phase generated tech stack docs and ensure Developer Agent's system prompt includes instructions to read that file[^24].

## Conclusion: The Future of AI-Native Development

BMAD-METHOD represents a critical turning point in software engineering. It marks our transition from the "artisan era" (manually writing every line of code) to the "industrial era" (designing production lines where machines produce code).

In this new paradigm, human developers' core competitiveness is no longer mastering syntax but system design, requirements analysis, and AI output review capacity. BMAD provides scaffolding helping developers adapt to this role transformation ahead of time. As future "agent stores" emerge, we foresee BMAD becoming a universal bus connecting various specialized AI experts, redefining what "software team" means[^9].

For any developer or technical manager hoping to stay competitive in the AI wave, mastering BMAD isn't just learning a new tool—it's a rehearsal for future development models.

---

## References

[^1]: [BMAD-METHOD/README.md at main · bmad-code-org/BMAD-METHOD](https://github.com/bmad-code-org/BMAD-METHOD/blob/main/README.md)
[^2]: [AI Software Development Team in Your IDE: The BMAD Method - YouTube](https://www.youtube.com/watch?v=Q3uhN4lno4A)
[^3]: [What Is Spec-Driven Development (SDD)? In-Depth Comparison](https://redreamality.com/blog/-sddbmad-vs-spec-kit-vs-openspec-vs-promptx/)
[^4]: [AI Agile Team Builds a FULL App Step by Step Tutorial - YouTube](https://www.youtube.com/watch?v=YLGrENURe98)
[^6]: [bmad-code-org/BMAD-METHOD: Breakthrough Method for Agile Ai Driven Development](https://github.com/bmad-code-org/BMAD-METHOD)
[^7]: [A Comparative Analysis of AI Agentic Frameworks | by Marius Sabaliauskas](https://medium.com/@mariussabaliauskas/a-comparative-analysis-of-ai-agentic-frameworks-bmad-method-vs-github-spec-kit-edd8a9c65c5e)
[^8]: [Releases · bmad-code-org/BMAD-METHOD - GitHub](https://github.com/bmad-code-org/BMAD-METHOD/releases)
[^9]: [From Token Hell to 90% Savings: How BMAD v6 Revolutionized AI-Assisted Development](https://medium.com/@hieutrantrung.it/from-token-hell-to-90-savings-how-bmad-v6-revolutionized-ai-assisted-development-09c175013085)
[^11]: [The BMAD Method: A Framework for Spec Oriented AI-Driven Development](https://recruit.group.gmo/engineer/jisedai/blog/the-bmad-method-a-framework-for-spec-oriented-ai-driven-development/)
[^13]: [The Complete Enterprise Million-Dollar App Development Framework](https://www.reddit.com/r/vibecoding/comments/1oxevhv/the_complete_enterprise_milliondollar_app/)
[^15]: [Gitingest - bmad-code-org/BMAD-METHOD](https://gitingest.com/bmad-code-org/BMAD-METHOD)
[^17]: [BMad Method V6 Quick Start Guide - GitHub](https://github.com/bmad-code-org/BMAD-METHOD/blob/main/docs/modules/bmm-bmad-method/quick-start.md)
[^18]: [BmadElixir v0.1.1 - Hexdocs](https://hexdocs.pm/bmad_elixir/)
[^20]: [The Official BMad-Method Masterclass - YouTube](https://www.youtube.com/watch?v=LorEJPrALcg)
[^24]: [Claude Code not following Dev-Agent instructions · Issue #387](https://github.com/bmad-code-org/BMAD-METHOD/issues/387)
[^28]: [AI-driven development workflow system built on Claude Code Sub-Agents](https://github.com/zhsama/claude-sub-agent)
