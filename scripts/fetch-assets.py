"""Copy the original portfolio assets and build a portable content module.

Usage: python scripts/fetch-assets.py
Requires beautifulsoup4 and ffmpeg/ffprobe on PATH. Existing source media are
reused byte-for-byte. Video posters are small local still-frame derivatives.
"""
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from urllib.request import Request, urlopen
import hashlib
import json
import re
import shutil
import subprocess

from bs4 import BeautifulSoup


ROOT = Path(__file__).resolve().parents[1]
BASE = "https://wellewkin.pages.dev/"
DEST = ROOT / "assets" / "source"
DEST.mkdir(parents=True, exist_ok=True)
html = (ROOT / "reference" / "original.html").read_text(encoding="utf-8-sig")
soup = BeautifulSoup(html, "html.parser")
source_paths = sorted(set(re.findall(r'(?:src|poster)="(assets/[^\"]+)"', html)))


def download(path):
    out = DEST / Path(path).name
    if not out.exists():
        req = Request(BASE + path, headers={"User-Agent": "WelleW-portfolio-migration/1.0"})
        with urlopen(req, timeout=90) as response:
            data = response.read()
        out.write_bytes(data)
    data = out.read_bytes()
    print(f"{out.name}: {len(data):,} bytes", flush=True)
    return {"file": out.name, "bytes": len(data), "sha256": hashlib.sha256(data).hexdigest(), "url": BASE + path}


with ThreadPoolExecutor(max_workers=5) as pool:
    inventory = list(pool.map(download, source_paths))

ffmpeg = shutil.which("ffmpeg")
if not ffmpeg:
    raise RuntimeError("ffmpeg is required to make video posters")


def poster_for(src):
    path = DEST / Path(src).name
    poster = path.with_name(path.stem + "_poster.webp")
    if not poster.exists():
        subprocess.run([ffmpeg, "-hide_banner", "-loglevel", "error", "-y", "-ss", "1.0", "-i", str(path), "-frames:v", "1", "-vf", "scale=960:960:force_original_aspect_ratio=decrease", "-c:v", "libwebp", "-quality", "82", str(poster)], check=True)
        if not poster.exists():
            subprocess.run([ffmpeg, "-hide_banner", "-loglevel", "error", "-y", "-i", str(path), "-frames:v", "1", "-vf", "scale=960:960:force_original_aspect_ratio=decrease", "-c:v", "libwebp", "-quality", "82", str(poster)], check=True)
    return "assets/source/" + poster.name


video_paths = [path for path in source_paths if path.endswith(".webm")]
with ThreadPoolExecutor(max_workers=3) as pool:
    generated_posters = dict(zip(video_paths, pool.map(poster_for, video_paths)))


def media_record(el, caption=""):
    src = el["src"]
    is_video = el.name == "video"
    record = {
        "type": "video" if is_video else "image",
        "src": "assets/source/" + Path(src).name,
        "alt": el.get("aria-label", el.get("alt", caption)),
        "caption": caption,
    }
    if is_video:
        record["poster"] = generated_posters[src]
        if el.get("poster"):
            record["originalPoster"] = "assets/source/" + Path(el["poster"]).name
    return record


ids = ["planning", "editing", "kissko", "geo3d", "compositing", "live", "discord", "community", "gakey", "press"]
categories = ["節目與內容", "影音剪輯", "AI 與工具", "影像與合成", "影像與合成", "直播與社群", "直播與社群", "直播與社群", "AI 與工具", "文字與採訪"]
projects = []
for index, scene in enumerate(soup.select("article.scene-card[data-scene]")):
    copy = scene.select_one(".scene-copy")
    en = copy.select_one(".scene-index").get_text(" ", strip=True).split(" / ", 1)[1]
    item = {
        "id": ids[index],
        "title": copy.h2.get_text(" ", strip=True),
        "en": en,
        "category": categories[index],
        "description": copy.p.get_text(" ", strip=True),
        "tags": [tag.get_text(" ", strip=True) for tag in copy.select(".scene-tags span")],
        "media": [media_record(fig.select_one("img, video"), fig.figcaption.get_text(" ", strip=True)) for fig in scene.select("figure.paper-shot")],
    }
    facts = []
    for card in scene.select(".system-card"):
        fact = {"label": card.select_one(".system-num").get_text(" ", strip=True), "title": card.b.get_text(" ", strip=True)}
        if card.small:
            fact["description"] = card.small.get_text(" ", strip=True)
        facts.append(fact)
    if facts:
        item["facts"] = facts
    projects.append(item)

discord_details = [
    ("身分組與權限架構設計", "對應不同社群動線。"),
    ("頻道結構規劃", "公開／內部／分眾頻道分流。"),
    ("留言互動指令", "抽籤、佔卜、點歌，成員打一行字就有回應。"),
    ("表情機器人", "關鍵字自動蓋章、投票統計、活動簽到。"),
    ("掛機養成遊戲", "伺服器內建長期經營的 RPG 系統。"),
    ("精華時間軸整合", "VOD 上架後自動整理分段時間軸，主播不用自己重看一次直播才能剪。"),
    ("Webhook 自動化", "開台通知、新片上架、排程廣播。"),
]
projects[6]["facts"] = [{"label": f"{i:02}", "title": title, "description": description} for i, (title, description) in enumerate(discord_details, 1)]

editing_reel = []
for index, card in enumerate(soup.select(".archive-card"), 1):
    title = card.h3.get_text(" ", strip=True)
    category = card.small.get_text(" ", strip=True)
    media = media_record(card.video, title)
    editing_reel.append({"id": f"reel-{index:02}", "title": title, "category": category, "format": "portrait" if "portrait" in card.select_one(".archive-media").get("class", []) else "landscape", **media})

profile = {
    "name": "Welkin",
    "studio": "WelleW",
    "tagline": "影音製作工作室",
    "description": soup.select_one(".intro-lead").get_text(" ", strip=True),
    "email": "welkinhung7797@gmail.com",
    "line": "welkinhung",
    "itchUrl": "https://welkin87.itch.io/graffiti-fight",
    "itchTitle": "GRAFFITI FIGHT",
    "contactTitle": "有任何想法都歡迎聊聊",
    "copyright": "WELLEW / WELKIN PORTFOLIO © 2026",
    "sourceUrl": BASE,
}

module = "// Portfolio copy and media migrated from https://wellewkin.pages.dev/\n// See reference/content-notes.md for source inventory and derivations.\n\n"
for name, value in [("projects", projects), ("editingReel", editing_reel), ("profile", profile)]:
    module += f"export const {name} = " + json.dumps(value, ensure_ascii=False, indent=2) + ";\n\n"
(ROOT / "content.js").write_text(module, encoding="utf-8")

total = sum(item["bytes"] for item in inventory)
poster_files = sorted(DEST.glob("*_poster.webp"))
poster_total = sum(item.stat().st_size for item in poster_files)
notes = [
    "# Original portfolio content and media", "",
    f"Source: {BASE}",
    "Original markup: `reference/original.html`. Text and original media belong to the original portfolio owner.",
    "",
    "## Content", "",
    "All 10 original work categories, all 7 editing gallery items, the 7 Discord demo features, introductory biography, contact details, and professional facts are retained in `content.js`.",
    "The `category` grouping labels and ASCII `id` values are navigation metadata added for the rebuild. English labels, project descriptions, tags, captions, alt text, figures and contact details come from the original page.",
    "Facts use `{ label, title, description? }`. Editing reel records use `{ id, title, category, format, type, src, poster, alt, caption }`.",
    "No claim about the LOGO's conceptual rationale was present in the original HTML; the mark is an inline pug/dog head illustration using golden yellow, charcoal and cream.",
    "",
    "## Download inventory", "",
    f"{len(inventory)} original files; {total:,} bytes ({total / 1024 / 1024:.2f} MiB). All original files are copied byte-for-byte.",
    f"{len(poster_files)} generated video posters; {poster_total:,} bytes ({poster_total / 1024:.1f} KiB). Each poster is a frame extracted at 1 second, capped at 960 × 960 pixels, saved as WebP quality 82. Videos shorter than 1 second use their first frame.",
    "Original existing posters are also retained and linked through `originalPoster` where applicable. New `poster` files are explicit local static alternatives for each video; the UI should defer video loading until a viewer requests playback.",
    "", "| Local file | Bytes | Original URL | SHA-256 |", "| --- | ---: | --- | --- |",
]
for item in inventory:
    notes.append(f"| `assets/source/{item['file']}` | {item['bytes']:,} | {item['url']} | `{item['sha256']}` |")
notes.extend(["", "## Generated posters", "", "| Local file | Bytes |", "| --- | ---: |"])
for item in poster_files:
    notes.append(f"| `assets/source/{item.name}` | {item.stat().st_size:,} |")
(ROOT / "reference" / "content-notes.md").write_text("\n".join(notes) + "\n", encoding="utf-8")
print(f"COMPLETE: {len(projects)} projects, {len(editing_reel)} gallery items, {len(inventory)} source files ({total:,} bytes), {len(poster_files)} posters ({poster_total:,} bytes)")
