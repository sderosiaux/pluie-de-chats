# Pluie de Chats : game spec

Spec issue de deux tours de validation (`public/directions.html`, `public/directions-2.html`). Direction retenue : **Carambolage**. Remplace le jeu actuel (stand de tir infini à quatre armes).

## 1. Concept

Il pleut des chats. Tu lances une pelote sur l'un d'eux : il part en vrille, percute ses voisins, qui percutent les leurs. Chaque chat a un caractère physique qui change la façon dont la réaction se propage. Les averses durent une minute, sont notées en pattes, et chacune a son classement.

## 2. Fantasme du joueur

« Je choisis le bon chat, au bon moment, sous le bon angle, et je regarde toute la pluie dégringoler. »

C'est du billard en temps réel. Le plaisir vient du tir qui en déclenche quinze.

## 3. Rythme émotionnel d'une averse

`lecture (où sont les grappes ?) → attente tendue (encore une seconde, ils se rapprochent…) → tir → spectacle (cascade, ralenti) → fierté ou « ah non, le chien ! » → la pluie s'intensifie → dernière grappe → note`

La pression ne vient pas d'une mort possible. Elle vient de deux ressources qui fuient : **les pelotes** (en nombre limité) et **les chats** (qui sortent par le bas si on attend trop).

## 4. Principes de design

1. **Le joueur choisit le premier chat, la physique fait le reste.** Toute la maîtrise se joue sur un tir : la cible, l'angle et le moment. Après le tir, le joueur regarde.
2. **Un caractère, c'est une règle physique.** Chaque chat modifie la propagation (masse, esquive, rebond, trajectoire). Un caractère qui ne change que les points n'a rien à faire dans le jeu.
3. **Même entrée, même résultat.** La simulation est déterministe au bit près. Sans ça, ni classement juste, ni replay, ni défi.
4. **Lisible en 5 secondes.** Tu tires sur un chat, il tape les autres. Aucun texte n'est nécessaire pour jouer la première averse.
5. **Pas de mort.** On rate une averse, on la relance aussitôt. Aucune pénalité ne suit le joueur d'une averse à l'autre.
6. **Une seule arme.** La pelote. Toute la variété vient des chats.

## 5. Boucle de jeu

```
   ┌────────────────────────────────────────────────────────────┐
   ▼                                                            │
observer les chats qui tombent ──► choisir 1er chat + angle ──► tirer
(formations, caractères)          (ligne de visée montre        │
                                   la 1re collision)             ▼
                                                   carambolage (1–3 s)
                                                                 │
              pelote rendue si chaîne ≥ 4 ◄──── compter n chats ─┘
```

Verbe principal : **viser-tirer**. Il n'y a pas de verbe secondaire : le joueur décide seulement quand tirer et sur qui.

## 6. Contrôles

Mode retenu après essai : **vise vers le doigt**.

| Geste | Effet |
|---|---|
| Toucher / glisser n'importe où au-dessus du lanceur | Affiche la ligne de visée depuis le lanceur (bas, centre) vers le doigt |
| Relâcher | Tire la pelote dans cette direction |
| Tap bref | Tire immédiatement vers le point touché |
| Relâcher sous la ligne horizontale du lanceur (angle < 7° au-dessus de l'horizontale) | Annule, aucune pelote consommée |

- La pelote part à vitesse fixe (pas de charge). Elle ne dépend que de l'angle. Si la puissance variait, le classement ne mesurerait plus la même compétence.
- Recharge de **0,5 s** entre deux tirs. On peut tirer pendant qu'un carambolage est en cours.
- Aucune autre interaction en jeu (pas de choix d'arme, pas de dial).

## 7. Lois du monde (simulation)

Pas fixe de **120 Hz**, découplé du rendu. La simulation s'arrête quand l'onglet est caché ou qu'un menu est ouvert (corrige le bug actuel où le temps avançait dans les menus).

### Loi 1 : Chute
- **État :** chaque chat `tombe` avec une vitesse verticale propre au caractère et une oscillation horizontale déterministe (amplitude et phase fixées par la graine).
- **Conséquence :** sorti par le bas → **raté**.
- **Usage joueur :** attendre que deux chats se rapprochent avant de tirer.

### Loi 2 : Impact de la pelote
- **Condition :** la pelote touche un chat qui tombe.
- **Changement d'état :** le chat devient **boulet**. Sa vitesse prend la direction de la **ligne des centres** (de la pelote vers le chat), avec une norme égale à `|v_pelote| × transfert(chat)`. La pelote est absorbée et disparaît.
- **Usage joueur :** viser un côté du chat pour l'envoyer dans l'autre direction, comme au billard.
- **Cas limites :** la pelote touche deux chats dans le même tick → seul celui d'`id` le plus petit compte. Pelote qui ne touche rien → perdue en sortant de l'écran. Elle rebondit au maximum **2 fois** sur les bords latéraux et ne rebondit pas sur le plafond.

### Loi 3 : Propagation
- **Condition :** un boulet touche un chat qui tombe.
- **Changement d'état :** le chat touché devient boulet. Il part selon la ligne des centres, avec une vitesse `|v_boulet| × transfert(boulet)`. Le boulet tapeur est dévié selon le rapport des masses (choc élastique : `v_tapeur -= 2·m_cible/(m_tapeur+m_cible) × projection sur la normale`). Le gros n'est jamais dévié. Vitesse plancher d'un nouveau boulet : **380 px/s**, pour qu'une chaîne ne meure pas dans un frôlement.
- **Les boulets ne se percutent pas entre eux.**
- **Usage joueur :** viser un chat placé au-dessus d'une grappe pour que la cascade descende dedans.
- **Cas limites :** deux boulets touchent le même chat dans le même tick → c'est le boulet d'`id` le plus petit qui gagne, et le chat rejoint sa chaîne.

### Loi 4 : Vie d'un boulet
- Un boulet subit la gravité (900 px/s²), rebondit sur les bords latéraux et le plafond (restitution 0,8 sauf caractère) et tourne (rotation purement visuelle, sans effet physique).
- Il disparaît à la fin de sa durée de vie (dépend du caractère) ou en sortant par le bas.
- **Un chat devenu boulet est attrapé**, dès l'instant où il est touché.

### Loi 5 : Chaîne
- Tous les boulets issus d'un même tir forment une **chaîne**. Une chaîne est terminée quand son dernier boulet a disparu.
- À la fin d'une chaîne de `n` chats (hors chien) : **score += n²**. Si `n ≥ 4` : **+1 pelote** (« la pelote revient »).
- Plusieurs chaînes peuvent coexister. Chacune a son propre compteur.

### Loi 6 : Pelotes
- Chaque averse commence avec un stock fixe (défaut : **8 pelotes pour 30 chats**). Avec ce stock, attraper 90 % des chats demande des chaînes d'au moins ~3,5 chats en moyenne. Tirer chat par chat ne suffit pas.
- À 0 pelote, le lanceur est vide. Un bouton **« Finir l'averse »** fait avancer la simulation en accéléré jusqu'à la fin.

### Loi 7 : Fin d'averse
- L'averse est finie quand tous les chats prévus sont apparus, qu'aucun n'est à l'écran et qu'aucune chaîne n'est active.
- **Pattes :** ≥ 50 % des chats attrapables → 🐾, ≥ 75 % → 🐾🐾, ≥ 90 % → 🐾🐾🐾.
- **Score final** = Σ n² + 3 × pelotes restantes.
- La note en pattes mesure la progression et débloque la suite. Le score sert au classement.

## 8. Caractères

Dix caractères, introduits un par un. Chaque caractère a un **repère visuel dessiné par le moteur**, indépendant du costume : un collier de couleur, une icône sur le collier et une échelle de taille liée à la masse. Le repère compte plus que le sprite : un joueur doit reconnaître un « gros » même déguisé en Viking.

| # | Caractère | Repère | Masse | Transfert | Vie boulet | Règle | Ce qu'il apprend |
|---|---|---|---|---|---|---|---|
| 1 | **Tigré** | aucun | 1 | 0,8 | 1,2 s | référence | un chat touché en touche d'autres |
| 2 | **Gros** | collier rouge ⬤, taille ×1,35 | 3 | 1,0 | 2,0 s | traverse sans dévier, tombe lentement | choisir la première cible |
| 3 | **Chaton** | collier jaune 🍼, taille ×0,7 | 0,5 | 0,5 | 0,7 s | s'éteint vite | certains chats arrêtent la chaîne |
| 4 | **Chien déguisé** | aucun collier, oreilles tombantes visibles | n/a | n/a | n/a | s'il est touché (pelote ou boulet) : −5 pts, il ne propage rien, il ne compte pas comme attrapé | contourner, pas seulement viser |
| 5 | **Trouillard** | collier bleu ❗ | 1 | 0,8 | 1,2 s | esquive la **pelote** (bond latéral si la pelote passe à < 85 px), jamais les boulets | atteindre un chat par un autre |
| 6 | **Bouclier** | collier acier 🛡 | 2 | 0,8 | 1,2 s | premier contact : le bouclier casse et le tapeur rebondit dessus (réflexion), le chat continue de tomber. Deuxième contact : il devient boulet | un obstacle devient une bande |
| 7 | **Fusée** | collier orange 🚀 | 1 | 1,0 | 0,9 s | en boulet : ligne droite, sans gravité, traverse l'écran | balayer une rangée entière |
| 8 | **Élastique** | collier arc-en-ciel 〰 | 1 | 0,8 | 2,5 s | en boulet : restitution 1,15 sur les bords, il accélère à chaque rebond | utiliser les murs |
| 9 | **Fantôme** | halo translucide 👻 | 1 | n/a | 0,6 s | les boulets le traversent. Seule la pelote l'attrape. En boulet, il traverse tout sans rien toucher | dépenser une pelote pour un seul chat, au bon moment |
| 10 | **Maman** | collier rose 💗 + 2–4 chatons en escorte | 1,5 | 0,8 | 1,2 s | quand elle devient boulet, ses chatons encore en chute deviennent boulets, dirigés vers elle | viser les formations |

Le lucky ×5, les HP génériques, les attaquants (cracheur, griffeur, tireur) et le boss à 8 PV sont supprimés. Ils n'agissent pas sur la propagation.

### Costumes → caractères

Les 62 sprites existants deviennent des costumes. Un costume appartient à un seul caractère, choisi pour la cohérence visuelle. Proposition de départ, à ajuster :

| Caractère | Costumes |
|---|---|
| Tigré | tabby, noir, blanc, gris, siamois*, sphynx, scottish, bengal, boulanger, cuisinier, facteur, jardinier, artiste, musicien, marin, professeur, infirmier, gamer, clown, sportif, cowboy, policier |
| Gros | persan, parrain, garde, hulk, viking, moai, boss |
| Chaton | micro |
| Chien déguisé | faux |
| Trouillard | siamois*, ninja, catwoman, detective, magicien |
| Bouclier | bouclier, chevalier, robot, samourai |
| Fusée | astro, flash, superman, rapide |
| Élastique | rainbow, zigzag, spiderman, pirate |
| Fantôme | fantome, furtif, sorciere |
| Maman | medecin, pompier (+ micro en escorte) |

\* siamois sert de tigré dans les averses avant le chapitre 5, puis de trouillard. Il ne faut **jamais** mélanger les deux rôles dans une même averse. Les monuments (liberte, eiffel, pagode, sphinx, trafiquant, scientifique, batman, tireur) sont des **costumes rares** de tigré : apparition à 2 % une fois le chapitre 3 passé, une entrée au carnet, et aucun effet de jeu.

## 9. Matrice d'interactions

| A | B | Résultat |
|---|---|---|
| Gros boulet | grappe de tigrés | traverse tout en ligne : chaîne longue et prévisible |
| Gros boulet | Bouclier | casse le bouclier sans dévier, et le bouclier devient boulet tout de suite (le gros compte comme les deux contacts) |
| Chaton | n'importe quel boulet | la chaîne meurt vite à cet endroit : passer à côté |
| Boulet | Chien | −5, la chaîne s'arrête de ce côté |
| Pelote | Trouillard | il esquive. S'il bondit dans la trajectoire d'un boulet, il est pris |
| Boulet | Trouillard | il est pris (il n'esquive que la pelote) |
| Tigré boulet | Bouclier (1er contact) | le tigré rebondit : il sert de bande pour renvoyer la chaîne |
| Fusée boulet | rangée horizontale | balaie toute la rangée, sans gravité |
| Élastique boulet | bords | accélère à chaque rebond : un chat lent au bord devient le plus dangereux |
| Boulet | Fantôme | le traverse : le fantôme reste et il faut une pelote |
| Fantôme boulet | qui que ce soit | ne touche rien : un tir « gaspillé » pour 1 point, nécessaire pour la 3ᵉ patte |
| Boulet | Maman | toute l'escorte part vers elle : effet d'aspiration, souvent suivi d'un rebond vers le reste |
| Chaîne ≥ 4 | stock de pelotes | +1 pelote : un bon joueur termine avec des pelotes en trop, donc un meilleur score |

## 10. Progression

Elle porte sur la compréhension, pas sur les chiffres. Aucune amélioration ne s'achète ni ne se choisit. La pelote est la même à la première et à la dernière averse.

```
Ch.1  Tigré          un chat touché en touche d'autres
Ch.2  Gros           la première cible compte
Ch.3  Chaton         certaines cibles éteignent la chaîne
Ch.4  Chien          il faut aussi éviter
Ch.5  Trouillard     certains chats ne s'atteignent que par la chaîne   (inversion)
Ch.6  Bouclier       un obstacle devient une bande                       (limitation → outil)
Ch.7  Fusée          la gravité n'est pas une loi pour tous
Ch.8  Élastique      les murs sont une arme
Ch.9  Fantôme        certains chats ne s'atteignent que par la pelote    (inversion de ch.5)
Ch.10 Maman          on vise une formation, pas un chat
```

- **Structure :** 10 chapitres × 5 averses = 50 averses fixes. Dans chaque chapitre : l'averse 1 présente le caractère isolé, les averses 2–4 le combinent avec les précédents, l'averse 5 est une « Grande averse » (90 s, 45 chats, toutes les formations du chapitre).
- **Déblocage :** averse N+1 débloquée dès 1 🐾 sur l'averse N. Chapitre suivant débloqué dès 1 🐾 sur sa Grande averse. Les 3 🐾 ne bloquent jamais : elles servent la maîtrise et le classement.
- **Décors :** les 4 scènes existantes (city, garden, home, forest) tournent par chapitre. C'est cosmétique.

## 11. Structure d'une averse

Une averse est entièrement définie par **une graine + un numéro de chapitre**. Le générateur produit une suite de **formations** placées sur une ligne de temps :

| Formation | Description | Rôle |
|---|---|---|
| Pluie fine | chats isolés, espacés | respiration, pelotes « faciles » mais rentables seulement à 1 |
| Rideau | 4–6 chats alignés horizontalement | fusée, gros au bout |
| Colonne | 3–5 chats empilés | tir par en dessous |
| Grappe | 5–8 chats serrés | le gros coup de l'averse |
| V | 5–7 chats en V | angle de bande |
| Escorte | maman + chatons, ou gros + chatons | ch.10, ou piège à chatons |
| Garde | grappe entourée de boucliers / chiens | lecture et contournement |

- Densité croissante : la deuxième moitié de l'averse contient plus de grappes et moins de pluie fine. Les 10 dernières secondes : une formation « finale » garantie (grappe ou escorte).
- Une averse contient toujours **assez de matière pour 3 🐾 avec le stock de pelotes** : le générateur vérifie par simulation qu'un tir « idéal glouton » (meilleur premier impact parmi 72 angles, testé à chaque formation) atteint ≥ 90 %. Sinon il régénère avec la graine suivante.
- Les 50 averses du jeu sont générées une fois puis **figées** (graine écrite en dur). Le classement porte sur ces averses.

## 12. Averses représentatives

**1-1 « Première averse »** (tigrés seulement, 20 chats, 8 pelotes)
- Le joueur croit qu'il faut toucher chaque chat. Premiers tirs : 1 chat chacun.
- Arrive une grappe de 6. Un tir dedans donne « Carambolage ×5 », un ralenti et +1 pelote.
- Il comprend qu'il faut attendre les grappes. Test de maîtrise : finir avec des pelotes en trop.

**2-1 « Le gros »** (tigrés + 3 gros, 24 chats)
- Un gros arrive au-dessus d'une colonne de tigrés. En touchant un tigré, la chaîne part en biais et s'éteint. En touchant le gros, il descend toute la colonne.
- Découverte : la masse décide de la trajectoire de la chaîne.

**4-2 « Le chien »** (tigrés, gros, chatons, 2 chiens au milieu des grappes)
- Le joueur tire dans la grappe comme d'habitude : « WAF −5 », la chaîne s'arrête d'un côté.
- Découverte : il faut viser le côté de la grappe opposé au chien, pour que la ligne des centres l'évite.

**5-1 « Trouillard »** (tigrés + 4 trouillards isolés)
- Tirer sur un trouillard : il bondit et la pelote est perdue (le joueur croit à un bug).
- La ligne de visée montre le « ! » sur le trouillard et le bond prévu. Il comprend qu'il faut l'atteindre par un tigré voisin.
- Surprise cohérente : un trouillard qui esquive bondit parfois **dans** une chaîne en cours.

**6-3 « Bandes »** (boucliers en rideau + grappes en dessous)
- Le rideau de boucliers semble bloquer. En tirant un tigré dans le rideau, il rebondit sur le bouclier vers la grappe.
- Retournement : l'obstacle devient l'outil.

**9-5 « Grande averse fantôme »** (tout jusqu'au fantôme, 45 chats, 10 pelotes)
- La 3ᵉ patte demande d'attraper les 4 fantômes, et chacun coûte une pelote.
- Arbitrage : faire de grosses chaînes pour gagner des pelotes, puis les dépenser sur les fantômes.

## 13. Difficulté et apprentissage

- **Aucun tutoriel textuel.** L'averse 1-1 est construite pour qu'un tir dans la grappe soit presque inévitable.
- **Carte de caractère :** à la première apparition d'un caractère, un bandeau de 2 s apparaît sans pause : icône, nom et règle en 4 mots maximum (« Gros — traverse tout »). La même ligne est écrite dans le carnet.
- **La difficulté monte par la composition des formations,** jamais par la vitesse brute : la vitesse de chute reste dans une plage de ±20 % sur tout le jeu.
- **Ligne de visée :** pointillés de la pelote, rebonds compris, jusqu'au **premier** contact prédit (simulation avancée sur 1 s à partir de l'état courant). Au point de contact : cercle fantôme et flèche courte qui montre le départ du chat touché. Le reste de la chaîne n'est **pas** prédit, c'est la part de découverte et de spectacle. Si la cible est un trouillard qui va esquiver, un « ! » s'affiche et la flèche est barrée.

## 14. Échec et reprise

- On ne meurt pas. La seule défaite est **< 1 🐾** à la fin de l'averse : écran de fin, gros bouton **Rejouer** (même averse, relance en < 1 s), averse suivante verrouillée.
- Aucune ressource ne passe d'une averse à l'autre. Une averse ratée ne coûte rien de plus.

## 15. Surprises (dans l'ordre)

1. Ch.1 : la première cascade. Ce sont des chats qui volent.
2. Ch.2 : le gros traverse tout (échelle).
3. Ch.4 : WAF. Le chien était parmi les chats (perception).
4. Ch.5 : la pelote ne marche pas sur le trouillard (inversion).
5. Ch.6 : le bouclier sert de bande (une limite devient un outil).
6. Ch.7 : un chat qui ignore la gravité.
7. Ch.9 : le fantôme, qui inverse le ch.5. Désormais, c'est la chaîne qui ne marche pas.
8. Ch.10 : toucher la maman aspire toute la famille.

## 16. Monde et récit

Aucun récit. Le seul cadre : « il pleut des chats ». Les chats attrapés filent vers un panier en bas de l'écran (animation de fin de chaîne), et c'est tout.

## 17. Direction artistique

- On garde le style kawaii chibi existant et le pipeline de sprites (`CLAUDE.md`).
- **Les fonds sont discrets** (désaturés à ~60 %), pour que les chats et les colliers ressortent. Ce sont les seules couleurs saturées à l'écran.
- **Colliers** = codage couleur fixe des caractères (§8). Jamais réutilisé pour autre chose.
- Les boulets laissent une traînée courte de la couleur du collier. La traînée d'une chaîne à 5 ou plus devient arc-en-ciel.
- Le chien déguisé doit être reconnaissable **avant** d'être touché : oreilles tombantes et queue visible. Avec le sprite `faux` actuel, c'est à vérifier.

## 18. Animation

- Chute : pose `mid`, légère oscillation. Juste avant d'esquiver, le trouillard passe en pose `tro` pendant 0,2 s, ce qui annonce le bond.
- Boulet : pose `mid`, rotation proportionnelle à la vitesse.
- Fin de chaîne : chaque chat fait un arc vers le panier en 0,4 s, en léger décalage.
- **Ralenti** à la 5ᵉ capture d'une chaîne : ×0,5 pendant 0,6 s. Ça ne touche que l'horloge d'affichage : la simulation reste en ticks, et les tirs sont enregistrés au tick.
- Tremblement d'écran : `min(14, 2 × n)` px, en fin de chaîne.

## 19. Son

- **Chaque maillon joue une note d'une gamme pentatonique qui monte** : on entend la longueur de la chaîne sans la regarder.
- Chien : aboiement, et la gamme s'arrête net.
- Pelote rendue : carillon. Bouclier cassé : « tink » métallique. Fantôme traversé : souffle.
- Un miaulement par chaîne de 5 ou plus (`sfxMeow` existe).
- Musique : on garde la boucle actuelle. Elle baisse de 30 % pendant le ralenti.

## 20. Caméra

Fixe, portrait, plein écran. Aucun zoom ni défilement.

## 21. UI / UX

- **Haut :** barre de progression des chats attrapés avec les trois seuils 🐾 placés dessus. Score à droite.
- **Bas :** lanceur au centre, pelotes restantes en icônes à gauche, anneau de recharge autour du lanceur.
- **Fin d'averse :** 🐾×3, score, meilleure chaîne, rang au classement (« 12ᵉ sur 340 », ou « hors ligne »), boutons **Rejouer** (le plus gros) et **Suivante**.
- **Carte des averses :** grille par chapitre, pattes obtenues par averse, verrou sur les suivantes.
- **Carnet** (remplace le bestiaire) : une page par caractère avec sa règle et les costumes déjà vus.
- On supprime : le dial d'armes, le popup de déblocage d'arme, l'écran de level-up roguelite, les bannières d'événements et les cœurs.

## 22. Persistance

- **Local** (`localStorage`) : par averse, meilleures pattes, meilleur score et meilleure chaîne. Aussi : pages du carnet débloquées, pseudo, mode son.
- **Serveur** (classement) : par averse, la meilleure soumission par pseudo.

## 23. Classement (premier effet réseau)

- **Classement par averse** : top 50 et ton rang.
- **Soumission** = `{ averseId, pseudo, inputs: [(tick, angle_quantifié)], scoreDéclaré }`. Le serveur **rejoue la simulation** avec ces entrées et refuse la soumission si le score ne correspond pas. C'est l'anti-triche, et c'est pour ça que le déterminisme est obligatoire (§24).
- Pas de compte. Le pseudo est choisi à la première soumission et stocké en local, avec un identifiant d'appareil aléatoire pour éviter les doublons.
- Les replays et le défi par lien viennent ensuite (§28). Ils réutilisent le même journal d'entrées, sans serveur.

## 24. Contraintes techniques qui touchent le design

- Navigateur mobile, portrait, tactile. Le site reste statique sur GitHub Pages. Seul le classement passe par un petit serveur.
- **Déterminisme strict de la simulation :**
  - pas fixe de 120 Hz, entrées enregistrées au tick ;
  - PRNG seedé (ex. mulberry32) pour la génération. Aucun `Math.random` dans la simulation ;
  - angle de tir quantifié (0,1°) ;
  - **pas de `Math.sin/cos/atan2/pow/exp` dans la simulation** : leurs résultats peuvent varier d'un moteur JS à l'autre. Les oscillations utilisent une table précalculée et figée dans le code. La direction de tir est un vecteur normalisé (`sqrt` est correctement arrondi en IEEE 754, donc sûr). Le rendu peut utiliser ce qu'il veut ;
  - ordre d'itération stable (par `id`) pour toutes les collisions.
- Le même module de simulation (TS, sans DOM) tourne dans le client et sur le serveur.
- 60 fps de rendu visés sur un téléphone moyen. Jusqu'à 45 chats à l'écran.

## 25. Contenu requis

- 10 caractères : règles (§8) et colliers et icônes (dessinés par le moteur, pas de nouveau sprite).
- Pose `tro` déjà présente pour l'anticipation d'esquive.
- Générateur de formations (7 formations) et validation par simulation.
- 50 graines figées, une par averse.
- Sons : pentatonique (synthèse, `audio.ts`), aboiement, carillon, tink, souffle.
- 4 fonds existants, désaturés.

## 26. Cas limites

- Tir pendant le bandeau d'un caractère : autorisé, le bandeau ne met rien en pause.
- Tir avec 0 pelote : rien ne se passe, le lanceur clignote.
- Tir vers le bas (angle < 7°) : annulé, rien n'est consommé.
- Pelote qui touche le chien directement : −5, pelote absorbée, aucune chaîne.
- Une chaîne qui touche deux chiens : −5 chacun.
- Un boulet sort par le haut : impossible, le plafond rebondit.
- Un trouillard bondit contre un mur : il est bloqué au bord et peut alors être touché.
- Onglet caché en plein carambolage : la simulation est figée, puis reprend à l'identique.
- Fin d'averse pendant le ralenti : on attend la fin du ralenti avant l'écran de fin.
- Chaîne de plus de 30 : aucun plafond sur le score. Le n² fait partie du design.
- Soumission au classement hors ligne : mise en file d'attente, renvoyée à la prochaine fin d'averse en ligne.

## 27. Inconnues et risques

| Risque | Pourquoi c'est grave | Comment le lever |
|---|---|---|
| **Chance contre maîtrise** | Le joueur a voté pour le chaos, mais il veut un classement. Si deux bons tirs donnent 3 et 14, le classement récompense la chance. | Test : écart de score entre joueur expert et débutant sur la même averse (§29). Leviers : ligne de visée plus longue, transfert plus directionnel, moins de dispersion. |
| Ligne de visée trop assistée | Si elle prédit trop, la découverte meurt. | Elle ne montre que le premier contact. À tester avec et sans la flèche de départ. |
| Densité des formations | Trop dense : tout part au premier tir. Trop clairsemé : pas de chaîne. | Réglage par averse, et le validateur glouton borne le haut. |
| Lisibilité des costumes | Un « gros » déguisé en pompier pourrait se lire comme un tigré. | Colliers obligatoires. Test de lecture (§29). |
| Déterminisme cross-engine | Un classement rejeté à tort tue la confiance. | Test automatisé : même journal rejoué sous Node, Chromium et WebKit → même hash d'état. |
| Backend | Pas de serveur aujourd'hui. | **OPEN QUESTION**, ci-dessous. |

**OPEN QUESTION : hébergement du classement**
- Options : A. Cloudflare Worker + D1 (rejoue le TS directement, offre gratuite). B. Supabase (Postgres) + Edge Function Deno. C. Petit serveur Node + Postgres.
- Pourquoi ça compte : la vérification par rejeu doit exécuter le module de simulation exact.
- Penchant actuel : **A**. Le site reste sur GitHub Pages, et le Worker exécute le même module TS.
- Ce qui validerait : un rejeu de 90 s d'averse sous 50 ms CPU dans le Worker.

**OPEN QUESTION : nombre de pelotes**
- 8 pour 30 chats est une estimation. Il faut la régler sur le prototype : un joueur moyen doit faire 🐾 au premier essai, et 🐾🐾🐾 doit demander 3 à 5 essais.

## 28. Plan de prototype (ordre, pas de dates)

1. **P1. Le cœur.** Simulation déterministe (lois 1–7), tigré, gros, chaton, chien. Ligne de visée. Trois averses écrites à la main. Pas de menu, pas de serveur. *But : est-ce drôle et est-ce maîtrisable ?*
2. **P2. Le jeu.** Générateur de formations et validateur. Chapitres 1–5. Carte des averses, carnet, pattes, persistance locale. Le code mort de l'ancien jeu est supprimé.
3. **P3. Le classement.** Journal d'entrées, test de déterminisme cross-engine, serveur de rejeu, écran de rang.
4. **P4. Le reste du contenu.** Chapitres 6–10.
5. **P5. Partage.** Replay vidéo du meilleur coup (rejoué depuis le journal, capture du canvas), défi par lien (`?averse=…&score=…`).

Ce qu'on garde du code actuel : rendu des sprites, `audio.ts`, scènes de fond, menu, pipeline de sprites, `highscores.ts` (à transformer en meilleurs scores par averse), `bestiary.ts` (devient le carnet).
Ce qu'on supprime : artifice, laser, carton, catnip, dial d'armes, révélation d'arme, `levelup.ts` et les 22 améliorations, `LEVELS`, événements, objets-pièges, cœurs, attaquants, boss à PV, lucky, cheat code, mouvements calculés par image.

## 29. Critères de validation

```
PASS  Un nouveau joueur fait une chaîne ≥ 3 dans sa première averse sans aucune explication.
FAIL  Il tire chat par chat jusqu'à la fin.

PASS  Sur 5 essais de la même averse, le score d'un joueur progresse (il apprend l'averse).
FAIL  Les scores varient sans tendance.

PASS  Sur l'averse 2-3, la médiane des scores des 5 meilleurs joueurs-test est ≥ 2× celle des 5 débutants.
      Proxy automatique (bots) : ≥ 2× sur toute averse hors tutoriel ; sur le tutoriel 1-1, l'expert doit seulement battre le naïf.
FAIL  Écart < 1,5× : c'est la chance qui gagne, il faut revoir la propagation avant P3.

PASS  Montré un chat costumé avec son collier, un joueur qui a passé le ch.2 dit « gros » ou « normal » correctement 9 fois sur 10.
FAIL  Il se trompe plus d'une fois sur 10 : renforcer les colliers.

PASS  Le même journal d'entrées donne le même score et le même hash d'état sous Node, Chromium et WebKit.
FAIL  Un seul écart : pas de classement.

PASS  Après une averse ratée, le joueur appuie sur Rejouer dans les 3 s.
```

## 30. Contrat d'implémentation (à ne pas réinterpréter)

1. **Une seule arme, la pelote, à vitesse fixe.** Aucune charge, aucune amélioration, aucun deuxième projectile.
2. **Un chat touché est attrapé.** Il devient boulet et sa direction suit la ligne des centres. Pas de PV génériques.
3. **Les boulets ne se percutent pas entre eux.**
4. **Score = Σ n² par chaîne + 3 × pelotes restantes.** Les pattes dépendent uniquement du pourcentage de chats attrapés.
5. **Pas de mort, pas de cœurs, pas de game over.** On rate une averse, rien de plus.
6. **La simulation est déterministe** : pas fixe, PRNG seedé, aucune fonction transcendante, ordre stable. Un journal d'entrées suffit à reproduire une averse au bit près.
7. **La ligne de visée ne prédit que le premier contact.**
8. **Chaque caractère est reconnaissable par son collier**, quel que soit le costume. Un même costume ne porte jamais deux caractères dans une même averse.
9. **La simulation ne tourne pas quand un menu est ouvert ou l'onglet caché.**
10. **Aucun caractère ne modifie seulement les points.** S'il ne change pas la propagation, il n'existe pas.

---

*Mis de côté : « Fil de laine » (tour 2, apprécié). Une seule mécanique signature : le fil et le carambolage se disputeraient le même tir. On pourra y revenir si la validation §29 sur la chance échoue.*

## Écarts d'implémentation

- 2026-10-05 · §7 loi 3 : la formule de déviation du spec inversait l'effet des masses (un tapeur lourd aurait été plus dévié qu'un léger). Remplacée par le choc élastique `2·m_cible/(m_tapeur+m_cible)`.
- 2026-10-05 · §29 : la porte « chance / talent » s'applique hors tutoriel. Mesure P1 après revue (expert patient vs naïf qui vise juste une cible au hasard) : 2-1 = 2,67×, 4-2 = 3,02×, 1-1 = 1,60×. Le naïf varie fortement d'une graine à l'autre (22 à 178 sur 2-1) ; décision : le classement garde le meilleur score.
- 2026-10-05 · §7 loi 2 / §8 bouclier : un tapeur qui casse un bouclier est ignoré par ce bouclier tant qu'ils se chevauchent (sinon, sur un choc rasant, le même tapeur l'attrapait au tick suivant : « deux coups » en un). Un retour ultérieur du même tapeur reste un vrai second contact.
- 2026-10-05 · §7 lois 2–3 : un chat devenu boulet pendant la phase « boulets » d'un tick ne bouge qu'au tick suivant, quel que soit son id (l'id ne sert qu'à départager les égalités).
- 2026-10-05 · §24 : monde logique fixe 360×640, lanceur en (180, 610) ; angle de tir en dixièmes de degré entiers (900 = vers le haut).

