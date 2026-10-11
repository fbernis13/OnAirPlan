/* Carnet On Air : écrans Exercices, Mouvements et Sauvegarde. */
const KIND_LABELS = { force: 'Renforcement', gainage: 'Gainage', tech: 'Technique', cardio: 'Cardio', wod: 'Mouvements de WOD', mob: 'Mise en route et retour au calme' };
const UNIT_LABELS = { reps: 'répétitions', time: 'secondes (maintien)', dist: 'mètres', cal: 'calories', min: 'minutes' };

/* Où chaque exercice apparaît dans le programme */
const USAGE = (() => {
  const u = {}; const add = (k, sid, where) => { (u[k] = u[k] || []).push({ sid, where }); };
  SESSIONS.forEach(s => {
    s.warmup.forEach(l => l.x.forEach(k => add(k, s.id, 'mise en route')));
    s.cooldown.forEach(l => l.x.forEach(k => add(k, s.id, 'retour au calme')));
    s.blocks.forEach(b => (b.items || []).forEach(it => add(it.x, s.id, b.type === 'wod' ? 'WOD' : 'bloc ' + b.l)));
  });
  return u;
})();

function viewExercices() {
  const q = UI.exFilter.trim().toLowerCase();
  const keys = Object.keys(EXERCISES).filter(k => USAGE[k]).filter(k => !q || (EXERCISES[k].fr + ' ' + EXERCISES[k].en).toLowerCase().includes(q));
  let h = `<div style="margin-top:1rem"><input type="search" id="f-exsearch" data-in="exfilter" value="${esc(UI.exFilter)}" placeholder="Chercher un exercice (français ou anglais)" aria-label="Chercher un exercice"></div>`;
  ['force', 'gainage', 'tech', 'cardio', 'wod', 'mob'].forEach(kind => {
    const ks = keys.filter(k => EXERCISES[k].kind === kind); if (!ks.length) return;
    h += `<h3>${KIND_LABELS[kind]} <span class="faint num small">${ks.length}</span></h3><div class="stack">`;
    ks.forEach(k => {
      const d = EXERCISES[k]; const nv = videosFor(k).length;
      h += `<button class="listbtn" data-act="open-exo" data-id="${k}"><span class="grow"><span class="t">${esc(d.fr)}</span><br>
        <span class="small faint">${esc(d.en)}${(d.p || []).length ? ' · ' + d.p.map(g => MUSCLES[g]).join(', ') : ''}</span></span>
        ${nv ? `<span class="pill acc">${nv} vidéo${nv > 1 ? 's' : ''}</span>` : '<span class="pill">Vidéo absente</span>'}<span class="chev">${IC.chev}</span></button>`;
    });
    h += `</div>`;
  });
  if (!keys.length) h += `<div class="empty">Aucun exercice ne correspond à « ${esc(UI.exFilter)} ».</div>`;
  return h;
}
function viewExo(k) {
  const d = exDef(k); const hist = exHistory(k); const uses = USAGE[k] || [];
  const bySess = {}; uses.forEach(u => { (bySess[u.sid] = bySess[u.sid] || new Set()).add(u.where); });
  return `<h2 style="margin-top:1rem">${esc(d.fr)}</h2>
  <p class="exo-en" style="font-size:.95rem">${esc(d.en)}</p>
  <dl class="kv card">
    <dt>Type</dt><dd>${KIND_LABELS[d.kind] || ''}</dd>
    ${d.unit ? `<dt>Unité</dt><dd>${UNIT_LABELS[d.unit]}</dd>` : ''}
    ${d.kind !== 'mob' ? `<dt>Principal</dt><dd>${(d.p || []).map(g => MUSCLES[g]).join(', ') || '<span class="absent">aucun des groupes suivis</span>'}</dd>
    <dt>Secondaire</dt><dd>${(d.s || []).map(g => MUSCLES[g]).join(', ') || '—'}</dd>` : ''}
    ${d.off ? `<dt>Note</dt><dd>${esc(d.off)}</dd>` : ''}
    ${d.desc ? `<dt>Contenu</dt><dd>${esc(d.desc)}</dd>` : ''}
    ${d.variant ? `<dt>Variante</dt><dd class="variant">${esc(d.variant)}</dd>` : ''}
  </dl>
  ${d.mv && MOVE_BY_ID[d.mv] ? `<button class="btn" data-act="open-move" data-id="${d.mv}" style="margin-top:.6rem">Fiche du catalogue : ${esc(MOVE_BY_ID[d.mv].name)}</button>` : ''}
  ${d.alt && MOVE_BY_ID[d.alt] ? `<button class="btn ghost" data-act="open-move" data-id="${d.alt}" style="margin-top:.6rem">Alternative : ${esc(MOVE_BY_ID[d.alt].name)}</button>` : ''}
  <h3>Vidéos</h3>${videoBlock(k, 'exo')}
  <h3>Dans le programme</h3>
  <div class="chips">${Object.entries(bySess).map(([sid, w]) => `<button class="chip" data-act="open-session" data-id="${sid}">${esc(sessLabel(SESSION_BY_ID[sid]))} · ${[...w].join(', ')}</button>`).join('')}</div>
  ${d.kind !== 'mob' && d.kind !== 'wod' ? `<h3>Historique</h3>${hist.length ? `<div class="stack">${hist.map(x => `<div class="card"><div class="row"><strong class="grow">${esc(sessLabel(SESSION_BY_ID[x.sid]))}</strong><span class="faint small">${fmtDate(x.date)}</span></div>
    <div class="num small">${esc(setSummary(d, x.sets))}</div>${x.comment ? `<p class="small muted">${esc(x.comment)}</p>` : ''}</div>`).join('')}</div>` : '<div class="card empty">Rien de noté pour l’instant.</div>'}` : ''}`;
}

/* ── Catalogue des mouvements */
function prefOf(m) { return S.prefs[m.id] || m.selection || m.defaultPreference || CATALOG.defaultPreference || 'keep'; }
function viewMouvements() {
  const q = UI.mvFilter.trim().toLowerCase();
  const cats = [...new Set(MOVES.map(m => m.categoryFr))].sort();
  const list = MOVES.filter(m => (UI.mvPref === 'all' || prefOf(m) === UI.mvPref) && (UI.mvCat === 'all' || m.categoryFr === UI.mvCat)
    && (!q || [m.name, ...(m.aliases || []), ...(m.muscleGroups || []), ...(m.equipment || [])].join(' ').toLowerCase().includes(q)));
  const counts = {}; MOVES.forEach(m => { const p = prefOf(m); counts[p] = (counts[p] || 0) + 1; });
  return `<div class="stack" style="margin-top:1rem">
    <input type="search" id="f-mvsearch" data-in="mvfilter" value="${esc(UI.mvFilter)}" placeholder="Nom, muscle ou matériel" aria-label="Chercher un mouvement">
    <div class="chips"><button class="chip" data-act="mv-pref" data-v="all" aria-pressed="${UI.mvPref === 'all'}">Tous ${MOVES.length}</button>
      ${PREF_ORDER.map(p => `<button class="chip" data-act="mv-pref" data-v="${p}" aria-pressed="${UI.mvPref === p}">${PREF_LABELS[p]} ${counts[p] || 0}</button>`).join('')}</div>
    <select id="f-mvcat" data-in="mvcat" aria-label="Catégorie"><option value="all">Toutes les catégories</option>${cats.map(c => `<option ${UI.mvCat === c ? 'selected' : ''}>${esc(c)}</option>`).join('')}</select>
  </div>
  <p class="small faint">${list.length} mouvement${list.length > 1 ? 's' : ''} · catalogue collecté le ${fmtDate(CATALOG.retrievedAt)}</p>
  <div class="stack">${list.map(m => `<button class="listbtn" data-act="open-move" data-id="${m.id}"><span class="grow"><span class="t">${esc(m.name)}</span><br>
    <span class="small faint">${esc(m.categoryFr)} · ${esc(m.difficultyFr)}${m.sourceMissingFields && m.sourceMissingFields.length ? ' · infos incomplètes' : ''}</span></span>
    <span class="pill ${prefOf(m) === 'aside' ? '' : prefOf(m) === 'practice' ? 'amb' : prefOf(m) === 'alternative' ? 'dan' : 'acc'}">${PREF_LABELS[prefOf(m)]}</span><span class="chev">${IC.chev}</span></button>`).join('')}</div>
  ${!list.length ? '<div class="empty">Aucun mouvement ne correspond.</div>' : ''}`;
}
function listOrAbsent(arr, field, m) {
  if (arr && arr.length) return `<ul class="clean">${arr.map(x => `<li>${esc(x)}</li>`).join('')}</ul>`;
  const missing = (m.sourceMissingFields || []).includes(field);
  return `<span class="absent">${missing ? 'Information absente de la source lors de la collecte.' : 'Aucune.'}</span>`;
}
function viewMove(id) {
  const m = MOVE_BY_ID[id]; if (!m) return '<p>Fiche introuvable.</p>';
  const used = Object.entries(EXERCISES).filter(([k, d]) => (d.mv === id || d.alt === id) && USAGE[k]);
  return `<h2 style="margin-top:1rem">${esc(m.name)}</h2>
  ${m.aliases && m.aliases.length ? `<p class="faint small">Aussi appelé : ${m.aliases.map(esc).join(', ')}</p>` : ''}
  <div class="row"><span class="pill">${esc(m.categoryFr)}</span><span class="pill">${esc(m.difficultyFr)}</span>${m.supportsLoad ? '<span class="pill">Avec charge</span>' : '<span class="pill">Sans charge</span>'}</div>
  <h4>Ma préférence</h4>
  <div class="prefsel">${PREF_ORDER.map(p => `<button class="chip" data-act="set-pref" data-id="${m.id}" data-v="${p}" aria-pressed="${prefOf(m) === p}">${PREF_LABELS[p]}</button>`).join('')}</div>
  <h3>Vidéo</h3>
  ${(m.media || []).length ? `<div class="vids">${m.media.map((v, i) => videoCard(Object.assign({ origin: 'catalogue', checkedAt: v.metadataCheckedAt, ficheSource: v.sourceUrl, variantNote: m.editorialNote }, v), 'mv:' + id + ':' + i)).join('')}</div>` : '<div class="novid">Vidéo absente.</div>'}
  <h3>Fiche</h3>
  <dl class="kv card">
    <dt>Muscles</dt><dd>${(m.muscleGroups || []).map(esc).join(', ') || '<span class="absent">Non renseigné</span>'}</dd>
    <dt>Matériel</dt><dd>${(m.equipment || []).map(esc).join(', ') || '<span class="absent">Aucun</span>'}</dd>
    <dt>Unité</dt><dd>${esc(m.unit)}</dd>
    <dt>Charge</dt><dd>${m.supportsLoad ? 'Prise en charge' : 'Non'}</dd>
  </dl>
  <h4>Consignes techniques</h4>${listOrAbsent(m.coachingCues, 'coachingCues', m)}
  <h4>Standards</h4>${listOrAbsent(m.standards, 'standards', m)}
  <h4>Scaling (noms d’origine)</h4>${listOrAbsent(m.scalingOptions, 'scalingOptions', m)}
  ${m.relatedBenchmarks && m.relatedBenchmarks.length ? `<h4>Benchmarks liés</h4><ul class="clean">${m.relatedBenchmarks.map(b => `<li>${esc(typeof b === 'string' ? b : (b.name || JSON.stringify(b)))}</li>`).join('')}</ul>` : ''}
  ${used.length ? `<h4>Dans mon programme</h4><div class="chips">${used.map(([k, d]) => `<button class="chip" data-act="open-exo" data-id="${k}">${esc(d.fr)}</button>`).join('')}</div>` : ''}
  <h4>Provenance</h4>
  <dl class="kv small">
    <dt>Source</dt><dd><a href="${esc(m.sourceUrl)}" target="_blank" rel="noopener">${esc(m.sourceUrl)}</a></dd>
    ${m.strengthStandardsUrl ? `<dt>Standards de force</dt><dd><a href="${esc(m.strengthStandardsUrl)}" target="_blank" rel="noopener">${esc(m.strengthStandardsUrl)}</a></dd>` : ''}
    <dt>Collecte</dt><dd>${fmtDate(m.retrievedAt)}</dd>
    <dt>Champs absents</dt><dd>${(m.sourceMissingFields || []).length ? m.sourceMissingFields.map(f => ({ coachingCues: 'consignes', standards: 'standards', scalingOptions: 'scaling' }[f] || f)).join(', ') : 'aucun'}</dd>
    <dt>Textes</dt><dd>${esc(m.textPolicy || '')}</dd>
    <dt>Identifiants</dt><dd class="faint">${esc(m.id)} · source ${esc(m.sourceId)}</dd>
  </dl>`;
}

/* ── Sauvegarde */
function exportCarnet() {
  return JSON.stringify({ fileType: 'onair.carnet', version: 1, exportedAt: new Date().toISOString(), program: 'programme-reprise-on-air.md', data: S }, null, 1);
}
function exportCatalogue() {
  const c = JSON.parse(JSON.stringify(CATALOG));
  c.movements.forEach(m => { m.selection = prefOf(m); });
  c.savedAt = new Date().toISOString();
  return JSON.stringify(c, null, 1);
}
async function offerFile(name, text) {
  let dl = null;
  try { dl = window.claude && window.claude.use ? await window.claude.use('downloads') : null; } catch (e) { dl = null; }
  if (dl) {
    try { await dl.save({ filename: name, data: text }); showToast('Fichier enregistré'); return; }
    catch (e) { if (e && e.code === 'declined') return; }
  }
  UI.exportText = { name, text }; render();
  showToast('Copie le texte ci-dessous pour le garder');
}
function viewSauvegarde() {
  const nLogs = Object.keys(S.logs).length;
  return `<h2>Où sont mes données</h2>
  <div class="card stack">
    <div class="row"><span class="sync-dot ${UI.sync === 'cloud' ? 'cloud' : UI.sync === 'pending' ? 'pending' : ''}"></span>
      <strong class="grow">${UI.sync === 'cloud' ? 'Enregistré dans ton compte Claude' : UI.sync === 'pending' ? 'Enregistrement en cours…' : 'Enregistré sur cet appareil seulement'}</strong></div>
    <p class="small muted" style="margin:0">${UI.sync === 'cloud' ? 'Le carnet se retrouve sur tes autres appareils quand tu ouvres cette page connecté. Une copie reste aussi dans ce navigateur.' : 'Le navigateur garde le carnet, mais il peut l’effacer (navigation privée, nettoyage). Exporte une sauvegarde de temps en temps.'}</p>
    <p class="small faint num" style="margin:0">${nLogs} séance${nLogs > 1 ? 's' : ''} avec des notes · ${Object.keys(S.prefs).length} préférence${Object.keys(S.prefs).length > 1 ? 's' : ''} modifiée${Object.keys(S.prefs).length > 1 ? 's' : ''}</p>
  </div>
  <h2>Exporter</h2>
  <div class="stack">
    <button class="btn primary" data-act="export-carnet">${IC.save} Exporter le carnet (JSON)</button>
    <button class="btn" data-act="export-cat">${IC.save} Exporter le catalogue avec mes préférences</button>
    ${UI.exportText ? `<div class="card stack"><label class="fld">${esc(UI.exportText.name)}<textarea id="f-exporttext" rows="6" readonly>${esc(UI.exportText.text)}</textarea></label>
      <div class="row"><button class="btn small" data-act="copy-export">Copier</button><button class="btn small ghost" data-act="close-export">Fermer</button></div></div>` : ''}
  </div>
  <h2>Importer</h2>
  <div class="card stack">
    <p class="small muted" style="margin:0">Accepte une sauvegarde du carnet, ou un fichier de catalogue (MouvementsCrossFit.json) dont seules les préférences sont reprises.</p>
    <label class="btn" style="cursor:pointer">Choisir un fichier<input type="file" id="f-import" accept=".json,application/json" data-in="importfile" hidden></label>
    <label class="fld">Ou colle le contenu<textarea id="f-importtext" rows="3" placeholder="{ … }"></textarea></label>
    <button class="btn small" data-act="import-text" style="justify-self:start">Importer le texte collé</button>
  </div>
  <h2>Sources</h2>
  <div class="card small stack">
    <p style="margin:0">Programme : programme-reprise-on-air.md (4 cycles × 5 séances, salle On Air).</p>
    <p style="margin:0">Catalogue : ${esc(CATALOG.title)}, ${MOVES.length} fiches de <a href="${esc(CATALOG.source)}" target="_blank" rel="noopener">${esc(CATALOG.source)}</a>, collecte du ${fmtDate(CATALOG.retrievedAt)}.</p>
    ${(CATALOG.notes || []).map(n => `<p class="faint" style="margin:0">${esc(n)}</p>`).join('')}
    <p class="faint" style="margin:0">Vidéos hors catalogue : relevées le 11/10/26 dans les résultats de recherche YouTube (identifiant, titre et chaîne exacts). Quand aucune vidéo n’a été confirmée, la fiche l’indique.</p>
  </div>
  <h2>Effacer</h2>
  <button class="btn danger" data-act="reset-ask">Effacer tout le carnet</button>`;
}
function importData(text) {
  let d; try { d = JSON.parse(text); } catch (e) { showToast('Fichier illisible : ce n’est pas du JSON valide.'); return; }
  if (d && d.fileType === 'onair.carnet' && d.data && d.data.v === 1) { UI.pendingImport = d.data; UI.sheet = 'confirm:import'; renderSheet(); return; }
  if (d && d.fileType === 'hybrid.movements' && Array.isArray(d.movements)) {
    let n = 0; d.movements.forEach(m => { if (MOVE_BY_ID[m.id] && PREF_LABELS[m.selection || m.preference]) { S.prefs[m.id] = m.selection || m.preference; n++; } });
    touchMeta(); render(); showToast(`Préférences importées pour ${n} mouvements`); return;
  }
  showToast('Format non reconnu : attendu un export du carnet ou un catalogue.');
}
