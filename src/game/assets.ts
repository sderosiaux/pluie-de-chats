// Chargement des sprites depuis public/. Le site est servi sous un sous-chemin (GitHub Pages) :
// toutes les URL passent par import.meta.env.BASE_URL.

import type { AverseDef } from '../sim';

export type Pose = 'sit' | 'mid' | 'tro';
const POSES: readonly Pose[] = ['sit', 'mid', 'tro'];
const SCENES = ['garden', 'city', 'home', 'forest'] as const;
export type Scene = (typeof SCENES)[number];

/** Décor d'un chapitre : les 4 scènes tournent (§10, cosmétique). */
export function sceneFor(chapter: number): Scene {
  return SCENES[(((chapter - 1) % SCENES.length) + SCENES.length) % SCENES.length];
}

export interface Assets {
  cat(costume: string, pose: Pose): HTMLImageElement;
  pelote: HTMLImageElement;
  /** Bandeau de décor désaturé (§17), largeur native. */
  scenery: HTMLCanvasElement;
  /** Couleur moyenne de la dernière ligne opaque du décor : prolonge le sol sous le monde. */
  ground: string;
}

const BASE = import.meta.env.BASE_URL;

export const sceneUrl = (scene: Scene): string => `${BASE}sprites/scenery/${scene}.png`;
export const costumeUrl = (costume: string, pose: Pose): string => `${BASE}sprites/cats/${costume}_${pose}.png`;

function loadImage(path: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Sprite introuvable : ${BASE}${path}`));
    img.src = `${BASE}${path}`;
  });
}

/** Désature à ~60 % (§17) : mélange chaque pixel avec sa luminance. */
function desaturate(img: HTMLImageElement, amount: number): { canvas: HTMLCanvasElement; ground: string } {
  const c = document.createElement('canvas');
  c.width = img.naturalWidth;
  c.height = img.naturalHeight;
  const g = c.getContext('2d');
  if (!g) throw new Error('Canvas 2D indisponible');
  g.drawImage(img, 0, 0);
  const data = g.getImageData(0, 0, c.width, c.height);
  const p = data.data;
  for (let i = 0; i < p.length; i += 4) {
    const l = 0.299 * p[i] + 0.587 * p[i + 1] + 0.114 * p[i + 2];
    p[i] += (l - p[i]) * amount;
    p[i + 1] += (l - p[i + 1]) * amount;
    p[i + 2] += (l - p[i + 2]) * amount;
  }
  g.putImageData(data, 0, 0);
  // Sol : moyenne des pixels opaques et clairs des 16 dernières lignes. Les contours noirs du décor
  // (trait de sol) sont écartés, sinon la bande sous le monde virerait au gris foncé.
  let r = 0, gg = 0, b = 0, n = 0;
  for (let y = Math.max(0, c.height - 16); y < c.height; y++) {
    for (let x = 0; x < c.width; x++) {
      const i = (y * c.width + x) * 4;
      if (p[i + 3] < 200 || 0.299 * p[i] + 0.587 * p[i + 1] + 0.114 * p[i + 2] < 110) continue;
      r += p[i]; gg += p[i + 1]; b += p[i + 2]; n++;
    }
  }
  const ground = n ? `rgb(${Math.round(r / n)},${Math.round(gg / n)},${Math.round(b / n)})` : 'transparent';
  return { canvas: c, ground };
}

const cache = new Map<string, HTMLImageElement>();
const sceneryCache = new Map<string, { canvas: HTMLCanvasElement; ground: string }>();

async function get(path: string): Promise<HTMLImageElement> {
  const hit = cache.get(path);
  if (hit) return hit;
  const img = await loadImage(path);
  cache.set(path, img);
  return img;
}

/**
 * Charge les costumes de l'averse (plus `extra`, ex. costumes rares), la pelote et le décor du chapitre.
 * Rejette si un fichier manque.
 */
export async function loadAssets(averse: AverseDef, extra: Iterable<string> = []): Promise<Assets> {
  const costumes = [...new Set([...averse.spawns.map(s => s.costume), ...extra])];
  const scene = sceneFor(averse.chapter);
  const [pelote, sceneImg] = await Promise.all([
    get('sprites/weapons/pelote.png'),
    get(`sprites/scenery/${scene}.png`),
    ...costumes.flatMap(c => POSES.map(p => get(`sprites/cats/${c}_${p}.png`))),
  ]);
  let scenery = sceneryCache.get(scene);
  if (!scenery) {
    scenery = desaturate(sceneImg, 0.6);
    sceneryCache.set(scene, scenery);
  }
  return {
    pelote,
    scenery: scenery.canvas,
    ground: scenery.ground,
    cat(costume, pose) {
      const img = cache.get(`sprites/cats/${costume}_${pose}.png`);
      if (!img) throw new Error(`Costume non préchargé : ${costume}_${pose}`);
      return img;
    },
  };
}
