from __future__ import annotations

import os
from pathlib import Path

from builder import build_artifacts, load_manifest


ROOT = Path(__file__).resolve().parent
REPO_ROOT = ROOT.parents[1]


def clear() -> None:
    os.system("cls" if os.name == "nt" else "clear")


def render(state: dict[str, object]) -> None:
    clear()
    print("\033[1m三语交互图解创作工具\033[0m")
    print("\033[2m预览可复用的 shell/runtime/demo 与 locale 数据。\033[0m\n")
    print(f"\033[1m语言\033[0m: en, zh, ja")
    print(f"\033[1m包含总览\033[0m: {state['include_overview']}")
    print(f"\033[1m步骤数量\033[0m: {state['step_limit']}")
    print(f"\033[1m最近构建\033[0m: {state['last_build']}\n")
    print("[o] 切换总览  [1] 一个步骤  [2] 两个步骤  [b] 构建  [q] 退出")


def main() -> int:
    manifest = load_manifest(ROOT / "manifest.json")
    state: dict[str, object] = {
        "include_overview": True,
        "step_limit": 2,
        "last_build": "尚未构建",
    }

    while True:
        render(state)
        choice = input("> ").strip().lower()
        if choice == "q":
            return 0
        if choice == "o":
            state["include_overview"] = not bool(state["include_overview"])
        elif choice in {"1", "2"}:
            state["step_limit"] = int(choice)
        elif choice == "b":
            output = REPO_ROOT / "dist" / "visual-kit" / "interactive"
            built = build_artifacts(
                ROOT,
                manifest,
                output,
                locales=["en", "zh", "ja"],
                include_overview=bool(state["include_overview"]),
                step_limit=int(state["step_limit"]),
            )
            state["last_build"] = f"{len(built)} 个文件 → {output}"


if __name__ == "__main__":
    raise SystemExit(main())
