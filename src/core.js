/* Carnet On Air : état, stockage local, synchronisation, utilitaires. */
const LS_KEY = 'carnet-onair-v1';
const PREF_LABELS = { keep: 'Conserver', aside: 'Mettre de côté', practice: 'À travailler', warmup: 'Mise en route', alternative: 'Chercher une alternative' };
const PREF_ORDER = ['keep', 'aside', 'practice', 'warmup', 'alternative'];

function blankState() {
  return { v: 1, settings: { theme: 'system', size: 100, sound: true }, prefs: {}, machines: {}, bench: {}, logs: {}, metaAt: 0, savedAt: 0 };
}
let S = blankState();
const UI = { tab: 'programme', session: null, exo: null, move: null, musScope: 'prog', musSession: 'c1-r1', musAdj: true, musSel: null, exFilter: '', mvFilter: '', mvPref: 'all', mvCat: 'all', sheet: null, sync: 'local', toast: null };

function loadLocal() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) { const d = JSON.parse(raw); if (d && d.v === 1) S = Object.assign(blankState(), d); }
  } catch (e) { /* stockage indisponible : on continue en mémoire */ }
}
function saveLocal() {
  try { localStorage.setItem(LS_KEY, JSON.stringify(S)); } catch (e) {}
}

/* ── Synchronisation avec le compte (capability db, sous-arbre privé data/users/<id>) */
const Cloud = { db: null, col: null, dirty: new Set(), timer: null, busy: false };
function touchMeta() { S.metaAt = Date.now(); markDirty('meta'); }
function touchLog(id) { const L = S.logs[id]; if (L) L.updatedAt = Date.now(); markDirty('log-' + id); }
function markDirty(docId) {
  if (!docId.startsWith('snap-')) S.savedAt = Date.now();
  saveLocal();
  if (typeof serverDirty === 'function') serverDirty(docId);
  Cloud.dirty.add(docId);
  if (Cloud.col) { setSync('pending'); clearTimeout(Cloud.timer); Cloud.timer = setTimeout(flushCloud, 1500); }
}
function docBody(docId) {
  if (docId === 'meta') return { kind: 'meta', settings: S.settings, prefs: S.prefs, machines: S.machines, bench: S.bench, updatedAt: S.metaAt || Date.now() };
  if (docId.startsWith('snap-')) { const x = SNAPS.find(z => 'snap-' + z.id === docId); return x ? { kind: 'snap', id: x.id, at: x.at, label: x.label, progression: x.progression, updatedAt: x.at } : null; }
  const id = docId.slice(4); const L = S.logs[id];
  return L ? { kind: 'log', session: id, log: L, updatedAt: L.updatedAt || Date.now() } : null;
}
async function flushCloud() {
  if (!Cloud.col || Cloud.busy) return;
  Cloud.busy = true;
  try {
    while (Cloud.dirty.size) {
      const docId = Cloud.dirty.values().next().value; Cloud.dirty.delete(docId);
      const body = docBody(docId);
      try {
        if (body) await Cloud.col.doc(docId).set(JSON.parse(JSON.stringify(body)));
        else await Cloud.col.doc(docId).delete();
      } catch (e) {
        if (e && e.code === 'unavailable') { Cloud.dirty.add(docId); await new Promise(r => setTimeout(r, 1500 + Math.random() * 1000)); continue; }
        if (e && (e.code === 'revoked' || e.code === 'invalid_argument' || e.code === 'not_granted')) { Cloud.col = null; setSync('local'); break; }
        if (e && e.code === 'quota_exceeded') { showToast('Espace du compte plein : exporte une sauvegarde.'); }
      }
    }
    if (Cloud.col) setSync('cloud');
  } finally { Cloud.busy = false; }
}
async function initCloud() {
  if (!window.claude || typeof window.claude.use !== 'function') return;
  try {
    const [db, user] = await Promise.all([window.claude.use('db'), window.claude.use('user')]);
    if (!db || !user) return;
    const uid = await user.id();
    if (!uid) return;
    const col = db.collection('data/users/' + uid);
    const snap = await col.get();
    const remoteIds = new Set();
    snap.docs.forEach(d => {
      const b = d.data(); if (!b) return; remoteIds.add(d.id);
      if (d.id === 'meta') {
        if ((b.updatedAt || 0) > (S.metaAt || 0)) { S.settings = Object.assign(S.settings, b.settings || {}); S.prefs = b.prefs || {}; S.machines = b.machines || {}; S.bench = b.bench || {}; S.metaAt = b.updatedAt; }
        else if ((b.updatedAt || 0) < (S.metaAt || 0)) Cloud.dirty.add('meta');
      } else if (d.id.startsWith('log-') && b.log) {
        const id = d.id.slice(4); const local = S.logs[id];
        if (!local || (b.updatedAt || 0) > (local.updatedAt || 0)) S.logs[id] = b.log;
        else if ((local.updatedAt || 0) > (b.updatedAt || 0)) Cloud.dirty.add(d.id);
      } else if (d.id.startsWith('snap-') && b.progression) {
        if (!SNAPS.some(x => x.id === b.id)) SNAPS.push({ id: b.id, at: b.at, label: b.label, progression: b.progression });
      }
    });
    if (!remoteIds.has('meta') && (S.metaAt || Object.keys(S.prefs).length || Object.keys(S.bench).length)) Cloud.dirty.add('meta');
    Object.keys(S.logs).forEach(id => { if (!remoteIds.has('log-' + id)) Cloud.dirty.add('log-' + id); });
    SNAPS.forEach(x => { if (!remoteIds.has('snap-' + x.id)) Cloud.dirty.add('snap-' + x.id); });
    storeSnaps();
    Cloud.db = db; Cloud.col = col;
    saveLocal(); applySettings(); setSync('cloud'); render();
    if (Cloud.dirty.size) flushCloud();
  } catch (e) { setSync('local'); }
}
function setSync(s) { UI.sync = s; const dot = document.getElementById('syncdot'); if (dot) dot.className = 'sync-dot ' + (s === 'cloud' ? 'cloud' : s === 'pending' ? 'pending' : ''); }

/* ── Réglages */
function applySettings() {
  const r = document.documentElement;
  if (S.settings.theme === 'light' || S.settings.theme === 'dark') r.setAttribute('data-theme', S.settings.theme); else r.removeAttribute('data-theme');
  r.style.setProperty('--fs', (S.settings.size || 100) + '%');
}

/* ── Utilitaires */
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const todayISO = () => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
const fmtDate = iso => { if (!iso) return ''; const [y, m, d] = iso.split('-'); return `${d}/${m}/${y.slice(2)}`; };
const firstNum = s => { const m = String(s).replace(/(\d)[\s\u202f\u00a0](?=\d{3}\b)/g, '$1').replace(',', '.').match(/\d+(\.\d+)?/); return m ? Number(m[0]) : ''; };
const fmtSec = s => { s = Math.max(0, Math.round(s)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };
function exDef(k) { return EXERCISES[k] || { fr: k, en: '', kind: 'force', unit: 'reps', p: [], s: [] }; }
function sessLabel(s) { return `C${s.cycle} · ${SESSION_TYPES[s.slot].label}`; }
/* Machine guidée ou Hammer : choix enregistré dans la progression, sinon la machine prévue */
function machineOk(p, v, cycle) { return !!p[v] && (v !== 'haltero' || !cycle || cycle >= (p.halteroFrom || 1)); }
function machineEx(k, cycle) { const p = PAIR_OF[k]; const c = p && S.machines && S.machines[p.id]; return c && machineOk(p, c, cycle) ? p[c] : k; }
function plannedEx(it, E, cycle) { return (E && (E.swap || E.machine)) || machineEx(it.x, cycle); }
/* Unité de saisie : celle de l'exercice, sauf si la séance la précise (intervalles en secondes, test au rameur) */
function itemUnit(it) { return it.unit || exDef(it.x).unit; }
function prefill(it) { return itemUnit(it) === 'min' && !/min/.test(String(it.reps)) ? '' : firstNum(it.reps); }
function itemKey(bl, i) { return bl.l + i; }
function itemLabel(it) { return it.label || exDef(it.x).fr; }

function getLog(id, create) {
  if (!S.logs[id] && create) S.logs[id] = { date: '', done: false, rpe: '', wrist: '', comment: '', ex: {}, wod: {}, updatedAt: Date.now() };
  return S.logs[id];
}
function getExLog(sid, key, it, create) {
  const L = getLog(sid, create); if (!L) return null;
  if (!L.ex[key] && create) {
    const u = itemUnit(it); const n = Math.max(1, it.sets || 1); const v = prefill(it);
    const base = u === 'time' ? { dur: v } : u === 'dist' ? { dist: v } : u === 'min' ? { min: v } : { reps: v };
    L.ex[key] = { swap: '', comment: '', done: false, skipped: false, sets: Array.from({ length: n }, () => Object.assign({ load: '', rpe: '', done: false }, base)) };
  }
  return L.ex[key];
}
function sessionStatus(id) {
  const L = S.logs[id]; if (!L) return 'todo';
  if (L.done) return 'done';
  const any = Object.values(L.ex || {}).some(e => e.done || (e.sets || []).some(x => x.done)) || Object.values(L.wod || {}).some(w => w.score || w.done);
  return any ? 'started' : 'todo';
}
function markStarted(sid) { const L = getLog(sid, true); if (!L.date) L.date = todayISO(); }

/* Historique d'un exercice : séances précédentes où des séries ont été notées */
function exHistory(x) {
  const out = [];
  SESSIONS.forEach(s => {
    const L = S.logs[s.id]; if (!L) return;
    s.blocks.forEach(bl => (bl.items || []).forEach((it, i) => {
      const e = L.ex && L.ex[itemKey(bl, i)]; if (!e) return;
      const eff = e.swap || e.machine || it.x; if (eff !== x) return;
      const sets = (e.sets || []).filter(st => st.done || st.load || st.reps || st.dur);
      if (sets.length) out.push({ sid: s.id, date: L.date, label: itemLabel(it), sets, comment: e.comment });
    }));
  });
  return out;
}
function setSummary(d, sets) {
  return sets.map(st => {
    if (d.unit === 'time') return (st.dur || '–') + ' s' + (st.load ? ' @' + st.load + ' kg' : '');
    if (d.unit === 'dist') return (st.dist || '–') + ' m' + (st.load ? ' @' + st.load + ' kg' : '');
    if (d.unit === 'min') return (st.min || '–') + ' min' + (st.res ? ' · ' + st.res : '');
    return (st.reps || '–') + (st.load ? ' × ' + st.load + ' kg' : ' reps');
  }).join(' · ');
}

/* ── Icônes (SVG inline) */
const IC = {
  list: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01"/></svg>',
  chart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18"/><path d="M7 15l4-4 3 3 5-6"/></svg>',
  dumbbell: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6.5 6.5v11M17.5 6.5v11M3.5 9v6M20.5 9v6M6.5 12h11"/></svg>',
  book: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5z"/><path d="M4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5"/></svg>',
  save: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12M7 10l5 5 5-5"/><path d="M5 21h14"/></svg>',
  gear: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>',
  back: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>',
  chev: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>',
  play: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>',
  pause: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 5h4v14H6zM14 5h4v14h-4z"/></svg>',
  reset: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/></svg>',
  close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>',
  mic: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 10a7 7 0 0 0 14 0M12 17v5"/></svg>',
  plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
  minus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M5 12h14"/></svg>',
  ext: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3"/></svg>',
  video: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>'
};

let toastTimer;
function showToast(msg) {
  UI.toast = msg; renderToast();
  clearTimeout(toastTimer); toastTimer = setTimeout(() => { UI.toast = null; renderToast(); }, 2600);
}
function renderToast() {
  let el = document.getElementById('toast');
  if (!UI.toast) { if (el) el.remove(); return; }
  if (!el) { el = document.createElement('div'); el.id = 'toast'; el.className = 'toast'; el.setAttribute('role', 'status'); document.body.appendChild(el); }
  el.textContent = UI.toast;
}

/* ── Son (bip) : contexte audio débloqué au premier geste */
let AC = null;
function unlockAudio() { if (AC) return; try { AC = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { AC = null; } }
function beep(times = 3) {
  if (S.settings.sound === false) return;
  try { if (navigator.vibrate) navigator.vibrate([200, 100, 200]); } catch (e) {}
  if (!AC) return;
  try {
    if (AC.state === 'suspended') AC.resume();
    for (let i = 0; i < times; i++) {
      const o = AC.createOscillator(), g = AC.createGain(); const t = AC.currentTime + i * 0.28;
      o.type = 'sine'; o.frequency.value = i === times - 1 ? 1180 : 880;
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.35, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
      o.connect(g); g.connect(AC.destination); o.start(t); o.stop(t + 0.24);
    }
  } catch (e) {}
}
