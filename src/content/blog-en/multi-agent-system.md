---
title: 'Multi-Agent Systems'
pubDate: 2025-02-09T00:00:00.000Z
description: 'A comprehensive research report on multi-agent systems, covering architecture design, planning, memory management, interaction principles, and evaluation metrics.'
author: 'Remy'
tags: ['multi-agent-systems', 'artificial-intelligence', 'ai', 'constraint-satisfaction-problem']
lang: 'en'
---
## 1. Multi-Agent Systems Overview
- Definition: What is an agent?
- Concept clarification: Differences and connections between workflow and (multi-)agent systems

## 2. Design Patterns for Multi-Agent Systems

### 2.1 Fundamentals: From Workflow to Agents
- How to distinguish and choose between workflow vs agent architecture
- From simple to complex: Progressive construction methodology

### 2.2 Key Components of Multi-Agent Systems

- **Agents**: Systems where LLMs can dynamically guide their own processes and tool usage, capable of autonomous control over task completion methods.

- **Environment**: The external world in which agents operate, which agents can perceive and act upon. The environment can be a software world or physical spaces like factories, roads, power grids, etc.

- **Interactions**: Agents communicate through standardized communication languages. Depending on system requirements, interactions between agents include various forms such as cooperation, coordination, negotiation, etc.

- **Organization**: Agents can be organized through hierarchical control or self-organize based on emergent behavior.

## 3. Key Modules
### 3.1 Basic Components

* **Multi-Agent System Structures**:

  * **Equi-Level Structure**: Studies agent systems operating at the same level, such as DMAS (Chen et al., 2023).

  * **Hierarchical Structure**: Explores hierarchical structures with leader and follower roles, such as Stackelberg games (Von Stackelberg, 2010; Conitzer & Sandholm, 2006; Harris et al., 2023).

  * **Nested Structure**: Studies nested or hybrid structures, such as (Chan et al., 2023).

  * **Dynamic Structure**: Discusses dynamic structures of multi-agent systems, such as (Talebirad & Nadiri, 2023).

* **Planning**:

  * **Global Planning**: Involves understanding overall tasks and decomposing tasks into subtasks, as well as coordinating workflows between agents.

  * **Single-Agent Task Decomposition**: Within individual agents, task decomposition involves breaking down large tasks into a series of manageable small tasks.

* **Memory/Context Management**:

  * **Short-term Memory**: Immediate, temporary memory used during conversations or interactions.

  * **Long-term Memory**: Memory that stores historical conversations and responses.

  * **External Data Storage**: Such as RAG (Lewis et al., 2020), used for supplementary information sources.

  * **Episodic Memory**: Memory involving a series of interactions in multi-agent systems.

  * **Consensus Memory**: In multi-agent systems, serves as a unified source of shared information.

[cite] LLM Multi-Agent Systems: Challenges and Open Problems

### 3.2 Framework Selection
- Key considerations for framework selection: when to use, when to avoid
- Introduction to existing general frameworks: langgraph, autogen, swarm
- Selection recommendations

### 3.3 Interaction Design for Multi-Agent Applications
- Interaction design principles:
  - Task-oriented: Multi-agent applications should customize optimal interaction interfaces for each task, conforming to workflow design rather than using chat windows for everything.
  - Detail abstraction: Users don't need to understand internal implementation details of agents, only their external behavior and interaction methods
  - Simple interaction: Interactions between users and agents should be as simple as possible, avoiding complex operational procedures
  - Adequate feedback: Agent behavior and decision-making processes should have clear feedback
  - Controllability: Users should be able to intervene and adjust agent behavior

- Typical product case analysis:
  - Multi-agent applications (code development): cline, devin, cursor agent
  - Multi-agent applications (writing): deep researcher
  - Multi-agent building platforms: coze, langgraph studio



### 3.4 Evaluation Methods, Datasets, and Metrics
- Benchmarks
  - Public benchmarks:
    - ToolBench: GitHub - OpenBMB/ToolBench: [ICLR'24 spotlight] An open platform for training, serving, and evaluation
      Large-scale tool calling instruction dataset supporting multi-step reasoning and real API integration
    - SWE-bench: https://github.com/princeton-nlp/SWE-bench
      Benchmark for evaluating LLM's ability to solve GitHub issues, containing 2,294 Python code fixing tasks
    - Mind2Web: https://huggingface.co/datasets/osunlp/Mind2Web
      General web interaction dataset covering diverse DOM operations and user trajectories
    - WebArena: GitHub - web-arena-x/webarena: Code repo for "WebArena: A Realistic Web Environment for Building Autonomous Agents"
      Real web environment testing platform integrating 4 applications and tool libraries
    - AgentInstruct: https://huggingface.co/datasets/THUDM/AgentInstruct
      High-quality agent instruction dataset enhancing model task generalization capabilities

- Evaluation Metrics
  - Performance Metrics
    - Task Resolution Rate (% Resolved)
      - Core performance indicator reflecting system's problem-solving capability

    - Localization Accuracy (F1 Score)
      - Balance of precision and recall for code defect localization

    - Visual Necessity Impact
      - Improvement in task resolution rate from image input

    - Image Type Sensitivity
      - Adaptability to different image types (code screenshots/UI images/charts)

    - Code Modification Complexity (Patch Complexity)
      - Scale of reference solution modifications (number of files/lines/functions)

    - Task Difficulty Distribution
      - Proportion of tasks with different time requirements (simple/medium/difficult/extremely difficult)

    - Task Success Rate
      - Reference: https://www.restack.io/p/multi-agent-systems-answer-llm-evaluation-cat-ai
      - This metric measures the percentage of tasks successfully completed by agents, directly indicating overall efficiency.
      - **Formula**:
        $$ \text{Task Success Rate} = \frac{\text{Number of Successfully Completed Tasks}}{\text{Total Number of Tasks}} \times 100\% $$

    - Collaboration Efficiency
      - Reference: https://www.restack.io/p/multi-agent-systems-answer-llm-evaluation-cat-ai
      - Evaluates how effectively multiple agents cooperate to achieve common goals

    - Task Allocation Accuracy
      - Reference: https://www.restack.io/p/multi-agent-systems-answer-llm-evaluation-cat-ai
      - Whether tasks are assigned to the most suitable agents
      - **Formula**:
        $$ \text{Task Allocation Accuracy} = \frac{\text{Number of Correctly Allocated Tasks}}{\text{Total Number of Tasks}} \times 100\% $$

    - Task Completion Accuracy
      - Reference: https://www.restack.io/p/multi-agent-systems-answer-llm-evaluation-cat-ai
      - Accuracy of output results
      - **Formula**:
        $$ \text{Task Completion Accuracy} = \frac{\text{Number of Correct Output Results}}{\text{Total Number of Completed Tasks}} \times 100\% $$

    - Output Coherence
      - Reference: https://www.restack.io/p/multi-agent-systems-answer-llm-evaluation-cat-ai
      - Logical consistency of generated content

    - Progress Rate
      - Reference: AgentBoard https://arxiv.org/pdf/2401.13178
      - Continuous metric calculated through sub-goal matching or state similarity, reflecting gradual progress during task completion (0 to 1)
      - **Formula**:
        - **Continuous tasks** (such as state matching):
          $$ r_t^{\text{match}} = \max_{0 \leq i \leq t} f(s_i, g) $$
          where $f(s_i, g)$ is the similarity function between current state $s_i$ and target state $g$ (such as table cell matching ratio).

        - **Discrete sub-goal tasks** (such as multi-step planning):
          $$ r_t^{\text{subgoal}} = \max_{0 \leq i \leq t} \frac{1}{K} \sum_{k=1}^K f(s_i, g_k) $$
          where $g_k$ is the manually annotated $k$-th sub-goal, and $f(s_i, g_k) \in \{0,1\}$ indicates whether the sub-goal is completed.

  - Efficiency Metrics
    - Average Cost (Avg. Cost)
      - Economic cost of single-task inference
    - Abnormal Termination Rate
      - Proportion of task interruptions due to cost overruns or errors (reflecting resource waste)
    - Communication Latency: Agent response time (milliseconds)
    - Task Completion Time

  - Scalability Metrics
    - Multi-file Type Editing
      - Proportion of tasks that simultaneously modify multiple file types (TS/HTML/CSS)
    - Language Adaptability Comparison
      - Resolution rate degradation of Python-centric systems in JavaScript tasks

  - Reliability Metrics
    - Test Consistency
      - Consistency of the same patch passing multiple runs
    - Error Recovery Capability
      - Effectiveness of automatic retry or rollback mechanisms after task termination

## 4. Application Domains

### 4.1 Characteristics and Applicable Scenarios of Multi-Agent Systems
- Characteristics of multi-agent systems: Non-real-time, non-deterministic
- Suitable scenarios for multi-agent systems: Offline operations, error tolerance, high user tolerance and willingness to intervene
- When (and when not) to use multi-agent systems

### 4.2 Typical Applications of Multi-Agent Systems in Banking Scenarios
- Customer service robots: From knowledge operations to intelligent customer service
- Intelligent writing: Simple copywriting, research report style, marketing copywriting style
- Intelligent marketing: From customer profiling to precision marketing

## 5. References

![Prompt-To-Agent: Create custom engineering agents for your code](/assets/multi-agent-system/image.png)





