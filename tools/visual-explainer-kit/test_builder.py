from __future__ import annotations

import copy
import json
import unittest
from pathlib import Path

from builder import load_demo_adapters, load_manifest, render_document, validate_manifest


ROOT = Path(__file__).resolve().parent


def fresh_manifest() -> dict:
    return json.loads((ROOT / "manifest.json").read_text(encoding="utf-8"))


class ManifestValidationTests(unittest.TestCase):
    def test_rejects_missing_schema_fields(self) -> None:
        manifest = fresh_manifest()
        del manifest["locales"]

        with self.assertRaisesRegex(ValueError, "manifest 缺少字段"):
            validate_manifest(manifest)

    def test_rejects_duplicate_step_ids(self) -> None:
        manifest = fresh_manifest()
        manifest["structure"]["steps"][1]["id"] = manifest["structure"]["steps"][0]["id"]

        with self.assertRaisesRegex(ValueError, "共享步骤 ID 必须唯一"):
            validate_manifest(manifest)

    def test_rejects_unregistered_demos(self) -> None:
        manifest = copy.deepcopy(fresh_manifest())
        manifest["structure"]["steps"][0]["demo"] = "missing-demo"

        with self.assertRaisesRegex(ValueError, "未注册 demo"):
            load_demo_adapters(ROOT, manifest)

    def test_renders_rich_loop_engineering_content_and_all_registered_demos(self) -> None:
        manifest = load_manifest(ROOT / "manifest-loop-engineering.json")

        document = render_document(
            ROOT,
            manifest,
            "zh",
            include_overview=True,
            step_limit=None,
        )

        self.assertEqual(document.count("<interactive-figure"), 10)
        self.assertIn('data-demo="role-shift"', document)
        self.assertIn('data-demo="stop-router"', document)
        self.assertIn('data-demo="failure-lab"', document)
        self.assertIn('data-demo="workflow-blueprint"', document)
        self.assertIn('class="plain-language"', document)
        self.assertIn('class="closing"', document)
        self.assertIn("自动化下一轮之前，先回答七个问题", document)


if __name__ == "__main__":
    unittest.main()
