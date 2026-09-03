# wellew 素材清冊閘門（2026-09-03 重寫，原本產 CREATIVE_ASSET_GATE.json 的腳本已找不到）
# 既有產線調查：qa/ 只剩兩個 JSON 結果檔、沒有腳本；這支照 JSON 欄位重現同一套檢查。
#
# 做四件事：
#   1. assets/ 底下沒登記的檔 → --register 時補進清冊（sha256/size/provenance），否則列為 unregistered
#   2. index.html 的 sha256/size 重算寫回 site_index
#   3. 同內容不同檔名（sha256 重複）、殘留檔名（tmp/test/candidate/copy）、外連 src 各算一個數字
#   4. 寫 qa/CREATIVE_ASSET_GATE.json；任何 issue → gate=ISSUE，exit 1
#
# 用法：python qa/asset_gate.py [--register "登記理由"]
import hashlib, io, json, os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MANIFEST = os.path.join(ROOT, "assets", "ASSET_MANIFEST.json")
OUT = os.path.join(ROOT, "qa", "CREATIVE_ASSET_GATE.json")
KIND = {".webm": "video", ".mp4": "video", ".jpg": "image", ".jpeg": "image", ".png": "image", ".html": "html"}
RESIDUE = re.compile(r"(^|[_\-.])(tmp|temp|test|candidate|copy|old|new)([_\-.]|$)", re.I)


def sha256(p):
    h = hashlib.sha256()
    with open(p, "rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest().upper()


def main():
    register = None
    if "--register" in sys.argv:
        register = sys.argv[sys.argv.index("--register") + 1]
    m = json.load(io.open(MANIFEST, encoding="utf-8"))
    assets = m["assets"]
    issues = []

    # 1. assets/ 掃描
    by_path = {v["canonical_path"]: k for k, v in assets.items()}
    unregistered = []
    for name in sorted(os.listdir(os.path.join(ROOT, "assets"))):
        if name == "ASSET_MANIFEST.json":
            continue
        rel = "assets/" + name
        full = os.path.join(ROOT, "assets", name)
        if rel in by_path:
            k = by_path[rel]
            real = sha256(full)
            if assets[k].get("sha256") != real or assets[k].get("size") != os.path.getsize(full):
                issues.append("manifest drift: %s" % rel)
            continue
        if register:
            key = os.path.splitext(name)[0]
            assets[key] = {
                "kind": KIND.get(os.path.splitext(name)[1].lower(), "file"),
                "role": "portfolio_media",
                "canonical_path": rel,
                "original_path": rel,
                "provenance": register,
                "sha256": sha256(full),
                "size": os.path.getsize(full),
                "approved": True,
                "status": "approved",
            }
            print("registered", rel)
        else:
            unregistered.append(rel)
    for rel in unregistered:
        issues.append("unregistered: %s" % rel)

    # 2. site_index 重算
    idx = os.path.join(ROOT, "index.html")
    si = assets.get("site_index")
    if si is not None:
        si["sha256"] = sha256(idx)
        si["size"] = os.path.getsize(idx)
        if register:
            si["provenance"] = (si.get("provenance", "") + "；" + register).strip("；")

    # 3. 重複、殘留、外連
    seen = {}
    for k, v in assets.items():
        seen.setdefault(v.get("sha256"), []).append(k)
    dup_groups = [g for g in seen.values() if len(g) > 1]
    for g in dup_groups:
        issues.append("duplicate sha256: %s" % ",".join(g))
    residue = [v["canonical_path"] for v in assets.values() if RESIDUE.search(os.path.basename(v["canonical_path"]))]
    for r in residue:
        issues.append("residue-looking filename: %s" % r)
    html = io.open(idx, encoding="utf-8").read()
    ext = [u for u in re.findall(r'(?:src|poster)="(https?://[^"]+)"', html) if "fonts.g" not in u]
    for u in ext:
        issues.append("external media reference: %s" % u)
    # 頁面引用的本機素材都要存在
    missing = [u for u in re.findall(r'(?:src|poster)="(assets/[^"]+)"', html) if not os.path.exists(os.path.join(ROOT, u))]
    for u in missing:
        issues.append("missing local reference: %s" % u)

    if register or si is not None:
        io.open(MANIFEST, "w", encoding="utf-8", newline="\n").write(json.dumps(m, ensure_ascii=False, indent=2) + "\n")

    out = {
        "gate": "PASS" if not issues else "ISSUE",
        "project_root": ROOT,
        "manifest": MANIFEST,
        "asset_count": len(assets),
        "deliverable_canonical_count": sum(1 for v in assets.values() if v.get("role") == "deliverable"),
        "duplicate_sha256_groups": len(dup_groups),
        "unregistered_project_files": len(unregistered),
        "candidate_residue_files": len(residue),
        "prohibited_external_references": len(ext),
        "missing_local_references": len(missing),
        "issue_count": len(issues),
        "issues": issues,
    }
    io.open(OUT, "w", encoding="utf-8", newline="\n").write(json.dumps(out, ensure_ascii=False, indent=2) + "\n")
    print(json.dumps({k: v for k, v in out.items() if k not in ("project_root", "manifest")}, ensure_ascii=False, indent=1))
    sys.exit(0 if not issues else 1)


if __name__ == "__main__":
    main()
