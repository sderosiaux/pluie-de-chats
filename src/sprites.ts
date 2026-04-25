// Tous les chargements de sprites. PNG servis depuis /sprites/ par Vite.

function loadImage(src: string): HTMLImageElement {
  const i = new Image();
  i.src = src;
  return i;
}

const CAT_IDS = [
  'astro','bengal','blanc','boss','bouclier','crachat','fantome','faux',
  'furtif','griffeur','gris','medecin','micro','noir','persan','rainbow',
  'rapide','scottish','siamois','sphynx','tabby','zigzag',
  'pompier','boulanger','ninja','detective','pirate','policier','magicien',
  'cowboy','viking','sorciere','marin','gamer','scientifique','artiste',
  'jardinier','chevalier','musicien','cuisinier','clown','robot','sportif',
  'professeur','facteur','samourai','infirmier',
  'batman','catwoman','flash','hulk','spiderman','superman',
];

export const CAT_SPRITES: Record<string, HTMLImageElement[]> = {};
for (const id of CAT_IDS) {
  CAT_SPRITES[id] = ['sit', 'mid', 'tro'].map(p => loadImage(`/sprites/cats/${id}_${p}.png`));
}

export const WEAPON_SPRITES: Record<string, HTMLImageElement> = {
  pelote:   loadImage('/sprites/weapons/pelote.png'),
  artifice: loadImage('/sprites/weapons/artifice.png'),
  laser:    loadImage('/sprites/weapons/laser.png'),
  carton:   loadImage('/sprites/weapons/carton.png'),
};

export const OBJECT_SPRITES: Record<string, HTMLImageElement> = {
  bombe:      loadImage('/sprites/objects/bombe.png'),
  plume:      loadImage('/sprites/objects/plume.png'),
  souris:     loadImage('/sprites/objects/souris.png'),
  chien:      loadImage('/sprites/objects/chien.png'),
  flaque:     loadImage('/sprites/objects/flaque.png'),
  piment:     loadImage('/sprites/objects/piment.png'),
  aspirateur: loadImage('/sprites/objects/aspirateur.png'),
};

export const BG_SPRITES: Record<string, HTMLImageElement> = {
  city:   loadImage('/sprites/scenery/city.png'),
  garden: loadImage('/sprites/scenery/garden.png'),
  home:   loadImage('/sprites/scenery/home.png'),
  forest: loadImage('/sprites/scenery/forest.png'),
};

export const MOON_SPRITE = loadImage('/sprites/scenery/moon.png');
