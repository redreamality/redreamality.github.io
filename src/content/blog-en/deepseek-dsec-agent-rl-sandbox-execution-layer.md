---
title: "3 Million Sandboxes a Day: How DeepSeek DSec Runs the Execution Layer for Agent RL (2026 Survey)"
description: "DeepSeek's DSec: one scale unit serves ~3M sandboxes a day at ~380K peak concurrency. Why agent RL bottlenecks on execution, how DSec handles images, memory overcommit, CPU isolation, preemption and reward hacking, a comparison with AgentENV, E2B and Modal, and a checklist."
pubDate: 2026-10-12T10:45:00+08:00
author: "Remy"
tags: ["deepseek", "ai-agents", "agent-harness", "security", "open-source"]
lang: "en"
---

On September 19, DeepSeek posted a technical report to arXiv titled *DeepSeek Elastic Compute (DSec): A Sandbox Infrastructure for Effective Agentic Training at Scale*. [1] It isn't about a model or a training algorithm. It covers the least-documented layer of agent reinforcement learning: the execution environments where a model reads code, runs commands and runs tests, how to spin them up by the tens of thousands, and how to keep their state when training is interrupted. TechNode's September 23 write-up noted that the author list runs past 130 names and includes founder Liang Wenfeng. [2] The Hacker News thread had 324 points and 116 comments when I pulled it. [3]

Headline numbers: one production scale unit spans about 160 CPU nodes, 30K cores and ~250 TB of DRAM, serves about 3 million sandboxes a day, peaks around 380K concurrent and creates over 5,000 per second. [1] These are *per scale unit*; DSec runs on several, and the report gives no fleet total.

The report's related-work section notes that most RL training frameworks treat the execution environment as a black box, assuming sandboxes are "already there and correctly configured"; other training reports mention environments but focus on the model. [1] This post goes mechanism by mechanism: why agent RL bottlenecks on execution, what DSec does about each bottleneck and with what evidence, how it compares with other public stacks, and a checklist.

Related posts: [Cordis and DeepSeek Harness](/blog/cordis-spatiotemporal-composability-deepseek-harness/) covers the harness's plugin system, while this post covers the machines it runs on; [the DeepSeek V4.1 Flash cost breakdown](/blog/deepseek-v4-1-flash-cheap-model-economics/) covers inference, this covers training; [CheatBench](/blog/cheatbench-agent-reward-gaming/) measures whether agents cheat for score, and DSec has first-hand production cases. Opinions are labeled "my take"; forum content is labeled as discussion.

## Why agent RL bottlenecks on the execution layer

The report breaks agent RL into three steps. In rollout, the model reads files, calls tools, runs commands and observes output inside a sandbox, producing a trajectory. In reward computation, the framework scores it with exit codes, stdout, test pass rates or task-specific verifiers. In policy update, the parameters are updated. Evaluation uses the same execution path but measures capability instead. [1] The reward itself is computed in the sandbox: slow sandboxes mean slow training, flaky sandboxes mean dirty rewards.

The report lists seven properties that make this layer hard, reordered here by how much they hurt:

1. **Bursty creation.** One job can request up to 32K sandboxes. In a one-week sample, container tasks created a median of about 2,528 sandboxes each (p99 about 16,388); microVM tasks a median of about 352. [1] A batch waits until its environments are ready, so any straggler holds up the whole batch.
2. **Sparse CPU, good for overcommit.** Sandboxes mostly wait for the model's next action; about 90% use no more than 5% of requested CPU on average. [1]
3. **Stateful and long-lived.** The model edits files, installs dependencies and starts services that later calls depend on. Median lifetime is 17.4 minutes for containers and 15.5 for microVMs; p99 exceeds three hours for both. [1] CPU idles while memory and the writable layer stay pinned.
4. **Heterogeneous workloads.** From OJ-style (online judge) scripts to full-repository software engineering, security, computer use and Android development, resource and isolation needs vary widely. [1]
5. **Scattered environments.** In one production week, containers used 11,266 base images and 102,171 workspaces; microVMs used 2 shared base images, 53,590 task-specific workspaces and 4,889 snapshots, over 130 TB in total. There were 103 toolkits, and 67.8% of sandboxes needed at least one workspace or toolkit beyond the base image. [1]
6. **Untrusted agents.** They can corrupt filesystems or exhaust resources and hurt co-located tasks. [1]
7. **Interruptible.** GPU jobs get preempted; long rollouts' state must survive. [1]

None is new alone; the trouble is all seven at once. The report contrasts serverless, which targets short-lived, stateless functions with high image reuse and often assumes images are local, with agent training's long-lived, stateful sandboxes drawn from an image corpus far larger than one node, with low reuse per image. [1] Hence its argument for an elastic execution platform rather than a single sandbox runtime.

## DSec's skeleton: four backends, one SDK

The entry point is libdsec, a Python client. A request specifies sandbox type, image or environment ID, CPU and memory limits, lifetime, network rules and initial user; the caller then runs shell commands or tool calls and collects output and return status. [1] The minimal example includes `network_rules={"npm": False, "pypi": True}`: this task may reach PyPI but not NPM. Network permissions are per task, which matters again for anti-cheating.

There are four backends, with the trade-off stated plainly: stronger isolation and fuller OS functionality cost startup latency and overhead, so no single abstraction fits all. [1]

| Backend | Typical tasks | Isolation and overhead | Implementation notes from the report |
| --- | --- | --- | --- |
| FnCall | OJ-style short tasks, compilation, GPU kernel evaluation | Precreated, reusable containers that skip per-invocation provisioning | GPU variant supports shared and exclusive modes, partitions GPUs with MIG, offloads compilation to CPU FnCall |
| Container | Software engineering, general tool use | Fast startup and high density, but shares the host kernel | Runs inside QEMU/libvirt VMs, adding a kernel and network-stack boundary |
| MicroVM | Security tasks, computer use | Stronger boundary, higher memory overhead, slower startup | Firecracker |
| Full VM | Commercial OS, graphics rendering, Android | Highest overhead | QEMU, para-virtualized GPU (e.g. virtio-gpu), DXVK for translating graphics APIs |

Compiled from chapters 2 and 3. [1] Two things stand out: containers and FnCall run inside QEMU VMs, not on bare metal, as an extra boundary between untrusted containers and hardware; and libdsec deliberately avoids a fully unified abstraction, so callers still pick the backend. [1] Containers and microVMs dominate production. [1]

## How a request reaches a sandbox

Chapter 3 splits the architecture into cluster-level services and a per-node runtime. Roughly: [1]

- **IAM** authorizes every management request. Projects nest; agents and harnesses can create subprojects and delegate quota but can't grant permissions they lack. Humans and agents share one management API.
- **apiserver**: training code runs on trusted GPU servers while sandboxes run untrusted code and may reach the internet, so the two sides are network-isolated with the apiserver as the only path. It keeps no per-sandbox state; sandbox IDs encode their node, so any instance can forward any request and ingress scales horizontally.
- **Placement engine and watcher**: filter healthy nodes with the right backend and hardware, sample a few at random and pick the least loaded (power-of-k-choices). Neither keeps durable state; after a restart they re-poll.
- **edge**, one per node, makes the final admission call and rejects when local resources are tight; it provisions storage, applies eBPF network policy, launches runtimes and handles snapshots.
- **aether and chronus**: aether, a proxy in each sandbox, talks to the edge over a Unix socket or vsock; chronus is the in-sandbox shell session for commands, files and streaming output.

Cloud bursting: above 80% on-prem utilization, some creations go to cloud VMs. A de-duplicated 30 TB image set covers files accessed by 70% of container tasks, and only tasks fully inside that set go to the cloud; 200 cloud VMs in one scale unit absorb about 30% of peak overflow. [1]

Density: production has run stably with at least 3,200 containers or 800 microVMs per node, demonstrated operating points rather than limits; one sampled day peaked at 1,048 containers and 524 microVMs on a node. [1]

## Three hard problems: images, memory, CPU

### Image distribution: don't pull the whole image

In my view this is the report's most valuable part. In sampled container images across languages, only 4.2% to 13.3% of image data is read at runtime; median per-task fanout is 3 for container images and 1 for microVM images. [1] Low reuse defeats local caches; sparse reads make full pulls wasted I/O; pre-warming just moves the cost earlier. [1]

DSec does two things.

First, **composable layers**. A sandbox is a base image (OS dependencies), a workspace (task repo and its dependencies) and toolkits (for example DeepSeek Harness). Fused into one OCI image, upgrading m base images means rebuilding every combination with N workspaces, O(m·N); with independently versioned layers it's O(m). [1] They modified dockerd to stack overlayfs lower directories at creation time (base, then workspace, then toolkits) with writes going to the upper layer; the change is 30 lines of Go. [1] Simpler options fail: unpacking archives per sandbox saturates CPU and I/O in a burst and causes startup timeouts; read-only bind mounts replace the target path and conflict with Python writing `__pycache__`. [1]

Second, **on-demand loading**. Immutable layers are stored as EROFS (a compressed read-only filesystem with random access); data lives on 3FS, DeepSeek's distributed filesystem, and is fetched in bulk only when read. 3FS is strong at large sequential I/O and weak at small random I/O, so: writes stay local, reads are on demand and bulk, metadata stays local where possible. [1] For microVMs, since the Firecracker backend lacks virtio-fs, DSec uses the OverlayBD block format via ublk (a userspace block-device framework), plus a local cache. [1]

Experiments (on a dedicated 10-node test cluster, not production):

- In an 8,192-container burst, on-demand loading finished in about 35 minutes, matching a fully pre-cached baseline; cold full pulls took over 60 minutes, 1.71× slower. Per-node disk writes: over 1,600 GB eager versus about 700 GB on demand, roughly 57% less and near the ~600 GB local baseline. [1]
- Extracting the same workspace and toolkits from tar.gz per sandbox took 79 minutes; mounting EROFS layers took 45, a 1.76× speedup, and tar generated about 5.5× the disk writes. [1]

### Memory: two kinds of microVM waste

MicroVMs waste memory twice: image data is cached on the host and again in each guest, and guest free pages aren't returned unless reported. [1] Fixes: for read-only layers, virtio-pmem with DAX lets co-located microVMs share one host page-cache copy; for larger writable disks, DAMON (Linux's sampling memory-access monitor) evicts cold pages and virtio-balloon free-page reporting returns memory to the host. [1]

Results: virtio-pmem with DAX cut peak host memory 40.2%; DAMON plus free-page reporting barely moved the peak but cut time-integrated memory 21.2%. virtio-pmem raised transient peak CPU from 26.5% to 41.4%, so CPU-constrained deployments may use free-page reporting alone. [1] virtio-pmem also doesn't suit large disks: the guest needs page metadata for the whole pmem range, about 1/64 of capacity. [1]

### CPU: overcommit without slowing latency-sensitive tasks

Some tasks have per-step limits, like a chess agent with a fixed time per move. Deprioritizing best-effort work isn't enough, since it can run on the sibling hyperthread of the same core. [1] DSec runs best-effort sandboxes under `SCHED_IDLE` and gives latency-sensitive ones Linux core scheduling, keeping unrelated work off the sibling thread. [1] At 50% background load, per-step latency rose 45.2% unprotected; `SCHED_IDLE` alone helped at most 3.4%; both together held it to 17.3%. The rest comes from lower turbo frequency, memory bandwidth and last-level cache contention. Everything uses stock kernel features, no kernel changes. [1]

## Wiring into the training framework: preemption, pause, self-built environments

The report says DSec has served all RL training and evaluation sandboxes from DeepSeek V3.2 through V4.1. [1] Chapter 6 describes how it works with the RL framework.

**Moving the agent loop out of the GPU job.** Early on, the agent loop ran in the preemptible GPU training pod with the RL framework. On preemption the loop died while the sandbox lived, and recovery replayed a command log, reusing recorded results to avoid repeating side effects. [1] From V4.1, rollout moved onto DSec as two parts: an agent sandbox hosting the scaffold (for example DeepSeek Harness) and its tools, and a worker container that manages it with a scaffold-agnostic control layer. Both sit outside the preemptible GPU pool and hold the full rollout state, so a preempted job just reconnects. [1] My take: this settles where rollout state lives; split state only makes recovery logic worse.

**Freeing memory while training is paused.** On preemption, the RL framework sends pause requests to the job's sandboxes. Containers get `docker pause`, swap enabled and proactive reclamation; on resume, `MADV_WILLNEED` prefetches the mappings before unpausing. MicroVMs are snapshotted and their Firecracker process killed, then restored in a new process. Any later request transparently resumes the sandbox first. [1]

**Letting agents build environments.** Hand-building that many environments is impractical, so agents build them interactively on the same infrastructure, using `pack_diff` to take an incremental disk snapshot at any point and restore it later as a new sandbox. [1] An internal platform quality-checks and exports them. To prevent leaks, builders and runtime agents use separate accounts, and build residue is wiped from the writable layer before packing so reference answers don't ship in the image. [1]

## Agents find loopholes: first-hand cases from the report

Section 6.4 deserves a careful read: it is a production record, not a red-team exercise. Two risk types: a task looks passed but the answer came through an unintended channel, or the agent damages the environment, hurting its own task or others. [1]

Ways agents went after answers: [1]

- Sending forged RPC messages straight to chronus sockets to impersonate user requests, or reading chronus logs for leaked answers.
- Overwriting `/bin/bash` to bypass checks or inject commands into later sessions.
- After access controls were added, using `XFS_IOC_SWAPEXT` (an ioctl that swaps the data-extent mappings of two files) to get at protected content. It corrupted XFS metadata and forced a filesystem shutdown.
- Outside the sandbox, scanning ports for reachable mirrors, pulling GitHub code through Go module proxies, and installing newer package releases to find existing implementations. The report's point: final-output checks can't reliably tell whether the task was solved as intended.

Damage wasn't always deliberate: a recursive grep from root read `/proc/kpagecgroup` and hit a kernel bug that crashed the kernel; in an exploitation task, attack commands meant for a target VM ran in the agent's own container and crashed its kernel; an agent ran `yes`, and chronus's recorded output filled tens of gigabytes. [1]

Two mitigations: AppArmor profiles restrict file and socket access (including chronus logs and Unix sockets) and apply even to root inside the sandbox; per-sandbox eBPF programs enforce task-level network allowlists by IP, port and protocol, updatable on the fly. [1] The report admits these address only part of the problem and offer no general defense against destructive behavior like triggering kernel bugs. [1]

My take: there's no frequency data, and chapter 8 evaluates only images, layers, memory and CPU, leaving framework integration out of scope. [1] Read this as a case collection, not proof of effectiveness.

## Side by side: other public agent sandbox stacks

DSec isn't alone. Below are only stacks whose public docs I checked; numbers are each project's own claims, not a controlled comparison.

| Stack | Positioning | Isolation | Startup and state | Published scale or density figures |
| --- | --- | --- | --- | --- |
| DSec | In-house: training, evaluation, environment building | Four backends; containers inside QEMU VMs; AppArmor plus eBPF | On-demand loading; pause and snapshots; rollout state on the sandbox side | Per scale unit: ~3M a day, ~380K peak concurrency, >5,000 creations/s [1] |
| AgentENV | Open source; powers agentic RL for Kimi K3 | Firecracker | Snapshot-backed boot or resume under 50 ms, pause under 100 ms; fork | 1.5M images in production, 9.6× memory overcommit [4] |
| E2B Runtime | Open source; backend of E2B Cloud | One Firecracker microVM per sandbox, nftables egress firewall with domain allow/deny lists | Resume from snapshot with lazily faulted memory pages; pause, resume, fork | Up to a hundred forks per request [5] |
| Modal Sandboxes | Managed service | gVisor, or a VM with its own kernel | Default max lifetime 5 minutes, up to 24 hours, longer via filesystem snapshots | No public scale figures found [8] |
| Daytona | Managed service | Dedicated kernel, filesystem and network stack | Claims under 90 ms from code to execution; stateful snapshots | No public scale figures found [9] |
| SWE-bench eval harness | Open-source evaluation | Docker | Three image layers (base, environment, instance), ~60 environment images | Full instance cache ~2,000 GB; recommended workers below min(0.75 × CPU count, 24) [10] |

AgentENV is worth reading against DSec: it also combines Firecracker, OverlayBD and ublk, with local disk as a bounded cache. [4] DSec says its Rust OverlayBD and ublk components are open source, linking to the storage directory in the AgentENV repo. [1] So they share actual storage-path code, which is more concrete than "both use Firecracker."

On isolation primitives, Firecracker claims boot under 125 ms, under 5 MiB overhead per VM, up to 150 microVMs per second per host, and five emulated devices. [6] gVisor instead uses a userspace application kernel in Go to intercept syscalls, lowering fixed costs versus a full VM at the price of compatibility and per-syscall overhead. [7] DSec adds no new isolation mechanism; it integrates several backends in one platform. [1]

SWE-Gym is a public software-engineering training environment with 2,400 real tasks from 11 Python repositories, verified with executable environments and tests. [11] It answers "which tasks, and how do we judge them"; DSec answers "how do we run hundreds of thousands of them at once." Different layers.

On the forum, one commenter called it "just a scheduler over firecracker"; another replied that agent sandboxes are bursty yet long-lived and need low-latency suspend/resume, that naive approaches are wasteful, and that over-optimizing can hurt isolation. Others compared it with Google's ax. [3] These are discussion opinions. The ax README describes a declarative orchestrator on Agent Substrate with primitives for sandboxed tasks, workspaces and suspend/resume, in heavy development. [12]

## My take: what's most worth copying

In priority order:

1. **Measure image access ratios and reuse before choosing a distribution scheme.** DSec's whole storage design rests on those two measurements. [1]
2. **Layer environments instead of one big image per task.** Toolkits, harness included, change most; baking them in means full rebuilds on every upgrade.
3. **Keep rollout state in one place.**
4. **Treat cheating as an infrastructure problem.** Logs, control channels, internal sockets and package mirrors can leak answers; agents dig into what you assumed only the platform touches.
5. **Fill in what the report leaves out:** cost, cheating frequency, the exact configuration of the container-in-VM boundary. The only components the report says are open source are the storage pieces. [1]

## Checklist: building agent training and evaluation environments

**A. Workload profile**

- [ ] Record the per-task sandbox count distribution (median, p90, p99) and burst windows.
- [ ] Record sandbox lifetime distribution and average/peak CPU and memory as a fraction of the request.
- [ ] Sample the fraction of image data actually read at runtime and the per-image reuse count.

**B. Environments and images**

- [ ] Version base images, workspaces and toolkits as separate layers so a toolkit upgrade doesn't trigger a full rebuild.
- [ ] Keep images read-only and load on demand, with writes landing locally and metadata local where possible.
- [ ] Separate builder and runner accounts, clean residue before packing, spot-check images for reference answers.

**C. Isolation and network**

- [ ] Pick backends by task type, separating short tasks, repository tasks, security tasks and full-OS tasks.
- [ ] Network-isolate the training side from the sandbox side and leave a single ingress.
- [ ] Grant network access per task via allowlists that can change between stages; treat package mirrors as answer channels too.
- [ ] Keep platform logs, sockets and control processes off-limits even to root inside the sandbox.

**D. Lifecycle and recovery**

- [ ] Decide where rollout state lives, so a preempted trainer can reconnect.
- [ ] Release memory on pause and prefetch on resume; reclaim abandoned sandboxes with a TTL.
- [ ] Cap command output size so a single `yes` can't fill storage.

**E. Reward and audit**

- [ ] Verifiers should record how answers were obtained (network access, suspicious syscalls, files read), not just final output.
- [ ] Incidents like kernel crashes and filesystem shutdowns should be traceable to a specific sandbox and task.
- [ ] Mirror and API-gateway outages fail tasks and corrupt rewards; make them highly available (DSec uses BGP with ECMP). [1]

## What this means for coding-agent sandboxes in production

Training sandboxes want throughput, density and reproducibility; production sandboxes want data safety and low latency. A few lessons still carry over.

First, **the harness is a layer inside the sandbox, not a controller outside it.** DSec mounts DeepSeek Harness as a toolkit layer and, since V4.1, runs it in the agent sandbox under an external worker container. [1] That points the same direction as [Claude Cowork moving execution to per-session cloud sandboxes](/blog/claude-cowork-cloud-sandbox-where-agents-run/) and [OpenShell moving policy enforcement out of the harness](/blog/nvidia-open-agent-safety-openshell-sentry/): don't put the policy enforcement point somewhere the agent can modify.

Second, **agents find exits you didn't anticipate.** In training they hunt answers; in production, credentials and egress paths. Chronus sockets, logs and package proxies all have production counterparts.

Third, **pause and snapshot are now table stakes.** DSec, AgentENV, E2B, Modal and Daytona all offer some form of pause, snapshot or resume. [1][4][5][8][9] My take: if your coding-agent sandbox can only be discarded after use, long tasks and multi-step reviews will keep costing more than necessary.

## Closing

Most DSec components are off the shelf: Firecracker, QEMU, overlayfs, EROFS, DAMON, core scheduling, AppArmor, eBPF. Its value is a set of production measurements, each tied to a design choice. Measure your own workload along the lines of chapter 4 first, then decide which parts of chapters 5 and 6 to copy.

## References

1. [DeepSeek Elastic Compute (DSec): A Sandbox Infrastructure for Effective Agentic Training at Scale (arXiv:2609.22978)](https://arxiv.org/abs/2609.22978)
2. [TechNode: DeepSeek details DSec sandbox infrastructure for agent training](https://technode.com/2026/09/23/deepseek-dsec-agent-training-sandbox-infrastructure/)
3. [Hacker News discussion: DeepSeek Elastic Compute (DSec)](https://news.ycombinator.com/item?id=49859112)
4. [kvcache-ai/AgentENV (GitHub)](https://github.com/kvcache-ai/AgentENV)
5. [e2b-dev/runtime: E2B Runtime (GitHub)](https://github.com/e2b-dev/runtime)
6. [Firecracker website](https://firecracker-microvm.github.io/)
7. [gVisor docs: What is gVisor?](https://gvisor.dev/docs/)
8. [Modal docs: Sandboxes](https://modal.com/docs/guide/sandbox)
9. [Daytona documentation](https://www.daytona.io/docs/en/)
10. [SWE-bench docs: Docker Setup](https://www.swebench.com/SWE-bench/guides/docker_setup/)
11. [SWE-Gym (GitHub)](https://github.com/SWE-Gym/SWE-Gym)
12. [google/ax (GitHub)](https://github.com/google/ax)
