import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { test, expect } from '@playwright/test';

const locales = [
  {
    folder: 'en', prefix: '', title: 'Claude Agent SDK (Python) Learning Guide',
    headings: [
      'Installation and Version Check', 'Query and Message Types',
      'ClaudeSDKClient Lifecycle and Cleanup', 'Hooks and Permission Decisions',
      'Module Query with Streaming Hooks', 'Timeouts at Different Layers',
      'Custom MCP Tools', 'Troubleshooting and Verification Boundaries', 'References',
    ],
    boundary: 'Its messages are fixtures, not Claude\'s answers.',
    deadline: 'not startup plus both turns plus shutdown',
    table: 'Timeout layers comparison',
  },
  {
    folder: 'cn', prefix: '/cn', title: 'Claude Agent SDK (Python) 学习指南',
    headings: [
      '安装与版本检查', 'Query 与消息类型', 'ClaudeSDKClient 生命周期与清理',
      'Hooks 与权限决定', '模块级 Query 的流式 Hooks', '不同层次的超时',
      '自定义 MCP 工具', '排障与验证边界', '参考资料',
    ],
    boundary: '模拟消息只是 fixture，不是 Claude 的回答。',
    deadline: '单轮与清理各有预算',
    table: '超时层次对照表',
  },
  {
    folder: 'ja', prefix: '/ja', title: 'Claude Agent SDK (Python) 学習ガイド',
    headings: [
      'インストールとバージョン確認', 'Query とメッセージ型',
      'ClaudeSDKClient のライフサイクルと後処理', 'Hooks と権限判断',
      'モジュール Query のストリーミング Hooks', '層ごとのタイムアウト',
      'カスタム MCP ツール', 'トラブルシューティングと検証範囲', '参考資料',
    ],
    boundary: '模擬メッセージは fixture であり、Claude の回答ではありません。',
    deadline: 'ターンと後処理の予算は別',
    table: 'タイムアウト層の比較表',
  },
] as const;

// Real pinned SDK, simulated transport only: no CLI, model or credentials.
const cleanupFixture = String.raw`
import json
import re
import sys
from importlib.metadata import version
from pathlib import Path

import anyio
from claude_agent_sdk import Transport

for package, expected in [
    ("claude-agent-sdk", "0.1.3"), ("mcp", "1.18.0"), ("anyio", "4.11.0"),
]:
    assert version(package) == expected, (package, version(package))

class Probe(Transport):
    def __init__(self, mode="stall", never_close=False):
        self.mode = mode
        self.never_close = never_close
        self.send, self.receive = anyio.create_memory_object_stream(20)
        self.prompt_seen = anyio.Event()
        self.close_seen = anyio.Event()
        self.close_started = False
        self.close_completed = False
        self.prompts = 0

    async def connect(self):
        pass

    async def write(self, data):
        message = json.loads(data)
        if message["type"] == "control_request":
            await self.send.send({
                "type": "control_response",
                "response": {"subtype": "success", "response": {},
                             "request_id": message["request_id"]},
            })
        elif message["type"] == "user":
            self.prompts += 1
            self.prompt_seen.set()
            if self.mode == "missing":
                await self.send.aclose()
            elif self.mode != "stall":
                await self.send.send({
                    "type": "result", "subtype": self.mode,
                    "is_error": self.mode == "error", "num_turns": 1,
                    "duration_ms": 1, "duration_api_ms": 0, "session_id": "fixture",
                })

    async def read_messages(self):
        async for message in self.receive:
            yield message

    async def close(self):
        self.close_started = True
        self.close_seen.set()
        await anyio.sleep(0)
        if self.never_close:
            await anyio.sleep_forever()
        await self.send.aclose()
        await self.receive.aclose()
        self.close_completed = True

    async def end_input(self):
        await self.send.aclose()

    def is_ready(self):
        return not self.close_completed

async def cancel_when(event, scope):
    await event.wait()
    scope.cancel()

async def check(run_turns):
    for mode, expected in [
        ("success", None), ("stall", TimeoutError),
        ("missing", RuntimeError), ("error", RuntimeError),
    ]:
        probe = Probe(mode)
        try:
            await run_turns(probe, seconds=0.1 if mode == "stall" else 2)
        except Exception as error:
            assert expected and isinstance(error, expected), repr(error)
        else:
            assert expected is None
        assert probe.close_completed, (mode, "cleanup incomplete")
        assert probe.prompts == (2 if expected is None else 1)
        await anyio.lowlevel.checkpoint()

    # Same external move_on_after probe as the independent review.
    probe = Probe()
    with anyio.move_on_after(0.2) as caller:
        await run_turns(probe, seconds=30)
    assert caller.cancelled_caught and probe.close_completed
    assert probe.prompts == 1

    # Cancellation while already closing must propagate after completed cleanup.
    probe = Probe("success")
    propagated = False
    async with anyio.create_task_group() as group:
        with anyio.CancelScope() as caller:
            group.start_soon(cancel_when, probe.close_seen, caller)
            try:
                await run_turns(probe, seconds=2)
            except anyio.get_cancelled_exc_class():
                propagated = True
                raise
        assert caller.cancelled_caught and propagated and probe.close_completed
        await anyio.lowlevel.checkpoint()

    # Stalled cleanup is bounded and reported as incomplete, even on cancellation.
    for external in (False, True):
        probe = Probe("stall" if external else "success", never_close=True)
        started = anyio.current_time()
        try:
            with anyio.move_on_after(0.2 if external else 4):
                await run_turns(probe, seconds=2, cleanup_seconds=0.1)
        except RuntimeError as error:
            assert str(error) == "cleanup deadline exceeded; resources may remain"
        else:
            raise AssertionError("incomplete cleanup was swallowed")
        assert probe.close_started and not probe.close_completed
        assert anyio.current_time() - started < 3
        await anyio.lowlevel.checkpoint()

for filename in sys.argv[1:]:
    source = Path(filename).read_text(encoding="utf-8")
    fence = chr(96) * 3
    blocks = re.findall(rf"^{fence}python\n(.*?)^{fence}", source,
                        re.MULTILINE | re.DOTALL)
    block, = [block for block in blocks if "async def run_turns(" in block]
    namespace = {"__name__": "article_fixture"}
    exec(compile(block, filename, "exec"), namespace)
    anyio.run(check, namespace["run_turns"])
    print("PASS cleanup completed and cancellation preserved: " + Path(filename).parent.name)
`;

test('SDK cleanup completes under external cancellation with the pinned runtime', () => {
  test.setTimeout(120_000);
  const files = locales.map(({ folder }) => fileURLToPath(new URL(
    `../src/content/blog-${folder}/claude-agent-sdk-python-.md`, import.meta.url,
  )));
  // An existing isolated interpreter can avoid downloading the pinned packages.
  const python = process.env.SDK_CONTENT_PYTHON;
  const args = ['-B', '-u', '-c', cleanupFixture, ...files];
  const output = python
    ? execFileSync(python, args, { encoding: 'utf8', timeout: 90_000 })
    : execFileSync('uv', [
      'run', '--no-project', '--python', '3.12',
      '--with', 'claude-agent-sdk==0.1.3', '--with', 'mcp==1.18.0',
      '--with', 'anyio==4.11.0', 'python', ...args,
    ], { encoding: 'utf8', timeout: 90_000 });
  for (const { folder } of locales) {
    expect(output).toContain(`PASS cleanup completed and cancellation preserved: blog-${folder}`);
  }
});

test('SDK source examples are complete and identical across locales', () => {
  const examples = locales.map(({ folder }) => {
    const source = readFileSync(new URL(
      `../src/content/blog-${folder}/claude-agent-sdk-python-.md`, import.meta.url,
    ), 'utf8');
    expect(source.match(/^```/gm)).toHaveLength(18);
    const prose = source.replace(/^```[^\n]*\n[\s\S]*?^```\s*$/gm, '');
    expect(prose).not.toMatch(/^# /m);
    expect(source).not.toMatch(/[ \t]+$/m);
    const blocks = [...source.matchAll(/^```python\r?\n([\s\S]*?)^```/gm)]
      .map((match) => match[1].replace(/\r\n/g, '\n'));
    expect(blocks).toHaveLength(6);
    for (const block of blocks) {
      expect(block).toContain('if __name__ == "__main__":');
      expect(block).not.toMatch(/AsyncClaudeSDKClient|@client\.hook|options = ClaudeAgent\s*$/m);
    }
    return blocks;
  });
  expect(examples[1]).toEqual(examples[0]);
  expect(examples[2]).toEqual(examples[0]);
});

for (const locale of locales) {
  test(`SDK mobile table remains keyboard-scrollable: ${locale.folder}`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${locale.prefix}/blog/claude-agent-sdk-python-/`, { waitUntil: 'domcontentloaded' });
    const region = page.getByRole('region', { name: locale.table, exact: true });
    await expect(region.getByRole('table')).toHaveCount(1);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(391);
    await region.focus();
    await expect(region).toBeFocused();
    expect(await region.evaluate(element => element.scrollWidth > element.clientWidth)).toBe(true);
    await page.keyboard.press('ArrowRight');
    await expect.poll(() => region.evaluate(element => element.scrollLeft)).toBeGreaterThan(0);
  });

  test(`SDK old URL and runnable content: ${locale.folder}`, async ({ page }) => {
    const path = `${locale.prefix}/blog/claude-agent-sdk-python-/`;
    const response = await page.goto(path, { waitUntil: 'domcontentloaded' });
    expect(response?.status()).toBe(200);
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('h1')).toHaveText(locale.title);
    await expect(page.locator('link[rel="canonical"]'))
      .toHaveAttribute('href', `https://redreamality.com${path}`);
    const article = page.locator('main article');
    for (const name of locale.headings) {
      await expect(article.getByRole('heading', { level: 2, name, exact: true })).toHaveCount(1);
    }
    await expect.poll(async () => (await article.innerText()).replaceAll('\u2019', "'"))
      .toContain(locale.boundary);
    await expect(article).toContainText(locale.deadline);
    const blocks = article.locator('pre code');
    const query = blocks.filter({ hasText: 'prompt="Reply with the number' });
    await expect(query).toHaveCount(1);
    await expect(query).toContainText('from contextlib import aclosing');
    await expect(query).toContainText('async with aclosing(query(');
    await expect(query).toContainText('async for message in messages:');
    await expect(query).toContainText('Stream ended without ResultMessage');
    const lifecycle = blocks.filter({ hasText: 'async def run_turns(' });
    await expect(lifecycle).toContainText('await client.connect()');
    await expect(lifecycle).toContainText('with anyio.fail_after(seconds):');
    await expect(lifecycle).toContainText('await client.query(prompt)');
    await expect(lifecycle).toContainText('async for message in client.receive_response():');
    await expect(lifecycle).toContainText('with anyio.CancelScope() as lifecycle_scope:');
    await expect(lifecycle).toContainText('lifecycle_scope.shield = True');
    await expect(lifecycle).toContainText('lifecycle_scope.deadline = anyio.current_time() + cleanup_seconds');
    await expect(lifecycle).toContainText('await client.disconnect()\n            cleanup_completed = True');
    await expect(lifecycle).toContainText('cleanup deadline exceeded; resources may remain');
    await expect(lifecycle).toContainText('await anyio.lowlevel.checkpoint()');
    const hooks = blocks.filter({ hasText: 'async def deny_bash(' });
    await expect(hooks).toContainText('async def deny_bash(input_data, tool_use_id, context):');
    await expect(hooks).toContainText('HookMatcher(matcher="Bash", hooks=[deny_bash])');
    await expect(hooks).toContainText('"permissionDecision": "deny"');
    await expect(hooks).toContainText('anyio.run(main, parser.parse_args().live)');
    await expect(blocks.filter({ hasText: 'async def prompts()' }))
      .toContainText('query(prompt=prompts(), options=make_options())');
    const mcp = blocks.filter({ hasText: '@tool("calculate_sum"' });
    await expect(mcp).toContainText('mcp_servers={"math": server}');
    await expect(mcp).toContainText('allowed_tools=["mcp__math__calculate_sum"]');
    await expect(mcp).toContainText('await calculate_sum.handler({"a": 15.0, "b": 27.0})');
    await expect(blocks.filter({ hasText: 'uv pip install' }))
      .toContainText('"claude-agent-sdk==0.1.3" "mcp==1.18.0" "anyio==4.11.0"');
    expect((await blocks.allTextContents()).join('\n'))
      .not.toMatch(/AsyncClaudeSDKClient|@client\.hook|HookMatcher\([^)]*timeout=/);
    const targets = await article.locator('a[href*="to="]').evaluateAll((links) =>
      links.map((link) => new URL((link as HTMLAnchorElement).href).searchParams.get('to')),
    );
    expect(targets).toContain('https://github.com/anthropics/claude-agent-sdk-python/blob/v0.1.3/src/claude_agent_sdk/types.py');
    expect(targets).toContain('https://github.com/anthropics/claude-agent-sdk-python/blob/v0.1.3/src/claude_agent_sdk/client.py');
  });
}
