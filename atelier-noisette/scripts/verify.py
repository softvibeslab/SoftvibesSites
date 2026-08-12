#!/usr/bin/env python3
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parents[1]
SITE = ROOT / "site"
INSTAGRAM = "https://www.instagram.com/atelier_.noisette/"

class Inspector(HTMLParser):
    def __init__(self):
        super().__init__()
        self.tags=[]; self.ids=set(); self.links=[]; self.images=[]; self.metas=[]
    def handle_starttag(self, tag, attrs):
        data=dict(attrs); self.tags.append(tag)
        if data.get('id'): self.ids.add(data['id'])
        if tag=='a': self.links.append(data)
        if tag=='img': self.images.append(data)
        if tag=='meta': self.metas.append(data)

def inspect(path):
    text=path.read_text(encoding='utf-8')
    parser=Inspector(); parser.feed(text)
    assert parser.tags.count('h1') == 1, f"{path}: expected one h1"
    assert 'main' in parser.tags and 'nav' in parser.tags and 'footer' in parser.tags, f"{path}: missing landmarks"
    for image in parser.images:
        assert image.get('alt') is not None and image.get('alt').strip(), f"{path}: image missing alt"
        source=(path.parent / image['src']).resolve()
        assert source.exists() and source.is_file(), f"{path}: missing image {image['src']}"
    for link in parser.links:
        href=link.get('href','')
        if href.startswith('http'):
            assert link.get('target') == '_blank', f"{path}: external link must open separately"
            assert 'noopener' in link.get('rel',''), f"{path}: external link missing noopener"
        elif href and not href.startswith('#'):
            target=(path.parent / href.split('#')[0]).resolve()
            assert target.exists(), f"{path}: missing local target {href}"
    return text, parser

landing_text, landing = inspect(SITE/'index.html')
analysis_text, analysis = inspect(SITE/'analisis'/'index.html')
expected_gallery_assets = {
    'assets/instagram-plated-sweet.jpg',
    'assets/instagram-blush-cake.jpg',
    'assets/instagram-floral-cake.jpg',
    'assets/instagram-table-detail.jpg',
}
assert landing.tags.count('figure') >= 7, 'landing must show at least seven gallery figures'
assert expected_gallery_assets.issubset({image.get('src') for image in landing.images}), 'expanded Instagram derivatives missing from landing'
assert INSTAGRAM in landing_text, 'landing must use verified Instagram destination'
assert 'wa.me' not in landing_text and 'whatsapp' not in landing_text.lower(), 'unverified WhatsApp destination found'
assert not any(meta.get('name')=='robots' for meta in landing.metas), 'public landing should not inherit analysis robots metadata'
robots=[meta.get('content','').lower() for meta in analysis.metas if meta.get('name')=='robots']
assert robots == ['noindex, nofollow'], 'analysis must be noindex, nofollow'
assert 'analisis' not in landing_text.lower(), 'landing must not link or disclose the private analysis route'
assert '../index.html' in analysis_text, 'analysis must link to landing'
for forbidden in ('pedido confirmado', 'entrega garantizada', 'respuesta en minutos', 'envío a todo'):
    assert forbidden not in landing_text.lower(), f'unsupported claim found: {forbidden}'
print('PASS: static structure, assets, safe links, metadata, and claim guardrails verified')
