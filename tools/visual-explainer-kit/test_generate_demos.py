from __future__ import annotations

import json
import tempfile
import threading
import unittest
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from unittest import mock

import generate_demos
from builder import load_manifest


ROOT = Path(__file__).resolve().parent


class DemoSseHandler(BaseHTTPRequestHandler):
    requests: list[dict[str, object]] = []

    def do_POST(self) -> None:  # noqa: N802
        length = int(self.headers["Content-Length"])
        payload = json.loads(self.rfile.read(length))
        type(self).requests.append(payload)
        source = '''registerDemo("energy", ({ root, copy, motion, tokens }) => {
  root.innerHTML = `<div role="img" aria-label="${copy.ariaLabel}" style="color:${tokens.ink}">${copy.caption}</div>`;
  return {
    pause() {},
    resume() {},
    reset() {},
    destroy() { root.innerHTML = ""; }
  };
});'''
        event = json.dumps({"choices": [{"delta": {"content": source}}]})
        body = f"data: {event}\n\ndata: [DONE]\n\n".encode()
        self.send_response(200)
        self.send_header("Content-Type", "text/event-stream")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, format: str, *args: object) -> None:
        return


class GeminiGenerationTests(unittest.TestCase):
    def setUp(self) -> None:
        DemoSseHandler.requests = []
        self.server = ThreadingHTTPServer(("127.0.0.1", 0), DemoSseHandler)
        self.thread = threading.Thread(target=self.server.serve_forever, daemon=True)
        self.thread.start()
        self.endpoint = f"http://127.0.0.1:{self.server.server_port}/v1/chat/completions"
        self.manifest = load_manifest(ROOT / "manifest.json")
        self.temporary = tempfile.TemporaryDirectory()
        self.log_path = Path(self.temporary.name) / "generation-requests.ndjson"
        self.log_patcher = mock.patch.object(generate_demos, "REQUEST_LOG_PATH", self.log_path)
        self.log_patcher.start()

    def tearDown(self) -> None:
        self.log_patcher.stop()
        self.server.shutdown()
        self.server.server_close()
        self.thread.join(timeout=5)
        self.temporary.cleanup()

    def test_one_demo_uses_gemini_stream_and_writes_valid_adapter(self) -> None:
        destination = Path(self.temporary.name) / "energy.js"
        built = generate_demos.generate_demo(
            root=ROOT,
            manifest=self.manifest,
            target_id="ocean-energy",
            locale="en",
            destination=destination,
            api_key="sk-test-secret",
            endpoint=self.endpoint,
        )

        self.assertEqual(built, destination)
        self.assertIn('registerDemo("energy"', destination.read_text(encoding="utf-8"))
        self.assertEqual(len(DemoSseHandler.requests), 1)
        request = DemoSseHandler.requests[0]
        self.assertEqual(request["model"], "gemini-3.1-pro")
        self.assertTrue(request["stream"])
        prompt = request["messages"][1]["content"]
        self.assertIn("ocean-energy", prompt)
        self.assertIn('"controlLabel"', prompt)
        self.assertNotIn("storm-organization", prompt)
        log = self.log_path.read_text(encoding="utf-8")
        self.assertNotIn("sk-test-secret", log)

    def test_prompt_requires_runtime_copy_instead_of_one_locale(self) -> None:
        contract, prompt = generate_demos.compile_prompts(
            ROOT,
            self.manifest,
            "storm-organization",
            "ja",
        )

        self.assertIn("所有可见文本", contract)
        self.assertIn("copy", contract)
        self.assertIn("document.createElement", contract)
        self.assertIn('"organizedButton"', prompt)
        self.assertIn("生成源码必须读取对应 `copy` 字段", prompt)

    def test_prompt_flattens_multi_paragraph_body_for_gemini(self) -> None:
        manifest = load_manifest(ROOT / "manifest-loop-engineering.json")

        _, prompt = generate_demos.compile_prompts(
            ROOT,
            manifest,
            "failure-lab",
            "en",
        )

        self.assertIn("Reliable behavior is an emergent property", prompt)
        self.assertIn("break the machine on purpose", prompt)

    def test_validation_rejects_adapter_without_copy(self) -> None:
        source = '''registerDemo("energy", ({ root, copy }) => {
  root.textContent = "Hard-coded";
  return { pause() {}, resume() {}, reset() {}, destroy() {} };
});'''

        with self.assertRaisesRegex(ValueError, "必须从 copy"):
            generate_demos.validate_adapter("energy", source)

    def test_validation_rejects_css_variable_tokens_used_directly_by_canvas(self) -> None:
        source = '''registerDemo("energy", ({ root, copy, tokens, resolveColor }) => {
  root.innerHTML = `<canvas aria-label="${copy.ariaLabel}"></canvas>`;
  const context = root.querySelector("canvas").getContext("2d");
  context.fillStyle = tokens.ocean;
  return { pause() {}, resume() {}, reset() {}, destroy() {} };
});'''

        with self.assertRaisesRegex(ValueError, "不能直接使用"):
            generate_demos.validate_adapter("energy", source)

    def test_validation_rejects_runtime_owned_class_names(self) -> None:
        source = '''registerDemo("energy", ({ root, copy }) => {
  root.innerHTML = `<div class="controls">${copy.caption}</div>`;
  return { pause() {}, resume() {}, reset() {}, destroy() {} };
});'''

        with self.assertRaisesRegex(ValueError, "共享运行时 class"):
            generate_demos.validate_adapter("energy", source)

    def test_validation_rejects_hard_coded_canvas_copy(self) -> None:
        source = '''registerDemo("energy", ({ root, copy }) => {
  root.innerHTML = `<canvas aria-label="${copy.ariaLabel}"></canvas>`;
  const context = root.querySelector("canvas").getContext("2d");
  context.fillText("Human", 10, 10);
  return { pause() {}, resume() {}, reset() {}, destroy() {} };
});'''

        with self.assertRaisesRegex(ValueError, "Canvas 硬编码文案"):
            generate_demos.validate_adapter("energy", source)

    def test_validation_rejects_token_name_string_in_resolve_color(self) -> None:
        source = '''registerDemo("energy", ({ root, copy, resolveColor }) => {
  root.innerHTML = `<canvas aria-label="${copy.ariaLabel}"></canvas>`;
  const color = resolveColor("ocean");
  return { pause() {}, resume() {}, reset() {}, destroy() {} };
});'''

        with self.assertRaisesRegex(ValueError, "颜色 token 名字符串"):
            generate_demos.validate_adapter("energy", source)


if __name__ == "__main__":
    unittest.main()
