#!/usr/bin/env python3
"""Assemble le carnet en un seul fichier HTML.
Les données vivent dans data/ (bibliotheque.json, carnet.json) ; la progression est
écrite par l'application. Une copie des deux fichiers est intégrée à la page pour
qu'elle marche hors ligne ou ouverte directement ; servie par un site, la page relit data/.
- index.html : page autonome (GitHub Pages, ouverture directe dans un navigateur)
- carnet-on-air.html : contenu sans squelette, pour la publication en Artifact claude.ai
  (sans écran de connexion : l'accès y passe déjà par le compte claude.ai)
Les comptes (auth/utilisateurs.json, mots de passe hachés) ne sont intégrés qu'à index.html.
"""
import json, pathlib
here = pathlib.Path(__file__).resolve().parent
src = here / 'src'
def embed(name, var):
    d = json.loads((here / 'data' / name).read_text(encoding='utf-8'))
    return f'const {var} = ' + json.dumps(d, ensure_ascii=False, separators=(',', ':')).replace('</', '<\\/') + ';\n'
def embed_cars():
    cars = {}
    for f in sorted((here / 'data').glob('carnet*.json')):
        d = json.loads(f.read_text(encoding='utf-8')); cars[d.get('id', 'crossfit')] = d
    return 'const EMBED_CARS = ' + json.dumps(cars, ensure_ascii=False, separators=(',', ':')).replace('</', '<\\/') + ';\n'
js = embed('bibliotheque.json', 'EMBED_BIB') + embed_cars() + ''.join(
    (src / f).read_text(encoding='utf-8') + '\n' for f in ['core.js', 'data.js', 'server.js', 'auth.js', 'views.js', 'progression.js', 'catalog.js', 'main.js'])
users = json.loads((here / 'auth' / 'utilisateurs.json').read_text(encoding='utf-8'))
users_js = 'const AUTH_USERS = ' + json.dumps(users, ensure_ascii=False, separators=(',', ':')) + ';\n'
# Supabase : seules l'adresse du projet et la clé publique (anon) vont dans la page ; l'accès aux données est filtré par les règles RLS
supa = json.loads((here / 'config' / 'supabase.json').read_text(encoding='utf-8'))
supa_on = bool(supa.get('url') and supa.get('anonKey'))
site_js = users_js + ('const SUPA_CONFIG = ' + json.dumps(supa, ensure_ascii=False, separators=(',', ':')) + ';\n' if supa_on else '')
supa_tag = '<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.117.0/dist/umd/supabase.js"></script>\n' if supa_on else ''
def page_body(extra=''):
    return BODY.replace('<script>\n', '<script>\n' + extra, 1)
css = (src / 'style.css').read_text(encoding='utf-8')
BODY = f'''<title>Carnet On Air</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Barlow:wght@400;500;600;700&family=Barlow+Condensed:wght@600;700&display=swap">
<style>
{css}</style>
<div id="app" class="app"></div>
<script>
{js}</script>
'''
(here / 'carnet-on-air.html').write_text(page_body(), encoding='utf-8')
page = f'''<!doctype html>
<html lang="fr"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="theme-color" content="#0B6C76">
<meta name="apple-mobile-web-app-capable" content="yes"><meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="Carnet On Air">
<style>:root{{padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}}body{{margin:0}}img{{max-width:100%}}[hidden]{{display:none!important}}</style>
{supa_tag}</head><body>
{page_body(site_js)}</body></html>
'''
(here / 'index.html').write_text(page, encoding='utf-8')
print('ok', len(page))
