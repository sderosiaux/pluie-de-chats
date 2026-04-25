// @ts-nocheck
// Tous les chargements de sprites. Fichiers PNG servis depuis /sprites/ par Vite.

const CAT_SPRITES = {};
(function() {
  const defs = {
    astro: ['/sprites/cats/astro_sit.png','/sprites/cats/astro_mid.png','/sprites/cats/astro_tro.png'],
    bengal: ['/sprites/cats/bengal_sit.png','/sprites/cats/bengal_mid.png','/sprites/cats/bengal_tro.png'],
    blanc: ['/sprites/cats/blanc_sit.png','/sprites/cats/blanc_mid.png','/sprites/cats/blanc_tro.png'],
    boss: ['/sprites/cats/boss_sit.png','/sprites/cats/boss_mid.png','/sprites/cats/boss_tro.png'],
    bouclier: ['/sprites/cats/bouclier_sit.png','/sprites/cats/bouclier_mid.png','/sprites/cats/bouclier_tro.png'],
    crachat: ['/sprites/cats/crachat_sit.png','/sprites/cats/crachat_mid.png','/sprites/cats/crachat_tro.png'],
    fantome: ['/sprites/cats/fantome_sit.png','/sprites/cats/fantome_mid.png','/sprites/cats/fantome_tro.png'],
    faux: ['/sprites/cats/faux_sit.png','/sprites/cats/faux_mid.png','/sprites/cats/faux_tro.png'],
    furtif: ['/sprites/cats/furtif_sit.png','/sprites/cats/furtif_mid.png','/sprites/cats/furtif_tro.png'],
    griffeur: ['/sprites/cats/griffeur_sit.png','/sprites/cats/griffeur_mid.png','/sprites/cats/griffeur_tro.png'],
    gris: ['/sprites/cats/gris_sit.png','/sprites/cats/gris_mid.png','/sprites/cats/gris_tro.png'],
    medecin: ['/sprites/cats/medecin_sit.png','/sprites/cats/medecin_mid.png','/sprites/cats/medecin_tro.png'],
    micro: ['/sprites/cats/micro_sit.png','/sprites/cats/micro_mid.png','/sprites/cats/micro_tro.png'],
    noir: ['/sprites/cats/noir_sit.png','/sprites/cats/noir_mid.png','/sprites/cats/noir_tro.png'],
    persan: ['/sprites/cats/persan_sit.png','/sprites/cats/persan_mid.png','/sprites/cats/persan_tro.png'],
    rainbow: ['/sprites/cats/rainbow_sit.png','/sprites/cats/rainbow_mid.png','/sprites/cats/rainbow_tro.png'],
    rapide: ['/sprites/cats/rapide_sit.png','/sprites/cats/rapide_mid.png','/sprites/cats/rapide_tro.png'],
    scottish: ['/sprites/cats/scottish_sit.png','/sprites/cats/scottish_mid.png','/sprites/cats/scottish_tro.png'],
    siamois: ['/sprites/cats/siamois_sit.png','/sprites/cats/siamois_mid.png','/sprites/cats/siamois_tro.png'],
    sphynx: ['/sprites/cats/sphynx_sit.png','/sprites/cats/sphynx_mid.png','/sprites/cats/sphynx_tro.png'],
    tabby: ['/sprites/cats/tabby_sit.png','/sprites/cats/tabby_mid.png','/sprites/cats/tabby_tro.png'],
    zigzag: ['/sprites/cats/zigzag_sit.png','/sprites/cats/zigzag_mid.png','/sprites/cats/zigzag_tro.png'],
    pompier: ['/sprites/cats/pompier_sit.png','/sprites/cats/pompier_mid.png','/sprites/cats/pompier_tro.png'],
    boulanger: ['/sprites/cats/boulanger_sit.png','/sprites/cats/boulanger_mid.png','/sprites/cats/boulanger_tro.png'],
    ninja: ['/sprites/cats/ninja_sit.png','/sprites/cats/ninja_mid.png','/sprites/cats/ninja_tro.png'],
    detective: ['/sprites/cats/detective_sit.png','/sprites/cats/detective_mid.png','/sprites/cats/detective_tro.png'],
    pirate: ['/sprites/cats/pirate_sit.png','/sprites/cats/pirate_mid.png','/sprites/cats/pirate_tro.png'],
    policier: ['/sprites/cats/policier_sit.png','/sprites/cats/policier_mid.png','/sprites/cats/policier_tro.png'],
    magicien: ['/sprites/cats/magicien_sit.png','/sprites/cats/magicien_mid.png','/sprites/cats/magicien_tro.png'],
    cowboy: ['/sprites/cats/cowboy_sit.png','/sprites/cats/cowboy_mid.png','/sprites/cats/cowboy_tro.png'],
    viking: ['/sprites/cats/viking_sit.png','/sprites/cats/viking_mid.png','/sprites/cats/viking_tro.png'],
    sorciere: ['/sprites/cats/sorciere_sit.png','/sprites/cats/sorciere_mid.png','/sprites/cats/sorciere_tro.png'],
    marin: ['/sprites/cats/marin_sit.png','/sprites/cats/marin_mid.png','/sprites/cats/marin_tro.png'],
    gamer: ['/sprites/cats/gamer_sit.png','/sprites/cats/gamer_mid.png','/sprites/cats/gamer_tro.png'],
    scientifique: ['/sprites/cats/scientifique_sit.png','/sprites/cats/scientifique_mid.png','/sprites/cats/scientifique_tro.png'],
    artiste: ['/sprites/cats/artiste_sit.png','/sprites/cats/artiste_mid.png','/sprites/cats/artiste_tro.png'],
    jardinier: ['/sprites/cats/jardinier_sit.png','/sprites/cats/jardinier_mid.png','/sprites/cats/jardinier_tro.png'],
    chevalier: ['/sprites/cats/chevalier_sit.png','/sprites/cats/chevalier_mid.png','/sprites/cats/chevalier_tro.png'],
    musicien: ['/sprites/cats/musicien_sit.png','/sprites/cats/musicien_mid.png','/sprites/cats/musicien_tro.png'],
    cuisinier: ['/sprites/cats/cuisinier_sit.png','/sprites/cats/cuisinier_mid.png','/sprites/cats/cuisinier_tro.png'],
    clown: ['/sprites/cats/clown_sit.png','/sprites/cats/clown_mid.png','/sprites/cats/clown_tro.png'],
    robot: ['/sprites/cats/robot_sit.png','/sprites/cats/robot_mid.png','/sprites/cats/robot_tro.png'],
    sportif: ['/sprites/cats/sportif_sit.png','/sprites/cats/sportif_mid.png','/sprites/cats/sportif_tro.png'],
    professeur: ['/sprites/cats/professeur_sit.png','/sprites/cats/professeur_mid.png','/sprites/cats/professeur_tro.png'],
    facteur: ['/sprites/cats/facteur_sit.png','/sprites/cats/facteur_mid.png','/sprites/cats/facteur_tro.png'],
    samourai: ['/sprites/cats/samourai_sit.png','/sprites/cats/samourai_mid.png','/sprites/cats/samourai_tro.png'],
    infirmier: ['/sprites/cats/infirmier_sit.png','/sprites/cats/infirmier_mid.png','/sprites/cats/infirmier_tro.png'],
      batman: ['/sprites/cats/batman_sit.png','/sprites/cats/batman_mid.png','/sprites/cats/batman_tro.png'],
    catwoman: ['/sprites/cats/catwoman_sit.png','/sprites/cats/catwoman_mid.png','/sprites/cats/catwoman_tro.png'],
    flash: ['/sprites/cats/flash_sit.png','/sprites/cats/flash_mid.png','/sprites/cats/flash_tro.png'],
    hulk: ['/sprites/cats/hulk_sit.png','/sprites/cats/hulk_mid.png','/sprites/cats/hulk_tro.png'],
    spiderman: ['/sprites/cats/spiderman_sit.png','/sprites/cats/spiderman_mid.png','/sprites/cats/spiderman_tro.png'],
    superman: ['/sprites/cats/superman_sit.png','/sprites/cats/superman_mid.png','/sprites/cats/superman_tro.png'],
};
  for (const [id, srcs] of Object.entries(defs)) {
    CAT_SPRITES[id] = srcs.map(src => { const img = new Image(); img.src = src; return img; });
  }
})();

const WEAPON_SPRITES = {};
WEAPON_SPRITES['pelote'] = (() => { const i = new Image(); i.src = '/sprites/weapons/pelote.png'; return i; })();
WEAPON_SPRITES['artifice'] = (() => { const i = new Image(); i.src = '/sprites/weapons/artifice.png'; return i; })();
WEAPON_SPRITES['laser'] = (() => { const i = new Image(); i.src = '/sprites/weapons/laser.png'; return i; })();
WEAPON_SPRITES['carton'] = (() => { const i = new Image(); i.src = '/sprites/weapons/carton.png'; return i; })();

const OBJECT_SPRITES = {};
OBJECT_SPRITES['bombe'] = (() => { const i = new Image(); i.src = '/sprites/objects/bombe.png'; return i; })();
OBJECT_SPRITES['plume'] = (() => { const i = new Image(); i.src = '/sprites/objects/plume.png'; return i; })();
OBJECT_SPRITES['souris'] = (() => { const i = new Image(); i.src = '/sprites/objects/souris.png'; return i; })();
OBJECT_SPRITES['chien'] = (() => { const i = new Image(); i.src = '/sprites/objects/chien.png'; return i; })();
OBJECT_SPRITES['flaque'] = (() => { const i = new Image(); i.src = '/sprites/objects/flaque.png'; return i; })();
OBJECT_SPRITES['piment'] = (() => { const i = new Image(); i.src = '/sprites/objects/piment.png'; return i; })();
OBJECT_SPRITES['aspirateur'] = (() => { const i = new Image(); i.src = '/sprites/objects/aspirateur.png'; return i; })();

const BG_SPRITES = {};
BG_SPRITES.city = new Image();
BG_SPRITES.city.src = '/sprites/scenery/city.png';
BG_SPRITES.garden = new Image();
BG_SPRITES.garden.src = '/sprites/scenery/garden.png';
BG_SPRITES.home = new Image();
BG_SPRITES.home.src = '/sprites/scenery/home.png';
BG_SPRITES.forest = new Image();
BG_SPRITES.forest.src = '/sprites/scenery/forest.png';

const MOON_SPRITE = new Image();
MOON_SPRITE.src = '/sprites/scenery/moon.png';

export { CAT_SPRITES, WEAPON_SPRITES, OBJECT_SPRITES, BG_SPRITES, MOON_SPRITE };
