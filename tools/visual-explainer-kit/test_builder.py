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
    def test_runtime_keeps_status_outside_the_demo_mount_and_resizes_by_stage(self) -> None:
        runtime = (ROOT / "src" / "demo-runtime.js").read_text(encoding="utf-8")

        self.assertIn('<div class="stage"><div class="mount"></div><div class="runtime-status" data-runtime-status role="status"></div></div>', runtime)
        self.assertIn('root: this._mountRoot', runtime)
        self.assertIn('width: this._stage.clientWidth', runtime)
        self.assertIn('height: this._stage.clientHeight', runtime)
        self.assertIn('this._status.hidden = true', runtime)
        self.assertIn('.runtime-status[data-live-only]', runtime)
        self.assertIn('clip-path: inset(50%)', runtime)
        self.assertIn('this._status.removeAttribute("data-live-only")', runtime)
        self.assertIn('this._status.setAttribute("data-live-only", "")', runtime)
        self.assertIn('this._status.hidden = false', runtime)
        self.assertIn('queueMicrotask(() =>', runtime)
        self.assertNotIn('root: this._stage', runtime)
        self.assertNotIn('.status {', runtime)
        self.assertNotIn('querySelector(".status")', runtime)

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

    def test_renders_air_conditioner_content_in_all_locales(self) -> None:
        manifest = load_manifest(ROOT / "manifest-air-conditioner.json")

        for locale, title in (
            ("en", "How air conditioning moves heat"),
            ("zh", "空调怎样把热量搬出去"),
            ("ja", "エアコンはどう熱を外へ運ぶのか"),
        ):
            document = render_document(
                ROOT,
                manifest,
                locale,
                include_overview=True,
                step_limit=None,
            )

            self.assertEqual(document.count("<interactive-figure"), 6)
            self.assertIn(f"<h1>{title}</h1>", document)
            self.assertIn('data-demo="ac-cycle-overview"', document)
            self.assertIn('data-demo="ac-energy-ledger"', document)
            self.assertIn('class="closing"', document)

    def test_renders_price_volume_content_in_all_locales(self) -> None:
        manifest = load_manifest(ROOT / "manifest-price-volume-relationship.json")

        for locale, title in (
            ("en", "Price shows where an auction moved. Volume shows how much traded there."),
            ("zh", "价格显示竞价走到哪里，成交量显示在那里交换了多少"),
            ("ja", "価格はオークションの到達点、出来高はそこで交換された量を示す"),
        ):
            document = render_document(
                ROOT,
                manifest,
                locale,
                include_overview=True,
                step_limit=None,
            )
            self.assertEqual(document.count("<interactive-figure"), 7)
            self.assertEqual(document.count("<h1>"), 1)
            self.assertIn(f"<h1>{title}</h1>", document)
            self.assertIn('data-demo="pv-auction-overview"', document)
            self.assertIn('data-demo="pv-context-checklist"', document)
            self.assertIn('class="closing"', document)
            self.assertNotIn("fetch(", document)


if __name__ == "__main__":
    unittest.main()
