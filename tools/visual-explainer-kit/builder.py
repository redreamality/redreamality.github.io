from __future__ import annotations

import html
import json
import re
from pathlib import Path
from typing import Any, Iterable


SUPPORTED_LOCALES = ("en", "zh", "ja")
FORBIDDEN_ADAPTER_PATTERNS = (
    r"\bfetch\s*\(",
    r"\bXMLHttpRequest\b",
    r"\bWebSocket\b",
    r"\bEventSource\b",
    r"\bsendBeacon\s*\(",
    r"\bdocument\s*\.",
    r"\bnew\s+ResizeObserver\b",
    r"\b(?:window|globalThis)\s*\.\s*devicePixelRatio\b",
)
ALLOWED_STATIC_URLS = {
    "http://www.w3.org/2000/svg",
    "http://www.w3.org/1999/xlink",
}


def read_text(path: Path) -> str:
    return path.read_text(encoding="utf-8-sig")


def load_manifest(path: Path) -> dict[str, Any]:
    manifest = json.loads(read_text(path))
    validate_manifest(manifest)
    return manifest


def validate_manifest(manifest: dict[str, Any]) -> None:
    if not isinstance(manifest, dict):
        raise ValueError("manifest 必须是对象。")
    missing_top_level = {"structure", "locales"} - manifest.keys()
    if missing_top_level:
        raise ValueError(f"manifest 缺少字段：{sorted(missing_top_level)}")

    structure = manifest["structure"]
    if not isinstance(structure, dict) or not isinstance(structure.get("steps"), list):
        raise ValueError("structure.steps 必须是数组。")
    if not isinstance(structure.get("overview"), dict) or not structure["overview"].get("demo"):
        raise ValueError("structure.overview 必须声明 demo。")

    for step in structure["steps"]:
        if not isinstance(step, dict) or not step.get("id") or not step.get("demo"):
            raise ValueError("每个共享步骤都必须声明 id 和 demo。")

    expected_steps = [step["id"] for step in structure["steps"]]
    if len(expected_steps) != len(set(expected_steps)):
        raise ValueError("共享步骤 ID 必须唯一。")

    if not isinstance(manifest["locales"], dict):
        raise ValueError("locales 必须是对象。")
    available_locales = tuple(manifest["locales"])
    if not available_locales:
        raise ValueError("manifest 至少需要一个 locale。")
    unsupported = set(available_locales) - set(SUPPORTED_LOCALES)
    if unsupported:
        raise ValueError(f"不支持的 locale：{sorted(unsupported)}")

    for locale, localized in manifest["locales"].items():
        actual_steps = [step["id"] for step in localized["steps"]]
        if actual_steps != expected_steps:
            raise ValueError(f"{locale} 的步骤顺序必须与共享结构完全一致。")

        required_ui = {
            "pauseAll",
            "resumeAll",
            "pause",
            "resume",
            "reset",
            "waiting",
            "loading",
            "error",
            "figureFallback",
            "skipToContent",
            "languageNavigation",
        }
        missing_ui = required_ui - localized["ui"].keys()
        if missing_ui:
            raise ValueError(f"{locale} 缺少运行时文案：{sorted(missing_ui)}")


def load_demo_adapters(root: Path, manifest: dict[str, Any]) -> str:
    demos_directory = root / "src" / "demos"
    demo_ids = [
        manifest["structure"]["overview"]["demo"],
        *(step["demo"] for step in manifest["structure"]["steps"]),
    ]
    adapters = []
    for demo_id in dict.fromkeys(demo_ids):
        path = demos_directory / f"{demo_id}.js"
        if not path.is_file():
            raise ValueError(f"引用了未注册 demo：{demo_id}")
        source = read_text(path)
        registration = re.compile(rf'registerDemo\(\s*["\']{re.escape(demo_id)}["\']')
        if not registration.search(source):
            raise ValueError(f"{path.name} 没有注册预期 demo：{demo_id}")
        for pattern in FORBIDDEN_ADAPTER_PATTERNS:
            if re.search(pattern, source):
                raise ValueError(f"{path.name} 包含禁止的外部访问或全局 DOM 访问：{pattern}")
        urls = set(re.findall(r"https?://[^\s\"'`<>]+", source, flags=re.IGNORECASE))
        forbidden_urls = sorted(url for url in urls if url not in ALLOWED_STATIC_URLS)
        if forbidden_urls:
            raise ValueError(f"{path.name} 包含禁止的外部 URL：{', '.join(forbidden_urls)}")
        adapters.append(source.rstrip())

    helper = read_text(demos_directory / "helpers.js").rstrip()
    return "\n\n".join([helper, *adapters])


def escaped(value: object) -> str:
    return html.escape(str(value), quote=True)


def json_for_attribute(value: object) -> str:
    return escaped(json.dumps(value, ensure_ascii=False, separators=(",", ":")))


def json_for_script(value: object) -> str:
    return json.dumps(value, ensure_ascii=False, separators=(",", ":")).replace("<", "\\u003c")


def render_paragraphs(value: str | list[str], class_name: str = "copy-prose") -> str:
    paragraphs = value if isinstance(value, list) else [value]
    return "\n".join(f'<p class="{class_name}">{escaped(paragraph)}</p>' for paragraph in paragraphs)


def render_learning_aids(copy: dict[str, Any]) -> str:
    plain_language = copy.get("plainLanguage")
    plain_language_html = ""
    if plain_language:
        plain_language_html = (
            '<aside class="plain-language">'
            f'<strong>{escaped(plain_language["label"])}</strong>'
            f'<p>{escaped(plain_language["body"])}</p>'
            "</aside>"
        )

    key_points = copy.get("keyPoints", [])
    key_points_html = ""
    if key_points:
        cards = "".join(
            '<li class="concept-card">'
            f'<strong>{escaped(point["title"])}</strong>'
            f'<p>{escaped(point["body"])}</p>'
            "</li>"
            for point in key_points
        )
        key_points_html = (
            '<div class="concept-points">'
            f'<p class="concept-points-label">{escaped(copy["keyPointsLabel"])}</p>'
            f'<ul>{cards}</ul>'
            "</div>"
        )

    return plain_language_html + key_points_html


def render_closing(localized: dict[str, Any]) -> str:
    closing = localized.get("closing")
    if not closing:
        return ""

    checklist = "".join(f"<li>{escaped(item)}</li>" for item in closing["checklist"])
    scale_items = "".join(
        '<li class="scale-card">'
        f'<strong>{escaped(item["term"])}</strong>'
        f'<span>{escaped(item["question"])}</span>'
        f'<p>{escaped(item["role"])}</p>'
        "</li>"
        for item in closing["scaleItems"]
    )
    return f'''<section class="closing" aria-labelledby="closing-title">
  <div class="copy-block closing-copy">
    <p class="section-label">{escaped(closing["eyebrow"])}</p>
    <h2 id="closing-title">{escaped(closing["title"])}</h2>
    {render_paragraphs(closing["body"])}
    <div class="closing-grid">
      <div class="starter-checklist">
        <h3>{escaped(closing["checklistLabel"])}</h3>
        <ol>{checklist}</ol>
      </div>
      <div class="boundary-map">
        <h3>{escaped(closing["scaleTitle"])}</h3>
        <ul>{scale_items}</ul>
      </div>
    </div>
    <blockquote>{escaped(closing["finalQuote"])}</blockquote>
    <p class="source-note">{escaped(closing["sourceNote"])}</p>
  </div>
</section>'''


def render_figure(demo: str, title: str, copy: dict[str, Any], fallback: str) -> str:
    return (
        f'<interactive-figure data-demo="{escaped(demo)}" '
        f'data-title="{escaped(title)}" data-copy="{json_for_attribute(copy)}">'
        f"<noscript>{escaped(fallback)}</noscript>"
        "</interactive-figure>"
    )


def render_language_links(
    active_locale: str,
    labels: dict[str, str],
    available_locales: Iterable[str],
) -> str:
    links = []
    for locale in available_locales:
        current = ' aria-current="page"' if locale == active_locale else ""
        links.append(
            f'<a href="../{locale}/" hreflang="{locale}"{current}>'
            f"{escaped(labels[locale])}</a>"
        )
    return "\n".join(links)


def render_document(
    root: Path,
    manifest: dict[str, Any],
    locale: str,
    *,
    include_overview: bool,
    step_limit: int | None,
) -> str:
    if locale not in SUPPORTED_LOCALES:
        raise ValueError(f"不支持的 locale：{locale}")

    structure = manifest["structure"]
    localized = manifest["locales"][locale]
    localized_steps = localized["steps"][:step_limit]
    shared_steps = structure["steps"][:step_limit]

    overview = ""
    if include_overview:
        overview_copy = localized["overview"]
        overview = f'''<section class="overview" aria-labelledby="overview-title">
  <div class="copy-block">
    <p class="section-label">{escaped(localized["ui"]["overviewLabel"])}</p>
    <h2 id="overview-title">{escaped(overview_copy["title"])}</h2>
    {render_paragraphs(overview_copy["body"])}
    {render_learning_aids(overview_copy)}
  </div>
  {render_figure(structure["overview"]["demo"], overview_copy["demoTitle"], overview_copy["copy"], localized["ui"]["figureFallback"])}
</section>'''

    chapters = []
    for shared, copy in zip(shared_steps, localized_steps, strict=True):
        chapters.append(
            f'''<section class="chapter" id="{escaped(shared["id"])}" aria-labelledby="{escaped(shared["id"])}-title">
  <div class="copy-block">
    <p class="section-label">{escaped(localized["ui"]["stepLabel"])} {escaped(copy["number"])}</p>
    <h2 id="{escaped(shared["id"])}-title">{escaped(copy["title"])}</h2>
    {render_paragraphs(copy["body"])}
    {render_learning_aids(copy)}
  </div>
  {render_figure(shared["demo"], copy["demoTitle"], copy["copy"], localized["ui"]["figureFallback"])}
</section>'''
        )

    replacements = {
        "{{LANG}}": escaped(localized["lang"]),
        "{{SLUG}}": escaped(manifest.get("slug", "visual-explainer")),
        "{{META_TITLE}}": escaped(localized["meta"]["title"]),
        "{{DESCRIPTION}}": escaped(localized["meta"]["description"]),
        "{{EYEBROW}}": escaped(localized["hero"]["eyebrow"]),
        "{{TITLE}}": escaped(localized["hero"]["title"]),
        "{{SUBTITLE}}": escaped(localized["hero"]["subtitle"]),
        "{{SKIP_TO_CONTENT}}": escaped(localized["ui"]["skipToContent"]),
        "{{LANGUAGE_NAVIGATION}}": escaped(localized["ui"]["languageNavigation"]),
        "{{LANGUAGE_LINKS}}": render_language_links(
            locale,
            localized["languageLabels"],
            manifest["locales"].keys(),
        ),
        "{{OVERVIEW}}": overview,
        "{{CHAPTERS}}": "\n".join(chapters),
        "{{CLOSING}}": render_closing(localized),
        "{{ARTICLE_CSS}}": read_text(root / "src" / "article.css").rstrip(),
        "{{RUNTIME_I18N}}": json_for_script(localized["ui"]),
        "{{RUNTIME}}": read_text(root / "src" / "demo-runtime.js").rstrip(),
        "{{DEMOS}}": load_demo_adapters(root, manifest),
    }

    output = read_text(root / "src" / "shell.html")
    for marker, value in replacements.items():
        output = output.replace(marker, value)
    if "{{" in output:
        raise ValueError("模板仍有未替换标记。")
    return output.rstrip() + "\n"


def build_artifacts(
    root: Path,
    manifest: dict[str, Any],
    output: Path,
    *,
    locales: Iterable[str],
    include_overview: bool,
    step_limit: int | None,
) -> list[Path]:
    built = []
    for locale in locales:
        document = render_document(
            root,
            manifest,
            locale,
            include_overview=include_overview,
            step_limit=step_limit,
        )
        destination = output / locale / "index.html"
        destination.parent.mkdir(parents=True, exist_ok=True)
        temporary = destination.with_suffix(".html.tmp")
        temporary.write_text(document, encoding="utf-8", newline="\n")
        temporary.replace(destination)
        built.append(destination)
    return built
