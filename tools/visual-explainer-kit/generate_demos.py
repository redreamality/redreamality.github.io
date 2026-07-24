from __future__ import annotations

import argparse
import datetime as dt
import hashlib
import json
import os
import re
import subprocess
import tempfile
import time
import urllib.error
import urllib.request
from pathlib import Path
from typing import Any

from builder import load_manifest


DEFAULT_MODEL = "gemini-3.1-pro"
DEFAULT_ENDPOINT = "https://newapi.aoe.chat/v1/chat/completions"
REQUEST_TIMEOUT_SECONDS = 600
RETRY_DELAYS_SECONDS = (2, 5)
REQUEST_LOG_PATH = Path(__file__).resolve().parent / "logs" / "generation-requests.ndjson"
GOPASS_ENTRY = "newapi/gemini"
GOPASS_EXE = Path(r"C:\Users\Remy\.agents\skills\gopass\gopass.exe")
GPG_EXE = Path(r"C:\Program Files\GnuPG\bin\gpg.exe")
REQUIRED_LIFECYCLE = ("pause", "resume", "reset", "destroy")
ALLOWED_TOKEN_NAMES = {"ink", "muted", "line", "ocean", "warm", "coral", "paper", "surface"}
ALLOWED_STATIC_URLS = {
    "http://www.w3.org/2000/svg",
    "http://www.w3.org/1999/xlink",
}
FORBIDDEN_SOURCE_PATTERNS = {
    "完整 HTML": r"<!doctype\s+html|<html\b|<script\b",
    "外部网络": r"\bfetch\s*\(|\bXMLHttpRequest\b|\bWebSocket\s*\(|\bEventSource\s*\(|\bsendBeacon\s*\(",
    "全局 DOM": r"(?:\bdocument|\bwindow\s*\.\s*document|\bglobalThis\s*\.\s*document)\s*\.",
    "私有尺寸观察": r"\bnew\s+ResizeObserver\b",
    "全局像素比": r"\b(?:window|globalThis)\s*\.\s*devicePixelRatio\b",
    "模块导入": r"\b(?:import|export)\s+",
    "共享运行时 class": (
        r'class\s*=\s*["\'][^"\']*(?<![\w-])'
        r'(?:frame|stage|controls|title|status)(?![\w-])[^"\']*["\']'
    ),
    "Canvas 硬编码文案": r"\b(?:fillText|strokeText)\s*\(\s*[\"'`]",
    "颜色 token 名字符串": (
        r"\bresolveColor\s*\(\s*[\"']"
        r"(?:ink|muted|line|ocean|warm|coral|paper|surface)[\"']"
    ),
}
SENSITIVE_HEADER_FRAGMENTS = (
    "authorization",
    "cookie",
    "api-key",
    "apikey",
    "token",
    "secret",
    "password",
)


class TransientRequestError(RuntimeError):
    pass


def read_text(path: Path) -> str:
    return path.read_text(encoding="utf-8-sig")


def redact_string(value: str, api_key: str) -> str:
    redacted = value.replace(api_key, "***") if api_key else value
    redacted = re.sub(r"(?i)\bBearer\s+[A-Za-z0-9._~+/=-]+", "Bearer ***", redacted)
    redacted = re.sub(r"\bsk-[A-Za-z0-9_-]{8,}\b", "sk-***", redacted)
    return redacted


def redact(value: Any, api_key: str) -> Any:
    if isinstance(value, str):
        return redact_string(value, api_key)
    if isinstance(value, dict):
        return {str(key): redact(item, api_key) for key, item in value.items()}
    if isinstance(value, (list, tuple)):
        return [redact(item, api_key) for item in value]
    return value


def safe_response_headers(headers: Any) -> dict[str, str]:
    safe: dict[str, str] = {}
    if headers is None:
        return safe
    for key, value in headers.items():
        normalized = str(key).lower()
        safe[normalized] = (
            "[REDACTED]"
            if any(fragment in normalized for fragment in SENSITIVE_HEADER_FRAGMENTS)
            else str(value)
        )
    return safe


def log_request_event(
    *,
    event: str,
    demo_id: str,
    attempt: int,
    started_at: float,
    api_key: str,
    **details: Any,
) -> None:
    record = {
        "timestamp": dt.datetime.now(dt.timezone.utc).isoformat(),
        "event": event,
        "demo_id": demo_id,
        "attempt": attempt,
        "elapsed_seconds": round(time.monotonic() - started_at, 3),
        **details,
    }
    REQUEST_LOG_PATH.parent.mkdir(parents=True, exist_ok=True)
    with REQUEST_LOG_PATH.open("a", encoding="utf-8", newline="\n") as log_file:
        log_file.write(json.dumps(redact(record, api_key), ensure_ascii=False) + "\n")


def get_api_key() -> str:
    if key := os.environ.get("NEWAPI_GEMINI_KEY", "").strip():
        return key
    if not GOPASS_EXE.is_file():
        raise RuntimeError(f"找不到 gopass：{GOPASS_EXE}")
    environment = os.environ.copy()
    environment["GOPASS_GPG_BINARY"] = str(GPG_EXE)
    result = subprocess.run(
        [str(GOPASS_EXE), "show", "-o", GOPASS_ENTRY],
        check=False,
        capture_output=True,
        text=True,
        env=environment,
        timeout=90,
    )
    if result.returncode != 0:
        raise RuntimeError(
            "无法从 gopass 读取 Gemini 密钥。请在交互式 PowerShell 中先执行 "
            "gopass show -o newapi/gemini 完成解锁，再重试。"
        )
    key = result.stdout.strip()
    if not key:
        raise RuntimeError("gopass 返回了空密钥。")
    return key


def resolve_manifest(root: Path, requested: Path) -> tuple[Path, dict[str, Any]]:
    path = requested if requested.is_absolute() else root / requested
    return path, load_manifest(path)


def load_target(manifest: dict[str, Any], target_id: str, locale: str) -> dict[str, Any]:
    if locale not in manifest["locales"]:
        raise ValueError(f"manifest 不包含 locale：{locale}")
    structure = manifest["structure"]
    localized = manifest["locales"][locale]
    overview = structure["overview"]
    if target_id in {"overview", overview["demo"]}:
        copy = localized["overview"]
        return {
            "id": "overview",
            "demo": overview["demo"],
            "title": copy["title"],
            "body": copy["body"],
            "demoTitle": copy["demoTitle"],
            "copy": copy["copy"],
        }
    for index, step in enumerate(structure["steps"]):
        if target_id not in {step["id"], step["demo"]}:
            continue
        copy = localized["steps"][index]
        return {
            "id": step["id"],
            "demo": step["demo"],
            "title": copy["title"],
            "body": copy["body"],
            "demoTitle": copy["demoTitle"],
            "copy": copy["copy"],
        }
    raise ValueError(f"manifest 中不存在步骤或 demo：{target_id}")


def prompt_text(value: Any) -> str:
    if isinstance(value, str):
        return value
    if isinstance(value, list):
        return "\n\n".join(prompt_text(item) for item in value)
    return json.dumps(value, ensure_ascii=False)


def compile_prompts(root: Path, manifest: dict[str, Any], target_id: str, locale: str) -> tuple[str, str]:
    target = load_target(manifest, target_id, locale)
    contract = read_text(root / "prompts" / "animation-contract.md").strip()
    template = read_text(root / "prompts" / "demo-prompt.md")
    replacements = {
        "{{DEMO_ID}}": target["demo"],
        "{{STEP_ID}}": target["id"],
        "{{LOCALE}}": locale,
        "{{TITLE}}": prompt_text(target["title"]),
        "{{BODY}}": prompt_text(target["body"]),
        "{{DEMO_TITLE}}": prompt_text(target["demoTitle"]),
        "{{COPY_JSON}}": json.dumps(target["copy"], ensure_ascii=False, indent=2),
    }
    prompt = template
    for marker, value in replacements.items():
        prompt = prompt.replace(marker, value)
    return contract, prompt.strip()


def parse_delta(payload: dict[str, Any]) -> str:
    choices = payload.get("choices") or []
    if not choices:
        return ""
    content = (choices[0].get("delta") or {}).get("content", "")
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        return "".join(item.get("text", "") for item in content if isinstance(item, dict))
    return ""


def build_request_payload(system_prompt: str, user_prompt: str, model: str) -> dict[str, Any]:
    return {
        "model": model,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        "stream": True,
        "reasoning_effort": "low",
        "temperature": 0.7,
        "max_tokens": 32768,
    }


def request_once(
    *,
    demo_id: str,
    system_prompt: str,
    user_prompt: str,
    api_key: str,
    endpoint: str,
    model: str,
    attempt: int,
) -> str:
    started_at = time.monotonic()
    request_body = json.dumps(
        build_request_payload(system_prompt, user_prompt, model),
        ensure_ascii=False,
    ).encode("utf-8")
    request = urllib.request.Request(
        endpoint,
        data=request_body,
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            "Accept": "text/event-stream",
        },
        method="POST",
    )
    log_request_event(
        event="request_started",
        demo_id=demo_id,
        attempt=attempt,
        started_at=started_at,
        api_key=api_key,
        endpoint=endpoint,
        model=model,
        request_bytes=len(request_body),
    )
    chunks: list[str] = []
    completed = False
    headers: Any = None
    try:
        with urllib.request.urlopen(request, timeout=REQUEST_TIMEOUT_SECONDS) as response:
            headers = response.headers
            for raw_line in response:
                line = raw_line.decode("utf-8", errors="replace").strip()
                if not line or not line.startswith("data:"):
                    continue
                data = line[5:].strip()
                if data == "[DONE]":
                    completed = True
                    break
                try:
                    payload = json.loads(data)
                except json.JSONDecodeError:
                    continue
                chunks.append(parse_delta(payload))
        if not completed:
            raise TransientRequestError("连接在 SSE 完成标记前结束。")
    except urllib.error.HTTPError as error:
        body = error.read().decode("utf-8", errors="replace")
        log_request_event(
            event="request_http_error",
            demo_id=demo_id,
            attempt=attempt,
            started_at=started_at,
            api_key=api_key,
            status=error.code,
            response_headers=safe_response_headers(error.headers),
            response_body=body,
        )
        if error.code in {408, 409, 425, 429, 500, 502, 503, 504}:
            raise TransientRequestError(f"HTTP {error.code}，{body}") from error
        raise RuntimeError(f"Gemini 请求失败：HTTP {error.code}，{body}") from error
    except urllib.error.URLError as error:
        log_request_event(
            event="request_connection_error",
            demo_id=demo_id,
            attempt=attempt,
            started_at=started_at,
            api_key=api_key,
            exception_message=str(error.reason),
        )
        raise TransientRequestError(f"连接失败：{error.reason}") from error

    source = "".join(chunks).strip()
    if not source:
        raise RuntimeError("Gemini 返回空内容。")
    log_request_event(
        event="request_succeeded",
        demo_id=demo_id,
        attempt=attempt,
        started_at=started_at,
        api_key=api_key,
        response_headers=safe_response_headers(headers),
        response_chars=len(source),
    )
    return source


def request_adapter(
    *,
    demo_id: str,
    system_prompt: str,
    user_prompt: str,
    api_key: str,
    endpoint: str,
    model: str,
) -> str:
    for attempt in range(len(RETRY_DELAYS_SECONDS) + 1):
        try:
            return request_once(
                demo_id=demo_id,
                system_prompt=system_prompt,
                user_prompt=user_prompt,
                api_key=api_key,
                endpoint=endpoint,
                model=model,
                attempt=attempt + 1,
            )
        except TransientRequestError as error:
            if attempt >= len(RETRY_DELAYS_SECONDS):
                raise RuntimeError(
                    f"Gemini 请求在 {attempt + 1} 次尝试后仍失败：{error}"
                ) from error
            time.sleep(RETRY_DELAYS_SECONDS[attempt])
    raise AssertionError("unreachable")


def clean_adapter(source: str) -> str:
    cleaned = source.strip()
    fenced = re.fullmatch(r"```(?:javascript|js)?\s*([\s\S]*?)\s*```", cleaned, flags=re.IGNORECASE)
    if fenced:
        cleaned = fenced.group(1).strip()
    registration = cleaned.find("registerDemo(")
    if registration > 0:
        cleaned = cleaned[registration:]
    return cleaned.rstrip() + "\n"


def validate_javascript_syntax(source: str) -> None:
    temporary_path: Path | None = None
    try:
        with tempfile.NamedTemporaryFile(
            mode="w",
            suffix=".js",
            encoding="utf-8",
            newline="\n",
            delete=False,
        ) as temporary:
            temporary.write(source)
            temporary_path = Path(temporary.name)
        result = subprocess.run(
            ["node", "--check", str(temporary_path)],
            check=False,
            capture_output=True,
            text=True,
            timeout=30,
        )
    except FileNotFoundError as error:
        raise RuntimeError("找不到 Node.js，无法完成 demo 语法校验。") from error
    finally:
        if temporary_path is not None:
            temporary_path.unlink(missing_ok=True)
    if result.returncode != 0:
        detail = (result.stderr or result.stdout).strip()
        raise ValueError(f"demo JavaScript 语法无效：{detail}")


def validate_adapter(demo_id: str, source: str) -> None:
    registration = re.compile(rf'registerDemo\(\s*["\']{re.escape(demo_id)}["\']')
    if not registration.search(source):
        raise ValueError(f"产物没有注册预期 demo ID：{demo_id}")
    factory_context = re.compile(
        rf'registerDemo\(\s*["\']{re.escape(demo_id)}["\']\s*,\s*'
        r'(?:async\s*)?(?:function\s*)?\(\s*\{[^}]*\broot\b[^}]*\bcopy\b[^}]*\}\s*\)'
    )
    if not factory_context.search(source):
        raise ValueError("demo factory 必须使用包含 root 和 copy 的对象解构参数。")
    if not re.search(r"\bcopy(?:\.|\[)", source):
        raise ValueError("demo 必须从 copy 读取可见和 aria 文案，不能硬编码单一语言。")
    for name, pattern in FORBIDDEN_SOURCE_PATTERNS.items():
        if re.search(pattern, source, flags=re.IGNORECASE):
            raise ValueError(f"产物包含禁止内容：{name}")
    urls = set(re.findall(r"https?://[^\s\"'`<>]+", source, flags=re.IGNORECASE))
    forbidden_urls = sorted(url for url in urls if url not in ALLOWED_STATIC_URLS)
    if forbidden_urls:
        raise ValueError(f"产物包含禁止的外部 URL：{', '.join(forbidden_urls)}")
    for method in REQUIRED_LIFECYCLE:
        lifecycle_pattern = re.compile(
            rf"\b{method}\s*(?:\(\s*\)|:\s*(?:\(\s*\)\s*=>|function\s*\(\s*\)))"
        )
        if not lifecycle_pattern.search(source):
            raise ValueError(f"产物缺少生命周期方法：{method}()")
    used_tokens = set(re.findall(r"\btokens\.([A-Za-z_$][\w$]*)", source))
    unknown_tokens = sorted(used_tokens - ALLOWED_TOKEN_NAMES)
    if unknown_tokens:
        raise ValueError(f"产物使用了未知设计 token：{', '.join(unknown_tokens)}")
    if re.search(r"\.getContext\(\s*[\"']2d[\"']", source):
        if not re.search(r"\bresolveColor\b", source):
            raise ValueError("Canvas demo 必须使用 resolveColor() 解析设计 token。")
        if re.search(r"\b(?:fillStyle|strokeStyle)\s*=\s*tokens\.", source):
            raise ValueError("Canvas fillStyle/strokeStyle 不能直接使用 CSS var token。")
    validate_javascript_syntax(source)


def write_atomic(destination: Path, source: str) -> None:
    destination.parent.mkdir(parents=True, exist_ok=True)
    temporary = destination.with_suffix(destination.suffix + ".tmp")
    temporary.write_text(source, encoding="utf-8", newline="\n")
    temporary.replace(destination)


def generate_demo(
    *,
    root: Path,
    manifest: dict[str, Any],
    target_id: str,
    locale: str,
    destination: Path,
    api_key: str,
    endpoint: str = DEFAULT_ENDPOINT,
    model: str = DEFAULT_MODEL,
) -> Path:
    target = load_target(manifest, target_id, locale)
    system_prompt, user_prompt = compile_prompts(root, manifest, target_id, locale)
    source = clean_adapter(
        request_adapter(
            demo_id=target["demo"],
            system_prompt=system_prompt,
            user_prompt=user_prompt,
            api_key=api_key,
            endpoint=endpoint,
            model=model,
        )
    )
    validation_started_at = time.monotonic()
    try:
        validate_adapter(target["demo"], source)
    except Exception as error:
        log_request_event(
            event="adapter_validation_error",
            demo_id=target["demo"],
            attempt=0,
            started_at=validation_started_at,
            api_key=api_key,
            destination=str(destination),
            exception_type=type(error).__name__,
            exception_message=str(error),
            model_output=source,
            model_output_chars=len(source),
        )
        raise
    write_atomic(destination, source)
    return destination


def prompt_fingerprint(
    root: Path,
    manifest: dict[str, Any],
    target_id: str,
    locale: str,
    model: str,
) -> str:
    prompts = compile_prompts(root, manifest, target_id, locale)
    material = "\n\n".join([model, *prompts])
    return hashlib.sha256(material.encode("utf-8")).hexdigest()


def load_state(path: Path) -> dict[str, str]:
    if not path.exists():
        return {}
    return json.loads(read_text(path))


def save_state(path: Path, state: dict[str, str]) -> None:
    write_atomic(path, json.dumps(state, ensure_ascii=False, indent=2) + "\n")


def generation_targets(manifest: dict[str, Any], include_overview: bool) -> list[str]:
    ids = [step["id"] for step in manifest["structure"]["steps"]]
    return ["overview", *ids] if include_overview else ids


def main() -> int:
    parser = argparse.ArgumentParser(description="使用 Gemini 逐 demo 生成多语言交互适配器。")
    parser.add_argument("--manifest", type=Path, default=Path("manifest.json"))
    selection = parser.add_mutually_exclusive_group(required=True)
    selection.add_argument("--step", help="生成指定共享步骤 ID 或 demo ID，也可使用 overview。")
    selection.add_argument("--all", action="store_true", help="按 manifest 顺序生成全部步骤。")
    parser.add_argument("--include-overview", action="store_true", help="配合 --all 生成 overview。")
    parser.add_argument("--locale", default="en", help="用于向 Gemini 描述语义的 locale。")
    parser.add_argument("--resume", action="store_true", help="跳过 prompt 未变化且已有产物的 demo。")
    parser.add_argument("--endpoint", default=DEFAULT_ENDPOINT)
    parser.add_argument("--model", default=DEFAULT_MODEL)
    args = parser.parse_args()

    root = Path(__file__).resolve().parent
    manifest_path, manifest = resolve_manifest(root, args.manifest)
    target_ids = (
        generation_targets(manifest, args.include_overview)
        if args.all
        else [args.step]
    )
    api_key = get_api_key()
    state_path = root / ".generation-state.json"
    state = load_state(state_path)

    for target_id in target_ids:
        target = load_target(manifest, target_id, args.locale)
        destination = root / "src" / "demos" / f"{target['demo']}.js"
        state_key = f"{manifest_path.name}:{args.locale}:{target['id']}:{args.model}"
        fingerprint = prompt_fingerprint(root, manifest, target_id, args.locale, args.model)
        if args.resume and destination.exists() and state.get(state_key) == fingerprint:
            print(f"skip {target['demo']}")
            continue
        print(f"generate {target['demo']}")
        generate_demo(
            root=root,
            manifest=manifest,
            target_id=target_id,
            locale=args.locale,
            destination=destination,
            api_key=api_key,
            endpoint=args.endpoint,
            model=args.model,
        )
        state[state_key] = fingerprint
        save_state(state_path, state)
        print(f"done {target['demo']}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
