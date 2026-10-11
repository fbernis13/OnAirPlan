/* Carnet On Air : écrans Exercices, Mouvements et Sauvegarde. */
const KIND_LABELS = { force: 'Renforcement', gainage: 'Gainage', tech: 'Technique', cardio: 'Cardio', wod: 'Mouvements de WOD', mob: 'Mise en route et retour au calme' };
const UNIT_LABELS = { reps: 'répétitions', time: 'secondes (maintien)', dist: 'mètres', cal: 'calories', min: 'minutes' };


function viewExercices() {
  const q = UI.exFilter.trim().toLowerCase();
  const keys = Object.keys(EXERCISES).filter(k => USAGE[k]).filter(k => !q || (EXERCISES[k].fr + ' ' + EXERCISES[k].en).toLowerCase().includes(q));
  let h = `<div style="margin-top:1rem"><input type="search" id="f-exsearch" data-in="exfilter" value="${esc(UI.exFilter)}" placeholder="Chercher un exercice (français ou anglais)" aria-label="Chercher un exercice"></div>`;
  ['force', 'gainage', 'tech', 'cardio', 'wod', 'mob'].forEach(kind => {
    const ks = keys.filter(k => EXERCISES[k].kind === kind); if (!ks.length) return;
    h += `<h3>${KIND_LABELS[kind]} <span class="faint num small">${ks.length}</span></h3><div class="stack">`;
    ks.forEach(k => {
      const d = EXERCISES[k]; const nv = videosFor(k).length;
      h += `<button class="listbtn" data-act="open-exo" data-id="${k}">${hasThumb(k) ? `<span class="lthumb">${thumbSvg(k)}</span>` : ''}<span class="grow"><span class="t">${esc(d.fr)}</span><br>
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
  ${hasThumb(k) ? `<div class="bigthumb">${thumbSvg(k)}</div>` : ''}
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

/* ── Sauvegarde : export, import, sauvegardes, restauration, remise à zéro */
const DOC_INFO = {
  bib: { file: 'bibliotheque', title: 'Bibliothèque de mouvements', what: () => `${Object.keys(EXERCISES).length} exercices, ${MOVES.length} fiches du catalogue, ${Object.keys(VIDEOS).length} vidéos vérifiées` },
  car: { file: 'carnet', title: 'Carnet de séances', what: () => `${CYCLES.length} cycles, ${SESSIONS.length} séances, ${BENCHMARKS.length} repères` },
  progression: { file: 'progression', title: 'Ma progression', what: () => { const n = Object.keys(S.logs).length, p = Object.keys(S.prefs).length; return `${n} séance${n > 1 ? 's' : ''} notée${n > 1 ? 's' : ''}, ${Object.keys(S.bench).length} repère${Object.keys(S.bench).length > 1 ? 's' : ''}, ${p} préférence${p > 1 ? 's' : ''}, ${Object.keys(S.machines || {}).length} choix de machine`; } }
};
function docText(kind) {
  const d = kind === 'bib' ? docBibliotheque() : kind === 'car' ? docCarnet() : kind === 'progression' ? docProgression()
    : { fileType: 'onair.sauvegarde', version: 1, exportedAt: new Date().toISOString(), bibliotheque: docBibliotheque(), carnet: docCarnet(), progression: docProgression() };
  return JSON.stringify(d, null, 1);
}
async function exportDoc(kind) {
  const name = (kind === 'all' ? 'onair-sauvegarde' : DOC_INFO[kind].file) + '-' + todayISO() + '.json';
  let text = docText(kind);
  /* l'administrateur exporte aussi la progression de chaque compte */
  if (kind === 'all' && isAdmin() && Server.on && Server.client) {
    const r = await allProfiles();
    if (r) { const d = JSON.parse(text); d.profils = r; text = JSON.stringify(d, null, 1); if (r.length < 2) showToast('Seul ton profil est exporté : ajoute la règle « admin lit tout » dans Supabase.'); }
  }
  offerFile(name, text);
}
async function allProfiles() {
  try {
    const { data, error } = await Server.client.from('progression').select('user_id,data,updated_at');
    if (error) throw error;
    return (data || []).map(r => ({ compte: (r.data && r.data.compte) || (r.user_id === Server.user.id ? userName() : r.user_id), user_id: r.user_id, majLe: r.updated_at, progression: r.data }));
  } catch (e) { showToast('Profils non récupérés : ' + (e.message || e)); return null; }
}
async function offerFile(name, text) {
  const inClaude = !!(window.claude && typeof window.claude.use === 'function');
  if (inClaude) {
    let dl = null;
    try { dl = await window.claude.use('downloads'); } catch (e) { dl = null; }
    if (dl) {
      try { await dl.save({ filename: name, data: text }); showToast('Fichier enregistré'); return; }
      catch (e) { if (e && e.code === 'declined') return; }
    }
  } else {
    try {
      const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
      const a = document.createElement('a'); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 2000); showToast('Fichier téléchargé : ' + name); return;
    } catch (e) { /* on passe au texte à copier */ }
  }
  UI.exportText = { name, text }; render();
  showToast('Copie le texte ci-dessous pour le garder');
}
const fmtStamp = t => new Date(t).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' });
function viewSauvegarde() {
  const src = { bib: DATA.source.bib, car: DATA.source.car, progression: Server.on ? 'serveur et appareil' : UI.sync === 'cloud' ? 'compte Claude et appareil' : 'cet appareil' };
  const docCard = k => `<div class="card stack docrow">
      <div class="row"><strong class="grow">${DOC_INFO[k].title}</strong><span class="pill">${esc(src[k])}</span></div>
      <p class="small muted num" style="margin:0">${DOC_INFO[k].file}.json · ${DOC_INFO[k].what()}</p>
      <div class="row wrap"><button class="btn small" data-act="export-doc" data-v="${k}">${IC.save} Exporter</button>
        ${k === 'progression' || isAdmin() ? `<button class="btn small ghost" data-act="reset-ask" data-v="${k}">Remettre à zéro</button>` : ''}</div>
    </div>`;
  return `<h2>Les trois fichiers</h2>
  <p class="small muted">L’affichage lit trois fichiers indépendants. La bibliothèque et le carnet décrivent le programme, la progression contient ce que tu notes. Chacun s’exporte, s’importe et se remet à zéro séparément.</p>
  <div class="stack">${['bib', 'car', 'progression'].map(docCard).join('')}</div>
  <div class="row sync-line"><span class="sync-dot ${UI.sync === 'cloud' ? 'cloud' : UI.sync === 'pending' ? 'pending' : ''}"></span>
    <span class="small muted grow">${UI.sync === 'cloud' ? (Server.on ? 'Progression enregistrée sur le serveur, avec une copie dans ce navigateur pour la salle.' : 'Progression enregistrée dans ton compte Claude, avec une copie dans ce navigateur.') : UI.sync === 'pending' ? 'Enregistrement en cours…' : 'Progression enregistrée dans ce navigateur seulement : exporte-la de temps en temps.'}</span></div>

  <h2>Sauvegardes</h2>
  <div class="card stack">
    <p class="small muted" style="margin:0">Une sauvegarde fige ta progression (et la bibliothèque ou le carnet s’ils ont été importés) pour pouvoir y revenir. Une sauvegarde automatique est faite avant chaque import, restauration ou remise à zéro. Les ${SNAP_MAX} plus récentes sont gardées.</p>
    <button class="btn primary" data-act="snap-make" style="justify-self:start">${IC.save} Sauvegarder maintenant</button>
    ${SNAPS.length ? `<ul class="snaps">${SNAPS.map(x => { const n = Object.keys((x.progression && x.progression.logs) || {}).length;
      return `<li><div class="grow"><strong class="num">${fmtStamp(x.at)}</strong><div class="small muted">${esc(x.label)} · ${n} séance${n > 1 ? 's' : ''} notée${n > 1 ? 's' : ''}${x.bib ? ' · bibliothèque' : ''}${x.car ? ' · carnet' : ''}</div></div>
        <button class="btn small" data-act="snap-restore-ask" data-v="${x.id}">Restaurer</button>
        <button class="iconbtn" data-act="snap-del" data-v="${x.id}" aria-label="Supprimer la sauvegarde du ${fmtStamp(x.at)}">${IC.close}</button></li>`; }).join('')}</ul>`
      : '<p class="small faint" style="margin:0">Aucune sauvegarde pour l’instant.</p>'}
  </div>

  <h2>Exporter</h2>
  <div class="stack">
    <button class="btn" data-act="export-doc" data-v="all">${IC.save} Tout exporter en un fichier</button>
    ${isAdmin() && Server.on ? '<p class="small muted" style="margin:0">Le fichier contient aussi la progression de chaque compte.</p>' : ''}
    ${UI.exportText ? `<div class="card stack"><label class="fld">${esc(UI.exportText.name)}<textarea id="f-exporttext" rows="6" readonly>${esc(UI.exportText.text)}</textarea></label>
      <div class="row"><button class="btn small" data-act="copy-export">Copier</button><button class="btn small ghost" data-act="close-export">Fermer</button></div></div>` : ''}
  </div>

  <h2>Importer</h2>
  <div class="card stack">
    <p class="small muted" style="margin:0">Le type du fichier est reconnu tout seul : bibliothèque, carnet, progression, export complet, ou catalogue MouvementsCrossFit.json (seules ses préférences sont reprises). Tu confirmes avant tout remplacement.</p>
    <label class="btn" style="cursor:pointer">Choisir un fichier<input type="file" id="f-import" accept=".json,application/json" data-in="importfile" hidden></label>
    <label class="fld">Ou colle le contenu<textarea id="f-importtext" rows="3" placeholder="{ … }"></textarea></label>
    <button class="btn small" data-act="import-text" style="justify-self:start">Importer le texte collé</button>
  </div>

  <h2>Remise à zéro</h2>
  <div class="card stack">
    <p class="small muted" style="margin:0">La bibliothèque et le carnet reviennent à leur version d’origine ; la progression est vidée (les réglages d’affichage restent). Une sauvegarde est faite juste avant.</p>
    <button class="btn danger" data-act="reset-ask" data-v="${isAdmin() ? 'all' : 'progression'}" style="justify-self:start">${isAdmin() ? 'Tout remettre à zéro' : 'Vider ma progression'}</button>
  </div>

  <h2>Sources</h2>
  <div class="card small stack">
    <p style="margin:0">Carnet : ${esc(CAR.title || '')}${CAR.source ? ' (' + esc(CAR.source) + ')' : ''}.</p>
    <p style="margin:0">Catalogue : ${esc(CATALOG.title || '')}, ${MOVES.length} fiches${CATALOG.source ? ` de <a href="${esc(CATALOG.source)}" target="_blank" rel="noopener">${esc(CATALOG.source)}</a>` : ''}${CATALOG.retrievedAt ? ', collecte du ' + fmtDate(CATALOG.retrievedAt) : ''}.</p>
    ${(CATALOG.notes || []).concat(BIB.notes || []).map(n => `<p class="faint" style="margin:0">${esc(n)}</p>`).join('')}
  </div>`;
}

/* Reconnaît le fichier, puis demande confirmation avant de remplacer quoi que ce soit */
function importData(text) {
  let d; try { d = JSON.parse(text); } catch (e) { showToast('Fichier illisible : ce n’est pas du JSON valide.'); return; }
  const ask = (kind, data, summary) => { UI.pendingImport = { kind, data, summary }; UI.sheet = 'confirm:import'; renderSheet(); };
  if (!isAdmin() && d && (d.fileType === 'onair.bibliotheque' || d.fileType === 'onair.sauvegarde' || (d.fileType === 'onair.carnet' && Array.isArray(d.sessions)))) { showToast('Seul un administrateur peut remplacer la bibliothèque ou le carnet.'); return; }
  if (d && d.fileType === 'onair.sauvegarde') {
    const st = progressionToState(d.progression), eb = checkBib(d.bibliotheque), ec = !eb && checkCar(d.carnet, d.bibliotheque);
    if (!st || eb || ec) { showToast('Export complet incomplet : ' + (eb || ec || 'progression illisible')); return; }
    return ask('all', d, 'la bibliothèque, le carnet et ta progression');
  }
  if (d && d.fileType === 'onair.bibliotheque') { const e = checkBib(d); if (e) { showToast('Bibliothèque refusée : ' + e); return; } return ask('bib', d, 'la bibliothèque de mouvements'); }
  if (d && d.fileType === 'onair.carnet' && Array.isArray(d.sessions)) { const e = checkCar(d, BIB); if (e) { showToast('Carnet refusé : ' + e); return; } return ask('car', d, 'le carnet de séances'); }
  if (d && (d.fileType === 'onair.progression' || isLegacyProgression(d))) { const st = progressionToState(d); if (!st) { showToast('Progression illisible'); return; } return ask('progression', st, 'ta progression'); }
  if (d && d.fileType === 'hybrid.movements' && Array.isArray(d.movements)) {
    let n = 0; d.movements.forEach(m => { if (MOVE_BY_ID[m.id] && PREF_LABELS[m.selection || m.preference]) { S.prefs[m.id] = m.selection || m.preference; n++; } });
    touchMeta(); render(); showToast(`Préférences importées pour ${n} mouvements`); return;
  }
  showToast('Format non reconnu : attendu bibliotheque.json, carnet.json, progression.json ou un export complet.');
}
function confirmImport() {
  const p = UI.pendingImport; if (!p) return;
  makeSnapshot('Avant import (' + p.summary + ')');
  let ok = true;
  if (p.kind === 'bib') ok = setOverride('bib', p.data);
  if (p.kind === 'car') ok = setOverride('car', p.data);
  if (p.kind === 'progression') replaceProgression(p.data);
  if (p.kind === 'all') { ok = setOverride('bib', p.data.bibliotheque) && setOverride('car', p.data.carnet); replaceProgression(progressionToState(p.data.progression)); }
  const miss = missingExercises(CAR, BIB);
  showToast(!ok ? 'Import fait, mais le navigateur n’a pas pu le garder pour la prochaine visite.'
    : miss.length ? `Importé. ${miss.length} exercice${miss.length > 1 ? 's' : ''} du carnet absent${miss.length > 1 ? 's' : ''} de la bibliothèque.` : 'Importé');
}
