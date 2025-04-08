---
title: 'Awesome Manus-Like Projects'
pubDate: 2025-01-31T00:00:00.000Z
description: 'A curated list of open-source projects related to Manus technology stack'
author: 'Remy'
tags: ['AI', 'agents','multimodal', 'tools','多智能体系统', '人工智能', ]
---

# Awesome Manus-Like Projects

A curated list of open-source projects related to Manus technology stack, covering multimodal models, workflow orchestration, multi-agent systems, and tool integration.

## Technical Stack

Manus' likely technical stack includes:

- Web automation: Playwright/Selenium
- AI orchestration: LangChain/AutoGen
- Backend: Python/FastAPI
- Frontend: React/Next.js
- Deployment: Docker/Kubernetes
- Vector DB: Pinecone/Weaviate
- LLMs: Claude/Qwen/VL-models

## Contents

- [Awesome Manus-Like Projects](#awesome-manus-like-projects)
  - [Technical Stack](#technical-stack)
  - [Contents](#contents)
  - [Opensource Copy](#opensource-copy)
    - [OpenManus](#openmanus)
    - [OWL](#owl)
    - [LangManus](#langmanus)
  - [Multimodal Models](#multimodal-models)
  - [Workflow Orchestration](#workflow-orchestration)
  - [Multi-Agent Systems](#multi-agent-systems)
  - [Tool Integration](#tool-integration)
  - [Model Serving Frameworks](#model-serving-frameworks)
  - [Agent Development Kits](#agent-development-kits)
  - [Model Evaluation \& Benchmarking](#model-evaluation--benchmarking)
  - [Model Training \& Fine-tuning](#model-training--fine-tuning)
  - [Specialized Agent Applications](#specialized-agent-applications)
  - [MISC](#misc)
  - [Contributing](#contributing)
  - [License](#license)


## Opensource Copy

### OpenManus
- **Repository**: [https://github.com/mannaandpoem/OpenManus](https://github.com/mannaandpoem/OpenManus)
- **Description**: An open-source recreation of Manus developed by the MetaGPT team, supporting automated tasks such as web browsing, file operations, and code execution. It features a modular design that allows flexible switching between LLM models (like Claude 3.5). Suitable for local deployment and quick validation of basic AI Agent capabilities.

### OWL
- **Repository**: [https://github.com/camel-ai/owl](https://github.com/camel-ai/owl)
- **Description**: A multi-agent collaboration framework launched by the CAMEL-AI team, scoring 58.18 in the GAIA benchmark (ranking first among open-source projects). It supports cross-platform operations (Ubuntu containers, mobile app control) and complex task decomposition, making it suitable for enterprise-level automation scenarios.

### LangManus
- **Repository**: [https://github.com/MaoTouHU/byte-langmanus](https://github.com/MaoTouHU/byte-langmanus)
- **Description**: A community recreation project by ByteDance that integrates natural language interaction, web search, data scraping, and browser control. It supports hierarchical multi-agent collaboration and is suitable for research-oriented task automation.

## Multimodal Models

- [OpenFlamingo](https://github.com/mlfoundations/open_flamingo) - Open-source framework for training and evaluating large multimodal models (LMMs)
- [LLaVA](https://github.com/haotian-liu/LLaVA) - Large Language and Vision Assistant connecting vision encoders with LLMs
- [IDEFICS](https://github.com/HuggingFaceM4/idefics) - Open-source multimodal model for image-based question answering
- [MiniGPT-4](https://github.com/Vision-CAIR/MiniGPT-4) - Minimal multimodal model with visual-language capabilities
- [BLIP-2](https://github.com/salesforce/BLIP-2) - Bootstrapping Language-Image Pre-training with frozen encoders
- [Fuyu-8B](https://github.com/AdeptAI/Fuyu-8B) - Multimodal model for digital agents
- [Kosmos-2](https://github.com/microsoft/unilm/tree/master/kosmos-2) - Grounded Multimodal Model with object-level understanding
- [PALI](https://github.com/google-research/pali) - Pathways Language and Image model from Google Research
- [Qwen-VL](https://github.com/QwenLM/Qwen-VL) - Qwen Large Vision Language Model
- [InstructBLIP](https://github.com/salesforce/LAVIS/tree/main/projects/instructblip) - Instruction-tuned multimodal model

## Workflow Orchestration

- [Argo Workflows](https://github.com/argoproj/argo-workflows) - Cloud-native workflow engine for Kubernetes
- [Dapr Workflows](https://github.com/dapr/workflows) - Distributed application runtime with workflow capabilities
- [Prefect](https://github.com/PrefectHQ/prefect) - Python dataflow coordination
- [Airflow](https://github.com/apache/airflow) - Programmatic workflow authoring and monitoring
- [Metaflow](https://github.com/Netflix/metaflow) - Framework for real-life data science projects
- [Kubeflow Pipelines](https://github.com/kubeflow/pipelines) - ML workflow platform on Kubernetes
- [Flyte](https://github.com/flyteorg/flyte) - Cloud-native ML and data processing platform
- [Luigi](https://github.com/spotify/luigi) - Python module for complex batch job pipelines
- [Dagster](https://github.com/dagster-io/dagster) - Data orchestrator for ML and analytics
- [ZenML](https://github.com/zenml-io/zenml) - MLOps framework for reproducible pipelines

## Multi-Agent Systems

- [AutoGen](https://github.com/microsoft/autogen) - Next-gen LLM applications via multi-agent conversation
- [LangGraph](https://github.com/langchain-ai/langgraph) - Library for stateful multi-actor applications
- [CrewAI](https://github.com/joaomdmoura/crewai) - Framework for role-playing autonomous agents
- [ChatDev](https://github.com/OpenBMB/ChatDev) - Customizable multi-agent framework
- [AgentVerse](https://github.com/OpenBMB/AgentVerse) - Multi-agent simulation framework
- [MetaGPT](https://github.com/geekan/MetaGPT) - Multi-agent framework for collaborative software
- [AutoAgents](https://github.com/aiwaves-cn/autogents) - Framework for specialized AI agents
- [AgentForge](https://github.com/DataBass-io/AgentForge) - Framework for autonomous AI agents
- [SuperAGI](https://github.com/SuperAGI/SuperAGI) - Open-source autonomous AI agent framework
- [OpenAgents](https://github.com/xlang-ai/openagents) - Platform for hosting and developing AI agents

## Tool Integration

- [LangChain Tools](https://github.com/langchain-ai/langchain) - Framework for LLM applications with tool integration
- [LlamaIndex Tools](https://github.com/jerryjliu/llama_index) - Tools for connecting LLMs with external data
- [Semantic Kernel](https://github.com/microsoft/semantic-kernel) - SDK for LLM integration with programming languages
- [Transformers Agents](https://github.com/huggingface/transformers) - Hugging Face transformers with agent capabilities
- [ToolBench](https://github.com/OpenBMB/ToolBench) - Benchmark for tool-augmented LLMs
- [OpenAI Plugins](https://github.com/openai/plugins) - Plugin system for ChatGPT
- [GPT Engineer](https://github.com/AntonOsika/gpt-engineer) - Tool for generating codebases from descriptions
- [ChatGPT Retrieval Plugin](https://github.com/openai/chatgpt-retrieval-plugin) - Retrieval plugin for ChatGPT
- [BabyAGI Tools](https://github.com/yoheinakajima/babyagi) - Task-driven autonomous agent
- [Auto-GPT Plugins](https://github.com/Significant-Gravitas/Auto-GPT) - Autonomous AI agent with plugin support

## Model Serving Frameworks

- [vLLM](https://github.com/vllm-project/vllm) - High-throughput LLM inference engine
- [Text Generation Inference](https://github.com/huggingface/text-generation-inference) - Toolkit for serving LLMs
- [TensorRT-LLM](https://github.com/NVIDIA/TensorRT-LLM) - NVIDIA's LLM optimization toolkit
- [DeepSpeed](https://github.com/microsoft/DeepSpeed) - Deep learning optimization library
- [FastChat](https://github.com/lm-sys/FastChat) - Platform for serving and training LLMs
- [MLC LLM](https://github.com/mlc-ai/mlc-llm) - Universal solution for LLM deployment
- [OpenLLM](https://github.com/bentoml/OpenLLM) - Platform for operating LLMs in production
- [Ray Serve](https://github.com/ray-project/ray) - Scalable model serving framework
- [TGI](https://github.com/huggingface/text-generation-inference) - Text Generation Inference for LLMs
- [LMQL](https://github.com/eth-sri/lmql) - Programming language for LLM interaction

## Agent Development Kits

- [AgentKit](https://github.com/holistics-ai/agentkit) - Toolkit for autonomous AI agents
- [AgentPy](https://github.com/agent-py/agentpy) - Python library for agent-based modeling
- [AgentOS](https://github.com/agent-os/agentos) - Operating system for autonomous agents
- [AgentSims](https://github.com/py-why/AgentSims) - Simulation framework for multi-agent systems
- [AgentZero](https://github.com/agent-zero/agentzero) - Minimalist framework for AI agents
- [AgentLab](https://github.com/agent-lab/agentlab) - Laboratory for AI agent experimentation
- [AgentBase](https://github.com/agentbase/agentbase) - Base classes for AI agent development
- [AgentSmith](https://github.com/agentsmith/agentsmith) - Framework for conversational agents
- [AgentX](https://github.com/agentx/agentx) - Experimental framework for autonomous agents

## Model Evaluation & Benchmarking

- [OpenCompass](https://github.com/open-compass/opencompass) - Comprehensive LLM evaluation system
- [LM Evaluation Harness](https://github.com/EleutherAI/lm-evaluation-harness) - Framework for language model evaluation
- [HELM](https://github.com/stanford-crfm/helm) - Holistic Evaluation of Language Models
- [AlpacaEval](https://github.com/tatsu-lab/alpaca_eval) - Automatic evaluator for instruction-following models
- [Big-Bench](https://github.com/google/BIG-bench) - Beyond the Imitation Game benchmark
- [MMLU](https://github.com/hendrycks/test) - Massive Multitask Language Understanding benchmark
- [AGIEval](https://github.com/microsoft/AGIEval) - Benchmark for human-like cognitive abilities
- [VHELM](https://github.com/stanford-crfm/vhelm) - Vision-language extension of HELM
- [MMBench](https://github.com/open-compass/mmbench) - Comprehensive multimodal benchmark
- [GAIA](https://github.com/gaia-benchmark/gaia) - Benchmark for general AI assistants

## Model Training & Fine-tuning

- [Axolotl](https://github.com/OpenAccess-AI-Collective/axolotl) - Solution for fine-tuning LLMs
- [LLaMA-Factory](https://github.com/hiyouga/LLaMA-Factory) - Easy-to-use LLM fine-tuning framework
- [Lit-GPT](https://github.com/Lightning-AI/lit-gpt) - GPT implementation optimized for fine-tuning
- [LLaMA-Adapter](https://github.com/ZrrSkywalker/LLaMA-Adapter) - Efficient fine-tuning method for LLMs
- [QLoRA](https://github.com/artidoro/qlora) - Efficient finetuning of quantized LLMs
- [PEFT](https://github.com/huggingface/peft) - Parameter-Efficient Fine-Tuning methods
- [OpenDelta](https://github.com/thunlp/OpenDelta) - Delta Tuning for parameter-efficient fine-tuning
- [ColossalAI](https://github.com/hpcaitech/ColossalAI) - Unified system for large model training
- [DeepSpeed-Chat](https://github.com/microsoft/DeepSpeedExamples) - Complete RLHF training pipeline
- [trl](https://github.com/huggingface/trl) - Transformer Reinforcement Learning library

## Specialized Agent Applications

- [DevOpsGPT](https://github.com/kuafuai/DevOpsGPT) - AI agent for DevOps automation
- [DB-GPT](https://github.com/csunny/DB-GPT) - Database interaction agent
- [SQL-GPT](https://github.com/bigcode-project/sql-gpt) - SQL generation and optimization agent
- [ChatCAD](https://github.com/zhaozh10/ChatCAD) - Medical imaging analysis agent
- [FinGPT](https://github.com/ai4finance-foundation/fingpt) - Financial analysis agent
- [LegalGPT](https://github.com/legal-tech-research/legalgpt) - Legal document analysis agent
- [ChemCrow](https://github.com/ur-whitelab/chemcrow) - Chemistry research agent
- [EduGPT](https://github.com/educators-gpt/edugpt) - Educational content generation agent
- [ResearchGPT](https://github.com/mukulpatnaik/researchgpt) - Academic research assistant agent
- [AutoPR](https://github.com/irgolic/AutoPR) - Automated pull request generation agent

## MISC

- [awesome-manus-replay](https://github.com/agenaiguy/awesome-manus-replay) Manus Replay is a feature that allows users to view and replay the process by which Manus executes tasks. This functionality enables users to understand how Manus approaches specific tasks, including its thought processes and the steps it takes. This serves as a valuable learning tool for users, helping them comprehend the workings and decision-making processes of the AI agent.



## Contributing

Contributions welcome! Please feel free to submit a Pull Request at https://github.com/redreamality/awesome-manus.
This list will also be exhibited in https://redreamality.com/blog/awesome-manus-like-projects/

## License

[![CC0](https://licensebuttons.net/p/zero/1.0/88x31.png)](https://creativecommons.org/publicdomain/zero/1.0/)

To the extent possible under law, the authors have waived all copyright and related or neighboring rights to this work.