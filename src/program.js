/* Programme de reprise – Salle On Air
   Source : /mnt/project-files/programme/programme-reprise-on-air.md
   Données structurées pour le carnet. Les classifications musculaires
   (principal / secondaire) sont des conventions explicites, pas une mesure. */

// Groupes musculaires suivis par la visualisation
const MUSCLES = {
  pec:  'Pectoraux',
  dos:  'Dos',
  epa:  'Épaules',
  bic:  'Biceps',
  tri:  'Triceps',
  abs:  'Abdominaux / gainage',
  quad: 'Quadriceps',
  isch: 'Ischio-jambiers',
  fess: 'Fessiers',
  mol:  'Mollets',
  flex: 'Fléchisseurs de hanche'
};

/* Bibliothèque d'exercices du programme.
   kind : force (séries de renforcement), gainage (renforcement du tronc, souvent maintiens),
          tech (travail technique), cardio (machine/course), wod (mouvement de WOD), mob (mobilité / étirement)
   unit : reps | time (maintien en s) | dist (m) | cal | min
   mv   : identifiant de la fiche du catalogue (nom anglais conservé), sinon null
   vid  : clé(s) de vidéos vérifiées hors catalogue (voir videos.js)
   p / s : groupes principaux / secondaires (convention du carnet)
   off  : muscles sollicités mais hors des 11 groupes suivis */
const EXERCISES = {
  // ── Jambes / gainage
  presse:      { fr: 'Presse à cuisses', en: 'Leg Press', mv: null, vid: ['presse'], kind: 'force', unit: 'reps', load: true, p: ['quad','fess'], s: ['isch'] },
  goblet:      { fr: 'Goblet squat', en: 'Goblet Squat', mv: 'goblet-squat', kind: 'force', unit: 'reps', load: true, p: ['quad','fess'], s: ['abs'] },
  stepup:      { fr: 'Step-up sur box', en: 'Box Step-up', mv: 'box-step-up', kind: 'force', unit: 'reps', load: true, p: ['quad','fess'], s: ['isch','mol'] },
  legext:      { fr: 'Leg extension', en: 'Leg Extension', mv: null, vid: ['legext'], kind: 'force', unit: 'reps', load: true, p: ['quad'], s: [] },
  legcurl_l:   { fr: 'Leg curl allongé', en: 'Lying Leg Curl', mv: null, vid: ['legcurl_l'], kind: 'force', unit: 'reps', load: true, p: ['isch'], s: ['mol'] },
  legcurl_s:   { fr: 'Leg curl assis', en: 'Seated Leg Curl', mv: null, vid: ['legcurl_s'], kind: 'force', unit: 'reps', load: true, p: ['isch'], s: [] },
  calf_mach:   { fr: 'Mollets à la machine', en: 'Calf Raise (machine)', mv: null, vid: ['calf_standing'], kind: 'force', unit: 'reps', load: true, p: ['mol'], s: [] },
  calf_stand:  { fr: 'Mollets debout', en: 'Standing Calf Raise', mv: null, vid: ['calf_standing'], kind: 'force', unit: 'reps', load: true, p: ['mol'], s: [] },
  calf_press:  { fr: 'Mollets à la presse', en: 'Leg Press Calf Raise', mv: null, vid: ['calf_press'], kind: 'force', unit: 'reps', load: true, p: ['mol'], s: [] },
  plank_fa:    { fr: 'Planche sur avant-bras', en: 'Plank Hold', mv: 'plank-hold', kind: 'gainage', unit: 'time', load: false, p: ['abs'], s: ['epa'], variant: 'Version sur avant-bras.' },
  plank_fist:  { fr: 'Planche sur les poings ou sur haltères', en: 'Plank Hold', mv: 'plank-hold', kind: 'gainage', unit: 'time', load: false, p: ['abs'], s: ['epa','tri'], variant: 'Appui sur les poings ou les haltères pour épargner les poignets.' },
  deadbug:     { fr: 'Dead bug', en: 'Dead Bug', mv: null, vid: ['deadbug'], kind: 'gainage', unit: 'reps', load: false, p: ['abs'], s: ['flex'] },
  side_plank:  { fr: 'Gainage latéral sur avant-bras', en: 'Side Plank', mv: null, vid: ['side_plank'], kind: 'gainage', unit: 'time', load: false, p: ['abs'], s: ['fess','epa'] },
  backsquat:   { fr: 'Back squat', en: 'Back Squat', mv: 'back-squat', kind: 'force', unit: 'reps', load: true, p: ['quad','fess'], s: ['isch','abs','dos'] },
  db_wlunge:   { fr: 'Fentes marchées aux haltères', en: 'Dumbbell Walking Lunge', mv: 'dumbbell-walking-lunge', kind: 'force', unit: 'reps', load: true, p: ['quad','fess'], s: ['isch','abs'] },
  hack:        { fr: 'Hack squat ou presse Hammer', en: 'Hack Squat', mv: null, vid: ['hack_squat'], kind: 'force', unit: 'reps', load: true, p: ['quad','fess'], s: [] },
  adductor:    { fr: 'Adducteurs machine', en: 'Hip Adduction (machine)', mv: null, vid: ['adductor'], kind: 'force', unit: 'reps', load: true, p: [], s: [], off: 'Adducteurs (groupe non suivi par le schéma)' },
  hollow:      { fr: 'Hollow hold', en: 'Hollow Hold', mv: 'hollow-hold', kind: 'gainage', unit: 'time', load: false, p: ['abs'], s: ['flex'] },
  pallof:      { fr: 'Pallof press à la poulie', en: 'Pallof Press', mv: null, vid: ['pallof'], kind: 'gainage', unit: 'reps', load: true, p: ['abs'], s: ['epa'] },
  frontsquat:  { fr: 'Front squat', en: 'Front Squat', mv: 'front-squat', kind: 'force', unit: 'reps', load: true, p: ['quad','fess'], s: ['abs','dos'] },
  bulgarian:   { fr: 'Split squat bulgare aux haltères', en: 'Bulgarian Split Squat', mv: 'bulgarian-split-squat', kind: 'force', unit: 'reps', load: true, p: ['quad','fess'], s: ['isch'] },
  t2b:         { fr: 'Toes-to-bar', en: 'Toes to Bar', mv: 'toes-to-bar', alt: 'knees-to-chest', kind: 'gainage', unit: 'reps', load: false, p: ['abs','flex'], s: ['dos'], variant: 'Début en genoux à la poitrine (Knees to Chest).' },
  shoulder_taps:{ fr: 'Planche avec touchers d’épaule, sur les poings', en: 'Plank Shoulder Taps', mv: null, vid: ['shoulder_taps'], kind: 'gainage', unit: 'reps', load: false, p: ['abs'], s: ['epa'] },
  russian_twist:{ fr: 'Russian twist avec disque', en: 'Russian Twist', mv: null, vid: ['russian_twist'], kind: 'gainage', unit: 'reps', load: true, p: ['abs'], s: ['flex'] },
  lunge_heavy: { fr: 'Fentes marchées avec barre ou haltères lourds', en: 'Lunges (Barbell)', mv: 'lunges-barbell', kind: 'force', unit: 'reps', load: true, p: ['quad','fess'], s: ['isch','abs'] },
  pistol_box:  { fr: 'Pistol squat sur box (assis-debout)', en: 'Pistol Squat', mv: 'pistol-squat', kind: 'force', unit: 'reps', load: false, p: ['quad','fess'], s: ['abs'], variant: 'Version assis-debout sur box, plus facile que le pistol complet de la vidéo.' },
  lsit:        { fr: 'L-sit sur parallettes', en: 'L-sit', mv: 'l-sit', kind: 'gainage', unit: 'time', load: false, p: ['abs','flex'], s: ['tri','epa'], variant: 'Genoux pliés autorisés.' },
  hollow_rock: { fr: 'Hollow rock', en: 'Hollow Rock', mv: null, vid: ['hollow_rock'], kind: 'gainage', unit: 'reps', load: false, p: ['abs'], s: ['flex'] },

  // ── Haut du corps
  iso_chest:   { fr: 'Développé couché Hammer iso-latéral', en: 'Iso-Lateral Chest Press', mv: null, vid: ['iso_chest_press'], kind: 'force', unit: 'reps', load: true, p: ['pec'], s: ['tri','epa'] },
  latpull:     { fr: 'Tirage poitrine prise neutre', en: 'Lat Pulldown', mv: null, vid: ['lat_pulldown'], kind: 'force', unit: 'reps', load: true, p: ['dos'], s: ['bic'] },
  db_seat_press:{ fr: 'Développé épaules haltères assis, prise neutre', en: 'Seated Dumbbell Shoulder Press', mv: null, vid: ['db_seated_press'], kind: 'force', unit: 'reps', load: true, p: ['epa'], s: ['tri'] },
  seated_row:  { fr: 'Rowing assis machine', en: 'Seated Row', mv: null, vid: ['seated_row'], kind: 'force', unit: 'reps', load: true, p: ['dos'], s: ['bic','epa'] },
  ringrow:     { fr: 'Ring row', en: 'Ring Row', mv: 'ring-row', kind: 'force', unit: 'reps', load: false, p: ['dos'], s: ['bic','abs'] },
  hammer_curl: { fr: 'Curl marteau haltères', en: 'Hammer Curl', mv: null, vid: ['hammer_curl'], kind: 'force', unit: 'reps', load: true, p: ['bic'], s: [] },
  rope_pd:     { fr: 'Extension triceps à la poulie, corde', en: 'Triceps Rope Pushdown', mv: null, vid: ['rope_pushdown'], kind: 'force', unit: 'reps', load: true, p: ['tri'], s: [] },
  face_pull:   { fr: 'Face pull à la poulie', en: 'Face Pull', mv: null, vid: ['face_pull'], kind: 'force', unit: 'reps', load: true, p: ['epa'], s: ['dos'] },
  bench:       { fr: 'Développé couché barre', en: 'Bench Press', mv: 'bench-press', kind: 'force', unit: 'reps', load: true, p: ['pec'], s: ['tri','epa'] },
  banded_pu:   { fr: 'Tractions avec élastique', en: 'Band-Assisted Pull-up', mv: null, vid: ['banded_pullup'], kind: 'force', unit: 'reps', load: false, p: ['dos'], s: ['bic'] },
  db_stand_press:{ fr: 'Développé militaire haltères debout', en: 'Standing Dumbbell Shoulder Press', mv: null, vid: ['db_standing_press'], kind: 'force', unit: 'reps', load: true, p: ['epa'], s: ['tri','abs'] },
  bor:         { fr: 'Rowing barre penché', en: 'Bent Over Row', mv: 'bent-over-row', kind: 'force', unit: 'reps', load: true, p: ['dos'], s: ['bic','epa'] },
  pushup_par:  { fr: 'Pompes sur parallettes ou haltères', en: 'Push-up', mv: 'push-up', kind: 'force', unit: 'reps', load: false, p: ['pec'], s: ['tri','epa','abs'], variant: 'Appui sur parallettes ou haltères (poignets neutres).' },
  ez_curl:     { fr: 'Curl biceps barre EZ', en: 'EZ Bar Curl', mv: null, vid: ['ez_curl'], kind: 'force', unit: 'reps', load: true, p: ['bic'], s: [] },
  dip_assist:  { fr: 'Dips assistés à la machine', en: 'Assisted Dip', mv: null, vid: ['assisted_dip'], kind: 'force', unit: 'reps', load: true, p: ['tri','pec'], s: ['epa'] },
  lat_raise:   { fr: 'Élévations latérales haltères', en: 'Lateral Raise', mv: null, vid: ['lateral_raise'], kind: 'force', unit: 'reps', load: true, p: ['epa'], s: [] },
  strict_press:{ fr: 'Développé militaire barre (strict press)', en: 'Strict Press', mv: 'strict-press', kind: 'force', unit: 'reps', load: true, p: ['epa'], s: ['tri','abs'] },
  strict_pu:   { fr: 'Tractions strictes', en: 'Strict Pull-up', mv: 'strict-pull-up', kind: 'force', unit: 'reps', load: true, p: ['dos'], s: ['bic'] },
  incline_db:  { fr: 'Développé incliné haltères', en: 'Incline Dumbbell Press', mv: null, vid: ['incline_db_press'], kind: 'force', unit: 'reps', load: true, p: ['pec'], s: ['epa','tri'] },
  pendlay:     { fr: 'Pendlay row barre', en: 'Pendlay Row', mv: 'pendlay-row', kind: 'force', unit: 'reps', load: true, p: ['dos'], s: ['bic','epa'] },
  dips:        { fr: 'Dips aux anneaux assistés ou barres parallèles', en: 'Dip', mv: 'dip', kind: 'force', unit: 'reps', load: false, p: ['tri','pec'], s: ['epa'] },
  incline_curl:{ fr: 'Curl incliné haltères', en: 'Incline Dumbbell Curl', mv: null, vid: ['incline_curl'], kind: 'force', unit: 'reps', load: true, p: ['bic'], s: [] },
  skull:       { fr: 'Skull crusher barre EZ', en: 'Skull Crusher', mv: null, vid: ['skull_crusher'], kind: 'force', unit: 'reps', load: true, p: ['tri'], s: [] },
  push_press:  { fr: 'Push press', en: 'Push Press', mv: 'push-press', kind: 'force', unit: 'reps', load: true, p: ['epa'], s: ['tri','quad','fess'] },
  ring_dips:   { fr: 'Ring dips (ou dips barres)', en: 'Ring Dip', mv: 'ring-dip', kind: 'force', unit: 'reps', load: false, p: ['tri','pec'], s: ['epa','abs'] },

  // ── Chaîne postérieure / portés
  db_rdl:      { fr: 'Soulevé de terre roumain aux haltères', en: 'Dumbbell Romanian Deadlift', mv: null, vid: ['db_rdl'], kind: 'force', unit: 'reps', load: true, p: ['isch','fess'], s: ['dos'] },
  hipthrust:   { fr: 'Hip thrust', en: 'Hip Thrust', mv: 'hip-thrust', kind: 'force', unit: 'reps', load: true, p: ['fess'], s: ['isch'] },
  db_row:      { fr: 'Rowing un bras haltère, appui sur banc', en: 'One-Arm Dumbbell Row', mv: null, vid: ['db_row'], kind: 'force', unit: 'reps', load: true, p: ['dos'], s: ['bic'] },
  back_ext:    { fr: 'Extensions lombaires au banc à 45°', en: 'Back Extension', mv: 'back-extension', vid: ['back_ext_45'], kind: 'force', unit: 'reps', load: true, p: ['fess','isch'], s: ['dos'], variant: 'La vidéo du catalogue montre la version au GHD ; le programme utilise le banc à 45°.' },
  shrug:       { fr: 'Shrugs aux haltères', en: 'Dumbbell Shrug', mv: null, vid: ['db_shrug'], kind: 'force', unit: 'reps', load: true, p: ['dos'], s: [], off: 'Trapèzes (comptés dans « Dos »)' },
  farmer:      { fr: 'Farmer’s carry', en: 'Farmers Carry', mv: 'farmers-carry', kind: 'force', unit: 'dist', load: true, p: ['dos'], s: ['abs','fess','quad'], off: 'Avant-bras et prise (non suivis) ; trapèzes comptés dans « Dos »' },
  bird_dog:    { fr: 'Bird dog, mains sur poings', en: 'Bird Dog', mv: null, vid: ['bird_dog'], kind: 'gainage', unit: 'reps', load: false, p: ['abs'], s: ['fess','dos'] },
  deadlift:    { fr: 'Soulevé de terre barre', en: 'Deadlift', mv: 'deadlift', kind: 'force', unit: 'reps', load: true, p: ['isch','fess','dos'], s: ['quad','abs'] },
  iso_row:     { fr: 'Rowing iso-latéral Hammer', en: 'Iso-Lateral Row', mv: null, vid: ['iso_row'], kind: 'force', unit: 'reps', load: true, p: ['dos'], s: ['bic'] },
  good_morning:{ fr: 'Good morning barre légère', en: 'Good Morning', mv: 'good-morning', kind: 'force', unit: 'reps', load: true, p: ['isch'], s: ['fess','dos'] },
  kb_swing_ru: { fr: 'Kettlebell swing russe', en: 'Russian Kettlebell Swing', mv: 'russian-kettlebell-swing', kind: 'force', unit: 'reps', load: true, p: ['fess','isch'], s: ['dos','abs','epa'] },
  rdl:         { fr: 'Soulevé de terre roumain barre', en: 'Romanian Deadlift', mv: 'romanian-deadlift', kind: 'force', unit: 'reps', load: true, p: ['isch','fess'], s: ['dos'] },
  suitcase:    { fr: 'Suitcase carry (un bras)', en: 'Suitcase Carry', mv: null, vid: ['suitcase_carry'], kind: 'force', unit: 'dist', load: true, p: ['abs'], s: ['dos','fess'], off: 'Prise (non suivie)' },
  superman:    { fr: 'Superman', en: 'Superman', mv: null, vid: ['superman'], kind: 'force', unit: 'reps', load: false, p: ['dos'], s: ['fess','isch'] },
  tgu:         { fr: 'Turkish get-up', en: 'Turkish Get-Up', mv: 'turkish-get-up', kind: 'force', unit: 'reps', load: true, p: ['epa','abs'], s: ['fess','tri','quad'] },
  kb_rack_carry:{ fr: 'Kettlebell en position rack ou overhead (porté)', en: 'Kettlebell Rack / Overhead Carry', mv: null, vid: ['kb_rack_carry'], kind: 'force', unit: 'dist', load: true, p: ['abs','epa'], s: ['dos'] },

  // ── Technique (cleans)
  hpc:         { fr: 'Hang power clean', en: 'Hang Power Clean', mv: 'hang-power-clean', alt: 'dumbbell-hang-clean', kind: 'tech', unit: 'reps', load: true, p: ['quad','fess','isch','dos','epa'], s: [] },
  power_clean: { fr: 'Power clean (ou kettlebell clean)', en: 'Power Clean', mv: 'power-clean', alt: 'kettlebell-clean', kind: 'tech', unit: 'reps', load: true, p: ['quad','fess','isch','dos','epa'], s: [] },

  // ── Cardio et mouvements de WOD
  rower:       { fr: 'Rameur', en: 'Row', mv: 'row', kind: 'cardio', unit: 'min', load: false, p: ['quad','dos','isch','fess'], s: ['bic','abs'] },
  assault:     { fr: 'Assault bike', en: 'Bike (Assault/Echo)', mv: 'bike-assault-echo', kind: 'cardio', unit: 'min', load: false, p: ['quad','fess'], s: ['epa','dos','isch'] },
  skierg:      { fr: 'SkiErg', en: 'Ski Erg', mv: 'ski-erg', kind: 'cardio', unit: 'min', load: false, p: ['dos','tri'], s: ['abs','epa','fess'] },
  bike:        { fr: 'Vélo', en: 'Stationary Bike', mv: null, vid: ['upright_bike'], kind: 'cardio', unit: 'min', load: false, p: ['quad','fess'], s: ['isch','mol'] },
  incline_walk:{ fr: 'Tapis, marche inclinée', en: 'Incline Treadmill Walk', mv: null, vid: ['incline_walk'], kind: 'cardio', unit: 'min', load: false, p: ['fess','mol','quad'], s: ['isch'] },
  stairs:      { fr: 'Escalier', en: 'Stair Climber', mv: null, vid: ['stair_climber'], kind: 'cardio', unit: 'min', load: false, p: ['quad','fess','mol'], s: ['isch'] },
  run:         { fr: 'Course légère', en: 'Run', mv: 'run', kind: 'cardio', unit: 'min', load: false, p: ['quad','mol','isch'], s: ['fess','flex'] },
  kb_dl:       { fr: 'Deadlift kettlebell', en: 'Kettlebell Deadlift', mv: null, vid: ['kb_deadlift'], kind: 'wod', unit: 'reps', load: true, p: ['isch','fess'], s: ['dos','quad'] },
  wallball:    { fr: 'Wall balls', en: 'Wall Ball', mv: 'wall-ball', kind: 'wod', unit: 'reps', load: true, p: ['quad','fess','epa'], s: ['tri','abs'] },
  kb_swing_am: { fr: 'Kettlebell swing américain', en: 'American Kettlebell Swing', mv: 'american-kettlebell-swing', kind: 'wod', unit: 'reps', load: true, p: ['fess','isch'], s: ['epa','dos','abs'] },
  devil:       { fr: 'Devil press léger', en: 'Devil Press', mv: 'devil-press', kind: 'wod', unit: 'reps', load: true, p: ['fess','isch','epa'], s: ['pec','tri','quad','abs'] },
  db_thruster: { fr: 'Thrusters haltères', en: 'Dumbbell Thruster', mv: 'dumbbell-thruster', kind: 'wod', unit: 'reps', load: true, p: ['quad','fess','epa'], s: ['tri','abs'] },
  box_stepover:{ fr: 'Box step-overs', en: 'Dumbbell Box Step Over', mv: 'dumbbell-box-step-over', kind: 'wod', unit: 'reps', load: false, p: ['quad','fess'], s: ['mol'], variant: 'Le programme les prévoit sans haltères ; la vidéo montre la version avec haltères.' },
  single_under:{ fr: 'Corde à sauter (single unders)', en: 'Single Under', mv: 'single-under', kind: 'wod', unit: 'reps', load: false, p: ['mol'], s: ['quad','epa'] },
  double_under:{ fr: 'Double unders', en: 'Double Under', mv: 'double-under', kind: 'wod', unit: 'reps', load: false, p: ['mol'], s: ['quad','epa','abs'] },
  db_snatch:   { fr: 'Dumbbell snatch alterné', en: 'Dumbbell Snatch', mv: 'dumbbell-snatch', kind: 'wod', unit: 'reps', load: true, p: ['fess','isch','epa'], s: ['quad','dos','abs'] },
  burpee:      { fr: 'Burpees sur les poings ou sur haltères', en: 'Burpee', mv: 'burpee', kind: 'wod', unit: 'reps', load: false, p: ['pec','quad'], s: ['tri','epa','abs','fess'], variant: 'Appui sur les poings ou sur haltères, pas main à plat.' },
  thruster:    { fr: 'Thrusters (barre ou haltères)', en: 'Thruster', mv: 'thruster', kind: 'wod', unit: 'reps', load: true, p: ['quad','fess','epa'], s: ['tri','abs'] },
  pullup_wod:  { fr: 'Tractions (élastique) ou jumping pull-ups', en: 'Pull-up', mv: 'pull-up', vid: ['jumping_pullup'], kind: 'wod', unit: 'reps', load: false, p: ['dos'], s: ['bic'], variant: 'La vidéo du catalogue présente la traction stricte.' },
  ringrow_wod: { fr: 'Tractions avec élastique ou ring rows', en: 'Ring Row', mv: 'ring-row', vid: ['banded_pullup'], kind: 'wod', unit: 'reps', load: false, p: ['dos'], s: ['bic'] },
  goblet_wod:  { fr: 'Goblet squat', en: 'Goblet Squat', mv: 'goblet-squat', kind: 'wod', unit: 'reps', load: true, p: ['quad','fess'], s: ['abs'] },
  stepup_wod:  { fr: 'Step-up sur box', en: 'Box Step-up', mv: 'box-step-up', kind: 'wod', unit: 'reps', load: false, p: ['quad','fess'], s: ['isch','mol'] },
  plank_wod:   { fr: 'Planche sur avant-bras', en: 'Plank Hold', mv: 'plank-hold', kind: 'wod', unit: 'time', load: false, p: ['abs'], s: ['epa'] },
  kb_swing_wod:{ fr: 'Kettlebell swings russes', en: 'Russian Kettlebell Swing', mv: 'russian-kettlebell-swing', kind: 'wod', unit: 'reps', load: true, p: ['fess','isch'], s: ['dos','abs','epa'] },
  rower_wod:   { fr: 'Rameur', en: 'Row', mv: 'row', kind: 'wod', unit: 'cal', load: false, p: ['quad','dos','isch','fess'], s: ['bic','abs'] },
  assault_wod: { fr: 'Assault bike', en: 'Bike (Assault/Echo)', mv: 'bike-assault-echo', kind: 'wod', unit: 'cal', load: false, p: ['quad','fess'], s: ['epa','dos','isch'] },
  skierg_wod:  { fr: 'SkiErg', en: 'Ski Erg', mv: 'ski-erg', kind: 'wod', unit: 'cal', load: false, p: ['dos','tri'], s: ['abs','epa','fess'] },

  // ── Mise en route et retour au calme
  wrist_routine:{ fr: 'Routine poignets (2 min)', en: 'Wrist & tendon gliding routine', mv: null, vid: ['tendon_glides','wrist_mobility'], kind: 'mob', desc: 'Cercles de poignets, flexion/extension douce en appui sur une table ou un banc (pas au sol au cycle 1), glissements tendineux des doigts (poing, crochet, main à plat), 10 ouvertures/fermetures de main.' },
  air_squat:   { fr: 'Squats à l’air', en: 'Air Squat', mv: 'air-squat', kind: 'mob' },
  reverse_lunge:{ fr: 'Fentes arrière alternées', en: 'Reverse Lunge', mv: null, vid: ['reverse_lunge'], kind: 'mob' },
  walk_lunge:  { fr: 'Fentes marchées', en: 'Walking Lunges', mv: 'walking-lunges', kind: 'mob' },
  glute_bridge:{ fr: 'Ponts fessiers', en: 'Glute Bridge', mv: null, vid: ['glute_bridge'], kind: 'mob' },
  ankle_mob:   { fr: 'Mobilité des chevilles (rotations, au mur)', en: 'Ankle Mobility', mv: null, vid: ['ankle_mobility'], kind: 'mob' },
  leg_swings:  { fr: 'Balancés de jambes', en: 'Leg Swings', mv: null, vid: ['leg_swings'], kind: 'mob' },
  hip_opener:  { fr: 'Ouverture de hanche, fentes dynamiques', en: 'Dynamic Hip Opener', mv: null, vid: ['hip_opener'], kind: 'mob' },
  shoulder_band:{ fr: 'Rotations d’épaules à l’élastique, dislocations au bâton', en: 'Shoulder Dislocates', mv: null, vid: ['shoulder_band_rot'], kind: 'mob' },
  band_pull:   { fr: 'Band pull-aparts', en: 'Band Pull-Apart', mv: null, vid: ['band_pull_apart'], kind: 'mob' },
  dead_hang:   { fr: 'Dead hang (suspension)', en: 'Dead Hang', mv: 'dead-hang', kind: 'mob' },
  scap_pullup: { fr: 'Scapular pull-ups', en: 'Scapular Pull-up', mv: null, vid: ['scap_pullup'], kind: 'mob' },
  active_hang: { fr: 'Active hang', en: 'Active Hang', mv: null, vid: ['active_hang'], kind: 'mob' },
  gm_stick:    { fr: 'Good mornings au bâton', en: 'Good Morning', mv: 'good-morning', kind: 'mob', variant: 'Au bâton, sans charge.' },
  cat_cow:     { fr: 'Cat-cow', en: 'Cat-Cow', mv: null, vid: ['cat_cow'], kind: 'mob' },
  hip_hinge:   { fr: 'Hip hinge au mur', en: 'Hip Hinge Drill', mv: null, vid: ['hip_hinge'], kind: 'mob' },
  incline_pushup:{ fr: 'Pompes inclinées sur la barre au rack', en: 'Incline Push-up', mv: null, vid: ['incline_pushup'], kind: 'mob' },
  kb_swing_light:{ fr: 'Kettlebell swings légers', en: 'Russian Kettlebell Swing', mv: 'russian-kettlebell-swing', kind: 'mob' },
  st_quad:     { fr: 'Étirement des quadriceps', en: 'Quad Stretch', mv: null, vid: ['stretch_quad'], kind: 'mob' },
  st_hipflex:  { fr: 'Étirement des fléchisseurs de hanche (psoas)', en: 'Hip Flexor Stretch', mv: null, vid: ['stretch_hipflexor'], kind: 'mob' },
  st_calf:     { fr: 'Étirement des mollets', en: 'Calf Stretch', mv: null, vid: ['stretch_calf'], kind: 'mob' },
  st_ham:      { fr: 'Étirement des ischios', en: 'Hamstring Stretch', mv: null, vid: ['stretch_hamstring'], kind: 'mob' },
  st_pec:      { fr: 'Étirement des pectoraux contre le mur', en: 'Wall Chest Stretch', mv: null, vid: ['stretch_pec'], kind: 'mob' },
  st_lat:      { fr: 'Étirement des dorsaux', en: 'Lat Stretch', mv: null, vid: ['stretch_lat'], kind: 'mob' },
  st_tri:      { fr: 'Étirement des triceps', en: 'Triceps Stretch', mv: null, vid: ['stretch_triceps'], kind: 'mob' },
  st_forearm:  { fr: 'Étirement des avant-bras (doux, sans forcer sur la cicatrice)', en: 'Forearm Stretch', mv: null, vid: ['stretch_forearm'], kind: 'mob' },
  child_pose:  { fr: 'Posture de l’enfant (dos)', en: 'Child’s Pose', mv: null, vid: ['child_pose'], kind: 'mob' },
  st_glute:    { fr: 'Étirement des fessiers', en: 'Figure-Four Glute Stretch', mv: null, vid: ['stretch_glute'], kind: 'mob' },
  st_add:      { fr: 'Étirement des adducteurs', en: 'Adductor Stretch', mv: null, vid: ['stretch_adductor'], kind: 'mob' }
};

const CYCLES = [
  { n: 1, name: 'Reprise', intensity: 'RPE 6, 3-4 RIR', scheme: '3 × 12-15, tempo contrôlé', goal: 'Réhabituer tendons et articulations, retrouver les gestes, noter les charges de départ. Aucune série à l’échec.',
    hang: 'Dead hang 3 × 10-15 s, prise large et relâchée · Ring row pieds loin, tirage poitrine machine' },
  { n: 2, name: 'Construction', intensity: 'RPE 7, 2-3 RIR', scheme: '4 × 10-12', goal: 'Retour progressif de la barre, plus de volume, introduction de mouvements CrossFit simples.',
    hang: 'Dead hang 3 × 20-30 s · Ring row plus horizontal, tractions avec élastique' },
  { n: 3, name: 'Développement', intensity: 'RPE 7-8, 2 RIR', scheme: '4-5 × 6-8', goal: 'Monter en charge sur les mouvements de base, réintroduire la gymnastique stricte et un peu d’haltérophilie légère si les poignets le permettent.',
    hang: 'Dead hang 3 × 30-40 s, puis active hang · Tractions strictes (élastique léger si besoin)' },
  { n: 4, name: 'Consolidation', intensity: 'RPE 8, 1-2 RIR', scheme: '5 × 5 + travail de volume', goal: 'Retrouver des séances CrossFit complètes, consolider les charges et mesurer les progrès (retests).',
    hang: 'Dead hang 2 × 45 s + scapular pull-ups · Tractions strictes, kipping léger si tout va bien' }
];

const SESSION_TYPES = {
  R1: { label: 'R1', name: 'Jambes dominante genou + gainage', type: 'force' },
  CA: { label: 'Cardio', name: 'Cardio', type: 'cardio' },
  R2: { label: 'R2', name: 'Haut du corps pousser / tirer', type: 'force' },
  WOD:{ label: 'WOD', name: 'WOD', type: 'wod' },
  R3: { label: 'R3', name: 'Chaîne postérieure + dos + portés', type: 'force' }
};

/* Aide à l'écriture : ex(clé, séries, reps, repos en s, options) */
function ex(x, sets, reps, rest, o) { return Object.assign({ x, sets, reps: String(reps), rest }, o || {}); }
function w(t, xs) { return { t, x: xs || [] }; }

const SESSIONS = [
  // ═════════════ CYCLE 1
  { id: 'c1-r1', cycle: 1, slot: 'R1', title: 'Jambes dominante genou + gainage',
    warmup: [ w('5 min vélo, allure facile puis modérée', ['bike']),
              w('10 squats à l’air lents, 10 fentes arrière alternées, 10 ponts fessiers, rotations de chevilles, 1 série légère de presse', ['air_squat','reverse_lunge','glute_bridge','ankle_mob']) ],
    blocks: [
      { l: 'A', items: [ ex('presse', 3, 15, 90, { note: 'Machine guidée ou Hammer · tempo 3 s à la descente' }) ] },
      { l: 'B', items: [ ex('goblet', 3, 12, 90, { note: 'Kettlebell tenue par les cornes, poignets neutres' }) ] },
      { l: 'C', items: [ ex('stepup', 3, '10/jambe', 60, { note: 'Box ~50 cm, sans charge puis haltères légers' }) ] },
      { l: 'D', type: 'superset', rounds: 3, items: [ ex('legext', 3, 15, 0), ex('legcurl_l', 3, 15, 60) ] },
      { l: 'E', items: [ ex('calf_mach', 3, '15-20', 60) ] },
      { l: 'F', type: 'circuit', title: 'Gainage', rounds: 3, items: [ ex('plank_fa', 3, '30 s', 0), ex('deadbug', 3, '10/côté', 0), ex('side_plank', 3, '20 s/côté', 45) ] }
    ],
    cooldown: [ w('Vélo très facile 2 min', ['bike']), w('Étirements quadriceps, fessiers, mollets, psoas', ['st_quad','st_glute','st_calf','st_hipflex']) ] },

  { id: 'c1-ca', cycle: 1, slot: 'CA', title: 'Endurance fondamentale (zone 2)',
    intro: 'Allure où tu peux parler en phrases complètes (environ 65-75 % de la FC max).',
    warmup: [ w('5 min tapis en marche rapide', ['incline_walk']), w('5 min mobilité hanches et chevilles : balancés de jambes, fentes dynamiques, ouverture de hanche', ['leg_swings','hip_opener','ankle_mob']) ],
    blocks: [
      { l: 'A', items: [ ex('incline_walk', 1, '20 min', 0, { note: 'Pente 8 à 12 %, comme en rando' }) ] },
      { l: 'B', items: [ ex('bike', 1, '15 min', 0) ] },
      { l: 'C', items: [ ex('rower', 1, '15 min', 0, { note: 'Cadence 20-22 coups/min, technique propre' }) ] },
      { l: 'D', items: [ ex('stairs', 1, '5 min', 0, { note: 'Allure régulière' }) ] }
    ],
    cooldown: [ w('Marche 2 min'), w('Étirements mollets, ischios, fléchisseurs de hanche', ['st_calf','st_ham','st_hipflex']) ] },

  { id: 'c1-r2', cycle: 1, slot: 'R2', title: 'Haut du corps pousser / tirer',
    warmup: [ w('5 min rameur ou SkiErg facile', ['rower','skierg']),
              w('Routine poignets, rotations d’épaules avec élastique, dislocations au bâton, 10 band pull-aparts, dead hang 3 × 10-15 s', ['wrist_routine','shoulder_band','band_pull','dead_hang']) ],
    blocks: [
      { l: 'A', items: [ ex('iso_chest', 3, 12, 90, { note: 'Poignées neutres si possible' }) ] },
      { l: 'B', items: [ ex('latpull', 3, 12, 90) ] },
      { l: 'C', type: 'superset', rounds: 3, items: [ ex('db_seat_press', 3, 12, 0), ex('seated_row', 3, 12, 75) ] },
      { l: 'D', items: [ ex('ringrow', 3, 10, 60, { note: 'Corps incliné, pieds loin' }) ] },
      { l: 'E', type: 'superset', title: 'Bras', rounds: 3, items: [ ex('hammer_curl', 3, 12, 0), ex('rope_pd', 3, 15, 60) ] },
      { l: 'F', items: [ ex('face_pull', 3, 15, 60) ] }
    ],
    cooldown: [ w('Marche'), w('Étirements pectoraux contre le mur, dorsaux, triceps, avant-bras (doucement, sans forcer sur la cicatrice)', ['st_pec','st_lat','st_tri','st_forearm']) ] },

  { id: 'c1-wod', cycle: 1, slot: 'WOD', title: 'Remise en route métabolique',
    warmup: [ w('5 min : 1 min rameur, 1 min vélo, 1 min SkiErg, 2 min mixte allure croissante', ['rower','bike','skierg']),
              w('Routine poignets, 2 tours de 5 deadlifts kettlebell légers + 5 goblet squats + 5 step-ups', ['wrist_routine','kb_dl','goblet','stepup']) ],
    blocks: [
      { l: 'A', type: 'wod', title: 'EMOM 30 min', desc: 'Une station par minute, 6 tours. Effort modéré, environ 40 s de travail max.',
        items: [ ex('rower_wod', 0, '10-12 cal', 0), ex('kb_dl', 0, '12 · 24 kg', 0), ex('goblet_wod', 0, 10, 0), ex('stepup_wod', 0, '12 alternés', 0), ex('assault_wod', 0, '10-12 cal', 0), ex('plank_wod', 0, '30 s', 0) ] },
      { l: '', type: 'rest', title: 'Repos 5 min' },
      { l: 'B', type: 'wod', title: 'AMRAP 12 min', benchmark: 'amrap12', desc: 'Ce sera le retest du cycle 4 : note ton score.',
        items: [ ex('wallball', 0, '10 · balle 6-9 kg, cible basse si besoin', 0), ex('kb_swing_wod', 0, '10 · 16-20 kg', 0), ex('skierg_wod', 0, '10 cal', 0) ] }
    ],
    cooldown: [ w('Marche, étirements globaux, respiration') ] },

  { id: 'c1-r3', cycle: 1, slot: 'R3', title: 'Chaîne postérieure + dos + portés',
    warmup: [ w('5 min SkiErg ou rameur', ['skierg','rower']),
              w('Routine poignets, good mornings au bâton, cat-cow, ponts fessiers, hip hinge au mur, 1 série légère de soulevé de terre roumain', ['wrist_routine','gm_stick','cat_cow','glute_bridge','hip_hinge']) ],
    blocks: [
      { l: 'A', items: [ ex('db_rdl', 3, 12, 90, { note: 'Sangles possibles' }) ] },
      { l: 'B', items: [ ex('hipthrust', 3, 12, 90, { note: 'Barre ou machine' }) ] },
      { l: 'C', items: [ ex('db_row', 3, '12/bras', 60) ] },
      { l: 'D', type: 'superset', rounds: 3, items: [ ex('legcurl_s', 3, 12, 0), ex('back_ext', 3, 12, 60) ] },
      { l: 'E', items: [ ex('shrug', 3, 15, 60) ] },
      { l: 'F', items: [ ex('farmer', 4, '20 m', 60, { note: 'Haltères ou kettlebells légers, uniquement si la prise est confortable, sinon poids réduit' }) ] },
      { l: 'G', items: [ ex('bird_dog', 3, '8/côté', 30, { note: 'Mains sur poings' }) ] }
    ],
    cooldown: [ w('Marche'), w('Étirements ischios, fessiers, dos (posture de l’enfant), avant-bras', ['st_ham','st_glute','child_pose','st_forearm']) ] },

  // ═════════════ CYCLE 2
  { id: 'c2-r1', cycle: 2, slot: 'R1', title: 'Jambes dominante genou + gainage',
    warmup: [ w('5 min assault bike facile', ['assault']), w('Squats à l’air, fentes marchées, mobilité chevilles au mur, 2 séries d’approche de back squat barre vide', ['air_squat','walk_lunge','ankle_mob']) ],
    blocks: [
      { l: 'A', items: [ ex('backsquat', 4, 10, 120, { note: 'Barre haute, prise large pour soulager les poignets · RPE 7' }) ] },
      { l: 'B', items: [ ex('db_wlunge', 3, '10/jambe', 90) ] },
      { l: 'C', items: [ ex('hack', 3, 12, 90) ] },
      { l: 'D', type: 'superset', rounds: 3, items: [ ex('legext', 3, 12, 0), ex('adductor', 3, 15, 60) ] },
      { l: 'E', items: [ ex('calf_stand', 4, 12, 60) ] },
      { l: 'F', type: 'circuit', title: 'Gainage', rounds: 3, items: [ ex('plank_fist', 3, '40 s', 0), ex('hollow', 3, '20 s', 0, { note: 'Genoux pliés si besoin' }), ex('pallof', 3, '10/côté', 45) ] }
    ],
    cooldown: [ w('Vélo très facile', ['bike']), w('Étirements quadriceps, adducteurs, fessiers', ['st_quad','st_add','st_glute']) ] },

  { id: 'c2-ca', cycle: 2, slot: 'CA', title: 'Zone 2 + fartlek',
    warmup: [ w('5 min rameur facile', ['rower']), w('Mobilité hanches, thoraciques et chevilles', ['hip_opener','cat_cow','ankle_mob']) ],
    blocks: [
      { l: 'A', items: [ ex('rower', 1, '15 min', 0, { note: 'Zone 2' }) ] },
      { l: 'B', items: [ ex('bike', 1, '20 min', 0, { note: '4 × (3 min allure soutenue + 2 min facile)' }) ] },
      { l: 'C', items: [ ex('incline_walk', 1, '15 min', 0, { note: 'Marche inclinée 10 %, ou alternance 1 min petite course / 2 min marche si les genoux sont d’accord' }) ] },
      { l: 'D', items: [ ex('stairs', 1, '5 min', 0) ] }
    ],
    cooldown: [ w('Marche'), w('Étirements mollets, ischios, psoas', ['st_calf','st_ham','st_hipflex']) ] },

  { id: 'c2-r2', cycle: 2, slot: 'R2', title: 'Haut du corps pousser / tirer',
    warmup: [ w('5 min SkiErg', ['skierg']), w('Routine poignets, band pull-aparts, dead hang 3 × 20-30 s, pompes inclinées sur la barre au rack (poignets peu fléchis)', ['wrist_routine','band_pull','dead_hang','incline_pushup']) ],
    blocks: [
      { l: 'A', items: [ ex('bench', 4, 10, 120, { note: 'Ou haltères si le poignet tire · RPE 7' }) ] },
      { l: 'B', items: [ ex('banded_pu', 4, '6-8', 90) ] },
      { l: 'C', type: 'superset', rounds: 3, items: [ ex('db_stand_press', 3, 10, 0), ex('bor', 3, 10, 75, { label: 'Rowing barre penché, prise supination', variant: 'Prise en supination ; la vidéo peut montrer une autre prise.' }) ] },
      { l: 'D', items: [ ex('pushup_par', 3, 'max propre', 60, { note: 'Garder 2 répétitions en réserve' }) ] },
      { l: 'E', type: 'superset', title: 'Bras', rounds: 3, items: [ ex('ez_curl', 3, 12, 0), ex('dip_assist', 3, 10, 60) ] },
      { l: 'F', items: [ ex('lat_raise', 3, 15, 60) ] }
    ],
    cooldown: [ w('Étirements pectoraux, épaules, dorsaux, avant-bras', ['st_pec','st_lat','st_forearm']) ] },

  { id: 'c2-wod', cycle: 2, slot: 'WOD', title: 'Couplets et triplets',
    warmup: [ w('3 min rameur, 2 min corde à sauter (single unders) en douceur', ['rower','single_under']), w('Routine poignets, 2 tours à vide des mouvements du WOD', ['wrist_routine']) ],
    blocks: [
      { l: 'A', type: 'wod', title: 'For time, 5 tours (cap 20 min)',
        items: [ ex('assault_wod', 0, '15 cal', 0), ex('kb_swing_am', 0, '12 · 16-20 kg', 0), ex('ringrow_wod', 0, 9, 0), ex('devil', 0, '6 · haltères 10-12,5 kg', 0) ] },
      { l: '', type: 'rest', title: 'Repos 5 min' },
      { l: 'B', type: 'wod', title: 'AMRAP 15 min',
        items: [ ex('rower_wod', 0, '200 m', 0), ex('db_thruster', 0, '10 · 2 × 12,5 kg', 0), ex('box_stepover', 0, 10, 0), ex('single_under', 0, '50 (ou 25 double unders)', 0) ] }
    ],
    cooldown: [ w('Marche, étirements globaux, respiration lente') ] },

  { id: 'c2-r3', cycle: 2, slot: 'R3', title: 'Chaîne postérieure + dos + portés',
    warmup: [ w('5 min rameur', ['rower']), w('Mobilité hanches, hip hinge, ponts fessiers, 2 séries d’approche de soulevé de terre', ['hip_opener','hip_hinge','glute_bridge']) ],
    blocks: [
      { l: 'A', items: [ ex('deadlift', 4, 8, 120, { note: 'RPE 7 · sangles sur la dernière série si la prise lâche' }) ] },
      { l: 'B', items: [ ex('hipthrust', 3, 12, 90, { label: 'Hip thrust barre' }) ] },
      { l: 'C', items: [ ex('iso_row', 3, 12, 75) ] },
      { l: 'D', type: 'superset', rounds: 3, items: [ ex('good_morning', 3, 10, 0), ex('legcurl_l', 3, 12, 60) ] },
      { l: 'E', items: [ ex('kb_swing_ru', 3, 15, 60) ] },
      { l: 'F', items: [ ex('farmer', 4, '30 m', 60, { note: 'Charge modérée' }) ] },
      { l: 'G', items: [ ex('back_ext', 3, 15, 45, { label: 'Back extension au banc 45°' }) ] }
    ],
    cooldown: [ w('Étirements ischios, fessiers, lombaires, avant-bras', ['st_ham','st_glute','child_pose','st_forearm']) ] },

  // ═════════════ CYCLE 3
  { id: 'c3-r1', cycle: 3, slot: 'R1', title: 'Jambes dominante genou + gainage',
    warmup: [ w('5 min assault bike', ['assault']), w('Mobilité chevilles, hanches et poignets (test du front rack), 3 séries d’approche montantes de squat', ['ankle_mob','hip_opener','wrist_routine']) ],
    blocks: [
      { l: 'A', items: [ ex('backsquat', 5, 6, 150, { note: 'RPE 7-8 · récup 2-3 min' }) ] },
      { l: 'B', items: [ ex('frontsquat', 3, 8, 120, { note: 'Prise en sangles croisées ou bras croisés si le front rack gêne' }) ] },
      { l: 'C', items: [ ex('bulgarian', 3, '8/jambe', 90) ] },
      { l: 'D', type: 'superset', rounds: 3, items: [ ex('legext', 3, 12, 0), ex('calf_press', 3, 15, 60) ] },
      { l: 'E', type: 'circuit', title: 'Gainage', rounds: 3, items: [ ex('t2b', 3, '6-8', 0, { note: 'Genoux à la poitrine au début' }), ex('shoulder_taps', 3, '10/côté', 0), ex('russian_twist', 3, 20, 45) ] }
    ],
    cooldown: [ w('Vélo facile', ['bike']), w('Étirements quadriceps, fessiers, adducteurs', ['st_quad','st_glute','st_add']) ] },

  { id: 'c3-ca', cycle: 3, slot: 'CA', title: 'Fractionné au seuil',
    warmup: [ w('5 min vélo progressif', ['bike']), w('Mobilité, 3 accélérations de 15 s sur le rameur', ['hip_opener','rower']) ],
    blocks: [
      { l: 'A', items: [ ex('rower', 5, '4 min', 120, { note: 'Allure soutenue mais tenable · récup 2 min facile' }) ] },
      { l: 'B', items: [ ex('stairs', 1, '15 min', 0, { label: 'Escalier ou tapis incliné', note: 'Zone 2' }) ] },
      { l: 'C', items: [ ex('assault', 6, '20 s fort / 40 s facile', 0) ] }
    ],
    cooldown: [ w('Marche'), w('Étirements mollets, ischios, psoas', ['st_calf','st_ham','st_hipflex']) ] },

  { id: 'c3-r2', cycle: 3, slot: 'R2', title: 'Haut du corps pousser / tirer',
    warmup: [ w('5 min SkiErg', ['skierg']), w('Routine poignets, dead hang 3 × 30-40 s puis active hang, pompes, 2 séries légères de développé militaire', ['wrist_routine','dead_hang','active_hang','incline_pushup']) ],
    blocks: [
      { l: 'A', items: [ ex('strict_press', 5, 6, 120) ] },
      { l: 'B', items: [ ex('strict_pu', 5, 5, 120, { note: 'Élastique léger si besoin' }) ] },
      { l: 'C', type: 'superset', rounds: 4, items: [ ex('incline_db', 4, 8, 0), ex('pendlay', 4, 8, 90) ] },
      { l: 'D', items: [ ex('dips', 3, '6-8', 75) ] },
      { l: 'E', type: 'superset', title: 'Bras', rounds: 3, items: [ ex('incline_curl', 3, 10, 0), ex('skull', 3, 10, 60) ] },
      { l: 'F', items: [ ex('face_pull', 3, 15, 60, { label: 'Face pull' }) ] }
    ],
    cooldown: [ w('Étirements pectoraux, épaules, dorsaux, avant-bras', ['st_pec','st_lat','st_forearm']) ] },

  { id: 'c3-wod', cycle: 3, slot: 'WOD', title: 'Intensité et haltérophilie légère',
    warmup: [ w('3 min rameur + 2 min corde', ['rower','single_under']), w('Éducatifs de clean à la barre vide (deadlift, hang pull, hang power clean), uniquement si le poignet passe en front rack sans douleur', ['wrist_routine']) ],
    blocks: [
      { l: 'A', title: 'Technique · 10 min', items: [ ex('hpc', 6, 3, 60, { note: 'Léger, focus vitesse et réception · sinon dumbbell hang clean' }) ] },
      { l: 'B', type: 'wod', title: 'For time 21-15-9 (cap 12 min)',
        items: [ ex('wallball', 0, '9 kg', 0), ex('kb_swing_am', 0, '24 kg', 0), ex('rower_wod', 0, 'cal', 0) ] },
      { l: '', type: 'rest', title: 'Repos 5 min' },
      { l: 'C', type: 'wod', title: 'EMOM 16 min, 4 tours',
        items: [ ex('assault_wod', 0, '12 cal', 0), ex('db_snatch', 0, '8 alternés · 22,5 kg', 0), ex('burpee', 0, 10, 0), ex('double_under', 0, '30 (ou 60 single unders)', 0) ] }
    ],
    cooldown: [ w('Marche, étirements globaux, avant-bras', ['st_forearm']) ] },

  { id: 'c3-r3', cycle: 3, slot: 'R3', title: 'Chaîne postérieure + dos + portés',
    warmup: [ w('5 min rameur', ['rower']), w('Mobilité hanches, ponts fessiers, kettlebell swings légers, montée en charge sur le soulevé de terre', ['hip_opener','glute_bridge','kb_swing_light']) ],
    blocks: [
      { l: 'A', items: [ ex('deadlift', 5, 5, 150, { label: 'Soulevé de terre', note: 'RPE 8 · récup 2-3 min' }) ] },
      { l: 'B', items: [ ex('rdl', 3, 8, 90) ] },
      { l: 'C', type: 'superset', rounds: 4, items: [ ex('latpull', 4, 8, 0, { label: 'Tractions prise neutre ou lat pulldown lourd' }), ex('hipthrust', 4, 10, 90, { label: 'Hip thrust barre' }) ] },
      { l: 'D', items: [ ex('db_row', 3, '10/bras', 60, { label: 'Rowing un bras haltère lourd' }) ] },
      { l: 'E', type: 'circuit', title: 'Portés', rounds: 4, items: [ ex('farmer', 4, '30 m', 0, { label: 'Farmer’s carry lourd' }), ex('suitcase', 4, '20 m/côté', 60) ] },
      { l: 'F', items: [ ex('superman', 3, 12, 45, { label: 'Superman ou back extension lestée' }) ] }
    ],
    cooldown: [ w('Étirements ischios, fessiers, dos, avant-bras', ['st_ham','st_glute','child_pose','st_forearm']) ] },

  // ═════════════ CYCLE 4
  { id: 'c4-r1', cycle: 4, slot: 'R1', title: 'Jambes dominante genou + gainage',
    warmup: [ w('5 min assault bike', ['assault']), w('Mobilité, montée progressive au back squat', ['ankle_mob','hip_opener']) ],
    blocks: [
      { l: 'A', items: [ ex('backsquat', 3, 5, 180, { note: 'Montée jusqu’à un 5RM propre (RPE 8-9), puis 2 × 5 à 90 % de ce 5RM · récup 3 min', benchmark: 'squat5rm' }) ] },
      { l: 'B', items: [ ex('frontsquat', 3, 6, 120, { note: 'Front rack barre si OK' }) ] },
      { l: 'C', items: [ ex('lunge_heavy', 3, '8/jambe', 90) ] },
      { l: 'D', items: [ ex('pistol_box', 3, '5/jambe', 60) ] },
      { l: 'E', items: [ ex('calf_stand', 4, 12, 60, { label: 'Mollets' }) ] },
      { l: 'F', type: 'circuit', title: 'Gainage', rounds: 3, items: [ ex('t2b', 3, '8-10', 0), ex('lsit', 3, '15 s', 0), ex('hollow_rock', 3, 15, 45) ] }
    ],
    cooldown: [ w('Vélo facile, étirements', ['bike','st_quad','st_glute']) ] },

  { id: 'c4-ca', cycle: 4, slot: 'CA', title: 'VO2 + endurance',
    warmup: [ w('5 min rameur progressif', ['rower']), w('Mobilité, 3 accélérations de 10 s sur l’assault bike', ['hip_opener','assault']) ],
    blocks: [
      { l: 'A', items: [ ex('assault', 10, '30 s fort / 30 s facile', 0, { note: 'Puis 3 min facile' }) ] },
      { l: 'B', items: [ ex('rower', 1, '2 000 m', 0, { label: 'Rameur · test 2 000 m', note: 'Note ton temps, ce sera ta référence', benchmark: 'row2k' }) ] },
      { l: 'C', items: [ ex('incline_walk', 1, '25 min', 0, { label: 'Zone 2 au choix', note: 'Tapis incliné, escalier ou course légère si les genoux l’acceptent' }) ] }
    ],
    cooldown: [ w('Marche, étirements', ['st_calf','st_ham','st_hipflex']) ] },

  { id: 'c4-r2', cycle: 4, slot: 'R2', title: 'Haut du corps pousser / tirer',
    warmup: [ w('5 min SkiErg', ['skierg']), w('Routine poignets, scapular pull-ups, dead hang 2 × 45 s, montée en charge au développé couché', ['wrist_routine','scap_pullup','dead_hang']) ],
    blocks: [
      { l: 'A', items: [ ex('bench', 5, 5, 150, { label: 'Développé couché', note: 'RPE 8 · récup 2-3 min' }) ] },
      { l: 'B', items: [ ex('strict_pu', 5, 5, 120, { note: 'Lestées si 8 strictes faciles', benchmark: 'pullups' }) ] },
      { l: 'C', items: [ ex('push_press', 4, 6, 120) ] },
      { l: 'D', type: 'superset', rounds: 3, items: [ ex('ring_dips', 3, '6-8', 0), ex('ringrow', 3, 10, 75, { label: 'Ring row pieds surélevés' }) ] },
      { l: 'E', type: 'superset', title: 'Bras', rounds: 3, items: [ ex('hammer_curl', 3, 10, 0, { label: 'Curl marteau' }), ex('rope_pd', 3, 12, 60, { label: 'Extension triceps poulie' }) ] },
      { l: 'F', type: 'superset', rounds: 3, items: [ ex('lat_raise', 3, 12, 0, { label: 'Élévations latérales' }), ex('face_pull', 3, 12, 60, { label: 'Face pull' }) ] }
    ],
    cooldown: [ w('Étirements pectoraux, épaules, dorsaux, avant-bras', ['st_pec','st_lat','st_forearm']) ] },

  { id: 'c4-wod', cycle: 4, slot: 'WOD', title: 'Benchmark et retest',
    warmup: [ w('3 min rameur + 2 min corde', ['rower','single_under']), w('Routine poignets, montée en charge sur le thruster et éducatifs à vide des mouvements', ['wrist_routine']) ],
    blocks: [
      { l: 'A', type: 'wod', title: '« Fran » adapté · for time 21-15-9 (cap 10 min)',
        items: [ ex('thruster', 0, 'barre 30-40 kg ou haltères 2 × 15 kg si le front rack gêne', 0), ex('pullup_wod', 0, 'élastique si besoin', 0) ] },
      { l: '', type: 'rest', title: 'Repos 6-8 min (marche, rameur très facile)' },
      { l: 'B', type: 'wod', title: 'Retest de l’AMRAP 12 du cycle 1', benchmark: 'amrap12',
        desc: 'Mêmes charges qu’au cycle 1 pour comparer le score, ou charges augmentées si le cycle 1 était trop facile (le noter).',
        items: [ ex('wallball', 0, 10, 0), ex('kb_swing_wod', 0, 10, 0), ex('skierg_wod', 0, '10 cal', 0) ] },
      { l: '', type: 'rest', title: 'Repos 5 min' },
      { l: 'C', type: 'wod', title: 'Finisher · 5 min', desc: '1 tour = 5 burpees sur les poings + 10 cal assault bike, allure constante.',
        items: [ ex('burpee', 0, 5, 0), ex('assault_wod', 0, '10 cal', 0) ] }
    ],
    cooldown: [ w('Marche, étirements globaux, respiration') ] },

  { id: 'c4-r3', cycle: 4, slot: 'R3', title: 'Chaîne postérieure + dos + portés',
    warmup: [ w('5 min rameur', ['rower']), w('Mobilité hanches, swings légers, montée en charge au soulevé de terre', ['hip_opener','kb_swing_light']) ],
    blocks: [
      { l: 'A', items: [ ex('deadlift', 3, 5, 180, { label: 'Soulevé de terre', note: 'Montée jusqu’à un 3-5RM propre, puis 2 × 5 à 85 %', benchmark: 'deadlift' }) ] },
      { l: 'B', items: [ ex('power_clean', 5, 3, 90, { note: 'Léger et rapide, uniquement si le front rack est confortable' }) ] },
      { l: 'C', type: 'superset', rounds: 4, items: [ ex('bor', 4, 8, 0), ex('hipthrust', 4, 8, 90, { label: 'Hip thrust lourd' }) ] },
      { l: 'D', items: [ ex('tgu', 3, '2/côté', 60, { note: 'Kettlebell 12-16 kg' }) ] },
      { l: 'E', type: 'circuit', title: 'Portés', rounds: 3, items: [ ex('farmer', 3, '40 m', 0, { label: 'Farmer’s carry lourd' }), ex('kb_rack_carry', 3, '20 m/côté', 60) ] },
      { l: 'F', items: [ ex('back_ext', 3, 12, 45, { label: 'Back extension lestée' }) ] }
    ],
    cooldown: [ w('Étirements ischios, fessiers, dos, avant-bras', ['st_ham','st_glute','child_pose','st_forearm']) ] }
];

// Repères de suivi (section 7 du programme)
const BENCHMARKS = [
  { id: 'amrap12', label: 'AMRAP 12 (WOD C1 / retest C4)', unit: 'tours + reps' },
  { id: 'hang', label: 'Dead hang max', unit: 's' },
  { id: 'pullups', label: 'Tractions strictes max', unit: 'reps' },
  { id: 'squat5rm', label: 'Back squat', c1hint: '3 × 15 presse', c4hint: '5RM', unit: 'kg' },
  { id: 'deadlift', label: 'Soulevé de terre', c1hint: '3 × 12 RDL haltères', c4hint: '3-5RM', unit: 'kg' },
  { id: 'row2k', label: 'Rameur 2 000 m', unit: 'mm:ss' }
];

const PROGRAM_RULES = [
  'Signaux d’arrêt : fourmillements, engourdissement des doigts, douleur sur la cicatrice ou dans la paume. On arrête l’exercice et on passe à une variante sans prise (machine, sangles, avant-bras). Si ça persiste, on en parle au chirurgien ou au kiné.',
  'Si une séance a été trop dure (RPE > 8 au cycle 1-2, ou courbatures plus de 3 jours), garde les mêmes charges à la séance suivante.',
  'Si tout est facile, augmente de 2,5 à 5 kg sur le haut du corps et de 5 à 10 kg sur le bas du corps d’un cycle à l’autre.',
  'En cas de gêne au poignet, prends la version machine, sangles ou appui sur avant-bras de l’exercice et poursuis la séance.',
  'Ordre type dans un cycle : R1 → Cardio → R2 → WOD → R3, avec au moins un jour de repos après le WOD ou une séance de jambes lourde.'
];

/* But de chaque séance, rédigé à partir des objectifs de cycle et de la répartition du programme */
const SESSION_GOALS = {
  'c1-r1': 'Réhabituer genoux et hanches au travail de jambes sur machines et charges légères, et relancer le gainage. Note tes charges de départ : elles servent de repère pour la suite. Aucune série à l’échec (3-4 répétitions en réserve).',
  'c1-ca': 'Construire la base d’endurance en zone 2, en parlant en phrases complètes. La marche inclinée et l’escalier remplacent la course pour ménager les genoux au cycle 1.',
  'c1-r2': 'Reprendre pousser et tirer avec des prises neutres (machines Hammer, haltères) pour protéger le poignet opéré, et recommencer la suspension à la barre en volume court.',
  'c1-wod': 'Retrouver l’enchaînement d’un WOD à effort modéré. L’AMRAP 12 sert de référence : note ton score, il sera retesté au cycle 4.',
  'c1-r3': 'Réactiver la chaîne postérieure (ischios, fessiers, lombaires) et le dos, et tester la prise sur les portés. Sangles autorisées, charges légères.',
  'c2-r1': 'Retour de la barre avec le back squat (prise large pour les poignets) et plus de volume sur les jambes. RPE 7, 2-3 répétitions en réserve.',
  'c2-ca': 'Garder la base en zone 2 et introduire des changements d’allure (fartlek) sur le vélo.',
  'c2-r2': 'Retour du développé couché à la barre et des tractions avec élastique. Les pompes se font sur parallettes ou haltères pour garder le poignet neutre.',
  'c2-wod': 'Réintroduire des mouvements CrossFit simples en couplets et triplets (swings, devil press, thrusters haltères, corde à sauter).',
  'c2-r3': 'Retour du soulevé de terre à la barre (RPE 7) et plus de travail de portés pour reconstruire la prise.',
  'c3-r1': 'Monter en charge sur le squat (5 × 6) et tester le front squat si le front rack passe sans douleur. Gainage plus exigeant avec les toes-to-bar.',
  'c3-ca': 'Travailler au seuil en fractionné sur le rameur et en sprints courts sur l’assault bike.',
  'c3-r2': 'Gymnastique stricte et charges plus lourdes : strict press, tractions strictes, dips. RPE 7-8, 2 répétitions en réserve.',
  'c3-wod': 'Réintroduire une haltérophilie légère (hang power clean) seulement si le poignet passe en front rack sans douleur, puis monter l’intensité des WODs.',
  'c3-r3': 'Monter en charge sur le soulevé de terre (5 × 5, RPE 8) et charger davantage les portés.',
  'c4-r1': 'Mesurer ta force au squat : 5RM propre puis séries à 90 %. Travail unilatéral (pistol sur box) et gainage complet.',
  'c4-ca': 'Travailler la VO2 sur l’assault bike et faire le test 2 000 m au rameur, qui devient ta référence.',
  'c4-r2': 'Consolider les charges du haut du corps (5 × 5) et reprendre le push press. Tractions lestées si 8 strictes deviennent faciles.',
  'c4-wod': 'Benchmark « Fran » adapté et retest de l’AMRAP 12 du cycle 1 pour mesurer le chemin parcouru.',
  'c4-r3': 'Trouver un 3-5RM au soulevé de terre, reprendre le power clean si le front rack est confortable, et des portés lourds.'
};
