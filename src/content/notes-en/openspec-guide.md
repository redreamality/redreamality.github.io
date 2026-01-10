---
title: "OpenSpec: Deep Research Report on Spec-Driven Development (SDD) in AI-Assisted Programming"
description: "Comprehensive analysis of OpenSpec's architecture, design philosophy, and practical implementation for AI-powered software development with Brownfield-first strategy"
date: 2025-01-10
source: "https://github.com/Fission-AI/OpenSpec"
tags: ["openspec", "spec-driven-development", "ai-programming", "brownfield", "markdown-based"]
lang: "en"
---

# OpenSpec: Deep Research Report on Spec-Driven Development (SDD) in AI-Assisted Programming

## Introduction: Paradigm Shift in AI-Assisted Programming

With the exponential growth of Large Language Model (LLM) capabilities, the software engineering field is experiencing profound transformation. Developers are shifting from traditional character-by-character coding to intent-driven orchestration. However, this transition comes at a cost. Current AI programming practices commonly exhibit a phenomenon called "Vibe Coding"—developers interact with AI through unstructured natural language conversations, with requirements scattered across lengthy chat records, lacking persistence and systematic organization.

### The Dilemma of "Vibe Coding"

While "Vibe Coding" lowers entry barriers, its unsustainability in complex projects becomes increasingly apparent. When context windows fill up, AI often exhibits "forgetfulness" symptoms, leading to logical discontinuities, code rollbacks, and severe hallucinations. Research shows that when context utilization exceeds 40%, AI performance significantly degrades, with previous requirement details forgotten or distorted in subsequent conversations. Additionally, this approach makes code review extremely difficult since reviewers cannot compare generated code against explicit, documented requirements.

### OpenSpec's Genesis and Mission

Against this backdrop, OpenSpec emerges as a standardized "Spec-Driven Development" (SDD) framework. It's not merely a tool but an engineering methodology aimed at solving context loss and uncontrollability in AI programming through "Structure before Code" principles.

OpenSpec's core value proposition lies in its "Brownfield-first" strategy. Unlike many AI tools focusing on building new applications from scratch (Greenfield, 0→1), OpenSpec is specifically designed for evolving existing codebases (1→n). It ensures change atomicity and auditability by physically isolating current system state (Source of Truth) from proposed changes (Change Proposals) in the filesystem. This architecture enables AI agents to become intelligent collaborators capable of understanding, planning, and executing clear tasks rather than being mere black-box code generators.

## Core Architecture & Design Philosophy

OpenSpec's architecture reflects the combination of minimalism and pragmatism. It rejects complex database dependencies, instead adopting a Markdown-based filesystem storage solution. This design ensures specifications coexist with source code in version control systems (like Git), becoming "Living Documentation."

### Repository Structure Analysis

When OpenSpec initializes in a project, it injects a standardized directory structure serving as AI agents' "external long-term memory." This structure is not only human-readable but optimized for machine parsing.

#### Root Directory Structure Overview

A typical OpenSpec project contains these core components:

```
project_root/  
├── openspec/  
│   ├── AGENTS.md        # AI agents' instruction sets and behavioral guidelines  
│   ├── project.md       # Global project context, tech stack, and specifications  
│   ├── specs/           # Current system's "Source of Truth"  
│   │   ├── auth-login/  # Capability-organized specification folders  
│   │   │   └── spec.md  
│   │   └── payment/  
│   │       └── spec.md  
│   └── changes/         # Active change proposals (workspace)  
│       └── add-oauth-login/  
│           ├── proposal.md    # Change intent and high-level design  
│           ├── design.md      # Technical architecture decisions  
│           ├── tasks.md       # Atomic implementation task checklist  
│           └── specs/         # Specification deltas (additions/modifications/removals)
```

#### Source of Truth (specs/)

The specs/ directory is OpenSpec's core asset library. Organized by functional modules (Capabilities), it stores current system's business logic and technical constraints. For example, auth-login/spec.md might define login flow input validation rules, error handling mechanisms, and security requirements in detail. When AI agents receive modification tasks, they first retrieve from this directory to understand existing system behavior. This mechanism effectively prevents AI from accidentally breaking one function's logic while modifying another, solving "catastrophic forgetting" problems in long conversations.

#### Change Workspace (changes/)

OpenSpec introduces a Git-branch-like change management model. All feature requests or bug fixes initially manifest as independent subdirectories under changes/ directory. This isolation is crucial—it allows developers and AI to iterate and validate requirements repeatedly without contaminating the main specification library. Only after changes are implemented and accepted are these temporary specification deltas merged back to the specs/ main directory.

#### Agent Interface (AGENTS.md)

The AGENTS.md file is called "README for Robots." Unlike human-facing README.md, it contains fine-grained instructions for AI models, guiding them on how to read project context, format outputs, and follow OpenSpec workflow state machines. This file's existence gives OpenSpec extremely high generality—even AI tools not natively integrated with OpenSpec can follow specifications for development as long as they can read this file.

### State Machine Model & Lifecycle

OpenSpec enforces a strict software evolution state machine, dividing development into four irreversible phases:

| Phase | Core Action | Output | Purpose |
|-------|-------------|--------|---------|
| **1. Proposal** | /openspec:proposal | proposal.md, tasks.md, design.md | Clarify intent, create plan, decompose tasks |
| **2. Definition** | openspec validate | specs/ (Deltas) | Write specific specification deltas (add/modify/remove) |
| **3. Apply** | /openspec:apply | Source code changes | AI writes code based on task list and specifications |
| **4. Archive** | /openspec:archive | Merged specs/ | Solidify changes as permanent documentation, cleanup workspace |

This structured lifecycle ensures documentation never lags behind code, fundamentally solving software engineering's "document rot" problem.

## Environment Configuration & System Initialization

OpenSpec, as a Node.js-based command-line tool (CLI), has an installation and configuration process designed to be as lightweight as possible, requiring no complex dependency chains or specific SaaS platform API keys—crucial for enterprise environments emphasizing data privacy.

### Installation Prerequisites & Steps

To run OpenSpec, the host system must have Node.js installed, with version v20.19.0 or higher recommended to ensure support for the latest filesystem operation APIs.

**Global Installation**: OpenSpec is typically installed globally via npm to enable calling from any project path:

```bash
npm install -g @fission-ai/openspec@latest
```

After installation, verify completeness with `openspec --version` command.

### Interactive Initialization

After entering the project root directory, run initialization command to start configuration wizard:

```bash
openspec init
```

This process is context-aware. OpenSpec guides users to select the primary AI-assisted tools used by their current development team. Supported options include:

- **Claude Code**: Anthropic's command-line agent
- **Cursor**: AI-integrated IDE
- **GitHub Copilot**: Widely-used code completion tool
- **Windsurf / Kilo Code**: New AI-native editors
- **Others (Generic)**: For unlisted tools, system generates generic AGENTS.md instructions

**Configuration Generation Logic**: If users select "Cursor" or "Claude Code," OpenSpec automatically configures tool-specific slash commands (like /openspec:proposal). For example, for GitHub Copilot CLI, it generates specific prompt templates under .github/prompts/; for Windsurf, it generates workflow definitions under .windsurf/workflows/.

**Non-Interactive Initialization (CI/CD Friendly)**: For automation scripts or batch deployments, use parameters to skip the wizard:

```bash
openspec init --tools claude,cursor
```

This makes OpenSpec easy to integrate into enterprise-level project scaffolding.

### Key Configuration Files Deep Dive

After initialization, the two most critical static configuration files are openspec/project.md and openspec/AGENTS.md.

1. **Global Context Anchor: project.md**: This file is more than project introduction—it's AI's worldview for understanding the entire engineering project. Developers should thoroughly describe:
   - **Tech Stack**: Explicit version numbers (TypeScript 5.0, React 18) to prevent AI from using outdated or incompatible syntax
   - **Architecture Patterns**: "All database access must go through Repository layer, strictly prohibit direct queries in Controller"
   - **Code Standards**: Naming conventions, directory structure preferences
   - **Business Domain Knowledge**: Industry-specific terminology and rules
   
   This pre-configured context significantly reduces AI "hallucinations," making generated code more aligned with project conventions.

2. **Agent Behavioral Guidelines: AGENTS.md**: This file contains special XML-style markup blocks ... maintained automatically by openspec update command. It instructs AI: "When user requests contain words like 'plan,' 'proposal,' or 'specification,' must first read this file." This mechanism injects a fundamental system instruction for AI, forcing entry into OpenSpec's workflow mode.

## OpenSpec Workflow Comprehensive Analysis

OpenSpec reconstructs the development process into a closed engineering loop. This section details operational specifics and underlying logic for each phase.

### Phase 1: Proposal & Planning (Proposal)

In traditional development, developers might directly tell AI: "Add login functionality with two-factor authentication." Under OpenSpec workflow, this request transforms into a structured proposal process.

**Trigger Method**: In Cursor or Claude Code, input:
```
/openspec:proposal Add user authentication with 2FA
```
Note: Different tools may have slightly different trigger prefixes, like Kilo Code using /openspec-proposal.md.

**AI's Reasoning Process**:

1. **Context Retrieval**: AI reads project.md and relevant files under specs/ directory, analyzing existing system's authentication module state.
2. **Scaffold Generation**: AI creates new directory named add-user-auth under openspec/changes/.
3. **Document Generation**:
   - **proposal.md**: Elaborates change motivation, scope, and expected impact—equivalent to simplified PRD (Product Requirements Document)
   - **tasks.md**: AI-generated "action guide" that splits complex tasks into indivisible atomic steps. For example: "1.1 Add OTP key field to user table," "2.1 Implement TOTP generation algorithm," "3.1 Update frontend login form UI." This decomposition is crucial, allowing AI to "check off" completed steps during subsequent implementation, maintaining progress control.
   - **design.md** (optional): Records technical decisions like which encryption library to choose, database indexing strategies, etc.

### Phase 2: Specification Definition & Delta (Spec Deltas)

This is where OpenSpec diverges from ordinary task management tools. In this phase, AI must explicitly state how it plans to modify system behavior. OpenSpec adopts "Delta" mode to describe requirement changes.

**Delta Types**:
- **ADDED**: Brand new feature requirements
- **MODIFIED**: Modifications to existing logic—must include complete modified requirement text
- **REMOVED**: Deprecated features

**Example: Two-Factor Authentication Specification Delta**

AI generates content like this in changes/add-user-auth/specs/auth/spec.md:

## ADDED Requirements

### Requirement: Two-Factor Authentication

Users must provide a second verification factor when logging in.

#### Scenario: OTP Verification Required

* **GIVEN** User has 2FA enabled  
* **WHEN** Correct username and password provided  
* THEN System should return OTP challenge request instead of directly issuing token  

This structured GIVEN/WHEN/THEN format (similar to Cucumber/Gherkin) makes requirements both clear and testable.

**Validation**: Before entering coding, developers run validation command:
```bash
openspec validate add-user-auth
```

This command strictly checks specification file syntax: Are necessary Scenarios included? Are standardized terms (SHALL/MUST) used? This validation layer is equivalent to static checking before code compilation, intercepting vague requirements.

### Phase 3: Implementation & Coding (Apply)

When specifications pass human review and machine validation, true coding work begins.

**Execute Command**: `/openspec:apply add-user-auth`

**AI's Execution Logic**:
1. **Read Tasks**: Load tasks.md
2. **Reference Specifications**: AI treats proposal.md and deltas in specs/ as unbreakable instructions
3. **Step by Step**: AI modifies source code files in order according to task list. It doesn't "feel" code but strictly implements behavior defined in specifications
4. **State Synchronization**: After completing each task, AI might update status markers in tasks.md

Since AI only focuses on "how to implement" rather than "what to implement" in this phase, cognitive load significantly decreases, and code generation accuracy notably improves.

### Phase 4: Archiving & Merging (Archive)

After feature development completes and passes testing, change lifecycle enters its final phase.

**Execute Command**: `/openspec:archive add-user-auth --yes`

**System Actions**:
1. **Specification Merge**: CLI tool intelligently merges specification deltas from changes/ directory to main directory. Added requirements are appended, modified requirements overwrite old versions.
2. **Cleanup**: add-user-auth directory is removed or moved to archive area.
3. **Single Source of Truth Update**: At this point, specs/ directory accurately reflects system latest state including new features, ready for next iteration.

## AI Agent Integration & Tool Ecosystem

OpenSpec's strength lies in its cross-platform compatibility. It integrates seamlessly with mainstream AI programming tools through specific adaptation layers.

### Cursor Integration

Cursor is currently one of OpenSpec's most完善ly supported IDEs.

- **Principle**: OpenSpec utilizes Cursor's custom Slash Command functionality
- **Experience**: Users don't need to leave editor, can input /openspec:proposal directly in Chat window to invoke workflow. OpenSpec-generated files (like proposal.md) directly open in editor for user review and modification
- **Advantage**: Cursor's AI understands filesystem context well, making multi-file modifications (like simultaneously updating frontend and backend code) smooth

### Claude Code Integration

Claude Code provides powerful reasoning capabilities, especially suitable for handling complex refactoring tasks.

- **Principle**: OpenSpec registers custom commands through Claude Code's config.toml or similar mechanisms
- **Characteristics**: When executing /openspec:proposal, Claude Code exhibits extremely strong logical planning ability. It can recursively read existing code, with generated design.md often containing profound architectural insights
- **Note**: When using Claude Code, sometimes encounter "Plan Mode" restrictions preventing direct file operations (like archiving). Explicit authorization required or manual CLI command execution

### GitHub Copilot CLI Integration

- **Principle**: OpenSpec generates .prompt.md files under .github/prompts/ directory
- **Usage**: Copilot CLI automatically recognizes these prompt files, converting them into slash commands. This allows OpenSpec workflows to seamlessly embed into GitHub's native ecosystem, facilitating enterprise user adoption

### Windsurf & Kilo Code

These emerging tools often have automatic workflow discovery capabilities.

- **Configuration**: openspec init places definition files under directories like .kilocode/workflows/
- **Automation**: In these tools, /openspec-apply can trigger more advanced agent behaviors, even configuring automatic unit test execution after code generation, only marking tasks complete after tests pass

## Advanced Application Patterns & Best Practices

For large teams or legacy projects, OpenSpec provides advanced patterns to handle complex scenarios.

### "Retrofitting" Mode

Facing legacy code without documentation, OpenSpec can serve as a reverse engineering tool.

- **Operation**: Create change proposal named baseline
- **Instruction**: Prompt AI to "read src/legacy-module source code and reverse-generate OpenSpec specification files describing its current behavior"
- **Value**: This not only generates documentation but provides refactoring baseline. In subsequent refactoring, can ask AI to ensure new implementations still conform to these baseline specifications, guaranteeing behavioral consistency

### Token Efficiency Optimization

In large projects, directly throwing all code to AI instantly exhausts tokens. OpenSpec achieves "on-demand loading" through structured files:

- **Strategy**: AI only reads project.md (global overview), tasks.md (current task), and related spec.md (specific requirements)
- **Effect**: This streamlined context input enables AI to focus on current slice, significantly reducing token consumption while improving response speed and accuracy

### Team Collaboration & CI/CD Integration

OpenSpec's filesystem architecture naturally supports Git workflows.

- **Code Review**: When submitting PRs, reviewers can see not only code (diff) but also proposal.md and specs/ under changes/ directory. This enables reviewers to first judge "intent correctness" then examine "implementation correctness"
- **Automated Validation**: Can add openspec validate step in CI pipeline, mandating all submitted specification files conform to syntax specifications, preventing low-quality requirement documents from entering repository

## Troubleshooting & Common Issues Guide

Despite OpenSpec's rigorous processes, practical operation may encounter problems. Here are diagnostic and repair solutions for common failures.

| Problem | Possible Cause | Solution |
|---------|---------------|----------|
| **AI ignores specifications and writes code directly** | Context overload or AGENTS.md not read | 1. Run openspec update to refresh instructions. 2. Explicitly require in prompt: "Read @openspec/AGENTS.md first" |
| **Command openspec not found** | npm global path not added to PATH environment variable | Check npm list -g --depth=0, add Node bin directory to Shell configuration (like .zshrc) |
| **Cannot archive (Plan Mode)** | AI agent in security-restricted mode, prohibiting file deletion operations | 1. Try authorizing in Chat. 2. Downgrade to manually running openspec archive <id> in terminal |
| **Specification validation fails** | Specification file missing Scenario or incorrect Header format | Run openspec validate to see specific errors, ensure each Requirement contains at least one Scenario |
| **AI generates hallucinations/references non-existent libraries** | Tech stack versions not explicitly specified in project.md | Update project.md, explicitly specify dependency library versions (like "Use React 18, not 16") |

## Competitive Analysis: OpenSpec vs. SpecKit vs. Kiro

In AI-assisted development field, OpenSpec isn't the only choice. Comparison clarifies its applicable scenarios.

| Feature Dimension | OpenSpec | SpecKit | Kiro |
|------------------|----------|---------|------|
| **Core Scenario** | **Brownfield Development (1→n)**: Excels at iterating on existing codebases | **Greenfield Development (0→1)**: Excels at building new applications from scratch | Full-integrated IDE experience |
| **Change Management** | **Centralized**: All change-related files in one independent changes/ folder | **Distributed**: Updates scattered across multiple specification files | UI-based management with higher file invisibility |
| **Lightweight Degree** | **Extremely High**: Pure CLI, Markdown-based, no server dependencies | **Medium**: Generates large amounts of scaffolding files | **Low**: Requires specific IDE environment or SaaS accounts |
| **Cost & Privacy** | **Free/Open Source**: No API Key, local data | **Free/Open Source** | Partial paid features/cloud sync required |
| **Design Philosophy** | Structure First | Spec First | Visual SDD |

**Deep Comparison Analysis**: OpenSpec's greatest advantage lies in its "change isolation" mechanism. SpecKit tends to directly modify main specification files, which can cause conflicts in multi-person collaboration. OpenSpec's changes/ directory design makes each feature development like an independent micro-project, only merging at the final moment. This design aligns better with modern software engineering's Git Flow or Trunk Based Development patterns.

## Conclusion & Outlook

OpenSpec represents an important maturation evolution in AI-assisted software development. It deeply recognizes that while LLMs possess powerful code generation capabilities, they lack inherent mechanisms for maintaining long-term architectural consistency and business logic integrity. By introducing lightweight but strict file structures and state machine workflows (Proposal → Apply → Archive), OpenSpec successfully transforms "Vibe Coding's" arbitrariness into repeatable, auditable engineering processes.

For teams committed to deeply integrating AI into core development processes, OpenSpec provides a low-cost, high-return solution. It not only solves token context limitations and hallucination problems but, more importantly, re-establishes "specifications" as development's core—code becomes implementation details, while specifications become the system's soul. As AI agent capabilities further advance, frameworks like OpenSpec that can bridge human intent and machine execution will inevitably become future software industry's infrastructure.
