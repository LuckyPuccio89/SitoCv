#!/usr/bin/env python3
import os, re, sys
from urllib.parse import urlparse

root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
broken = []
for dirpath, dirnames, filenames in os.walk(root):
    # skip .git
    if '.git' in dirpath:
        continue
    for fn in filenames:
        if fn.endswith('.html'):
            path = os.path.join(dirpath, fn)
            try:
                with open(path, encoding='utf-8', errors='ignore') as f:
                    txt = f.read()
            except Exception as e:
                print('ERR reading', path, e)
                continue
            # find href/src
            for m in re.finditer(r'(?:href|src)\s*=\s*[\"\']([^\"\']+)[\"\']', txt):
                url = m.group(1)
                if url.startswith('http://') or url.startswith('https://') or url.startswith('mailto:') or url.startswith('tel:') or url.startswith('data:') or url.startswith('#'):
                    continue
                # strip query/fragment
                url_clean = url.split('#')[0].split('?')[0]
                if not url_clean:
                    continue
                target = os.path.normpath(os.path.join(os.path.dirname(path), url_clean))
                if not os.path.exists(target):
                    broken.append((path, url))
for b in broken:
    print('BROKEN:', b[0], '->', b[1])
if broken:
    sys.exit(1)
print('OK: no broken internal links found')
sys.exit(0)
