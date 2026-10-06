# Pluie de Chats — Guide Claude

Jeu mobile canvas 2D (Vite + TypeScript strict). Le design fait foi : **`GAME_SPEC.md`**, en particulier le contrat §30 et les règles de déterminisme §24. Toute décision d'implémentation qui s'en écarte est consignée en bas du spec (« Écarts d'implémentation »), jamais ailleurs.

## Architecture

- `src/sim/` — simulation déterministe, partagée avec le serveur du classement. Elle ne connaît ni l'écran ni l'horloge : monde fixe 360×640, pas de 1/120 s, entrées = angle entier en dixièmes de degré. Pas d'aléa à l'exécution : tout vient de l'averse (graine).
- `src/game/` — client : rendu, entrées, son. Ne modifie la sim que par `tryShoot` et `step`.
- `src/bots/` — joueurs automatiques : mesure « chance / talent » (§29) et validation des averses générées.
- `e2e/` — Playwright (Chromium + WebKit) sur un build de test (`VITE_DEBUG=1`, outils `?debug`).

## Règles qui ne se voient pas dans le code

- **Déterminisme.** Dans `src/sim`, ESLint refuse `Math.sin/cos/atan2/pow/random…`, `**`, `Date`, `performance`, les alias de `Math` et tout import hors de `src/sim` : leurs résultats peuvent différer d'un moteur JS à l'autre, et le serveur rejoue les parties pour valider les scores. Utiliser `fmath.ts`.
- **Toute modification de la physique invalide les données figées.** Relancer `npm run fixtures` (journaux de référence et leur hash) puis `npm run freeze-chapters -- <chapitreMax>` (graines de campagne, validées par simulation), et vérifier que les portes chance/talent passent encore (`npx vitest run src/bots`).
- **Une graine de campagne n'est retenue que si** l'expert fait 3 pattes ET plus de 2,2× le naïf (sauf le tutoriel 1-1). Ne pas assouplir ces seuils pour faire passer une averse : changer le générateur.
- **`main` déploie en production** (GitHub Pages). La CI (`.github/workflows/ci.yml`) lance lint, tests et E2E ; le hook pre-commit lance `npm run check`.

## Commandes
`npm run check` · `npx vitest run` · `npx playwright test` · `npm run build` · `npm run fixtures` · `npm run freeze-chapters -- 5`

## Style visuel — Kawaii chibi

Tous les sprites (chats, armes, objets) suivent le même style. **Le prompt DOIT inclure
les négatifs ci-dessous sinon Gemini retourne régulièrement des artefacts (2 sujets,
fenêtre Photoshop, sujet coupé, halo sticker blanc).**

```
SUBJECT: a single ONE [sujet], exactly one subject, alone in the frame.

STYLE: Kawaii chibi sticker illustration, smooth digital art, NOT pixel art,
bold clean black outlines integrated into the shape (no outer white halo),
flat candy-pop colors, soft smooth shading, anti-aliased clean edges,
big round head on tiny body (pour les personnages).

COMPOSITION: subject perfectly centered, fully visible from head to toe,
generous empty margin (~20%) on all four sides, NOTHING touching the edges,
no cropping, no zoom-in, no close-up.

BACKGROUND: pure flat white background only (#FFFFFF), nothing else.

STRICT NEGATIVES — DO NOT INCLUDE ANY OF THESE:
- no second subject, no duplicate, no twin, no group, no pair, no reflection
- no UI, no window, no application interface, no Photoshop / Illustrator / Figma chrome,
  no toolbar, no panel, no menu bar, no software screenshot, no mockup frame
- no picture frame, no border, no box, no card, no rounded rectangle around the subject
- no white sticker outline / die-cut halo / outer glow / drop shadow
- no text, no labels, no watermark, no logo, no signature
- no checkered transparency pattern, no grid, no gradient background
```

Génération via `~/.claude/scripts/generate_image.py` (Gemini primary, OpenAI fallback).
**Toujours** réutiliser ce template. Si le résultat sort raté, regen sans relâcher les
contraintes — ne jamais simplifier le prompt pour "voir ce que ça donne".

## Pipeline sprites

### 1. Génération
```bash
python3 ~/.claude/scripts/generate_image.py "PROMPT" /tmp/output.png
```
Gemini génère des images **1408×768** avec le sujet centré ~col 600-800.

### 2. Processing Python (PIL)
```python
from PIL import Image
import numpy as np

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
img.save('public/sprites/cats/<costume>_<pose>.png')
```

**Cas particulier :** si la moitié droite de l'image est noire (artefact Gemini), cropper à `(0, 0, 700, 768)` au lieu du crop centré, et appliquer aussi `remove_dark_bg(threshold=60)`.

### 3. Où vont les sprites
PNG dans `public/sprites/{cats,weapons,objects}/`, chargés via `import.meta.env.BASE_URL` (le site est servi sous `/pluie-de-chats/`). Chats : `<costume>_{sit,mid,tro}.png`. Le costume → caractère est dans `src/sim/costumes.ts` (§8 : un costume ne porte qu'un caractère par averse).
