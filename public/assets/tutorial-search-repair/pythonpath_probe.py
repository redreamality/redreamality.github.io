"""Inspect one Python process or run isolated import-path checks without packages."""

import argparse
import importlib
import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile


def inspect_process(module):
    print(json.dumps({
        "executable": sys.executable,
        "cwd": os.getcwd(),
        "PYTHONPATH": os.environ.get("PYTHONPATH"),
        "ignore_environment": sys.flags.ignore_environment,
        "isolated": sys.flags.isolated,
        "sys.path": sys.path,
    }, indent=2))
    imported = importlib.import_module(module)
    print("module_file:", getattr(imported, "__file__", None))


def self_test():
    # A unique uninstalled package prevents a global package from hiding failure.
    with tempfile.TemporaryDirectory(prefix="pythonpath-check-") as directory:
        root = Path(directory)
        source = root / "src"
        package = source / "path_probe_fixture"
        package.mkdir(parents=True)
        (package / "__init__.py").write_text("VALUE = 42\n", encoding="utf-8")
        elsewhere = root / "elsewhere"
        elsewhere.mkdir()
        environment = dict(os.environ)
        environment.pop("PYTHONPATH", None)
        environment.pop("PYTHONHOME", None)
        program = (
            "import path_probe_fixture as p; "
            "assert p.VALUE == 42; print(p.__file__)"
        )
        cases = [
            ("unset", None, [], root, False),
            ("source-directory", str(source), [], root, True),
            ("package-directory-is-wrong", str(package), [], root, False),
            ("absolute-path-new-cwd", str(source), [], elsewhere, True),
            ("relative-path-new-cwd", "./src", [], elsewhere, False),
            ("ignore-environment", str(source), ["-E"], root, False),
            ("isolated-mode", str(source), ["-I"], root, False),
        ]
        for name, path, flags, cwd, should_import in cases:
            child_environment = dict(environment)
            if path is not None:
                child_environment["PYTHONPATH"] = path
            result = subprocess.run(
                [sys.executable, "-B", *flags, "-c", program],
                cwd=cwd, env=child_environment, text=True,
                capture_output=True, timeout=10, check=False,
            )
            if should_import:
                assert result.returncode == 0, (name, result.stderr)
                assert Path(result.stdout.strip()).resolve() == (
                    package / "__init__.py"
                ).resolve(), (name, result.stdout)
            else:
                assert result.returncode != 0, name
                assert "ModuleNotFoundError" in result.stderr, (name, result.stderr)
            print("PASS", name)
    print("7 local checks passed; no VS Code process was exercised")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("module", nargs="?", default="my_package")
    parser.add_argument("--self-test", action="store_true")
    arguments = parser.parse_args()
    if arguments.self_test:
        self_test()
    else:
        inspect_process(arguments.module)
