#!/bin/bash
BASE="Kawaii chibi cat sticker illustration, smooth digital art, NOT pixel art, bold clean black outlines, flat candy-pop colors, soft smooth shading, pure white background, no frame no border no box, floating character, centered, big round head on tiny body, anti-aliased clean edges"
OUT=~/Desktop/sprites
POSES=("sit" "mid" "tro")
POSE_DESC=(
  "sitting upright facing forward tail curled beside body"
  "mid-jump leaping paws spread wide surprised happy expression tail puffed"
  "trotting sideways one front paw raised tail up looking at viewer"
)

declare -A CAT_DESC
CAT_DESC[tabby]="orange tabby cat with dark orange stripes"
CAT_DESC[noir]="solid black cat with tiny white chest patch"
CAT_DESC[blanc]="fluffy all-white cat with blue eyes"
CAT_DESC[gris]="grey tabby cat with dark grey stripes"
CAT_DESC[fantome]="ghost cat semi-transparent white glowing body big round hollow eyes floating wispy tail no legs"
CAT_DESC[astro]="orange tabby cat wearing round astronaut space helmet tiny body in orange spacesuit"
CAT_DESC[rainbow]="magical cat with rainbow-colored fur stripes pastel pink blue yellow purple sparkles"
CAT_DESC[micro]="tiny chibi orange tabby cat very small cute proportions"
CAT_DESC[faux]="cute chibi corgi dog disguised as a cat wearing fake cat ears headband fluffy orange fur big dark eyes"
CAT_DESC[zigzag]="energetic orange striped cat with wild fur sticking out dizzy swirl eyes"
CAT_DESC[rapide]="small red cat with speed lines whoosh effect determined squinting eyes aerodynamic pose"
CAT_DESC[bouclier]="blue cat holding a tiny round shield determined expression armor markings"
CAT_DESC[furtif]="dark purple cat with big yellow alert eyes sneaky expression"
CAT_DESC[boss]="large red fluffy cat wearing a golden crown evil grin imposing big body"
CAT_DESC[crachat]="green cat with puffy cheeks about to spit cheeky mischievous expression"
CAT_DESC[griffeur]="orange cat with claws extended showing sharp nails fierce playful expression"
CAT_DESC[medecin]="white cat wearing tiny doctor stethoscope and medical cross friendly kind expression"
CAT_DESC[persan]="extremely fluffy cream persian cat with flat smooshed face squinted eyes very round fluffy body"
CAT_DESC[scottish]="grey scottish fold cat with distinctive folded flat ears calm dignified expression"
CAT_DESC[siamois]="siamese cat with cream body dark brown face ears paws blue eyes"
CAT_DESC[sphynx]="sphynx hairless cat wrinkled skin big ears wide eyes"
CAT_DESC[bengal]="bengal cat with leopard rosette spots golden fur"

for cat in tabby noir blanc gris fantome astro rainbow micro faux zigzag rapide bouclier furtif boss crachat griffeur medecin persan scottish siamois sphynx bengal; do
  for i in 0 1 2; do
    pose="${POSES[$i]}"
    pose_desc="${POSE_DESC[$i]}"
    desc="${CAT_DESC[$cat]}"
    python3 ~/.claude/scripts/generate_image.py "$BASE, $desc, $pose_desc" $OUT/${cat}_${pose}.png &
  done
done
wait
echo "done: $(ls $OUT | wc -l) files"
