from __future__ import annotations

import argparse
from pathlib import Path

from builder import build_artifacts, load_manifest


def main() -> int:
    parser = argparse.ArgumentParser(description="构建三语交互图解 HTML 产物。")
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--manifest", type=Path)
    parser.add_argument("--locales", nargs="+", default=["en", "zh", "ja"])
    parser.add_argument("--no-overview", action="store_true")
    parser.add_argument("--step-limit", type=int)
    args = parser.parse_args()

    root = Path(__file__).resolve().parent
    manifest_path = args.manifest or root / "manifest.json"
    manifest = load_manifest(manifest_path if manifest_path.is_absolute() else root / manifest_path)
    output = args.output if args.output.is_absolute() else root.parents[1] / args.output
    built = build_artifacts(
        root,
        manifest,
        output,
        locales=args.locales,
        include_overview=not args.no_overview,
        step_limit=args.step_limit,
    )
    for path in built:
        print(path)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
