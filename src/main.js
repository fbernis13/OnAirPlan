/* Carnet On Air : rendu, navigation, événements. */
const TABS = [
  ['programme', 'Programme', IC.list], ['progression', 'Progression', IC.chart], ['exercices', 'Exercices', IC.dumbbell],
  ['mouvements', 'Mouvements', IC.book], ['sauvegarde', 'Sauvegarde', IC.save]
];
let renderQueued = false;
function scheduleRender() { if (renderQueued) return; renderQueued = true; requestAnimationFrame(() => { renderQueued = false; render(); }); }

function currentTitle() {
  if (UI.tab === 'programme' && UI.session) { const s = SESSION_BY_ID[UI.session]; return `${sessLabel(s)}`; }
  if (UI.tab === 'exercices' && UI.exo) return 'Exercice';
  if (UI.tab === 'mouvements' && UI.move) return 'Fiche mouvement';
  return { programme: 'Carnet On Air', progression: 'Progression', exercices: 'Exercices', mouvements: 'Mouvements', sauvegarde: 'Sauvegarde' }[UI.tab];
}
function hasBack() { return (UI.tab === 'programme' && UI.session) || (UI.tab === 'exercices' && UI.exo) || (UI.tab === 'mouvements' && UI.move); }
function render() {
  const root = document.getElementById('app');
  let body = '';
  if (UI.tab === 'programme') body = UI.session ? viewSession(UI.session) : viewProgramme();
  else if (UI.tab === 'progression') body = viewProgression();
  else if (UI.tab === 'exercices') body = UI.exo ? viewExo(UI.exo) : viewExercices();
  else if (UI.tab === 'mouvements') body = UI.move ? viewMove(UI.move) : viewMouvements();
  else body = viewSauvegarde();
  const active = document.activeElement; const activeId = active && active.id; const selStart = active && active.selectionStart;
  root.innerHTML = `<header class="topbar">
      ${hasBack() ? `<button class="iconbtn" data-act="back" aria-label="Retour">${IC.back}</button>` : ''}
      <h1>${esc(currentTitle())}</h1>
      <span id="syncdot" class="sync-dot ${UI.sync === 'cloud' ? 'cloud' : UI.sync === 'pending' ? 'pending' : ''}" title="${UI.sync === 'cloud' ? 'Enregistré dans ton compte' : 'Enregistré sur cet appareil'}"></span>
      <button class="iconbtn" data-act="settings" aria-label="Affichage">${IC.gear}</button>
    </header>
    <main>${body}</main>`;
  if (activeId) { const el = document.getElementById(activeId); if (el && el !== document.activeElement && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA')) { el.focus(); try { if (selStart != null) el.setSelectionRange(selStart, selStart); } catch (e) {} } }
  let nav = document.getElementById('tabs');
  if (!nav) { nav = document.createElement('nav'); nav.id = 'tabs'; nav.className = 'tabs'; nav.setAttribute('aria-label', 'Navigation'); document.body.appendChild(nav); }
  nav.innerHTML = TABS.map(([id, l, ic]) => `<button data-act="tab" data-v="${id}" ${UI.tab === id ? 'aria-current="page"' : ''}>${ic}<span>${l}</span></button>`).join('');
  renderTimer();
  updateRailActive();
}

/* ── Accès aux éléments du programme depuis les attributs data-* */
function refOf(el) {
  const sid = el.dataset.sid; const s = SESSION_BY_ID[sid]; const bl = s && s.blocks.find(b => b.l === el.dataset.bi); const it = bl && bl.items[Number(el.dataset.i)];
  return { sid, key: el.dataset.key, si: el.dataset.si != null ? Number(el.dataset.si) : null, s, bl, it };
}
function writeSet(ref, f, v) {
  const r = ref.it ? ref : Object.assign(ref, refOf({ dataset: { sid: ref.sid, bi: ref.bi, i: ref.i } }));
  const E = getExLog(r.sid, r.key, r.it, true); if (!E.sets[r.si]) return;
  E.sets[r.si][f] = v; if (!E.swap && PAIR_OF[r.it.x] && !E.machine) E.machine = machineEx(r.it.x); markStarted(r.sid); touchLog(r.sid);
}

let wakeLock = null;
async function updateWakeLock() {
  try {
    if (UI.tab === 'programme' && UI.session && !wakeLock && navigator.wakeLock) { wakeLock = await navigator.wakeLock.request('screen'); wakeLock.addEventListener && wakeLock.addEventListener('release', () => { wakeLock = null; }); }
    else if (!(UI.tab === 'programme' && UI.session) && wakeLock) { await wakeLock.release(); wakeLock = null; }
  } catch (e) { wakeLock = null; }
}
function go(patch) { Object.assign(UI, patch); UI.playing = null; render(); window.scrollTo(0, 0); updateWakeLock(); }

document.addEventListener('click', ev => {
  unlockAudio();
  if (ev.target.id === 'sheet' && UI.sheet && !UI.sheet.startsWith('confirm')) { stopDictation(); UI.sheet = null; renderSheet(); return; }
  const el = ev.target.closest('[data-act]'); if (!el) return;
  const a = el.dataset.act;
  if (el.tagName === 'A') return;
  if (a === 'tab') { const t = el.dataset.v; if (t === UI.tab) go({ session: null, exo: null, move: null }); else go({ tab: t }); try { history.replaceState(null, '', '#' + t); } catch (e) {} return; }
  if (a === 'back') { if (UI.tab === 'programme') go({ session: null }); else if (UI.tab === 'exercices') go({ exo: null }); else go({ move: null }); return; }
  if (a === 'open-session') { go({ tab: 'programme', session: el.dataset.id, progCycle: SESSION_BY_ID[el.dataset.id].cycle }); return; }
  if (a === 'open-exo') { go({ tab: 'exercices', exo: el.dataset.id }); return; }
  if (a === 'open-move') { go({ tab: 'mouvements', move: el.dataset.id }); return; }
  if (a === 'settings') { UI.sheet = 'settings'; renderSheet(); return; }
  if (a === 'sheet-close') { stopDictation(); UI.sheet = null; renderSheet(); return; }
  if (a === 'set-theme') { S.settings.theme = el.dataset.v; applySettings(); touchMeta(); renderSheet(); return; }
  if (a === 'set-size') { S.settings.size = Number(el.dataset.v); applySettings(); touchMeta(); renderSheet(); return; }
  if (a === 'set-sound') { S.settings.sound = el.dataset.v === 'true'; touchMeta(); renderSheet(); if (S.settings.sound) beep(1); return; }
  if (a === 'play') { UI.playing = UI.playing === el.dataset.uid ? null : el.dataset.uid; if (EMBED_OK !== true) { const b = el.closest('.vid'); const link = b && b.querySelector('a[href*="youtube.com"]'); if (link) link.click(); return; } render(); return; }
  if (a === 'toggle-warm') { UI.openWarm = UI.openWarm === el.dataset.uid ? null : el.dataset.uid; render(); return; }

  // Séance
  if (a === 'sdone') { const L = getLog(el.dataset.sid, true); L.done = !L.done; if (L.done && !L.date) L.date = todayISO(); touchLog(el.dataset.sid); render(); if (L.done) showToast('Séance terminée'); return; }
  if (a === 'wdone') { const L = getLog(el.dataset.sid, true); markStarted(el.dataset.sid); const W = L.wod[el.dataset.bl] = L.wod[el.dataset.bl] || {}; W.done = !W.done; touchLog(el.dataset.sid); render(); return; }
  if (a === 'step' || a === 'setdone' || a === 'hold' || a === 'addset' || a === 'delset' || a === 'exdone' || a === 'skip') {
    const r = refOf(el); if (!r.it) return;
    const E = getExLog(r.sid, r.key, r.it, true); markStarted(r.sid);
    const d = exDef(E.swap || r.it.x);
    if (a === 'step') {
      const f = el.dataset.f; const st = E.sets[r.si]; const cur = st[f] !== '' && st[f] != null ? Number(st[f]) : Number(firstNum(r.it.reps)) || 0;
      st[f] = Math.max(0, Math.round((cur + Number(el.dataset.d)) * 10) / 10);
      const inp = document.getElementById(`s-${f}-${r.sid}-${r.key}-${r.si}`); if (inp) inp.value = st[f];
      touchLog(r.sid); return;
    }
    if (a === 'hold') { toggleHold({ sid: r.sid, key: r.key, si: r.si, bi: el.dataset.bi, i: el.dataset.i, it: r.it, target: firstNum(r.it.reps) }); render(); return; }
    if (a === 'setdone') {
      const st = E.sets[r.si]; st.done = !st.done;
      if (st.done) {
        if (HOLD.uid === `${r.sid}-${r.key}-${r.si}`) toggleHold(HOLD.ref);
        const f = d.unit === 'time' ? 'dur' : d.unit === 'dist' ? 'dist' : d.unit === 'min' ? 'min' : 'reps';
        if (st[f] === '' || st[f] == null) st[f] = firstNum(r.it.reps);
        st.at = Date.now();
        if (E.sets.every(x => x.done)) E.done = true;
        if (r.it.rest) startRest(r.it.rest, `${itemLabel(r.it)} · série ${r.si + 1}/${E.sets.length}`);
      } else E.done = false;
      touchLog(r.sid); render(); return;
    }
    if (a === 'addset') { const last = E.sets[E.sets.length - 1] || {}; E.sets.push(Object.assign({}, last, { done: false, rpe: '', at: undefined })); E.done = false; touchLog(r.sid); render(); return; }
    if (a === 'delset') { if (E.sets.length > 1) E.sets.pop(); touchLog(r.sid); render(); return; }
    if (a === 'exdone') { E.done = !E.done; touchLog(r.sid); render(); return; }
    if (a === 'skip') { E.skipped = !E.skipped; touchLog(r.sid); render(); return; }
  }
  // Minuteur
  if (a === 'rest-toggle') { if (REST.finished) return; if (REST.running) { REST.running = false; REST.left = Math.max(0, (REST.endAt - Date.now()) / 1000); } else { REST.running = true; REST.endAt = Date.now() + REST.left * 1000; runRest(); } renderTimer(); return; }
  if (a === 'rest-reset') { REST.left = REST.total; REST.finished = false; REST.running = true; REST.endAt = Date.now() + REST.total * 1000; runRest(); renderTimer(); return; }
  if (a === 'rest-plus') { REST.total += 15; if (REST.finished) { REST.finished = false; REST.left = 15; REST.running = true; REST.endAt = Date.now() + 15000; runRest(); } else if (REST.running) REST.endAt += 15000; else REST.left += 15; renderTimer(); return; }
  if (a === 'rest-close') { clearInterval(REST.tick); REST.total = 0; REST.running = false; renderTimer(); return; }
  // Dictée
  if (a === 'dictate') { openDictation(el.dataset.target); return; }
  if (a === 'dict-stop') { stopDictation(); renderSheet(); return; }
  if (a === 'dict-add') {
    const txt = (document.getElementById('dict-text') || {}).value || ''; stopDictation();
    const ta = document.getElementById(DICT.target);
    if (ta && txt.trim()) { ta.value = (ta.value ? ta.value.trimEnd() + '\n' : '') + txt.trim(); ta.dispatchEvent(new Event('input', { bubbles: true })); }
    UI.sheet = null; renderSheet(); return;
  }
  // Muscles
  if (a === 'jump') { const t = document.getElementById(el.dataset.target); if (t) t.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' }); return; }
  if (a === 'prog-cycle') { UI.progCycle = Number(el.dataset.v); render(); return; }
  if (a === 'mus-scope') { UI.musScope = el.dataset.v; render(); return; }
  if (a === 'mus-adj') { UI.musAdj = el.dataset.v === '1'; if (UI.sheet && UI.sheet.startsWith('muscles:')) renderSheet(); else render(); return; }
  if (a === 'mus-sel') { const g = el.dataset.g; UI.musSel = g && UI.musSel !== g ? g : null; if (UI.sheet && UI.sheet.startsWith('muscles:')) renderSheet(); else render(); return; }
  if (a === 'sess-muscles') { UI.musSel = null; UI.sheet = 'muscles:' + el.dataset.sid; renderSheet(); return; }
  // Mouvements
  if (a === 'mv-pref') { UI.mvPref = el.dataset.v; render(); return; }
  if (a === 'set-pref') { S.prefs[el.dataset.id] = el.dataset.v; touchMeta(); render(); return; }
  // Sauvegarde
  if (a === 'machine') { const p = MACHINE_PAIRS.find(x => x.id === el.dataset.pair); if (!p) return; S.machines[p.id] = el.dataset.v; touchMeta();
    if (el.dataset.sid) { const r = refOf(el); const E = getExLog(r.sid, r.key, r.it, false); if (E && !E.swap) { E.machine = p[el.dataset.v]; touchLog(r.sid); } }
    render(); showToast(el.dataset.v === 'hammer' ? 'Hammer retenu pour ' + p.label.toLowerCase() : 'Machine guidée retenue pour ' + p.label.toLowerCase()); return; }
  if (a === 'machine-all') { const v = el.dataset.v; MACHINE_PAIRS.forEach(p => { if (v === 'plan') delete S.machines[p.id]; else S.machines[p.id] = v; }); touchMeta(); render(); return; }
  if (a === 'logout') { logout(); return; }
  if (a === 'export-doc') { exportDoc(el.dataset.v); return; }
  if (a === 'copy-export') { const ta = document.getElementById('f-exporttext'); const t = ta ? ta.value : ''; const fallback = () => { if (ta) { ta.focus(); ta.select(); } showToast('Texte sélectionné : copie-le'); };
    try { navigator.clipboard.writeText(t).then(() => showToast('Copié'), fallback); } catch (e) { fallback(); } return; }
  if (a === 'close-export') { UI.exportText = null; render(); return; }
  if (a === 'import-text') { const t = (document.getElementById('f-importtext') || {}).value || ''; if (t.trim()) importData(t); return; }
  if (a === 'import-confirm') { confirmImport(); UI.pendingImport = null; UI.sheet = null; renderSheet(); render(); return; }
  if (a === 'snap-make') { makeSnapshot('Sauvegarde manuelle'); render(); showToast('Sauvegarde faite'); return; }
  if (a === 'snap-del') { deleteSnapshot(el.dataset.v); render(); return; }
  if (a === 'snap-restore-ask') { UI.pendingSnap = el.dataset.v; UI.sheet = 'confirm:snap'; renderSheet(); return; }
  if (a === 'snap-restore') { const ok = restoreSnapshot(UI.pendingSnap); UI.pendingSnap = null; UI.sheet = null; renderSheet(); render(); showToast(ok ? 'Sauvegarde restaurée' : 'Sauvegarde introuvable'); return; }
  if (a === 'reset-ask') { UI.resetWhat = el.dataset.v || 'all'; UI.sheet = 'reset'; renderSheet(); return; }
  if (a === 'reset-confirm') { resetData(UI.resetWhat || 'all'); UI.sheet = null; renderSheet(); render(); showToast('Remise à zéro faite. Une sauvegarde permet de revenir en arrière.'); return; }
});
document.addEventListener('keydown', ev => {
  if ((ev.key === 'Enter' || ev.key === ' ') && ev.target.matches('g[data-act]')) { ev.preventDefault(); ev.target.dispatchEvent(new MouseEvent('click', { bubbles: true })); }
  if (ev.key === 'Escape' && UI.sheet) { stopDictation(); UI.sheet = null; renderSheet(); }
});
document.addEventListener('input', ev => {
  const el = ev.target; const k = el.dataset && el.dataset.in; if (!k) return;
  const sid = el.dataset.sid;
  if (k === 'set') { const r = refOf(el); writeSet(r, el.dataset.f, el.value === '' ? '' : (el.type === 'number' ? Number(el.value) : el.value)); return; }
  if (k === 'sdate') { getLog(sid, true).date = el.value; touchLog(sid); return; }
  if (k === 'srpe') { getLog(sid, true).rpe = el.value; markStarted(sid); touchLog(sid); return; }
  if (k === 'scomment') { getLog(sid, true).comment = el.value; markStarted(sid); touchLog(sid); return; }
  if (k === 'wscore' || k === 'wrpe' || k === 'wload' || k === 'wcomment') {
    const L = getLog(sid, true); markStarted(sid); const W = L.wod[el.dataset.bl] = L.wod[el.dataset.bl] || {};
    W[{ wscore: 'score', wrpe: 'rpe', wload: 'load', wcomment: 'comment' }[k]] = el.value; touchLog(sid); return;
  }
  if (k === 'ecomment') { const r = refOf(el); const E = getExLog(sid, el.dataset.key, r.it, true); E.comment = el.value; markStarted(sid); touchLog(sid); return; }
  if (k === 'bench') { const b = S.bench[el.dataset.b] = S.bench[el.dataset.b] || {}; b[el.dataset.c] = el.value; touchMeta(); return; }
  if (k === 'exfilter') { UI.exFilter = el.value; render(); return; }
  if (k === 'mvfilter') { UI.mvFilter = el.value; render(); return; }
});
document.addEventListener('change', ev => {
  const el = ev.target; const k = el.dataset && el.dataset.in; if (!k) return;
  const sid = el.dataset.sid;
  if (k === 'swrist') { getLog(sid, true).wrist = el.value; markStarted(sid); touchLog(sid); render(); return; }
  if (k === 'swap') { const r = refOf(el); const E = getExLog(sid, el.dataset.key, r.it, true); E.swap = el.value; markStarted(sid); touchLog(sid); UI.openMore = sid + ':' + el.dataset.key; render(); return; }
  if (k === 'mus-sess') { UI.musSession = el.value; render(); return; }
  if (k === 'mvcat') { UI.mvCat = el.value; render(); return; }
  if (k === 'importfile') { const f = el.files && el.files[0]; if (!f) return; const rd = new FileReader(); rd.onload = () => importData(String(rd.result)); rd.readAsText(f); el.value = ''; return; }
});
document.addEventListener('toggle', ev => {
  const d = ev.target; if (!d.matches || !d.matches('details.more[data-uid]')) return;
  if (d.open) UI.openMore = d.dataset.uid; else if (UI.openMore === d.dataset.uid) UI.openMore = null;
}, true);
function updateRailActive() {
  const rail = document.querySelector('.sess-rail'); if (!rail) return;
  const btns = [...rail.querySelectorAll('button[data-target]')]; let cur = btns[0];
  btns.forEach(b => { const t = document.getElementById(b.dataset.target); if (t && t.getBoundingClientRect().top < 140) cur = b; });
  btns.forEach(b => b.classList.toggle('active', b === cur));
  if (cur && rail.scrollHeight > rail.clientHeight) { const r = cur.getBoundingClientRect(), rr = rail.getBoundingClientRect(); if (r.top < rr.top || r.bottom > rr.bottom) cur.scrollIntoView({ block: 'nearest' }); }
}
let railRaf = 0; window.addEventListener('scroll', () => { if (railRaf) return; railRaf = requestAnimationFrame(() => { railRaf = 0; updateRailActive(); }); }, { passive: true });
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') updateWakeLock(); });

/* ── Démarrage */
function startApp() {
initData();
loadLocal();
applySettings();
(() => { const h = (location.hash || '').slice(1); if (TABS.some(t => t[0] === h)) UI.tab = h; })();
render();
initCloud();
refreshDataFiles().then(changed => { if (changed) render(); }).then(() => initServer());
}
authGate();
