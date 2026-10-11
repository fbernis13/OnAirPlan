#!/usr/bin/env python3
"""Assemble le carnet en un seul fichier HTML.
- index.html : page autonome (GitHub Pages, ouverture directe dans un navigateur)
- carnet-on-air.html : contenu sans squelette, pour la publication en Artifact claude.ai
"""
import json, pathlib
here = pathlib.Path(__file__).resolve().parent
src = here / 'src'
cat = json.loads((here / 'data' / 'MouvementsCrossFit.json').read_text(encoding='utf-8'))
cat_js = 'const CATALOG = ' + json.dumps(cat, ensure_ascii=False, separators=(',', ':')).replace('</', '<\\/') + ';\n'
js = cat_js + ''.join((src / f).read_text(encoding='utf-8') + '\n' for f in ['program.js', 'videos.js', 'core.js', 'views.js', 'progression.js', 'catalog.js', 'main.js'])
css = (src / 'style.css').read_text(encoding='utf-8')
body = f'''<title>Carnet On Air</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Barlow:wght@400;500;600;700&family=Barlow+Condensed:wght@600;700&display=swap">
<style>
{css}</style>
<div id="app" class="app"></div>
<script>
{js}</script>
'''
(here / 'carnet-on-air.html').write_text(body, encoding='utf-8')
page = f'''<!doctype html>
<html lang="fr"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="theme-color" content="#0B6C76">
<meta name="apple-mobile-web-app-capable" content="yes"><meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="Carnet On Air">
<style>:root{{padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}}body{{margin:0}}img{{max-width:100%}}[hidden]{{display:none!important}}</style>
</head><body>
{body}</body></html>
'''
(here / 'index.html').write_text(page, encoding='utf-8')
print('ok', len(page))
