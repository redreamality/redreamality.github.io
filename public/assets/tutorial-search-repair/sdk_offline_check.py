# /// script
# requires-python = ">=3.10"
# dependencies = [
#   "claude-agent-sdk==0.1.3",
#   "mcp==1.18.0",
#   "anyio==4.11.0",
#   "pydantic==2.11.7",
# ]
# ///
"""Check the historical tutorial's imports and signatures without starting a CLI."""

import inspect
from importlib.metadata import version


def main():
    for package, expected in (
        ("claude-agent-sdk", "0.1.3"),
        ("mcp", "1.18.0"),
        ("anyio", "4.11.0"),
        ("pydantic", "2.11.7"),
    ):
        installed = version(package)
        print(f"{package}=={installed}")
        assert installed == expected, (package, installed, expected)

    from claude_agent_sdk import (
        ClaudeAgentOptions, ClaudeSDKClient, HookMatcher, query,
    )

    assert inspect.isasyncgenfunction(query)
    assert inspect.iscoroutinefunction(ClaudeSDKClient.query)
    assert set(inspect.signature(HookMatcher).parameters) == {"matcher", "hooks"}
    ClaudeAgentOptions(max_turns=2, setting_sources=[])
    print("PASS imports and signatures; no CLI or model was started")


if __name__ == "__main__":
    main()
