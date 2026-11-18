#!/usr/bin/env python3
"""Stamp a content-based version onto every script and stylesheet the page loads.

Browsers (and GitHub Pages' ~10 minute cache) can otherwise mix files from two
releases, e.g. a new index.html with an old main.js. Run this before each commit:

    python3 tools/stamp-version.py

It rewrites index.html so that:
  - the stylesheet and js/main.js are loaded with ?v=<hash>
  - the import map sends every module import (js/*, vendor/*) to ?v=<hash>
"""
import hashlib
import json
import pathlib
import re

ROOT = pathlib.Path(__file__).resolve().parent.parent
INDEX = ROOT / "index.html"

modules = sorted(
    [p for p in (ROOT / "js").glob("*.js")]
    + [p for p in (ROOT / "vendor").rglob("*.js")]
)
assets = modules + [ROOT / "css" / "style.css"]

h = hashlib.sha1()
for p in assets:
    h.update(p.relative_to(ROOT).as_posix().encode())
    h.update(p.read_bytes())
version = h.hexdigest()[:10]

imports = {"three": f"./vendor/three/three.module.min.js?v={version}"}
for p in modules:
    rel = "./" + p.relative_to(ROOT).as_posix()
    imports[rel] = f"{rel}?v={version}"
importmap = json.dumps({"imports": imports}, indent=2)
importmap = "\n".join("    " + line for line in importmap.splitlines())

html = INDEX.read_text()
html, n1 = re.subn(
    r'<script type="importmap">.*?</script>',
    f'<script type="importmap">\n{importmap}\n  </script>',
    html,
    count=1,
    flags=re.S,
)
html, n2 = re.subn(r'href="css/style\.css(\?v=[\w]+)?"', f'href="css/style.css?v={version}"', html, count=1)
html, n3 = re.subn(r'src="js/main\.js(\?v=[\w]+)?"', f'src="js/main.js?v={version}"', html, count=1)
assert n1 == n2 == n3 == 1, (n1, n2, n3)
INDEX.write_text(html)
print(f"Stamped version {version} on {len(modules)} modules")
