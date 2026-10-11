# Carnet On Air

Carnet d'entraînement mobile pour le programme de reprise à la salle On Air (4 cycles × 5 séances).

## Données et affichage séparés

L'affichage (`src/`) ne contient aucune donnée d'entraînement. Il lit trois documents JSON :

| Fichier | `fileType` | Contenu |
|---|---|---|
| `data/bibliotheque.json` | `onair.bibliotheque` | groupes musculaires, exercices du programme (muscles principaux/secondaires, unité, variantes), vidéos vérifiées, catalogue des mouvements CrossFit |
| `data/carnet.json` | `onair.carnet` | cycles, types de séance, 20 séances (mise en route, blocs, retour au calme, but), repères, consignes |
| `progression.json` | `onair.progression` | ce que tu notes : séries, charges, RPE, commentaires, repères, préférences de mouvements, réglages. Écrit par l'application (navigateur, et compte Claude sur claude.ai), exportable depuis l'onglet Sauvegarde |

Servie par GitHub Pages, la page relit `data/*.json` à chaque ouverture : modifier ces fichiers suffit, sans reconstruire. Une copie est aussi intégrée à la page pour qu'elle fonctionne hors ligne.

Onglet Sauvegarde : export de chaque fichier ou de tout en un fichier, import (type reconnu automatiquement, confirmation avant remplacement), sauvegardes datées et restauration, remise à zéro par fichier ou complète. Une sauvegarde automatique précède chaque import, restauration ou remise à zéro.

## Connexion

`index.html` demande un identifiant (comptes dans `auth/utilisateurs.json`, mots de passe en PBKDF2-SHA256, jamais en clair) et pose un cookie de session. C'est un contrôle côté navigateur : il masque l'écran mais ne protège pas les fichiers publiés, lisibles par quiconque connaît leur adresse si le dépôt ou le site est public.

## Construction

`python3 build.py` régénère `index.html` (site, avec connexion) et `carnet-on-air.html` (version claude.ai, sans connexion).
