# Pluie de Chats — Guide Claude

Jeu mobile canvas 2D, **single-file** (`index.html` uniquement, ~5 Mo avec sprites base64 intégrés). Pas de build system, pas de bundler. Ouvrir directement dans le navigateur.

## Architecture

```
index.html
├── <style>          — CSS minimal, thème violet foncé (#1a0a2e)
└── <script>         — tout le jeu (~5000 lignes JS)
    ├── Constantes    — HUD_H, DIAL_R, DIAL_ANGLES, TYPE_ORDER, LEVELS, UPGRADES
    ├── CAT_TYPES[]   — 40+ types de chats avec pts/col/size/w/minLvl
    ├── OBJECT_TYPES[]— bombe, plume, souris (isObject:true obligatoire !)
    ├── PROJ_DEFS{}   — 5 armes : pelote, artifice, laser, catnip, carton
    ├── CAT_SPRITES{} — sprites chats base64 (22 types × 3 poses : sit/mid/tro)
    ├── WEAPON_SPRITES{} — sprites armes base64 (200×200 PNG RGBA)
    ├── OBJECT_SPRITES{} — sprites objets base64 (200×200 PNG RGBA)
    ├── Game loop     — requestAnimationFrame, dt en secondes
    ├── Draw fns      — drawCatShape, drawProjectileShape, drawInventory, drawEffect
    └── resetGame()   — remet TOUT à zéro (BASE_PROJ_DEFS comme source de vérité)
```

**Règle critique :** Tout ajout dans `OBJECT_TYPES` doit avoir `isObject:true` sinon `drawObject()` n'est jamais appelé (dispatch via `type.isObject` dans `drawCatShape`).

## Style visuel — Kawaii chibi

Tous les sprites (chats, armes, objets) suivent le même style :

```
Kawaii chibi [sujet] sticker illustration, smooth digital art, NOT pixel art,
bold clean black outlines, flat candy-pop colors, soft smooth shading,
pure white background, no frame no border no box, floating [character/object],
centered, big round head on tiny body (pour les personnages), anti-aliased clean edges
```

Génération via `~/.claude/scripts/generate_image.py` (Gemini primary, OpenAI fallback).

## Pipeline sprites

### 1. Génération
```bash
python3 ~/.claude/scripts/generate_image.py "PROMPT" /tmp/output.png
```
Gemini génère des images **1408×768** avec le sujet centré ~col 600-800.

### 2. Processing Python (PIL)
```python
from PIL import Image
import numpy as np, base64, io

def remove_white_bg(img, threshold=235):
    img = img.convert('RGBA')
    data = np.array(img)
    mask = (data[:,:,0]>threshold)&(data[:,:,1]>threshold)&(data[:,:,2]>threshold)
    data[mask,3] = 0
    return Image.fromarray(data,'RGBA')

def crop_to_content(img, padding=15):
    data = np.array(img)
    alpha = data[:,:,3]
    rows = np.any(alpha>10,axis=1); cols = np.any(alpha>10,axis=0)
    rmin,rmax = np.where(rows)[0][[0,-1]]; cmin,cmax = np.where(cols)[0][[0,-1]]
    h,w = img.height,img.width
    rmin,rmax = max(0,rmin-padding),min(h-1,rmax+padding)
    cmin,cmax = max(0,cmin-padding),min(w-1,cmax+padding)
    cropped = img.crop((cmin,rmin,cmax+1,rmax+1))
    cw,ch = cropped.size; side = max(cw,ch)
    square = Image.new('RGBA',(side,side),(0,0,0,0))
    square.paste(cropped,((side-cw)//2,(side-ch)//2))
    return square

img = Image.open('/tmp/output.png')
img = img.crop((320, 0, 1088, 768))  # centre 768×768 (ajuster si sujet décalé)
img = remove_white_bg(img)
img = crop_to_content(img)
img = img.resize((200,200), Image.LANCZOS)
buf = io.BytesIO(); img.save(buf,'PNG')
b64 = base64.b64encode(buf.getvalue()).decode()
```

**Cas particulier :** si la moitié droite de l'image est noire (artefact Gemini), cropper à `(0, 0, 700, 768)` au lieu du crop centré, et appliquer aussi `remove_dark_bg(threshold=60)`.

### 3. Injection dans index.html
- **Armes** → bloc `WEAPON_SPRITES['id']` (pattern existant)
- **Objets** → bloc `OBJECT_SPRITES['id']` (pattern existant)
- **Chats** → `CAT_SPRITES['id']` = array de 3 Images (sit/mid/tro)

Le script de génération de tous les chats est dans `scripts/gen_all_cats.sh`.

## Armes (PROJ_DEFS)

| id | Emoji | Vitesse | Gravité | Mécanique |
|---|---|---|---|---|
| pelote | 🧶 | [5,22] | normale | rebondit sur les bords (3 bounces) |
| artifice | 🎆 | [4,18] | ×0.7 | explose à `spd*30+rand*80` px de distance |
| laser | 🔴 | [20,20] | 0 | rayon instantané, frappe en ligne |
| catnip | 🌿 | [4,19] | normale | cloud qui étourdit |
| carton | 📦 | [4,19] | normale | aspire les chats dans un rayon |

`BASE_PROJ_DEFS` = source de vérité pour le reset. Toujours ajouter les nouveaux champs là-dedans.

## Chats

- **Spawn** : `spawnCat()` tire dans `CAT_TYPES` filtré par `minLvl <= level` et pondéré par `w`
- **Objets** : `spawnObject()` toutes les 8-18s, 1 sur 3 chance d'être une bombe
- **Dégâts joueur** : griffeur (fonce), crachat (boules de poils), bombe attrapée/tombée en bas
- **Système de poses** : `poseIdx` 0=sit, 1=mid (saut), 2=tro (trot) — assigné aléatoirement au spawn

## Système de progression

- **Score** → niveaux (LEVELS[] avec thresholds 20/50/90/150/220/320/450/620/840)
- **Level-up** → écran roguelite : 3 cartes d'upgrade à choisir
- **Armes débloquées** : artifice à 15pts, laser à 30pts, catnip à 80pts, carton à 150pts

## Pièges fréquents

- **Sprites non visibles** : vérifier `isObject:true` dans les types, et que `OBJECT_SPRITES`/`WEAPON_SPRITES` sont déclarés AVANT la game loop
- **Upgrades persistant entre parties** : tout reset doit passer par `BASE_PROJ_DEFS` dans `resetGame()`
- **Boucle de niveau skippée** : les level-ups utilisent `pendingLevelUps[]` queue, ne jamais appeler `showLevelUpScreen` directement
- **Cheat code** : taper "pluie" débloque tout + munitions infinies (`upgradeFlags.cheatMode`)

## Direction du jeu

Jeu mobile portrait, lanceur en bas au centre (slingshot). Ambiance kawaii/chibi colorée, fun et accessible. Pas de game over brutal — vies visuelles (❤️), slow-mo sur dernière vie.

**Prochaines idées possibles :**
- Nouvelles armes (filet, aspirateur, aimant)
- Événements spéciaux (pluie de chats × 10, invasion boss)
- Système de combo plus élaboré (streak visuel)
- Nouveaux objets tombants (bonbons bonus, étoiles)
- Animations d'entrée pour les chats (spirale, bounce-in)
