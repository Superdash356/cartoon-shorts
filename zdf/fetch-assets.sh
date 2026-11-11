#!/usr/bin/env bash
# Downloads the assets the 3D explainer engine needs into zdf/assets (not committed):
#   - the person: a Microsoft Rocketbox avatar (MIT licence, github.com/microsoft/Microsoft-Rocketbox)
#   - the lighting map: royal_esplanade_1k.hdr (Poly Haven, CC0) from the three.js examples
# usage: bash zdf/fetch-assets.sh [avatar folder, default Adults/Male_Adult_08] [texture prefix, default m014]
set -euo pipefail
AV="${1:-Adults/Male_Adult_08}"; PRE="${2:-m014}"; NAME="$(basename "$AV")"
HERE="$(cd "$(dirname "$0")" && pwd)"; OUT="$HERE/assets"; TMP="$(mktemp -d)"
RB="https://raw.githubusercontent.com/microsoft/Microsoft-Rocketbox/master/Assets/Avatars/$AV"
mkdir -p "$OUT/human"
[ -s "$OUT/studio.hdr" ] || curl -fsSL --retry 3 -o "$OUT/studio.hdr" https://raw.githubusercontent.com/mrdoob/three.js/r170/examples/textures/equirectangular/royal_esplanade_1k.hdr
if [ ! -s "$OUT/human/human.fbx" ] || [ ! -s "$OUT/human/opacity_color.png" ]; then
  curl -fsSL --retry 3 -o "$OUT/human/human.fbx" "$RB/Export/${NAME}_facial.fbx"
  for t in body_color body_normal body_specular head_color head_normal head_specular opacity_color; do curl -fsSL --retry 3 -o "$TMP/$t.tga" "$RB/Textures/${PRE}_$t.tga" & done; wait
  for t in body head; do
    ffmpeg -v error -y -i "$TMP/${t}_color.tga" -q:v 2 "$OUT/human/${t}_color.jpg"
    ffmpeg -v error -y -i "$TMP/${t}_normal.tga" "$OUT/human/${t}_normal.png"
    ffmpeg -v error -y -i "$TMP/${t}_specular.tga" -q:v 3 "$OUT/human/${t}_specular.jpg"
  done
  ffmpeg -v error -y -i "$TMP/opacity_color.tga" "$OUT/human/opacity_color.png"
fi
rm -rf "$TMP"; ls -la "$OUT" "$OUT/human"
