/* Carnet On Air : Progression (avancement, repères, charges) et visualisation musculaire. */

/* Règle de calcul (conservée volontairement séparée) :
   1. Séries de renforcement où le groupe est moteur principal.
   2. Séries de sollicitation secondaire, assistance ou stabilisation.
   3. Travail technique (cleans), compté à part.
   4. Présence dans les séances cardio (nombre de séances, pas de séries).
   5. Présence dans les WODs (nombre de séances, sans inventer de séries).
   La mise en route et le retour au calme ne sont pas comptés. */
function computeMuscles(sids, adjusted) {
  const R = {};
  Object.keys(MUSCLES).forEach(g => R[g] = { p: 0, s: 0, hold: 0, tech: 0, wod: new Set(), cardio: new Set(), oP: {}, oS: {}, oT: {}, oW: {}, oC: {} });
  const add = (o, k, n) => { o[k] = (o[k] || 0) + n; };
  sids.forEach(sid => {
    const s = SESSION_BY_ID[sid]; const L = adjusted ? S.logs[sid] : null;
    s.blocks.forEach(bl => {
      if (bl.type === 'rest') return;
      (bl.items || []).forEach((it, i) => {
        const E = L && L.ex ? L.ex[itemKey(bl, i)] : null;
        if (adjusted && E && E.skipped) return;
        const eff = adjusted ? plannedEx(it, E, s.cycle) : machineEx(it.x, s.cycle); const d = exDef(eff);
        const lbl = eff !== it.x ? d.fr : itemLabel(it);
        const groups = [...new Set([...(d.p || []), ...(d.s || [])])];
        if (bl.type === 'wod') { groups.forEach(g => { R[g].wod.add(sid); add(R[g].oW, lbl, 1); }); return; }
        if (s.slot === 'CA' || d.kind === 'cardio') { groups.forEach(g => { R[g].cardio.add(sid); add(R[g].oC, lbl, 1); }); return; }
        const n = adjusted && E ? (E.sets || []).length : (it.sets || 0);
        if (d.kind === 'tech') { (d.p || []).forEach(g => { R[g].tech += n; add(R[g].oT, lbl, n); }); return; }
        (d.p || []).forEach(g => { R[g].p += n; if (d.unit === 'time') R[g].hold += n; add(R[g].oP, lbl + (d.unit === 'time' ? ' (maintien)' : ''), n); });
        (d.s || []).forEach(g => { R[g].s += n; add(R[g].oS, lbl, n); });
      });
    });
  });
  return R;
}
function muscleClass(r) {
  if (r.p) return 'm-p'; if (r.s) return 'm-s'; if (r.tech) return 'm-t'; if (r.wod.size || r.cardio.size) return 'm-w'; return 'm-0';
}
function scopeSessions() {
  if (UI.musScope === 'prog') return SESSIONS.map(s => s.id);
  if (UI.musScope === 'sess') return [UI.musSession];
  const c = Number(UI.musScope.slice(1)); return SESSIONS.filter(s => s.cycle === c).map(s => s.id);
}

/* Schéma original face / dos (formes simplifiées) */
const BODY_FRONT = {
  epa: ['<ellipse cx="63" cy="86" rx="15" ry="12"/>', '<ellipse cx="137" cy="86" rx="15" ry="12"/>'],
  pec: ['<path d="M98 76 L76 80 Q70 98 80 109 Q92 113 98 107 Z"/>', '<path d="M102 76 L124 80 Q130 98 120 109 Q108 113 102 107 Z"/>'],
  bic: ['<ellipse cx="55" cy="124" rx="9" ry="22"/>', '<ellipse cx="145" cy="124" rx="9" ry="22"/>'],
  abs: ['<rect x="84" y="114" width="32" height="68" rx="9"/>'],
  flex: ['<path d="M83 188 L97 188 L95 210 Z"/>', '<path d="M117 188 L103 188 L105 210 Z"/>'],
  quad: ['<ellipse cx="84" cy="254" rx="15" ry="44"/>', '<ellipse cx="116" cy="254" rx="15" ry="44"/>']
};
const BODY_BACK = {
  dos: ['<path d="M86 64 L114 64 L134 80 L127 140 Q113 168 100 172 Q87 168 73 140 L66 80 Z"/>'],
  epa: ['<ellipse cx="63" cy="86" rx="15" ry="12"/>', '<ellipse cx="137" cy="86" rx="15" ry="12"/>'],
  tri: ['<ellipse cx="55" cy="124" rx="9" ry="22"/>', '<ellipse cx="145" cy="124" rx="9" ry="22"/>'],
  fess: ['<ellipse cx="88" cy="202" rx="14" ry="17"/>', '<ellipse cx="112" cy="202" rx="14" ry="17"/>'],
  isch: ['<ellipse cx="85" cy="260" rx="13" ry="40"/>', '<ellipse cx="115" cy="260" rx="13" ry="40"/>'],
  mol: ['<ellipse cx="85" cy="332" rx="10" ry="28"/>', '<ellipse cx="115" cy="332" rx="10" ry="28"/>']
};
const BODY_BASE = `<circle class="base" cx="100" cy="36" r="20"/><rect class="base" x="92" y="54" width="16" height="12" rx="3"/>
  <path class="base" d="M70 72 Q100 62 130 72 L134 112 Q129 152 123 188 L77 188 Q71 152 66 112 Z"/>
  <rect class="base" x="76" y="184" width="48" height="30" rx="10"/>
  <ellipse class="base" cx="55" cy="124" rx="11" ry="25"/><ellipse class="base" cx="145" cy="124" rx="11" ry="25"/>
  <ellipse class="base" cx="49" cy="172" rx="8" ry="24"/><ellipse class="base" cx="151" cy="172" rx="8" ry="24"/>
  <circle class="base" cx="46" cy="202" r="7"/><circle class="base" cx="154" cy="202" r="7"/>
  <ellipse class="base" cx="84" cy="256" rx="17" ry="47"/><ellipse class="base" cx="116" cy="256" rx="17" ry="47"/>
  <ellipse class="base" cx="85" cy="334" rx="11" ry="34"/><ellipse class="base" cx="115" cy="334" rx="11" ry="34"/>
  <ellipse class="base" cx="83" cy="378" rx="11" ry="6"/><ellipse class="base" cx="117" cy="378" rx="11" ry="6"/>`;
function bodySvg(map, R, withDefs, label) {
  const parts = Object.entries(map).map(([g, shapes]) => {
    const cls = muscleClass(R[g]); const sel = UI.musSel;
    const extra = sel ? (sel === g ? ' sel' : ' dim') : '';
    return `<g class="m ${cls}${extra}" data-act="mus-sel" data-g="${g}" role="button" tabindex="0" aria-label="${esc(MUSCLES[g])}"><title>${esc(MUSCLES[g])}</title>${shapes.join('')}</g>`;
  }).join('');
  return `<svg class="body" viewBox="0 0 200 392" role="img" aria-label="${label}">
    ${withDefs ? '<defs><pattern id="hatch" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="5" height="5" fill="var(--amber-soft)"/><rect width="2" height="5" fill="var(--amber)"/></pattern></defs>' : ''}
    ${BODY_BASE}${parts}</svg>`;
}
function originsList(o) {
  const e = Object.entries(o); if (!e.length) return '<span class="faint">—</span>';
  return e.map(([k, n]) => `${esc(k)} <span class="num">(${n})</span>`).join(' · ');
}
function originsSessions(o) {
  const e = Object.keys(o); if (!e.length) return '<span class="faint">—</span>'; return e.map(esc).join(' · ');
}
function viewMuscles() {
  const sids = scopeSessions(); const R = computeMuscles(sids, UI.musAdj);
  const scopes = [['sess', 'Séance'], ['c1', 'Cycle 1'], ['c2', 'Cycle 2'], ['c3', 'Cycle 3'], ['c4', 'Cycle 4'], ['prog', 'Programme']];
  let h = `<h2 id="muscles">Répartition musculaire</h2>
  <div class="stack">
    <div class="seg" role="group" aria-label="Périmètre">${scopes.map(([v, l]) => `<button data-act="mus-scope" data-v="${v}" aria-pressed="${UI.musScope === v}">${l}</button>`).join('')}</div>
    ${UI.musScope === 'sess' ? `<select id="f-mus-sess" data-in="mus-sess">${SESSIONS.map(s => `<option value="${s.id}" ${UI.musSession === s.id ? 'selected' : ''}>${esc(sessLabel(s))} · ${esc(s.title)}</option>`).join('')}</select>` : ''}
    <div class="seg" role="group" aria-label="Version du programme">
      <button data-act="mus-adj" data-v="0" aria-pressed="${!UI.musAdj}">Programme prévu</button>
      <button data-act="mus-adj" data-v="1" aria-pressed="${UI.musAdj}">Avec mes ajustements</button></div>
  </div>
  <div class="card" style="margin-top:.6rem">
    <div class="bodywrap">
      <figure>${bodySvg(BODY_FRONT, R, true, 'Vue de face')}<figcaption>Face</figcaption></figure>
      <figure>${bodySvg(BODY_BACK, R, false, 'Vue de dos')}<figcaption>Dos</figcaption></figure>
    </div>
    <div class="legend" style="margin-top:.6rem">
      <span><i class="lp"></i>Moteur principal</span><span><i class="ls"></i>Secondaire seulement</span>
      <span><i class="lt"></i>Technique seulement</span><span><i class="lw"></i>Présent en WOD ou cardio</span><span><i class="l0"></i>Absent</span>
    </div>
    <p class="small faint" style="margin:.5rem 0 0">Touche un groupe pour l’isoler. Les couleurs indiquent la présence, pas une intensité mesurée.</p>
  </div>`;
  if (UI.musSel) {
    const g = UI.musSel; const r = R[g];
    h += `<div class="card stack" style="margin-top:.6rem">
      <div class="row"><h3 class="grow" style="margin:0">${esc(MUSCLES[g])}</h3><button class="btn small ghost" data-act="mus-sel" data-g="">Tout afficher</button></div>`;
    if (UI.musScope === 'prog') {
      h += `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Cycle</th><th class="n">Princ.</th><th class="n">Second.</th><th class="n">Tech.</th><th class="n">WOD</th><th class="n">Cardio</th></tr></thead><tbody>
        ${CYCLES.map(c => { const rc = computeMuscles(SESSIONS.filter(s => s.cycle === c.n).map(s => s.id), UI.musAdj)[g];
          return `<tr><td>C${c.n} ${esc(c.name)}</td><td class="n">${rc.p}${rc.hold ? ` <span class="faint">(${rc.hold} maint.)</span>` : ''}</td><td class="n">${rc.s}</td><td class="n">${rc.tech || '–'}</td><td class="n">${rc.wod.size ? rc.wod.size + ' séance' + (rc.wod.size > 1 ? 's' : '') : '–'}</td><td class="n">${rc.cardio.size ? rc.cardio.size + ' séance' + (rc.cardio.size > 1 ? 's' : '') : '–'}</td></tr>`; }).join('')}
        </tbody></table></div>`;
    }
    h += `<dl class="kv">
      <dt>Principal</dt><dd><strong class="num">${r.p} séries</strong>${r.hold ? ` dont ${r.hold} maintiens chronométrés` : ''}<div class="origins">${originsList(r.oP)}</div></dd>
      <dt>Secondaire</dt><dd><strong class="num">${r.s} séries</strong><div class="origins">${originsList(r.oS)}</div></dd>
      <dt>Technique</dt><dd><strong class="num">${r.tech} séries</strong><div class="origins">${originsList(r.oT)}</div></dd>
      <dt>WOD</dt><dd><strong class="num">${r.wod.size} séance${r.wod.size > 1 ? 's' : ''}</strong><div class="origins">${originsSessions(r.oW)}</div></dd>
      <dt>Cardio</dt><dd><strong class="num">${r.cardio.size} séance${r.cardio.size > 1 ? 's' : ''}</strong><div class="origins">${originsSessions(r.oC)}</div></dd>
    </dl></div>`;
  }
  h += `<h4>Détail par groupe</h4><p class="small faint" style="margin-top:0">Princ. et Second. : séries · WOD et Cardio : séances</p>
  <div class="tbl-wrap"><table class="tbl"><thead><tr><th>Groupe</th><th class="n">Princ.</th><th class="n">Second.</th><th class="n">Tech.</th><th class="n">WOD</th><th class="n">Cardio</th></tr></thead><tbody>
    ${Object.keys(MUSCLES).map(g => { const r = R[g];
      return `<tr class="clickable ${UI.musSel === g ? 'selrow' : ''}" data-act="mus-sel" data-g="${g}"><td>${esc(MUSCLES[g])}</td><td class="n">${r.p}</td><td class="n">${r.s}</td><td class="n">${r.tech || '–'}</td><td class="n">${r.wod.size || '–'}</td><td class="n">${r.cardio.size || '–'}</td></tr>`; }).join('')}
  </tbody></table></div>
  <div class="small muted stack" style="margin-top:.6rem">
    <p>Les colonnes ne s’additionnent pas : une série secondaire ne vaut pas une série principale. WOD et cardio comptent des séances où le groupe est présent, jamais des séries.</p>
    <p>Les vues décrivent le programme prévu${UI.musAdj ? ', corrigé de tes variantes, séries ajoutées ou retirées et exercices non réalisés' : ''}. Ce n’est ni le volume réellement effectué ni un tonnage. La mise en route et le retour au calme ne sont pas comptés.</p>
    <p>Classement principal / secondaire : convention du carnet, pas un diagnostic de déséquilibre. Adducteurs, avant-bras et prise ne font pas partie des groupes suivis.</p>
  </div>`;
  return h;
}

/* ── Progression */
function benchAuto(id) {
  const g = (sid, bl) => (((S.logs[sid] || {}).wod || {})[bl] || {}).score || '';
  const setRes = (sid, key) => { const e = ((S.logs[sid] || {}).ex || {})[key]; return e && e.sets && e.sets[0] ? (e.sets[0].res || '') : ''; };
  if (id === 'amrap12') return { c1: g('c1-wod', 'B'), c4: g('c4-wod', 'B') };
  if (id === 'row2k') return { c1: '', c4: setRes('c4-ca', 'B0') };
  return { c1: '', c4: '' };
}
/* Objectifs suivis sur tout le programme : résultat du test de chaque cycle (première série notée) */
function objectiveResults(o) {
  return CYCLES.map(c => {
    let v = '';
    SESSIONS.filter(s => s.cycle === c.n).forEach(s => s.blocks.forEach(bl => (bl.items || []).forEach((it, i) => {
      if (it.test !== o.id || v !== '') return;
      const e = ((S.logs[s.id] || {}).ex || {})[itemKey(bl, i)]; const st = e && e.sets && e.sets[0];
      if (st && st.reps !== '' && st.reps != null && (st.done || e.done)) v = Number(st.reps);
    })));
    return { n: c.n, v };
  });
}
function viewObjectives() {
  if (!OBJECTIVES.length) return '';
  return `<h2>Objectifs</h2><div class="stack">${OBJECTIVES.map(o => {
    const r = objectiveResults(o); const got = r.filter(x => x.v !== ''); const first = got[0], last = got[got.length - 1];
    const delta = got.length > 1 ? last.v - first.v : null;
    return `<div class="card stack"><div class="row"><strong class="grow">${esc(o.label)}</strong>${delta !== null ? `<span class="pill">${delta >= 0 ? '+' : ''}${delta} depuis le cycle ${first.n}</span>` : ''}</div>
      <div class="obj-grid">${r.map(x => `<div><span class="faint small">Cycle ${x.n}</span><strong class="num">${x.v === '' ? '—' : x.v}</strong></div>`).join('')}</div>
      ${sparkline(got.map(x => x.v))}
      <p class="small muted" style="margin:0">${esc(o.how)}</p></div>`; }).join('')}</div>`;
}
function sparkline(vals) {
  if (vals.length < 2) return '';
  const W = 300, H = 42, pad = 5; const mn = Math.min(...vals), mx = Math.max(...vals); const span = mx - mn || 1;
  const pts = vals.map((v, i) => [pad + i * (W - 2 * pad) / (vals.length - 1), H - pad - (v - mn) / span * (H - 2 * pad)]);
  const d = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');
  const last = pts[pts.length - 1];
  return `<svg class="spark" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-hidden="true"><path class="a" d="${d} L${last[0]} ${H} L${pts[0][0]} ${H} Z"/><path class="l" d="${d}"/><circle cx="${last[0]}" cy="${last[1]}" r="3.5"/></svg>`;
}
function viewProgression() {
  let h = `<h2>Avancement</h2><div class="stack">`;
  CYCLES.forEach(c => {
    const ss = SESSIONS.filter(s => s.cycle === c.n); const d = ss.filter(s => sessionStatus(s.id) === 'done').length;
    h += `<div class="card"><div class="row"><strong class="grow">Cycle ${c.n} · ${esc(c.name)}</strong><span class="num small">${d} / 5</span></div>
      <div class="progressbar" style="margin-top:.4rem"><i style="width:${d / 5 * 100}%"></i></div>
      <div class="row" style="margin-top:.5rem">${ss.map(s => `<button class="slot ${sessionStatus(s.id)}" data-act="open-session" data-id="${s.id}" style="border:0;cursor:pointer" aria-label="${esc(sessLabel(s))}">${esc(SESSION_TYPES[s.slot].label)}</button>`).join('')}</div></div>`;
  });
  h += `</div>${viewObjectives()}
  <h2>Repères</h2><p class="small muted">Section « Suivi » du programme. Les cases se remplissent seules quand le score est noté dans la séance correspondante ; tu peux aussi les saisir ici.</p>
  <div class="tbl-wrap"><table class="tbl"><thead><tr><th>Repère</th><th>Cycle 1</th><th>Cycle 4</th></tr></thead><tbody>
  ${BENCHMARKS.map(b => { const v = S.bench[b.id] || {}; const auto = benchAuto(b.id);
    return `<tr><td>${esc(b.label)}<div class="faint small">${esc(b.unit)}</div></td>
      <td><input type="text" id="b-${b.id}-c1" data-in="bench" data-b="${b.id}" data-c="c1" value="${esc(v.c1 || '')}" placeholder="${esc(auto.c1 || b.c1hint || '')}" aria-label="${esc(b.label)} cycle 1"></td>
      <td><input type="text" id="b-${b.id}-c4" data-in="bench" data-b="${b.id}" data-c="c4" value="${esc(v.c4 || '')}" placeholder="${esc(auto.c4 || b.c4hint || '')}" aria-label="${esc(b.label)} cycle 4"></td></tr>`; }).join('')}
  </tbody></table></div>
  <h2>Charges notées</h2>`;
  const rows = Object.keys(EXERCISES).filter(k => EXERCISES[k].load && ['force', 'gainage', 'tech'].includes(EXERCISES[k].kind)).map(k => ({ k, h: exHistory(k) })).filter(r => r.h.some(x => x.sets.some(s => Number(s.load))));
  if (!rows.length) h += `<div class="card empty">Aucune charge notée pour l’instant. Les charges saisies dans les séances apparaîtront ici, exercice par exercice.</div>`;
  else h += `<div class="stack">${rows.map(({ k, h: hist }) => {
      const pts = hist.map(x => ({ sid: x.sid, max: Math.max(...x.sets.map(s => Number(s.load) || 0)), date: x.date })).filter(p => p.max > 0);
      const lastP = pts[pts.length - 1]; const firstP = pts[0];
      return `<button class="listbtn" data-act="open-exo" data-id="${k}" style="display:block">
        <div class="row"><span class="t grow">${esc(EXERCISES[k].fr)}</span><span class="num"><strong>${lastP.max} kg</strong>${pts.length > 1 ? ` <span class="faint small">depuis ${firstP.max} kg</span>` : ''}</span></div>
        ${sparkline(pts.map(p => p.max))}
        <div class="small faint">${pts.map(p => esc(sessLabel(SESSION_BY_ID[p.sid])) + ' : ' + p.max + ' kg').join(' · ')}</div></button>`; }).join('')}</div>`;
  h += viewMuscles();
  return h;
}

/* Répartition musculaire d'une seule séance (fenêtre ouverte depuis la séance) */
function sessionMusclePanel(sid) {
  const R = computeMuscles([sid], UI.musAdj); const s = SESSION_BY_ID[sid];
  const rows = Object.keys(MUSCLES).filter(g => { const r = R[g]; return r.p || r.s || r.tech || r.wod.size || r.cardio.size; });
  const isW = s.slot === 'WOD', isC = s.slot === 'CA';
  let h = `<div class="seg" role="group" aria-label="Version" style="margin:.6rem 0">
      <button data-act="mus-adj" data-v="0" aria-pressed="${!UI.musAdj}">Prévu</button>
      <button data-act="mus-adj" data-v="1" aria-pressed="${UI.musAdj}">Avec mes ajustements</button></div>
    <div class="bodywrap">
      <figure>${bodySvg(BODY_FRONT, R, true, 'Vue de face')}<figcaption>Face</figcaption></figure>
      <figure>${bodySvg(BODY_BACK, R, false, 'Vue de dos')}<figcaption>Dos</figcaption></figure></div>
    <div class="legend" style="margin:.5rem 0"><span><i class="lp"></i>Principal</span><span><i class="ls"></i>Secondaire</span>${isW ? '<span><i class="lt"></i>Technique</span>' : ''}${isW || isC ? `<span><i class="lw"></i>${isC ? 'Cardio' : 'WOD'}</span>` : ''}</div>`;
  if (UI.musSel && R[UI.musSel]) {
    const r = R[UI.musSel];
    h += `<div class="card stack"><div class="row"><strong class="grow">${esc(MUSCLES[UI.musSel])}</strong><button class="btn small ghost" data-act="mus-sel" data-g="">Tout afficher</button></div>
      <dl class="kv small"><dt>Principal</dt><dd>${r.p} séries${r.hold ? ` (${r.hold} maintiens)` : ''}<div class="origins">${originsList(r.oP)}</div></dd>
      <dt>Secondaire</dt><dd>${r.s} séries<div class="origins">${originsList(r.oS)}</div></dd>
      ${r.tech ? `<dt>Technique</dt><dd>${r.tech} séries<div class="origins">${originsList(r.oT)}</div></dd>` : ''}
      ${r.wod.size ? `<dt>WOD</dt><dd>présent<div class="origins">${originsSessions(r.oW)}</div></dd>` : ''}
      ${r.cardio.size ? `<dt>Cardio</dt><dd>présent<div class="origins">${originsSessions(r.oC)}</div></dd>` : ''}</dl></div>`;
  }
  if (isW || isC) {
    h += `<p class="small muted">${isC ? 'Séance cardio' : 'WOD'} : les groupes sont marqués présents, sans nombre de séries.${isW ? ' Le travail technique (cleans) est compté à part.' : ''}</p>`;
  }
  h += `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Groupe</th><th class="n">Princ.</th><th class="n">Second.</th>${isW ? '<th class="n">Tech.</th><th class="n">WOD</th>' : ''}${isC ? '<th class="n">Cardio</th>' : ''}</tr></thead><tbody>
    ${rows.map(g => { const r = R[g]; return `<tr class="clickable ${UI.musSel === g ? 'selrow' : ''}" data-act="mus-sel" data-g="${g}"><td>${esc(MUSCLES[g])}</td><td class="n">${r.p || '–'}</td><td class="n">${r.s || '–'}</td>${isW ? `<td class="n">${r.tech || '–'}</td><td class="n">${r.wod.size ? 'oui' : '–'}</td>` : ''}${isC ? `<td class="n">${r.cardio.size ? 'oui' : '–'}</td>` : ''}</tr>`; }).join('')}
  </tbody></table></div>
  <p class="small faint">Séries prévues par groupe ; principal et secondaire ne s’additionnent pas. Mise en route et retour au calme non comptés. Groupes absents de la séance : ${Object.keys(MUSCLES).filter(g => !rows.includes(g)).map(g => MUSCLES[g]).join(', ') || 'aucun'}.</p>`;
  return h;
}
