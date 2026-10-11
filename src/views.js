/* Carnet On Air : écrans Programme et Séance, vidéos, minuteurs, dictée, réglages. */

/* ── Vidéos
   L'aperçu tente de charger la miniature YouTube. Si l'hébergement la bloque (cas des Artifacts),
   une vignette neutre s'affiche et seul le lien externe est proposé. Si la miniature se charge,
   la lecture intégrée à la demande est proposée. */
let EMBED_OK = null; // null = inconnu, true = miniatures chargées (lecture intégrée tentée), false = bloquées
function videosFor(k) {
  const d = exDef(k); const list = [];
  if (d.mv && MOVE_BY_ID[d.mv]) (MOVE_BY_ID[d.mv].media || []).forEach(m => list.push(Object.assign({ origin: 'catalogue', checkedAt: m.metadataCheckedAt, ficheSource: m.sourceUrl, variantNote: MOVE_BY_ID[d.mv].editorialNote }, m)));
  (d.vid || []).forEach(v => { if (VIDEOS[v]) list.push(Object.assign({ origin: 'recherche' }, VIDEOS[v])); });
  /* les vidéos en français passent en premier */
  list.sort((a, b) => (b.lang === 'fr') - (a.lang === 'fr'));
  const seen = new Set(); return list.filter(v => !seen.has(v.videoId) && seen.add(v.videoId));
}
function videoCard(v, uid) {
  const showEmbed = UI.playing === uid;
  return `<div class="vid">
    <button class="thumb" data-act="play" data-uid="${esc(uid)}" aria-label="Voir la vidéo ${esc(v.title)}">
      ${EMBED_OK !== false ? `<img src="https://i.ytimg.com/vi/${esc(v.videoId)}/mqdefault.jpg" alt="" loading="lazy" referrerpolicy="no-referrer" onload="thumbOk()" onerror="thumbFail(this)">` : ''}
      ${IC.video}
    </button>
    <div style="min-width:0">
      <div class="vt">${esc(v.title)}</div>
      <div class="va">${esc(v.author || '')} · ${v.lang === 'fr' ? 'en français' : v.origin === 'catalogue' ? 'fiche du catalogue' : 'recherche YouTube'}, vérifiée le ${fmtDate(v.checkedAt)}</div>
      ${v.note ? `<div class="variant">${esc(v.note)}</div>` : ''}
      ${v.variantNote ? `<div class="variant">${esc(v.variantNote)}</div>` : ''}
      <div class="links">
        ${EMBED_OK === true ? `<button class="btn small ghost" data-act="play" data-uid="${esc(uid)}">${showEmbed ? 'Fermer' : 'Lire ici'}</button>` : ''}
        <a href="${esc(v.url)}" target="_blank" rel="noopener">YouTube ${IC.ext}</a>
        ${v.ficheSource && v.ficheSource !== v.url ? `<a href="${esc(v.ficheSource)}" target="_blank" rel="noopener">Page source ${IC.ext}</a>` : ''}
      </div>
    </div>
    ${showEmbed && EMBED_OK === true ? `<div class="embed"><iframe src="https://www.youtube-nocookie.com/embed/${esc(v.videoId)}?autoplay=1&rel=0" title="${esc(v.title)}" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe></div>` : ''}
  </div>`;
}
window.thumbOk = () => { if (EMBED_OK !== true) { EMBED_OK = true; scheduleRender(); } };
window.thumbFail = img => { img.remove(); if (EMBED_OK === null) EMBED_OK = false; };
function videoBlock(k, ctx) {
  const vids = videosFor(k);
  if (!vids.length) return `<div class="novid">Vidéo absente : aucune démonstration vérifiée pour cet exercice.</div>`;
  return `<div class="vids">${vids.map((v, i) => videoCard(v, ctx + ':' + k + ':' + i)).join('')}</div>`;
}

/* ── Écran Programme */
function viewProgramme() {
  const doneCount = SESSIONS.filter(s => sessionStatus(s.id) === 'done').length;
  const next = SESSIONS.find(s => sessionStatus(s.id) !== 'done');
  let h = `${AUTH.user ? `<h2 class="hello">Bonjour ${esc(userName())}</h2>` : ''}<div class="card" style="margin-top:${AUTH.user ? '.5rem' : '1rem'}">
    <div class="row"><div class="grow"><div class="faint small" style="font-weight:700;text-transform:uppercase;letter-spacing:.08em">${esc(PROGRAMS[programId()].label)} · Salle On Air</div>
    <div style="font-family:var(--f-display);font-size:1.5rem;font-weight:700;line-height:1.15"><span class="num">${doneCount}</span> / ${SESSIONS.length} séances terminées</div></div></div>
    <div class="progressbar" style="margin:.5rem 0"><i style="width:${doneCount / SESSIONS.length * 100}%"></i></div>
    ${next ? `<button class="btn primary" data-act="open-session" data-id="${next.id}" style="width:100%;margin-top:.3rem">${sessionStatus(next.id) === 'started' ? 'Reprendre' : 'Prochaine séance'} : ${esc(sessLabel(next))}, ${esc(next.title)}</button>` : '<p class="muted">Programme terminé. Prévois une semaine plus légère avant le prochain bloc.</p>'}
  </div>
  ${MACHINE_PAIRS.length ? (() => { const used = MACHINE_PAIRS.filter(p => S.machines[p.id]); const all = v => MACHINE_PAIRS.every(p => S.machines[p.id] === v);
    const H = MACHINE_PAIRS.filter(p => p.haltero); const allH = H.length && H.every(p => S.machines[p.id] === 'haltero') && used.length === H.length;
    const cur = !used.length ? 'plan' : all('hammer') ? 'hammer' : all('guidee') ? 'guidee' : allH ? 'haltero' : 'mix';
    return `<div class="card stack" style="margin-top:.8rem"><div class="row"><strong class="grow">Machines</strong>${cur === 'mix' ? '<span class="pill">choix par exercice</span>' : ''}</div>
      <div class="seg" role="group" aria-label="Machines pour tout le programme">${[['plan', 'Comme prévu'], ['guidee', 'Tout guidé'], ['hammer', 'Tout Hammer']].concat(H.length ? [['haltero', 'Haltéro']] : []).map(([v, l]) => `<button data-act="machine-all" data-v="${v}" aria-pressed="${cur === v}">${l}</button>`).join('')}</div>
      <p class="small muted" style="margin:0">S’applique à ${MACHINE_PAIRS.length} machines.${H.length ? ` Haltéro remplace ${H.length} d’entre elles par un mouvement du catalogue à partir du cycle ${Math.min(...H.map(p => p.halteroFrom || 1))} ; avant, la machine prévue reste.` : ''} Tu peux aussi choisir exercice par exercice dans la séance. Le choix est enregistré avec ta progression.</p></div>`; })() : ''}
  <details class="more" style="margin-top:.8rem"><summary>${IC.chev} Principes et signaux d’arrêt</summary>
    <div class="card stack small">${PROGRAM_RULES.map(r => `<p style="margin:0">${esc(r)}</p>`).join('')}</div></details>`;
  const curC = UI.progCycle || (next ? next.cycle : 4);
  const c = CYCLES[curC - 1];
  const ss = SESSIONS.filter(s => s.cycle === c.n);
  h += `<div class="prog-layout${UI.railOpen ? ' rail-open' : ''}">
    <nav class="cycle-rail" id="cycle-rail" aria-label="Cycles">${CYCLES.map(cc => { const dd = SESSIONS.filter(s => s.cycle === cc.n && sessionStatus(s.id) === 'done').length;
      return `<button data-act="prog-cycle" data-v="${cc.n}" aria-pressed="${cc.n === curC}"><span class="cn">Cycle ${cc.n}</span><span class="cl">${esc(cc.name)}</span><span class="cd num">${dd}/${SESSIONS.filter(s => s.cycle === cc.n).length}</span></button>`; }).join('')}</nav>
    <div class="prog-main">
      <div class="row"><button class="btn rail-toggle" data-act="rail-toggle" aria-expanded="${!!UI.railOpen}" aria-controls="cycle-rail">${UI.railOpen ? 'Masquer' : 'Cycle ' + c.n + ' / ' + CYCLES.length + ' ▾'}</button><h2 style="margin:0" class="grow">${esc(c.name)}</h2></div>
      <div class="row" style="margin:.3rem 0"><span class="pill">${esc(c.intensity)}</span><span class="pill">${esc(c.scheme)}</span></div>
      <div class="stack">${ss.map((s, i) => { const st = sessionStatus(s.id); const L = S.logs[s.id];
        return `<button class="listbtn sessbtn ${st}" data-act="open-session" data-id="${s.id}">
          <span class="slot ${st}">${i + 1}</span>
          <span class="grow"><span class="t">Séance ${i + 1} · ${esc(SESSION_TYPES[s.slot].label)}</span><br><span class="small muted">${esc(s.title)}</span><br><span class="small faint">${st === 'done' ? 'Terminée' : st === 'started' ? 'En cours' : 'À faire'}${L && L.date ? ' · ' + fmtDate(L.date) : ''}</span></span>
          <span class="chev">${IC.chev}</span></button>`; }).join('')}</div>
      <details class="more" style="margin-top:.7rem"><summary>${IC.chev} Objectif du cycle</summary>
        <p class="muted small">${esc(c.goal)}</p>${c.hang ? `<p class="faint small">Suspension : ${esc(c.hang)}</p>` : ''}</details>
    </div></div>`;
  return h;
}

/* Choix machine guidée / Hammer, avec le dessin de chaque machine (pile de poids ou disques) */
function machineThumb(k) { return hasExThumb(k) ? `<span class="mthumb">${exThumb(k)}</span>` : ''; }
function machinePicker(pair, side, cycle, attrs) {
  const opts = [['guidee', 'Machine guidée'], ['hammer', 'Hammer'], ['haltero', 'Haltéro']].filter(([v]) => machineOk(pair, v, cycle));
  return `<div class="machine-pick${opts.length > 2 ? ' three' : ''}" role="group" aria-label="Type de machine">${opts.map(([v, l]) =>
    `<button data-act="machine" data-pair="${pair.id}" data-v="${v}" ${attrs} aria-pressed="${side === v}">${machineThumb(pair[v])}<span class="ml">${l}</span><span class="mn">${esc(exDef(pair[v]).fr)}</span></button>`).join('')}</div>`;
}

/* ── Écran Séance */
function presc(it) {
  const d = exDef(it.x);
  if (!it.sets) return esc(it.reps);
  if (itemUnit(it) === 'min' && it.sets === 1) return esc(it.reps);
  return `${it.sets} × ${esc(it.reps)}`;
}
/* Étapes d'une séance : échauffement, chaque exercice ou WOD, retour au calme, bilan */
function sessionSteps(s) {
  const st = [{ k: 'w' }]; let pre = '';
  s.blocks.forEach(bl => {
    if (bl.type === 'rest') { pre = bl.title; return; }
    if (bl.type === 'wod') { st.push({ k: 'wod', bl, pre }); pre = ''; return; }
    bl.items.forEach((it, i) => { st.push({ k: 'ex', bl, it, i, pre: i === 0 ? pre : '' }); }); pre = '';
  });
  st.push({ k: 'c' }, { k: 'b' });
  return st;
}
function curStep(s, n) { const v = (UI.step || {})[s.id] || 0; return Math.min(Math.max(0, v), n - 1); }
function viewSession(sid) {
  const s = SESSION_BY_ID[sid]; const L = getLog(sid, false) || {};
  const cyc = CYCLES[s.cycle - 1];
  const steps = sessionSteps(s); const n = steps.length; const cur = curStep(s, n); const S = steps[cur];
  if (GATE.sid === sid) return gateView(s, steps);
  let h = `<div class="row sess-tools"><button class="btn rail-toggle" data-act="sess-rail" aria-expanded="${!!UI.sessRail}" aria-controls="sess-rail">${UI.sessRail ? 'Masquer les étapes' : 'Afficher étapes'}</button>
    <button class="btn rail-toggle" data-act="sess-muscles" data-sid="${sid}">Muscles</button></div>
  <p class="muted small" style="margin-top:.6rem">Cycle ${s.cycle} · ${esc(cyc.name)} · ${esc(cyc.intensity)}</p>
  <h2 style="margin-top:.2rem">${esc(s.title)}</h2>`;
  if (S.k === 'w') {
    h += `<div class="goal"><div class="goal-l">But de la séance</div><p>${esc(s.goal || '')}</p>${s.intro ? `<p class="muted small">${esc(s.intro)}</p>` : ''}</div>
  <div class="grid2" style="margin-top:.6rem">
    <label class="fld">Date de réalisation<input type="date" id="f-date-${sid}" data-in="sdate" data-sid="${sid}" value="${esc(L.date || '')}"></label>
    <label class="fld">État<button class="btn ${L.done ? 'primary' : ''}" data-act="sdone" data-sid="${sid}">${L.done ? IC.check + ' Séance terminée' : 'Marquer terminée'}</button></label>
  </div>
  <h3 id="sec-w" class="anchor">${esc(s.warmTitle || 'Mise en route · 10 min')}</h3>${warmList(s.warmup, sid + ':w')}`;
  } else if (S.k === 'wod') {
    if (S.pre) h += `<div class="restline">${esc(S.pre)}</div>`;
    h += wodBlock(s, S.bl);
  } else if (S.k === 'ex') {
    const bl = S.bl;
    if (S.pre) h += `<div class="restline">${esc(S.pre)}</div>`;
    const rounds = bl.rounds ? `${bl.type === 'superset' ? 'Superset' : 'Circuit'}, ${bl.rounds} tours` : '';
    h += `<div class="blockhead"><span class="letter">${esc(bl.items.length > 1 ? bl.l + (S.i + 1) : bl.l)}</span>${bl.title || rounds ? `<span class="bt">${esc(bl.title || '')}${bl.title && rounds ? ' · ' : ''}${esc(rounds)}</span>` : ''}</div>`;
    if (bl.items.length > 1) h += `<p class="small muted stepwith">Enchaîné avec ${bl.items.map((o, j) => j === S.i ? '' : `<button class="linkbtn" data-act="sstep" data-sid="${sid}" data-v="${cur - S.i + j}">${esc(bl.l + (j + 1))} ${esc(itemLabel(o))}</button>`).filter(Boolean).join(', ')}</p>`;
    h += exoCard(s, bl, S.it, S.i);
  } else if (S.k === 'c') {
    h += `<h3 id="sec-c" class="anchor">${esc(s.coolTitle || 'Retour au calme · 5 min')}</h3>${warmList(s.cooldown, sid + ':c')}`;
  } else {
    h += `<h3 id="sec-b" class="anchor">Bilan de la séance</h3>
  <div class="card stack">
    <div class="grid2">
      <label class="fld">RPE global (1-10)<input type="number" inputmode="decimal" min="1" max="10" step="0.5" id="f-rpe-${sid}" data-in="srpe" data-sid="${sid}" value="${esc(L.rpe || '')}"></label>
      <label class="fld">État<button class="btn ${L.done ? 'primary' : ''}" data-act="sdone" data-sid="${sid}">${L.done ? IC.check + ' Séance terminée' : 'Marquer terminée'}</button></label>
    </div>
    ${commentField('scomment', sid, '', L.comment, 'Commentaire de séance')}
  </div>`;
  }
  const idx = SESSIONS.indexOf(s); const prev = SESSIONS[idx - 1], nxt = SESSIONS[idx + 1];
  const pb = cur > 0 ? `<button class="btn" data-act="sstep" data-sid="${sid}" data-v="${cur - 1}">${IC.back} Précédent</button>`
    : prev ? `<button class="btn" data-act="open-session" data-id="${prev.id}" title="${esc(sessLabel(prev))}">${IC.back} Séance préc.</button>` : '<span></span>';
  const gs = cur < n - 1 ? gateRest(S, steps[cur + 1]) : 0;
  const nb = cur < n - 1 ? `<button class="btn primary" data-act="${gs ? 'gate' : 'sstep'}" data-sid="${sid}" data-v="${cur + 1}">Suivant ${IC.chev}</button>`
    : nxt ? `<button class="btn" data-act="open-session" data-id="${nxt.id}" title="${esc(sessLabel(nxt))}">Séance suiv. ${IC.chev}</button>` : '<span></span>';
  h += `<div class="stepbar">${pb}<span class="stepn num">${cur + 1} / ${n}</span>${nb}</div>`;
  return `<div class="sess-layout${UI.sessRail ? ' rail-open' : ''}">${sessionRail(s, L, steps, cur)}<div class="sess-main">${h}</div></div>`;
}
function muscleLine(d) {
  if (d.kind === 'mob') return '';
  const P = (d.p || []).map(g => `<span class="mtag p">${esc(MUSCLES[g])}</span>`).join('');
  const Sx = (d.s || []).map(g => `<span class="mtag s">${esc(MUSCLES[g])}</span>`).join('');
  const lbl = d.kind === 'tech' ? 'Technique' : d.kind === 'cardio' ? 'Cardio' : 'Principal';
  return `<div class="mline">${P ? `<span class="mlbl">${lbl}</span>${P}` : ''}${Sx ? `<span class="mlbl">Secondaire</span>${Sx}` : ''}${!P && !Sx ? `<span class="mlbl">Hors groupes suivis</span>` : ''}${d.off ? `<span class="mnote">${esc(d.off)}</span>` : ''}</div>`;
}
function sessionRail(s, L, steps, cur) {
  const items = [{ act: 'sess-muscles', t: 'Muscles', title: 'Répartition musculaire de la séance' }];
  steps.forEach((S, v) => {
    if (S.k === 'w') items.push({ v, t: 'Échauf.', title: 'Mise en route' });
    else if (S.k === 'wod') { const W = ((L.wod || {})[S.bl.l]) || {}; items.push({ v, t: S.bl.l, sub: 'WOD', title: S.bl.title, done: !!W.done }); }
    else if (S.k === 'ex') { const bl = S.bl, it = S.it, i = S.i; const E = (L.ex || {})[itemKey(bl, i)];
      items.push({ v, t: bl.items.length > 1 ? bl.l + (i + 1) : bl.l, sub: shortName(plannedEx(it, E, s.cycle) !== it.x ? exDef(plannedEx(it, E, s.cycle)).fr : itemLabel(it)), title: itemLabel(it), done: !!(E && E.done), skip: !!(E && E.skipped) }); }
    else if (S.k === 'c') items.push({ v, t: 'Calme', title: 'Retour au calme' });
    else items.push({ v, t: 'Bilan', title: 'Bilan de la séance', done: !!L.done });
  });
  return `<nav class="sess-rail" id="sess-rail" aria-label="Étapes de la séance">${items.map(x => x.act ? `<button data-act="${x.act}" data-sid="${s.id}" class="musbtn" title="${esc(x.title)}" aria-label="${esc(x.title)}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="4.5" r="2.2"/><path d="M6 8.5h12M12 8.5v6M12 14.5l-3.5 7M12 14.5l3.5 7"/></svg><span class="rs">${esc(x.t)}</span></button>` : `<button data-act="sstep" data-sid="${s.id}" data-v="${x.v}" class="${x.done ? 'done' : ''} ${x.skip ? 'skip' : ''} ${x.v === cur ? 'active' : ''}" ${x.v === cur ? 'aria-current="step"' : ''} title="${esc(x.title)}" aria-label="${esc(x.title)}"><span class="rl">${esc(x.t)}</span>${x.sub ? `<span class="rs">${esc(x.sub)}</span>` : ''}</button>`).join('')}</nav>`;
}
function shortName(n) { const w = String(n).replace(/[(),·]/g, ' ').split(/\s+/).filter(x => x && !/^(de|du|des|à|la|le|les|sur|au|aux|et|ou|un|en|avec)$/i.test(x)); return w.slice(0, 2).join(' '); }
function warmList(lines, ctx) {
  return `<div class="warm">${lines.map((ln, li) => `<div class="line"><div>${esc(ln.t)}</div>
    ${ln.x.length ? `<div class="chips">${ln.x.map(k => `<button class="chip" data-act="toggle-warm" data-uid="${esc(ctx + li + k)}" aria-pressed="${UI.openWarm === ctx + li + k}">${IC.video}${esc(exDef(k).fr)}</button>`).join('')}</div>` : ''}
    ${ln.x.filter(k => UI.openWarm === ctx + li + k).map(k => `<div style="margin-top:.5rem">${exDef(k).desc ? `<p class="small muted">${esc(exDef(k).desc)}</p>` : ''}${exDef(k).variant ? `<p class="variant">${esc(exDef(k).variant)}</p>` : ''}${videoBlock(k, ctx + li)}</div>`).join('')}
  </div>`).join('')}</div>`;
}
function wodBlock(s, bl) {
  const L = getLog(s.id, false) || {}; const W = (L.wod || {})[bl.l] || {};
  return `<div class="blockhead anchor" id="wod-${s.id}-${bl.l}"><span class="letter">${esc(bl.l)}</span><span class="bt">${esc(bl.title)}</span></div>
  <div class="card wodcard stack">
    ${bl.desc ? `<p class="muted small" style="margin:0">${esc(bl.desc)}</p>` : ''}
    ${emomOf(bl) ? emomBox(s.id + ':' + bl.l, emomOf(bl)) : wodTimerOf(bl) ? wtBox(s.id, bl) : ''}
    <ul class="wod-items">${bl.items.map(it => `<li><strong>${esc(itemLabel(it))}</strong> <span class="faint">(${esc(exDef(it.x).en)})</span> · ${esc(it.reps)}${muscleLine(exDef(it.x))}${exDef(it.x).variant ? `<br><span class="variant">${esc(exDef(it.x).variant)}</span>` : ''}</li>`).join('')}</ul>
    <div class="chips">${bl.items.map(it => `<button class="chip" data-act="toggle-warm" data-uid="${esc(s.id + bl.l + it.x)}" aria-pressed="${UI.openWarm === s.id + bl.l + it.x}">${IC.video}${esc(exDef(it.x).en)}</button>`).join('')}</div>
    ${bl.items.filter(it => UI.openWarm === s.id + bl.l + it.x).map(it => videoBlock(it.x, s.id + bl.l)).join('')}
    <div class="grid2">
      <label class="fld">Score / temps${bl.benchmark ? ' (repère)' : ''}<input type="text" id="f-wod-${s.id}-${bl.l}" data-in="wscore" data-sid="${s.id}" data-bl="${bl.l}" value="${esc(W.score || '')}" placeholder="ex. 5 tours + 12"></label>
      <label class="fld">RPE<input type="number" inputmode="decimal" min="1" max="10" step="0.5" id="f-wrpe-${s.id}-${bl.l}" data-in="wrpe" data-sid="${s.id}" data-bl="${bl.l}" value="${esc(W.rpe || '')}"></label>
    </div>
    <label class="fld">Charges utilisées<input type="text" id="f-wload-${s.id}-${bl.l}" data-in="wload" data-sid="${s.id}" data-bl="${bl.l}" value="${esc(W.load || '')}" placeholder="ex. KB 20 kg, balle 9 kg"></label>
    ${commentField('wcomment', s.id, bl.l, W.comment, 'Commentaire')}
    <button class="btn ${W.done ? 'primary' : ''}" data-act="wdone" data-sid="${s.id}" data-bl="${bl.l}">${W.done ? IC.check + ' Bloc terminé' : 'Marquer le bloc terminé'}</button>
  </div>`;
}
function exoCard(s, bl, it, i) {
  const key = itemKey(bl, i); const E = getExLog(s.id, key, it, false);
  const eff = plannedEx(it, E, s.cycle); const d = exDef(eff); const orig = exDef(it.x); const pair = !(E && E.swap) && PAIR_OF[it.x];
  const side = pair ? (eff === pair.hammer ? 'hammer' : eff === pair.guidee ? 'guidee' : eff === pair.haltero ? 'haltero' : '') : '';
  const sets = E ? E.sets : Array.from({ length: Math.max(1, it.sets || 1) }, () => ({}));
  const hist = exHistory(eff).filter(hh => hh.sid !== s.id); const last = hist[hist.length - 1];
  const uid = s.id + ':' + key;
  const swapOpts = swapList(it.x);
  return `<div class="exo anchor ${E && E.done ? 'done' : ''} ${E && E.skipped ? 'skipped' : ''}" id="exo-${uid}">
    <div class="exo-title">${hasExThumb(eff) && !pair ? `<button class="ethumb" data-act="exmedia" data-uid="${esc(uid)}" data-v="image" aria-label="Voir l’image">${exThumb(eff)}</button>` : ''}<div class="grow">
      <div class="exo-name">${esc(eff !== it.x ? d.fr : itemLabel(it))}</div>
      <div class="exo-en">${esc(d.en)}${E && E.swap ? ` · variante de ${esc(itemLabel(it))}` : ''}</div>
    </div><div class="presc num">${presc(it)}</div></div>
    ${pair ? machinePicker(pair, side, s.cycle, `data-sid="${s.id}" data-key="${key}" data-bi="${bl.l}" data-i="${i}"`) : ''}
    ${mediaBar(eff, uid, `<div class="stack">
        ${d.mv ? `<button class="btn small ghost" data-act="open-move" data-id="${d.mv}" style="justify-self:start">Fiche ${esc(MOVE_BY_ID[d.mv] ? MOVE_BY_ID[d.mv].name : d.en)}</button>` : ''}
        <label class="fld">Variante appliquée (allègement, remplacement…)
          <input type="search" id="f-swapq-${uid}" data-in="swapq" data-target="f-swap-${uid}" data-x="${esc(it.x)}" placeholder="Rechercher un exercice" autocomplete="off" enterkeyhint="search">
          <select id="f-swap-${uid}" data-in="swap" data-sid="${s.id}" data-key="${key}" data-bi="${bl.l}" data-i="${i}" data-planned="${esc(itemLabel(it))}">
            ${swapOptions(swapOpts, itemLabel(it), E && E.swap)}
          </select></label>
        <button class="btn small ghost" data-act="skip" data-sid="${s.id}" data-key="${key}" data-bi="${bl.l}" data-i="${i}" style="justify-self:start">${E && E.skipped ? 'Rétablir l’exercice' : 'Exercice non réalisé'}</button>
      </div>`, E && (E.swap || E.skipped))}
    ${muscleLine(d)}
    ${it.note ? `<div class="small muted">${esc(it.note)}</div>` : ''}
    ${(it.variant || d.variant) ? `<div class="variant">${esc(it.variant || d.variant)}</div>` : ''}
    ${emomItem(it) ? emomBox(uid + ':emom', emomItem(it)) : it.rest ? recupBox(uid, it.rest, `${itemLabel(it)}`, bl.type === 'superset' || bl.type === 'circuit') : ''}
    ${last ? `<div class="prev">Dernière fois (${esc(sessLabel(SESSION_BY_ID[last.sid]))}${last.date ? ', ' + fmtDate(last.date) : ''}) : ${esc(setSummary(d, last.sets))}</div>` : ''}
    ${E && E.skipped ? '<div class="small faint">Exercice non réalisé.</div>' : `<div class="sets">${sets.map((st, si) => setRow(s.id, key, it, d, st, si)).join('')}</div>`}
    <div class="exo-actions">
      <button class="btn small ghost" data-act="addset" data-sid="${s.id}" data-key="${key}" data-bi="${bl.l}" data-i="${i}">${IC.plus} Série</button>
      <button class="btn small ghost" data-act="delset" data-sid="${s.id}" data-key="${key}" data-bi="${bl.l}" data-i="${i}" ${sets.length <= 1 ? 'disabled' : ''}>${IC.minus} Série</button>
      <button class="btn small ${E && E.done ? 'primary' : ''}" data-act="exdone" data-sid="${s.id}" data-key="${key}" data-bi="${bl.l}" data-i="${i}">${E && E.done ? IC.check + ' Terminé' : 'Terminé'}</button>
    </div>
  </div>`;
}
/* Boutons Vidéo, Image et Variante d'un exercice, et le panneau ouvert */
function mediaBar(k, uid, variantPanel, variantSet) {
  const open = UI.exMedia && UI.exMedia.uid === uid ? UI.exMedia.v : null; const nv = videosFor(k).length; const im = exImg(k);
  const btn = (v, label, icon) => `<button class="btn small ${open === v ? 'primary' : ''}" data-act="exmedia" data-uid="${esc(uid)}" data-v="${v}" aria-pressed="${open === v}">${icon}${label}</button>`;
  let panel = '';
  if (open === 'video') panel = videoBlock(k, uid);
  if (open === 'variant') panel = variantPanel || '';
  if (open === 'image') panel = `<figure class="bigthumb">${exThumb(k)}${im && im.file ? `<figcaption class="small faint">${im.note ? esc(im.note) + ' · ' : ''}Photo ${esc(im.source || '')}</figcaption>` : '<figcaption class="small faint">Dessin du mouvement (pas de photo pour cet exercice)</figcaption>'}</figure>`;
  return `<div class="row media-btns">${btn('video', 'Vidéo', IC.video)}${btn('image', 'Image', IC.image)}${variantPanel ? btn('variant', variantSet ? 'Variante ✓' : 'Variante', IC.swap) : ''}</div>${panel ? `<div class="media-panel">${panel}</div>` : ''}`;
}
/* Variantes possibles : exercices de la même famille (renfo, gainage, cardio) qui travaillent les mêmes
   muscles principaux (au moins la moitié en commun) ; « alt » dans la bibliothèque impose une liste. Ordre alphabétique. */
const swapFamily = v => v.kind === 'cardio' ? 'cardio' : v.kind === 'gainage' ? 'gainage' : 'force';
function swapList(x) {
  const d = exDef(x); const fam = swapFamily(d); const P = d.p || [];
  /* pas d'exercice à la poulie (préférence de Spook) */
  const pool = Object.entries(EXERCISES).filter(([k, v]) => v.kind !== 'mob' && v.kind !== 'wod' && k !== x && swapFamily(v) === fam && !/poulie/i.test(v.fr));
  if (d.alt) return pool.filter(([k]) => d.alt.includes(k)).sort((a, b) => a[1].fr.localeCompare(b[1].fr, 'fr', { sensitivity: 'base' }));
  const close = v => { const Q = v.p || []; const common = Q.filter(g => P.includes(g)).length; return common && common / new Set(P.concat(Q)).size >= .5; };
  const list = P.length && fam !== 'cardio' ? pool.filter(([, v]) => close(v)) : pool;
  return list.sort((a, b) => a[1].fr.localeCompare(b[1].fr, 'fr', { sensitivity: 'base' }));
}
const fold = t => String(t || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
function swapOptions(list, planned, cur, q) {
  const f = fold(q); const shown = f ? list.filter(([k, v]) => fold(v.fr + ' ' + v.en).includes(f) || k === cur) : list;
  return `<option value="">Exercice prévu : ${esc(planned)}</option>` + shown.map(([k, v]) => `<option value="${k}" ${cur === k ? 'selected' : ''}>${esc(v.fr)}</option>`).join('')
    + (f && !shown.length ? '<option disabled>Aucun exercice trouvé</option>' : '');
}
function setRow(sid, key, it, d, st, si) {
  const id = `${sid}-${key}-${si}`; const a = `data-sid="${sid}" data-key="${key}" data-si="${si}" data-bi="${key.replace(/\d+$/, '')}" data-i="${key.match(/\d+$/)[0]}"`;
  /* unité de l'exercice réellement fait (variante comprise), sauf si la séance la précise */
  const u = it.unit || d.unit; const ph = u === exDef(it.x).unit ? prefill(it) : ''; d = Object.assign({}, d, { unit: u });
  let main;
  if (d.unit === 'time') {
    const on = HOLD.uid === id;
    main = `<label>Secondes<div class="stepper"><button class="holdbtn ${on ? 'on' : ''}" data-act="hold" ${a} aria-label="Chronomètre de maintien">${on ? IC.pause : IC.play}</button><input type="number" inputmode="numeric" id="s-dur-${id}" data-in="set" data-f="dur" ${a} value="${esc(on ? Math.floor(HOLD.elapsed()) : (st.dur ?? ''))}" placeholder="${ph}"><button data-act="step" data-f="dur" data-d="5" ${a} aria-label="Plus 5 secondes">+</button></div></label>`;
  } else if (d.unit === 'dist') {
    main = `<label>Mètres<div class="stepper"><button data-act="step" data-f="dist" data-d="-5" ${a} aria-label="Moins 5 m">−</button><input type="number" inputmode="numeric" id="s-dist-${id}" data-in="set" data-f="dist" ${a} value="${esc(st.dist ?? '')}" placeholder="${ph}"><button data-act="step" data-f="dist" data-d="5" ${a} aria-label="Plus 5 m">+</button></div></label>`;
  } else if (d.unit === 'min') {
    main = `<label>Minutes<div class="stepper"><button data-act="step" data-f="min" data-d="-1" ${a} aria-label="Moins une minute">−</button><input type="number" inputmode="decimal" id="s-min-${id}" data-in="set" data-f="min" ${a} value="${esc(st.min ?? '')}" placeholder="${ph}"><button data-act="step" data-f="min" data-d="1" ${a} aria-label="Plus une minute">+</button></div></label>`;
  } else {
    main = `<label>Reps<div class="stepper"><button data-act="step" data-f="reps" data-d="-1" ${a} aria-label="Moins une répétition">−</button><input type="number" inputmode="numeric" id="s-reps-${id}" data-in="set" data-f="reps" ${a} value="${esc(st.reps ?? '')}" placeholder="${ph}"><button data-act="step" data-f="reps" data-d="1" ${a} aria-label="Plus une répétition">+</button></div></label>`;
  }
  const second = d.unit === 'min'
    ? `<label>Résultat<input type="text" id="s-res-${id}" data-in="set" data-f="res" ${a} value="${esc(st.res ?? '')}" placeholder="${esc(it.res || 'cal, m, FC')}"></label>`
    : `<label>Kg<input type="number" inputmode="decimal" step="0.5" id="s-load-${id}" data-in="set" data-f="load" ${a} value="${esc(st.load ?? '')}" placeholder="${d.load ? 'kg' : '—'}"></label>`;
  return `<div class="set ${st.done ? 'done' : ''}"><span class="idx">${si + 1}</span>${main}${second}
    <label>RPE<input type="number" inputmode="decimal" min="1" max="10" step="0.5" id="s-rpe-${id}" data-in="set" data-f="rpe" ${a} value="${esc(st.rpe ?? '')}"></label>
    <button class="checkbtn" data-act="setdone" ${a} aria-label="Valider la série ${si + 1}" aria-pressed="${!!st.done}">${IC.check}</button></div>`;
}
function commentField(kind, sid, key, val, label, extra) {
  const id = `c-${kind}-${sid}-${key}`;
  return `<label class="fld">${esc(label)}
    <textarea id="${id}" data-in="${kind}" data-sid="${sid}" data-key="${esc(key)}" data-bl="${esc(key)}" ${extra || ''} placeholder="Sensations, réglages de machine…">${esc(val || '')}</textarea></label>
    <button class="btn small ghost" data-act="dictate" data-target="${id}" style="justify-self:start">${IC.mic} Dicter</button>`;
}

/* ── Repos entre deux exercices : écran affiché quand on clique sur Suivant */
const GATE = { sid: null, to: 0, total: 0, left: 0, running: false, endAt: 0, tick: null };
function stepName(t) {
  if (!t) return '';
  if (t.k === 'ex') return `${t.bl.items.length > 1 ? t.bl.l + (t.i + 1) : t.bl.l} · ${itemLabel(t.it)}`;
  if (t.k === 'wod') return t.bl.title || 'WOD';
  return t.k === 'c' ? 'Retour au calme' : '';
}
// Durée de repos estimée selon la transition (0 = pas d'écran de repos)
function gateRest(a, b) {
  if (!b || b.k === 'b' || b.k === 'w') return 0;
  if (a.k === 'ex' && b.k === 'ex' && a.bl === b.bl) return 0; // même superset/circuit : on enchaîne
  if (a.k === 'wod') return b.k === 'c' ? 120 : 180;
  if (b.k === 'wod') return 120;
  if (a.k === 'w') return 60;
  if (b.k === 'c') return 60;
  const r = Math.max(...b.bl.items.map(o => Number(o.rest) || 0));
  return r >= 120 || /^[1-5]$/.test(String(b.it.reps)) ? 150 : 90;
}
function openGate(sid, to) {
  const s = SESSION_BY_ID[sid]; const steps = sessionSteps(s); const sec = gateRest(steps[curStep(s, steps.length)], steps[to]);
  clearInterval(GATE.tick);
  Object.assign(GATE, { sid, to, total: sec, left: sec, running: false, endAt: 0 });
}
function closeGate(advance) {
  clearInterval(GATE.tick); const { sid, to } = GATE; GATE.sid = null; GATE.running = false;
  if (advance) UI.step = Object.assign({}, UI.step, { [sid]: to });
}
function gateGo() {
  if (GATE.running) return; if (GATE.left <= 0) GATE.left = GATE.total;
  GATE.running = true; GATE.endAt = Date.now() + GATE.left * 1000;
  GATE.tick = setInterval(() => {
    GATE.left = Math.max(0, (GATE.endAt - Date.now()) / 1000);
    if (GATE.left <= 0) { beep(3); closeGate(true); go({}); return; }
    paintGate();
  }, 250);
}
function gateStop() { if (!GATE.running) return; clearInterval(GATE.tick); GATE.running = false; GATE.left = Math.max(0, (GATE.endAt - Date.now()) / 1000); }
function paintGate() {
  const t = document.getElementById('gate-time'); if (t) t.textContent = fmtSec(Math.ceil(GATE.left));
  const r = document.getElementById('gate-ring'); if (r) r.style.setProperty('--p', (1 - GATE.left / GATE.total) * 100);
}
function gateView(s, steps) {
  const nx = steps[GATE.to];
  return `<p class="muted small" style="margin-top:1rem">${esc(s.title)}</p>
  <div class="gate">
    <div class="gate-l">Repos</div>
    <div class="gate-ring" id="gate-ring" style="--p:${(1 - GATE.left / GATE.total) * 100}"><span id="gate-time" class="num">${fmtSec(Math.ceil(GATE.left))}</span></div>
    <p class="gate-next">Ensuite : <strong>${esc(stepName(nx))}</strong></p>
    <div class="gate-btns">
      <button class="btn primary big" data-act="gate-go" ${GATE.running ? 'disabled' : ''}>${IC.play} Go</button>
      <button class="btn big" data-act="gate-stop" ${GATE.running ? '' : 'disabled'}>${IC.pause} Stop</button>
    </div>
    <div class="gate-btns">
      <button class="btn small ghost" data-act="gate-plus">+15 s</button>
      <button class="btn small ghost" data-act="gate-skip">Passer le repos ${IC.chev}</button>
      <button class="btn small ghost" data-act="gate-back">${IC.back} Retour</button>
    </div>
  </div>`;
}

/* ── Minuteur EMOM : une station par minute, avec l'exercice de chaque minute */
// WOD dont le titre dit EMOM / E2MOM : durée prise dans le titre, stations = items dans l'ordre
function emomOf(bl) {
  const t = bl.title || ''; const m = t.match(/E(\d)?MOM/i); if (!m) return null;
  const every = (+m[1] || 1) * 60; const mins = +((t.match(/(\d+)\s*min/i) || [])[1] || 0);
  const st = bl.items.map(it => ({ name: itemLabel(it), reps: it.reps || '' }));
  const tours = +((t.match(/(\d+)\s*tours?/i) || [])[1] || 0);
  const total = mins ? Math.round(mins * 60 / every) : (tours || 1) * st.length;
  return { every, total, st };
}
// Exercice simple noté EMOM (ex. tractions strictes) : une minute par série
function emomItem(it) {
  if (!/EMOM/i.test(it.note || '')) return null;
  return { every: 60, total: it.sets || 1, st: [{ name: itemLabel(it), reps: it.reps || '' }] };
}
const EMOM = { key: null, cfg: null, base: 0, startAt: 0, running: false, tick: null, last: -99, done: false,
  el() { return this.base + (this.running ? (Date.now() - this.startAt) / 1000 : 0); } };
const EMOM_LEAD = 10; // décompte de préparation
function emomState(key, cfg) {
  const mine = EMOM.key === key; const t = mine ? EMOM.el() : -EMOM_LEAD;
  const end = cfg.total * cfg.every;
  if (mine && EMOM.done) return { phase: 'fin', left: 0, idx: cfg.total - 1 };
  if (t < 0) return { phase: 'prep', left: -t, idx: 0 };
  const idx = Math.min(cfg.total - 1, Math.floor(t / cfg.every));
  return { phase: t >= end ? 'fin' : 'go', left: cfg.every - (t - idx * cfg.every), idx };
}
function emomInner(key, cfg) {
  const z = emomState(key, cfg); const n = cfg.st.length;
  const cur = cfg.st[z.idx % n]; const nx = z.idx + 1 < cfg.total ? cfg.st[(z.idx + 1) % n] : null;
  const tours = Math.ceil(cfg.total / n);
  const head = z.phase === 'prep' ? 'Prépare-toi' : z.phase === 'fin' ? 'EMOM terminé' : `Minute ${z.idx * cfg.every / 60 + 1} / ${cfg.total * cfg.every / 60}${n > 1 ? ` · tour ${Math.floor(z.idx / n) + 1}/${tours}` : ''}`;
  return `<div class="emom-h"><span>${esc(head)}</span><span class="emom-t num">${fmtSec(Math.ceil(z.left))}</span></div>
    <div class="emom-st"><strong>${esc(z.phase === 'prep' ? 'Début : ' + cur.name : cur.name)}</strong> <span class="num">${esc(cur.reps)}</span></div>
    ${nx && z.phase !== 'fin' ? `<div class="small emom-nx">Ensuite : ${esc(nx.name)} · ${esc(nx.reps)}</div>` : ''}`;
}
function emomBox(key, cfg) {
  const mine = EMOM.key === key;
  return `<div class="emom ${mine && EMOM.running ? 'running' : ''} ${mine && EMOM.done ? 'finished' : ''}" data-emom-key="${esc(key)}" role="timer">
    <div class="emom-in">${emomInner(key, cfg)}</div>
    <div class="recup-b">
      <button class="btn primary" data-act="emom-go" data-key="${esc(key)}">${IC.play} Go</button>
      <button class="btn" data-act="emom-stop" data-key="${esc(key)}">${IC.pause} Stop</button>
      <button class="btn" data-act="emom-zero" data-key="${esc(key)}" aria-label="Remise à zéro">${IC.reset} RAZ</button>
    </div></div>`;
}
function emomCfg(key) {
  const [sid, a, b] = key.split(':'); const s = SESSION_BY_ID[sid]; const bl = s.blocks.find(x => x.l === (b === 'emom' ? a.replace(/\d+$/, '') : a));
  if (b !== 'emom') return emomOf(bl);
  const it = bl.items.find((x, i) => s.id + ':' + itemKey(bl, i) + ':emom' === key); return emomItem(it);
}
function emomGo(key) {
  if (EMOM.key !== key || EMOM.done) { emomZero(); EMOM.key = key; EMOM.cfg = emomCfg(key); EMOM.base = -EMOM_LEAD; EMOM.last = -99; EMOM.done = false; }
  if (EMOM.running) return;
  EMOM.running = true; EMOM.startAt = Date.now(); clearInterval(EMOM.tick);
  EMOM.tick = setInterval(emomTick, 200); emomTick();
}
function emomTick() {
  const c = EMOM.cfg; const t = EMOM.el(); const end = c.total * c.every;
  if (t >= end) { EMOM.base = end; EMOM.running = false; EMOM.done = true; clearInterval(EMOM.tick); beep(3); paintEmom(); return; }
  const idx = t < 0 ? -1 : Math.floor(t / c.every);
  if (idx !== EMOM.last) { if (EMOM.last !== -99) beep(idx === -1 ? 1 : 2); EMOM.last = idx; }
  paintEmom();
}
function emomStop() { if (!EMOM.running) return; EMOM.base = EMOM.el(); EMOM.running = false; clearInterval(EMOM.tick); paintEmom(); }
function emomZero() { clearInterval(EMOM.tick); const k = EMOM.key; Object.assign(EMOM, { key: null, running: false, done: false, base: 0, last: -99 }); if (k) paintEmom(k); }
function paintEmom(k) {
  document.querySelectorAll('[data-emom-key]').forEach(b => {
    const key = b.dataset.emomKey; if (k && key !== k && key !== EMOM.key) return;
    const cfg = EMOM.key === key ? EMOM.cfg : emomCfg(key); const mine = EMOM.key === key;
    b.classList.toggle('running', mine && EMOM.running); b.classList.toggle('finished', mine && EMOM.done);
    b.querySelector('.emom-in').innerHTML = emomInner(key, cfg);
  });
}

/* ── Minuteur AMRAP / For time / bloc chronométré */
// amrap : compte à rebours + compteur de tours ; fortime : chrono jusqu'au cap, « Fini » note le temps
function wodTimerOf(bl) {
  const t = (bl.title || '') + ' ' + (bl.desc || '');
  const am = t.match(/AMRAP\s*(\d+)/i); if (am) return { mode: 'amrap', sec: +am[1] * 60 };
  const cap = t.match(/cap\s*(\d+)\s*min/i); if (/for time/i.test(t)) return { mode: 'fortime', sec: cap ? +cap[1] * 60 : 0 };
  const mn = (bl.title || '').match(/(\d+)\s*min/i); if (mn) return { mode: 'amrap', sec: +mn[1] * 60 };
  return null;
}
const WT = { key: null, cfg: null, base: 0, startAt: 0, running: false, tick: null, done: false, rounds: 0,
  el() { return this.base + (this.running ? (Date.now() - this.startAt) / 1000 : 0); } };
function wtInner(key, cfg) {
  const mine = WT.key === key; const t = mine ? WT.el() : -EMOM_LEAD;
  let head, val;
  if (t < 0) { head = 'Prépare-toi'; val = -t; }
  else if (cfg.mode === 'amrap') { head = mine && WT.done ? 'Temps écoulé' : `AMRAP · ${fmtSec(cfg.sec)}`; val = Math.max(0, cfg.sec - t); }
  else { head = mine && WT.done ? 'Terminé en' : `For time${cfg.sec ? ` · cap ${fmtSec(cfg.sec)}` : ''}`; val = t; }
  return `<div class="emom-h"><span>${esc(head)}</span><span class="emom-t num">${fmtSec(t < 0 ? Math.ceil(val) : cfg.mode === 'amrap' ? Math.ceil(val) : Math.floor(val))}</span></div>
    ${cfg.mode === 'amrap' ? `<div class="emom-st">Tours : <strong class="num">${mine ? WT.rounds : 0}</strong></div>` : ''}`;
}
function wtBox(sid, bl) {
  const key = sid + ':' + bl.l; const cfg = wodTimerOf(bl); const mine = WT.key === key;
  return `<div class="emom ${mine && WT.running ? 'running' : ''} ${mine && WT.done ? 'finished' : ''}" data-wt-key="${esc(key)}" role="timer">
    <div class="emom-in">${wtInner(key, cfg)}</div>
    <div class="recup-b">
      <button class="btn primary" data-act="wt-go" data-key="${esc(key)}">${IC.play} Go</button>
      <button class="btn" data-act="wt-stop" data-key="${esc(key)}">${IC.pause} Stop</button>
      <button class="btn" data-act="wt-zero" data-key="${esc(key)}" aria-label="Remise à zéro">${IC.reset} RAZ</button>
    </div>
    <div class="recup-b">${cfg.mode === 'amrap'
      ? `<button class="btn" data-act="wt-round" data-key="${esc(key)}">+1 tour</button><button class="btn ghost" data-act="wt-round" data-d="-1" data-key="${esc(key)}">−1</button>`
      : `<button class="btn" data-act="wt-fin" data-key="${esc(key)}">${IC.check} Fini, noter le temps</button>`}</div></div>`;
}
function wtCfg(key) { const [sid, l] = key.split(':'); return wodTimerOf(SESSION_BY_ID[sid].blocks.find(b => b.l === l)); }
function wtGo(key) {
  if (WT.key !== key || WT.done) { wtZero(); Object.assign(WT, { key, cfg: wtCfg(key), base: -EMOM_LEAD, done: false, rounds: 0, last: -1 }); }
  if (WT.running) return;
  WT.running = true; WT.startAt = Date.now(); clearInterval(WT.tick); WT.tick = setInterval(wtTick, 200); wtTick();
}
function wtTick() {
  const t = WT.el(); const c = WT.cfg;
  if (WT.last < 0 && t >= 0) { beep(2); WT.last = 0; }
  if (c.sec && t >= c.sec) { WT.base = c.sec; WT.running = false; WT.done = true; clearInterval(WT.tick); beep(3); if (c.mode === 'amrap') wtScore(); }
  paintWt();
}
function wtStop() { if (!WT.running) return; WT.base = WT.el(); WT.running = false; clearInterval(WT.tick); paintWt(); }
function wtZero() { clearInterval(WT.tick); const k = WT.key; Object.assign(WT, { key: null, running: false, done: false, base: 0, rounds: 0 }); if (k) paintWt(k); }
// Écrit le résultat dans le champ Score du bloc
function wtScore() {
  const [sid, l] = WT.key.split(':'); const inp = document.getElementById(`f-wod-${sid}-${l}`);
  const v = WT.cfg.mode === 'amrap' ? `${WT.rounds} tours` : fmtSec(Math.floor(Math.max(0, WT.base)));
  if (inp) { inp.value = v; inp.dispatchEvent(new Event('input', { bubbles: true })); }
}
function wtFin() { if (WT.el() < 0) return; WT.base = Math.max(0, WT.el()); WT.running = false; WT.done = true; clearInterval(WT.tick); beep(1); wtScore(); paintWt(); }
function paintWt(k) {
  document.querySelectorAll('[data-wt-key]').forEach(b => {
    const key = b.dataset.wtKey; if (k && key !== k && key !== WT.key) return;
    const mine = WT.key === key; b.classList.toggle('running', mine && WT.running); b.classList.toggle('finished', mine && WT.done);
    b.querySelector('.emom-in').innerHTML = wtInner(key, mine ? WT.cfg : wtCfg(key));
  });
}

/* ── Minuteur de repos */
const REST = { total: 0, left: 0, running: false, label: '', endAt: 0, tick: null, finished: false, key: null };
function restTxt(sec) { return sec >= 60 && sec % 60 === 0 ? sec / 60 + ' min' : sec >= 60 ? fmtSec(sec) : sec + ' s'; }
// Ligne Récupération d'un exercice, avec son minuteur Go / Stop / Remise à zéro
function recupBox(key, sec, label, after) {
  const mine = REST.key === key && REST.total;
  const left = mine ? Math.ceil(REST.left) : sec;
  return `<div class="recup ${mine && REST.running ? 'running' : ''} ${mine && REST.finished ? 'finished' : ''}" data-rest-key="${esc(key)}" role="timer">
    <div class="recup-h"><span class="recup-l">Récupération ${esc(restTxt(sec))}${after ? ' après ce mouvement' : ''}</span><span class="recup-t num">${fmtSec(left)}</span></div>
    <div class="recup-b">
      <button class="btn primary" data-act="rest-go" data-key="${esc(key)}" data-sec="${sec}" data-label="${esc(label)}">${IC.play} Go</button>
      <button class="btn" data-act="rest-stop" data-key="${esc(key)}">${IC.pause} Stop</button>
      <button class="btn" data-act="rest-zero" data-key="${esc(key)}" aria-label="Remise à zéro">${IC.reset} RAZ</button>
    </div></div>`;
}
function paintRecup() {
  document.querySelectorAll('[data-rest-key]').forEach(b => {
    const mine = REST.key === b.dataset.restKey && REST.total;
    b.classList.toggle('running', !!(mine && REST.running)); b.classList.toggle('finished', !!(mine && REST.finished));
    const t = b.querySelector('.recup-t'); const go = b.querySelector('[data-act=rest-go]');
    if (mine && t) t.textContent = fmtSec(Math.ceil(REST.left));
    else if (t && go) t.textContent = fmtSec(+go.dataset.sec);
  });
}
function startRest(sec, label, key) {
  if (!sec) return;
  REST.key = key || null; REST.total = sec; REST.left = sec; REST.label = label; REST.finished = false; REST.running = true; REST.endAt = Date.now() + sec * 1000;
  runRest(); renderTimer();
}
function runRest() {
  clearInterval(REST.tick);
  REST.tick = setInterval(() => {
    if (!REST.running) return;
    REST.left = Math.max(0, (REST.endAt - Date.now()) / 1000);
    if (REST.left <= 0) { REST.running = false; REST.finished = true; clearInterval(REST.tick); beep(3); }
    renderTimer();
  }, 250);
}
function renderTimer() {
  let el = document.getElementById('timer');
  paintRecup();
  // le minuteur du bas ne s'affiche pas si la ligne Récupération correspondante est à l'écran
  const inline = REST.key && [...document.querySelectorAll('[data-rest-key]')].some(b => b.dataset.restKey === REST.key);
  if (!REST.total || inline) { if (el) el.remove(); return; }
  if (!el) { el = document.createElement('div'); el.id = 'timer'; el.setAttribute('role', 'timer'); document.body.appendChild(el); }
  el.className = 'timer' + (REST.finished ? ' finished' : '');
  el.innerHTML = `<i class="bar" style="width:${(1 - REST.left / REST.total) * 100}%"></i>
    <span class="big">${fmtSec(Math.ceil(REST.left))}</span>
    <span class="lbl">${REST.finished ? '<strong>Repos terminé</strong>' : 'Repos'}<br>${esc(REST.label)}</span>
    <button data-act="rest-plus" aria-label="Ajouter 15 secondes">+15</button>
    <button data-act="rest-toggle" aria-label="${REST.running ? 'Pause' : 'Reprendre'}">${REST.running ? IC.pause : IC.play}</button>
    <button data-act="rest-reset" aria-label="Réinitialiser">${IC.reset}</button>
    <button data-act="rest-close" aria-label="Fermer le minuteur">${IC.close}</button>`;
}

/* ── Chronomètre de maintien (planche, hollow…) */
const HOLD = { uid: null, start: 0, base: 0, tick: null, target: 0, beeped: false, ref: null, elapsed() { return this.base + (Date.now() - this.start) / 1000; } };
function toggleHold(ref) {
  const id = `${ref.sid}-${ref.key}-${ref.si}`;
  if (HOLD.uid === id) { // arrêt
    const v = Math.floor(HOLD.elapsed()); clearInterval(HOLD.tick); HOLD.uid = null;
    writeSet(ref, 'dur', v); return v;
  }
  if (HOLD.uid) toggleHold(HOLD.ref);
  HOLD.uid = id; HOLD.ref = ref; HOLD.start = Date.now(); HOLD.base = 0; HOLD.beeped = false; HOLD.target = Number(ref.target) || 0;
  HOLD.tick = setInterval(() => {
    const inp = document.getElementById('s-dur-' + id); const v = Math.floor(HOLD.elapsed());
    if (inp) inp.value = v;
    if (HOLD.target && !HOLD.beeped && v >= HOLD.target) { HOLD.beeped = true; beep(2); }
  }, 200);
  return null;
}

/* ── Dictée : reconnaissance vocale du navigateur si disponible, sinon micro du clavier. Texte relu avant ajout. */
const DICT = { target: null, rec: null, listening: false, text: '', error: '' };
function openDictation(targetId) {
  DICT.target = targetId; DICT.text = ''; DICT.error = ''; DICT.listening = false;
  UI.sheet = 'dict'; renderSheet();
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) { DICT.error = 'nosr'; renderSheet(); return; }
  try {
    const r = new SR(); r.lang = 'fr-FR'; r.interimResults = true; r.continuous = true;
    let finalTxt = '';
    r.onresult = ev => {
      let interim = '';
      for (let i = ev.resultIndex; i < ev.results.length; i++) { const t = ev.results[i][0].transcript; if (ev.results[i].isFinal) finalTxt += t + ' '; else interim += t; }
      DICT.text = (finalTxt + interim).trim(); const ta = document.getElementById('dict-text'); if (ta) ta.value = DICT.text;
    };
    r.onerror = e => { DICT.error = e.error === 'not-allowed' || e.error === 'service-not-allowed' ? 'denied' : 'fail'; DICT.listening = false; renderSheet(); };
    r.onend = () => { DICT.listening = false; renderSheet(); };
    DICT.rec = r; r.start(); DICT.listening = true; renderSheet();
  } catch (e) { DICT.error = 'fail'; renderSheet(); }
}
function stopDictation() { try { DICT.rec && DICT.rec.stop(); } catch (e) {} DICT.listening = false; }

function renderSheet() {
  let el = document.getElementById('sheet');
  if (!UI.sheet) { if (el) el.remove(); return; }
  if (!el) { el = document.createElement('div'); el.id = 'sheet'; el.className = 'scrim'; document.body.appendChild(el); }
  let inner = '';
  if (UI.sheet === 'dict') {
    const msg = DICT.error === 'nosr' ? 'La dictée du navigateur n’est pas disponible ici. Touche le champ ci-dessous puis le micro de ton clavier pour dicter.'
      : DICT.error === 'denied' ? 'Le micro est refusé sur cette page. Utilise le micro de ton clavier dans le champ ci-dessous.'
      : DICT.error ? 'La dictée s’est interrompue. Tu peux continuer avec le micro du clavier.' : '';
    inner = `<h3>Dicter un commentaire</h3>
      ${DICT.listening ? '<p class="rec">Écoute en cours…</p>' : ''}
      ${msg ? `<p class="small muted">${msg}</p>` : '<p class="small muted">Seul le texte est enregistré, jamais l’audio.</p>'}
      <label class="fld">Texte à relire avant ajout<textarea id="dict-text" rows="4">${esc(DICT.text)}</textarea></label>
      <div class="row" style="margin-top:.6rem">
        ${DICT.listening ? `<button class="btn" data-act="dict-stop">Arrêter l’écoute</button>` : ''}
        <span class="grow"></span>
        <button class="btn ghost" data-act="sheet-close">Annuler</button>
        <button class="btn primary" data-act="dict-add">Ajouter au commentaire</button>
      </div>`;
  } else if (UI.sheet && UI.sheet.startsWith('muscles:')) {
    inner = `<div class="row"><h3 class="grow" style="margin:0">Muscles · ${esc(sessLabel(SESSION_BY_ID[UI.sheet.slice(8)]))}</h3><button class="iconbtn" data-act="sheet-close" aria-label="Fermer">${IC.close}</button></div>` + sessionMusclePanel(UI.sheet.slice(8));
  } else if (UI.sheet === 'settings') {
    inner = `<h3>Affichage</h3>
      <h4>Thème</h4><div class="seg">${[['system', 'Système'], ['light', 'Clair'], ['dark', 'Sombre']].map(([v, l]) => `<button data-act="set-theme" data-v="${v}" aria-pressed="${S.settings.theme === v}">${l}</button>`).join('')}</div>
      <h4>Couleur</h4><div class="seg">${ACCENTS.map(([v, l]) => `<button data-act="set-accent" data-v="${v}" aria-pressed="${accentOf() === v}">${l}</button>`).join('')}</div>
      <h4>Taille du texte</h4><div class="seg">${[100, 125, 150].map(v => `<button data-act="set-size" data-v="${v}" aria-pressed="${(S.settings.size || 100) === v}">${v} %</button>`).join('')}</div>
      <h4>Signal sonore du minuteur</h4><div class="seg">${[[true, 'Activé'], [false, 'Coupé']].map(([v, l]) => `<button data-act="set-sound" data-v="${v}" aria-pressed="${(S.settings.sound !== false) === v}">${l}</button>`).join('')}</div>
      <h4>Programme</h4><div class="seg">${Object.keys(PROGRAMS).filter(k => DATA.base.cars[k]).map(k => `<button data-act="set-prog" data-v="${k}" aria-pressed="${programId() === k}">${PROGRAMS[k].label}</button>`).join('')}</div>
      <p class="small faint" style="margin:.3rem 0 0">Tes notes de chaque programme restent séparées.</p>
      ${AUTH.user ? `<h4>Compte</h4><div class="row"><span class="grow small">Connecté : <strong>${esc(AUTH.user.login)}</strong>${AUTH.user.role === 'admin' ? ' (administrateur)' : ''}</span><button class="btn small" data-act="logout">Se déconnecter</button></div>` : ''}
      <p class="small faint" style="margin-top:.6rem">Le bip retentit quand le navigateur l’autorise, après un premier geste sur la page. Le téléphone vibre aussi s’il le permet.</p>
      <div class="row" style="margin-top:.8rem"><span class="grow"></span><button class="btn primary" data-act="sheet-close">Fermer</button></div>`;
  } else if (UI.sheet === 'confirm:import' && UI.pendingImport) {
    inner = `<h3>Remplacer ${esc(UI.pendingImport.summary)} ?</h3><p>Le contenu actuel sera remplacé par celui du fichier. Une sauvegarde est faite juste avant : tu pourras la restaurer.</p>
      <div class="row" style="margin-top:.8rem"><span class="grow"></span><button class="btn ghost" data-act="sheet-close">Annuler</button><button class="btn danger" data-act="import-confirm">Remplacer</button></div>`;
  } else if (UI.sheet === 'confirm:snap') {
    const x = SNAPS.find(z => z.id === UI.pendingSnap);
    inner = `<h3>Restaurer la sauvegarde ?</h3><p>${x ? `Tu reviens à l’état du ${esc(fmtStamp(x.at))} (${esc(x.label)}).` : ''} L’état actuel est sauvegardé juste avant.</p>
      <div class="row" style="margin-top:.8rem"><span class="grow"></span><button class="btn ghost" data-act="sheet-close">Annuler</button><button class="btn primary" data-act="snap-restore">Restaurer</button></div>`;
  } else if (UI.sheet === 'reset') {
    const w = UI.resetWhat || 'all';
    const t = { progression: ['Vider ta progression ?', 'Séances notées, repères et préférences de mouvements sont effacés. Les réglages d’affichage restent.'],
      bib: ['Revenir à la bibliothèque d’origine ?', 'La bibliothèque importée est remplacée par la version d’origine.'],
      car: ['Revenir au carnet d’origine ?', 'Le carnet importé est remplacé par la version d’origine. Tes notes restent dans la progression.'],
      all: ['Tout remettre à zéro ?', 'Bibliothèque et carnet d’origine, progression vidée.'] }[w];
    inner = `<h3>${t[0]}</h3><p>${t[1]} Une sauvegarde est faite juste avant : tu pourras la restaurer.</p>
      <div class="row" style="margin-top:.8rem"><span class="grow"></span><button class="btn ghost" data-act="sheet-close">Annuler</button><button class="btn danger" data-act="reset-confirm">Remettre à zéro</button></div>`;
  }
  const keepText = document.getElementById('dict-text'); const typed = keepText ? keepText.value : null;
  el.innerHTML = `<div class="sheet" role="dialog" aria-modal="true">${inner}</div>`;
  if (typed != null && UI.sheet === 'dict') { const ta = document.getElementById('dict-text'); if (ta && !DICT.listening) ta.value = typed; }
}
