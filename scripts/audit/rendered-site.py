#!/usr/bin/env python3
"""Audit every actual route, rendered anchor/image/link and environment metadata.

Usage: python3 scripts/audit/rendered-site.py http://localhost:3100 [--indexing]
Build first. This audit reads rendered responses, not MDX counts alone.
"""
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urljoin, urlsplit, unquote, parse_qs
from urllib.request import urlopen
from urllib.error import HTTPError
import json
import re
import sys
import xml.etree.ElementTree as ET

base = sys.argv[1].rstrip('/')
indexing = '--indexing' in sys.argv
inventory = json.loads(Path('docs/migration/pages.json').read_text())

class Document(HTMLParser):
    def __init__(self, body):
        super().__init__(); self.ids = set(); self.links = []; self.images = []; self.canonical = []; self.og_urls = []; self.robots = []; self.feed(body)
    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if a.get('id'): self.ids.add(a['id'])
        if tag == 'a' and a.get('href'): self.links.append(a['href'])
        if tag == 'img' and a.get('src'): self.images.append(a['src'])
        if tag == 'link' and a.get('rel') == 'canonical': self.canonical.append(a.get('href'))
        if tag == 'meta' and a.get('property') == 'og:url': self.og_urls.append(a.get('content'))
        if tag == 'meta' and a.get('name') == 'robots': self.robots.append(a.get('content',''))

cache = {}; documents = {}; errors = []; links = set(); images = set(); anchors = set()
def fetch(path):
    path = path.split('#')[0]
    if path not in cache:
        try:
            with urlopen(base + path, timeout=30) as r: cache[path] = (r.status, {k.lower(): v for k, v in r.headers.items()}, r.read(), r.url)
        except HTTPError as e: cache[path] = (e.code, {k.lower(): v for k, v in e.headers.items()}, e.read(), e.url)
    return cache[path]
def document(path, body):
    if path not in documents: documents[path] = Document(body.decode())
    return documents[path]

def local_url(raw, route):
    target = urlsplit(urljoin(base + route, raw))
    if target.netloc != urlsplit(base).netloc: return None
    return target.path + ('?' + target.query if target.query else ''), unquote(target.fragment)

for route in inventory['siteRoutes']:
    status, headers, body, final = fetch(route)
    if status != 200: errors.append(f'{route}: HTTP {status}'); continue
    doc = document(route, body)
    if indexing:
        expected = 'https://fluttermix.com' + route
        if doc.og_urls != [expected]: errors.append(f'{route}: OG URL {doc.og_urls}, expected {expected}')
        if doc.canonical != [expected]: errors.append(f'{route}: canonical {doc.canonical}, expected {expected}')
        if 'noindex' in headers.get('x-robots-tag','') or any('noindex' in r for r in doc.robots): errors.append(f'{route}: production noindex')
    else:
        if doc.og_urls: errors.append(f'{route}: preview OG URL leaked {doc.og_urls}')
        if doc.canonical: errors.append(f'{route}: preview canonical leaked {doc.canonical}')
        if 'noindex' not in headers.get('x-robots-tag','') or not any('noindex' in r for r in doc.robots): errors.append(f'{route}: missing noindex')
    for raw in doc.links:
        target = local_url(raw, route)
        if not target: continue
        path, fragment = target
        if path.startswith('/_next/'): continue
        links.add(path)
        result = fetch(path)
        if result[0] != 200: errors.append(f'{route}: link {raw} -> HTTP {result[0]}')
        elif fragment and 'text/html' in result[1].get('content-type','') and not path.startswith('/remix/catalog'):
            anchors.add((path,fragment))
            if urlsplit(path).path == '/v2/source/' and re.fullmatch(r'L[0-9]+-L[0-9]+', fragment):
                # Source selection is applied by the browser after it reads the
                # query. Validate its file and line range, not a literal HTML id.
                name = parse_qs(urlsplit(path).query).get('file', [''])[0]
                source_root = Path('packages/mix_showcase/lib').resolve()
                source_file = (source_root / name).resolve()
                start, end = map(int, re.findall(r'[0-9]+', fragment))
                if not source_file.is_relative_to(source_root) or not source_file.is_file() or not 1 <= start <= end <= len(source_file.read_text().splitlines()):
                    errors.append(f'{route}: invalid source selection {raw}')
            elif fragment not in document(path, result[2]).ids: errors.append(f'{route}: missing anchor {raw}')
    for raw in doc.images:
        target = local_url(raw, route)
        if not target: continue
        path, _ = target; images.add(path)
        status, headers, _, _ = fetch(path)
        if status != 200 or not headers.get('content-type','').startswith('image/'): errors.append(f'{route}: image {raw}: {status}, {headers.get("content-type")}')

if not anchors: errors.append('No linked heading targets were audited; check HTML content-type handling')

# The canonical Naked source retains its archived heading ledger. Exact IDs
# are checked in rendered pages, including aliases for renamed active APIs.
legacy_anchors = json.loads(Path('.site-inputs/extracted/naked-ui-docs/legacy-anchors.json').read_text())
legacy_heading_count = 0
for slug, ids in legacy_anchors['pages'].items():
    route = '/naked-ui/docs/' + (slug+'/' if slug != 'index' else '')
    status, _, body, _ = fetch(route)
    if status != 200: continue
    actual = document(route, body).ids
    for anchor in ids:
        legacy_heading_count += 1
        if anchor not in actual: errors.append(f'{route}: missing archived heading #{anchor}')

# Check the actual exported search records, including labels and every canonical page.
for endpoint in ['/api/search-pages.json', '/api/search.json']:
    status, _, body, _ = fetch(endpoint)
    if status != 200:
        errors.append(f'{endpoint}: HTTP {status}'); continue
    records = json.loads(body)['docs']['docs'].values()
    roots = {r['url'].split('#')[0].rstrip('/') + '/' for r in records}
    expected = {p['path'] for pages in inventory['pages'].values() for p in pages}
    if roots != expected: errors.append(f'{endpoint}: search coverage differs: missing={expected-roots}, extra={roots-expected}')
    for record in records:
        project = next((p for p in inventory['pages'] if record['url'].startswith('/'+p+'/')), None)
        label = {'mix':'Mix', 'remix':'Remix', 'naked-ui':'Naked UI'}.get(project)
        if (record.get('type') in [None, 'page'] and record.get('breadcrumbs', [None])[0] != label) or (record.get('type') not in [None, 'page'] and record.get('tags') != [project]): errors.append(f'{endpoint}: unlabeled result {record["url"]}')

# Validate every concrete local destination in the preserved legacy inventory.
for row in json.loads(Path('docs/migration/legacy-urls.json').read_text()):
    target = row.get('destination') or ''
    if row['classification'] not in ['migrated', 'redirected'] or not target.startswith('/') or ':' in target: continue
    result = fetch(target)
    if result[0] != 200: errors.append(f'Legacy {row["oldUrl"]}: destination {target} returned {result[0]}')

status, _, body, _ = fetch('/sitemap.xml')
if status != 200: errors.append('Sitemap is missing')
else:
    found = {node.text for node in ET.fromstring(body).iter() if node.tag.endswith('}loc')}
    expected = {'https://fluttermix.com'+r for r in inventory['siteRoutes']} if indexing else set()
    if found != expected: errors.append(f'Sitemap differs: missing={expected-found}, extra={found-expected}')
status, _, robots, _ = fetch('/robots.txt')
if indexing and b'Sitemap: https://fluttermix.com/sitemap.xml' not in robots: errors.append('Production robots omits sitemap')
if not indexing and (b'Disallow: /' not in robots or b'Sitemap:' in robots): errors.append('Preview robots must disallow without advertising a sitemap')
print(json.dumps({'routes':len(inventory['siteRoutes']), 'canonicalPages':inventory['counts'], 'internalLinks':len(links), 'headingTargets':len(anchors), 'images':len(images), 'legacyHeadingTargets':legacy_heading_count, 'mode':'production' if indexing else 'noindex', 'errors':sorted(set(errors))},indent=2))
sys.exit(bool(errors))
