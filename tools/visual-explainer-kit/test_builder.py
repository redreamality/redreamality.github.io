from __future__ import annotations

import copy
import json
import unittest
from pathlib import Path

from builder import validate_manifest


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
            validate_manifest(manifest)


if __name__ == "__main__":
    unittest.main()
