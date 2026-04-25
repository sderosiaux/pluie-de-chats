#!/bin/bash
BASE="Kawaii chibi cat sticker illustration, smooth digital art, NOT pixel art, bold clean black outlines, flat candy-pop colors, soft smooth shading, pure white background, no frame no border no box, floating character, centered, big round head on tiny body, anti-aliased clean edges"
OUT=~/Desktop/sprites_prof
mkdir -p "$OUT"
POSES=("sit" "mid" "tro")
POSE_DESC=(
  "sitting upright facing forward tail curled beside body"
  "mid-jump leaping paws spread wide surprised happy expression tail puffed"
  "trotting sideways one front paw raised tail up looking at viewer"
)

declare -A CAT_DESC
CAT_DESC[pompier]="orange cat wearing a red firefighter helmet and tiny yellow jacket with reflective stripes"
CAT_DESC[boulanger]="cream cat wearing a white baker tall hat and flour-dusted apron holding a tiny baguette"
CAT_DESC[ninja]="black cat wearing a dark ninja mask headband only eyes visible crouching stealthy pose"
CAT_DESC[detective]="grey cat wearing a brown detective trench coat and deerstalker hat holding a magnifying glass"
CAT_DESC[pirate]="tawny cat wearing a black pirate tricorn hat eye patch striped shirt with tiny anchor tattoo"
CAT_DESC[policier]="blue cat wearing a navy police cap and badge on chest confident expression"
CAT_DESC[magicien]="purple cat wearing a tall sparkly wizard hat and cape with stars and moons wand with glowing tip"
CAT_DESC[cowboy]="caramel cat wearing a big brown cowboy hat neckerchief and tiny boots with spurs"
CAT_DESC[viking]="brown cat wearing a horned viking helmet fur vest braided beard tiny axe"
CAT_DESC[sorciere]="dark purple cat wearing a pointy black witch hat tattered cape on a tiny broomstick with stars"
CAT_DESC[marin]="navy blue cat wearing a sailor striped shirt white navy cap with anchor symbol"
CAT_DESC[gamer]="dark grey cat wearing large gaming headphones glowing LED collar holding a tiny controller"
CAT_DESC[scientifique]="white cat wearing round glasses and lab coat holding a bubbling test tube with colorful liquids"
CAT_DESC[artiste]="pink cat wearing a beret holding a tiny paintbrush with colorful paint smudges on paws"
CAT_DESC[jardinier]="green cat wearing a straw hat holding a tiny watering can with flowers growing around"
CAT_DESC[chevalier]="silver-grey cat wearing a shiny knight helmet with visor up holding a tiny sword and round shield"
CAT_DESC[musicien]="orange cat wearing headphones holding a tiny electric guitar with musical notes floating around"
CAT_DESC[cuisinier]="yellow cat wearing a tall white chef hat and apron holding a tiny pan with food jumping out"
CAT_DESC[clown]="white cat with colorful clown makeup rainbow wig red nose holding a tiny balloon animal"
CAT_DESC[robot]="grey metallic cat with glowing LED eyes panel on chest antennae with blinking lights"
CAT_DESC[sportif]="red cat wearing a sporty headband and jersey with sneakers in dynamic running pose"
CAT_DESC[professeur]="blue cat wearing square glasses and a mortarboard graduation cap holding a tiny book"
CAT_DESC[facteur]="yellow cat wearing a postman cap carrying a tiny mailbag with envelopes"
CAT_DESC[samourai]="dark red cat wearing traditional samurai kabuto helmet and kimono with tiny katana"
CAT_DESC[infirmier]="light blue cat wearing a nurse cap with red cross and scrubs holding a tiny clipboard"

CATS=(pompier boulanger ninja detective pirate policier magicien cowboy viking sorciere marin gamer scientifique artiste jardinier chevalier musicien cuisinier clown robot sportif professeur facteur samourai infirmier)

for cat in "${CATS[@]}"; do
  for i in 0 1 2; do
    pose="${POSES[$i]}"
    pose_desc="${POSE_DESC[$i]}"
    desc="${CAT_DESC[$cat]}"
    outfile="$OUT/${cat}_${pose}.png"
    if [ ! -f "$outfile" ]; then
      python3 ~/.claude/scripts/generate_image.py "$BASE, $desc, $pose_desc" "$outfile" &
    else
      echo "skip $outfile (exists)"
    fi
  done
done
wait
echo "done: $(ls $OUT/*.png 2>/dev/null | wc -l) files"
