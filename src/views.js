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
      <div class="va">${esc(v.author || '')} · ${v.origin === 'catalogue' ? 'fiche du catalogue' : 'recherche YouTube'}, vérifiée le ${fmtDate(v.checkedAt)}</div>
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
  let h = `<div class="card" style="margin-top:1rem">
    <div class="row"><div class="grow"><div class="faint small" style="font-weight:700;text-transform:uppercase;letter-spacing:.08em">Reprise · Salle On Air</div>
    <div style="font-family:var(--f-display);font-size:1.5rem;font-weight:700;line-height:1.15"><span class="num">${doneCount}</span> / 20 séances terminées</div></div></div>
    <div class="progressbar" style="margin:.5rem 0"><i style="width:${doneCount / 20 * 100}%"></i></div>
    ${next ? `<button class="btn primary" data-act="open-session" data-id="${next.id}" style="width:100%;margin-top:.3rem">${sessionStatus(next.id) === 'started' ? 'Reprendre' : 'Prochaine séance'} : ${esc(sessLabel(next))}, ${esc(next.title)}</button>` : '<p class="muted">Programme terminé. Prévois une semaine plus légère avant le prochain bloc.</p>'}
  </div>
  <details class="more" style="margin-top:.8rem"><summary>${IC.chev} Principes et signaux d’arrêt</summary>
    <div class="card stack small">${PROGRAM_RULES.map(r => `<p style="margin:0">${esc(r)}</p>`).join('')}</div></details>`;
  const curC = UI.progCycle || (next ? next.cycle : 4);
  const c = CYCLES[curC - 1];
  const ss = SESSIONS.filter(s => s.cycle === c.n);
  h += `<div class="prog-layout">
    <nav class="cycle-rail" aria-label="Cycles">${CYCLES.map(cc => { const dd = SESSIONS.filter(s => s.cycle === cc.n && sessionStatus(s.id) === 'done').length;
      return `<button data-act="prog-cycle" data-v="${cc.n}" aria-pressed="${cc.n === curC}"><span class="cn">Cycle ${cc.n}</span><span class="cl">${esc(cc.name)}</span><span class="cd num">${dd}/5</span></button>`; }).join('')}</nav>
    <div class="prog-main">
      <div class="row"><h2 style="margin:0" class="grow">${esc(c.name)}</h2></div>
      <div class="row" style="margin:.3rem 0"><span class="pill">${esc(c.intensity)}</span><span class="pill">${esc(c.scheme)}</span></div>
      <div class="stack">${ss.map((s, i) => { const st = sessionStatus(s.id); const L = S.logs[s.id];
        return `<button class="listbtn sessbtn" data-act="open-session" data-id="${s.id}">
          <span class="slot ${st}">${i + 1}</span>
          <span class="grow"><span class="t">Séance ${i + 1} · ${esc(SESSION_TYPES[s.slot].label)}</span><br><span class="small muted">${esc(s.title)}</span><br><span class="small faint">${st === 'done' ? 'Terminée' : st === 'started' ? 'En cours' : 'À faire'}${L && L.date ? ' · ' + fmtDate(L.date) : ''}</span></span>
          <span class="chev">${IC.chev}</span></button>`; }).join('')}</div>
      <details class="more" style="margin-top:.7rem"><summary>${IC.chev} Objectif du cycle</summary>
        <p class="muted small">${esc(c.goal)}</p><p class="faint small">Suspension : ${esc(c.hang)}</p></details>
    </div></div>`;
  return h;
}

/* ── Écran Séance */
function presc(it) {
  const d = exDef(it.x);
  if (!it.sets) return esc(it.reps);
  if (d.unit === 'min' && it.sets === 1) return esc(it.reps);
  return `${it.sets} × ${esc(it.reps)}`;
}
function viewSession(sid) {
  const s = SESSION_BY_ID[sid]; const L = getLog(sid, false) || {};
  const cyc = CYCLES[s.cycle - 1];
  let h = `<p class="muted small" style="margin-top:.8rem">Cycle ${s.cycle} · ${esc(cyc.name)} · ${esc(cyc.intensity)}</p>
  <h2 style="margin-top:.2rem">${esc(s.title)}</h2>
  <div class="goal"><div class="goal-l">But de la séance</div><p>${esc(s.goal || '')}</p>${s.intro ? `<p class="muted small">${esc(s.intro)}</p>` : ''}</div>
  <div class="grid2" style="margin-top:.6rem">
    <label class="fld">Date de réalisation<input type="date" id="f-date-${sid}" data-in="sdate" data-sid="${sid}" value="${esc(L.date || '')}"></label>
    <label class="fld">État<button class="btn ${L.done ? 'primary' : ''}" data-act="sdone" data-sid="${sid}">${L.done ? IC.check + ' Séance terminée' : 'Marquer terminée'}</button></label>
  </div>
  <h3 id="sec-w" class="anchor">Mise en route · 10 min</h3>${warmList(s.warmup, sid + ':w')}`;
  s.blocks.forEach((bl, bi) => {
    if (bl.type === 'rest') { h += `<div class="restline">${esc(bl.title)}</div>`; return; }
    if (bl.type === 'wod') { h += wodBlock(s, bl); return; }
    const rounds = bl.rounds ? `${bl.type === 'superset' ? 'Superset' : 'Circuit'}, ${bl.rounds} tours` : '';
    h += `<div class="blockhead"><span class="letter">${esc(bl.l)}</span>${bl.title || rounds ? `<span class="bt">${esc(bl.title || '')}${bl.title && rounds ? ' · ' : ''}${esc(rounds)}</span>` : ''}</div>`;
    bl.items.forEach((it, i) => { h += exoCard(s, bl, it, i); });
  });
  h += `<h3 id="sec-c" class="anchor">Retour au calme · 5 min</h3>${warmList(s.cooldown, sid + ':c')}
  <h3 id="sec-b" class="anchor">Bilan de la séance</h3>
  <div class="card stack">
    <div class="grid2">
      <label class="fld">RPE global (1-10)<input type="number" inputmode="decimal" min="1" max="10" step="0.5" id="f-rpe-${sid}" data-in="srpe" data-sid="${sid}" value="${esc(L.rpe || '')}"></label>
      <label class="fld">Poignets<select id="f-wrist-${sid}" data-in="swrist" data-sid="${sid}">
        ${['', 'RAS', 'Gêne', 'Fourmillements'].map(o => `<option value="${o}" ${L.wrist === o ? 'selected' : ''}>${o || 'Non renseigné'}</option>`).join('')}</select></label>
    </div>
    ${L.wrist === 'Fourmillements' ? `<div class="callout"><strong>Signal d’arrêt.</strong> Passe à une variante sans prise (machine, sangles, avant-bras). Si ça persiste, parles-en au chirurgien ou au kiné.</div>` : ''}
    ${commentField('scomment', sid, '', L.comment, 'Commentaire de séance')}
  </div>`;
  const idx = SESSIONS.indexOf(s); const prev = SESSIONS[idx - 1], nxt = SESSIONS[idx + 1];
  const rail = sessionRail(s, L);
  h += `<div class="row" style="margin-top:1rem">
    ${prev ? `<button class="btn grow" data-act="open-session" data-id="${prev.id}">${IC.back} ${esc(sessLabel(prev))}</button>` : '<span class="grow"></span>'}
    ${nxt ? `<button class="btn grow" data-act="open-session" data-id="${nxt.id}">${esc(sessLabel(nxt))} ${IC.chev}</button>` : '<span class="grow"></span>'}</div>`;
  return `<div class="sess-layout">${rail}<div class="sess-main">${h}</div></div>`;
}
function muscleLine(d) {
  if (d.kind === 'mob') return '';
  const P = (d.p || []).map(g => `<span class="mtag p">${esc(MUSCLES[g])}</span>`).join('');
  const Sx = (d.s || []).map(g => `<span class="mtag s">${esc(MUSCLES[g])}</span>`).join('');
  const lbl = d.kind === 'tech' ? 'Technique' : d.kind === 'cardio' ? 'Cardio' : 'Principal';
  return `<div class="mline">${P ? `<span class="mlbl">${lbl}</span>${P}` : ''}${Sx ? `<span class="mlbl">Secondaire</span>${Sx}` : ''}${!P && !Sx ? `<span class="mlbl">Hors groupes suivis</span>` : ''}${d.off ? `<span class="mnote">${esc(d.off)}</span>` : ''}</div>`;
}
function sessionRail(s, L) {
  const items = [{ act: 'sess-muscles', t: 'Muscles', title: 'Répartition musculaire de la séance' }, { id: 'sec-w', t: 'Échauf.', title: 'Mise en route', done: false }];
  s.blocks.forEach(bl => {
    if (bl.type === 'rest') return;
    if (bl.type === 'wod') { const W = ((L.wod || {})[bl.l]) || {}; items.push({ id: `wod-${s.id}-${bl.l}`, t: bl.l, sub: 'WOD', title: bl.title, done: !!W.done }); return; }
    bl.items.forEach((it, i) => { const E = (L.ex || {})[itemKey(bl, i)];
      items.push({ id: `exo-${s.id}:${itemKey(bl, i)}`, t: bl.items.length > 1 ? bl.l + (i + 1) : bl.l, sub: shortName(E && E.swap ? exDef(E.swap).fr : itemLabel(it)), title: itemLabel(it), done: !!(E && E.done), skip: !!(E && E.skipped) }); });
  });
  items.push({ id: 'sec-c', t: 'Calme', title: 'Retour au calme' }, { id: 'sec-b', t: 'Bilan', title: 'Bilan de la séance', done: !!L.done });
  return `<nav class="sess-rail" aria-label="Exercices de la séance">${items.map(x => x.act ? `<button data-act="${x.act}" data-sid="${s.id}" class="musbtn" title="${esc(x.title)}" aria-label="${esc(x.title)}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="4.5" r="2.2"/><path d="M6 8.5h12M12 8.5v6M12 14.5l-3.5 7M12 14.5l3.5 7"/></svg><span class="rs">${esc(x.t)}</span></button>` : `<button data-act="jump" data-target="${esc(x.id)}" class="${x.done ? 'done' : ''} ${x.skip ? 'skip' : ''}" title="${esc(x.title)}" aria-label="${esc(x.title)}"><span class="rl">${esc(x.t)}</span>${x.sub ? `<span class="rs">${esc(x.sub)}</span>` : ''}</button>`).join('')}</nav>`;
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
  const eff = (E && E.swap) || it.x; const d = exDef(eff); const orig = exDef(it.x);
  const sets = E ? E.sets : Array.from({ length: Math.max(1, it.sets || 1) }, () => ({}));
  const hist = exHistory(eff).filter(hh => hh.sid !== s.id); const last = hist[hist.length - 1];
  const uid = s.id + ':' + key;
  const swapOpts = Object.entries(EXERCISES).filter(([k, v]) => v.kind !== 'mob' && v.kind !== 'wod' && k !== it.x);
  return `<div class="exo anchor ${E && E.done ? 'done' : ''} ${E && E.skipped ? 'skipped' : ''}" id="exo-${uid}">
    <div class="exo-title"><div class="grow">
      <div class="exo-name">${esc(E && E.swap ? d.fr : itemLabel(it))}</div>
      <div class="exo-en">${esc(d.en)}${E && E.swap ? ` · variante de ${esc(itemLabel(it))}` : ''}</div>
    </div><div class="presc num">${presc(it)}</div></div>
    ${muscleLine(d)}
    ${it.note ? `<div class="small muted">${esc(it.note)}</div>` : ''}
    ${(it.variant || d.variant) ? `<div class="variant">${esc(it.variant || d.variant)}</div>` : ''}
    ${it.rest ? `<div class="small faint">Récupération ${it.rest >= 60 && it.rest % 60 === 0 ? it.rest / 60 + ' min' : it.rest >= 60 ? fmtSec(it.rest) : it.rest + ' s'}${bl.type === 'superset' || bl.type === 'circuit' ? ' après ce mouvement' : ''}</div>` : ''}
    ${last ? `<div class="prev">Dernière fois (${esc(sessLabel(SESSION_BY_ID[last.sid]))}${last.date ? ', ' + fmtDate(last.date) : ''}) : ${esc(setSummary(d, last.sets))}</div>` : ''}
    ${E && E.skipped ? '<div class="small faint">Exercice non réalisé.</div>' : `<div class="sets">${sets.map((st, si) => setRow(s.id, key, it, d, st, si)).join('')}</div>`}
    <div class="exo-actions">
      <button class="btn small ghost" data-act="addset" data-sid="${s.id}" data-key="${key}" data-bi="${bl.l}" data-i="${i}">${IC.plus} Série</button>
      <button class="btn small ghost" data-act="delset" data-sid="${s.id}" data-key="${key}" data-bi="${bl.l}" data-i="${i}" ${sets.length <= 1 ? 'disabled' : ''}>${IC.minus} Série</button>
      <button class="btn small ${E && E.done ? 'primary' : ''}" data-act="exdone" data-sid="${s.id}" data-key="${key}" data-bi="${bl.l}" data-i="${i}">${E && E.done ? IC.check + ' Terminé' : 'Terminé'}</button>
    </div>
    <details class="more" ${UI.openMore === uid ? 'open' : ''} data-uid="${esc(uid)}"><summary>${IC.chev} Vidéo, commentaire, variante</summary>
      <div class="stack">
        ${videoBlock(eff, uid)}
        ${d.mv ? `<button class="btn small ghost" data-act="open-move" data-id="${d.mv}" style="justify-self:start">Fiche ${esc(MOVE_BY_ID[d.mv] ? MOVE_BY_ID[d.mv].name : d.en)}</button>` : ''}
        ${commentField('ecomment', s.id, key, E && E.comment, 'Commentaire', `data-bi="${bl.l}" data-i="${i}"`)}
        <label class="fld">Variante appliquée (allègement, gêne au poignet…)
          <select id="f-swap-${uid}" data-in="swap" data-sid="${s.id}" data-key="${key}" data-bi="${bl.l}" data-i="${i}">
            <option value="">Exercice prévu : ${esc(itemLabel(it))}</option>
            ${swapOpts.map(([k, v]) => `<option value="${k}" ${E && E.swap === k ? 'selected' : ''}>${esc(v.fr)}</option>`).join('')}
          </select></label>
        <button class="btn small ghost" data-act="skip" data-sid="${s.id}" data-key="${key}" data-bi="${bl.l}" data-i="${i}" style="justify-self:start">${E && E.skipped ? 'Rétablir l’exercice' : 'Exercice non réalisé'}</button>
      </div></details>
  </div>`;
}
function setRow(sid, key, it, d, st, si) {
  const id = `${sid}-${key}-${si}`; const a = `data-sid="${sid}" data-key="${key}" data-si="${si}" data-bi="${key.replace(/\d+$/, '')}" data-i="${key.match(/\d+$/)[0]}"`;
  const ph = firstNum(it.reps);
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
    ? `<label>Résultat<input type="text" id="s-res-${id}" data-in="set" data-f="res" ${a} value="${esc(st.res ?? '')}" placeholder="cal, m, FC"></label>`
    : `<label>Kg<input type="number" inputmode="decimal" step="0.5" id="s-load-${id}" data-in="set" data-f="load" ${a} value="${esc(st.load ?? '')}" placeholder="${d.load ? 'kg' : '—'}"></label>`;
  return `<div class="set ${st.done ? 'done' : ''}"><span class="idx">${si + 1}</span>${main}${second}
    <label>RPE<input type="number" inputmode="decimal" min="1" max="10" step="0.5" id="s-rpe-${id}" data-in="set" data-f="rpe" ${a} value="${esc(st.rpe ?? '')}"></label>
    <button class="checkbtn" data-act="setdone" ${a} aria-label="Valider la série ${si + 1}" aria-pressed="${!!st.done}">${IC.check}</button></div>`;
}
function commentField(kind, sid, key, val, label, extra) {
  const id = `c-${kind}-${sid}-${key}`;
  return `<label class="fld">${esc(label)}
    <textarea id="${id}" data-in="${kind}" data-sid="${sid}" data-key="${esc(key)}" data-bl="${esc(key)}" ${extra || ''} placeholder="Sensations, poignets, réglages de machine…">${esc(val || '')}</textarea></label>
    <button class="btn small ghost" data-act="dictate" data-target="${id}" style="justify-self:start">${IC.mic} Dicter</button>`;
}

/* ── Minuteur de repos */
const REST = { total: 0, left: 0, running: false, label: '', endAt: 0, tick: null, finished: false };
function startRest(sec, label) {
  if (!sec) return;
  REST.total = sec; REST.left = sec; REST.label = label; REST.finished = false; REST.running = true; REST.endAt = Date.now() + sec * 1000;
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
  if (!REST.total) { if (el) el.remove(); return; }
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
      <h4>Taille du texte</h4><div class="seg">${[100, 125, 150].map(v => `<button data-act="set-size" data-v="${v}" aria-pressed="${(S.settings.size || 100) === v}">${v} %</button>`).join('')}</div>
      <h4>Signal sonore du minuteur</h4><div class="seg">${[[true, 'Activé'], [false, 'Coupé']].map(([v, l]) => `<button data-act="set-sound" data-v="${v}" aria-pressed="${(S.settings.sound !== false) === v}">${l}</button>`).join('')}</div>
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
