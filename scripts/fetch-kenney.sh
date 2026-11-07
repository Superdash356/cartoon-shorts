#!/usr/bin/env bash
# Downloads the CC0 Kenney kits the world uses and copies the needed .glb files to public/bridge/kenney/.
set -euo pipefail
OUT=public/bridge/kenney; mkdir -p "$OUT" /tmp/kenney
NEED="tree_oak tree_default tree_detailed tree_fat tree_cone tree-high-round tree plant_bushLarge plant_bushDetailed plant_bush hedge flower_redA flower_yellowA flower_purpleA grass_large grass lily_large lantern cart stall-red stall-green stall-bench banner-red banner-green windmill canoe"
for kit in nature-kit fantasy-town-kit; do
  url=$(curl -fsSL "https://kenney.nl/assets/$kit" | grep -oE 'https://kenney.nl/media/pages/assets/[^"]+\.zip' | head -1)
  echo "$kit -> $url"
  curl -fsSL "$url" -o "/tmp/kenney/$kit.zip"
  unzip -oq "/tmp/kenney/$kit.zip" -d "/tmp/kenney/$kit"
done
for n in $NEED; do
  f=$(find /tmp/kenney -iname "$n.glb" | head -1 || true)
  if [ -n "$f" ]; then cp "$f" "$OUT/$n.glb"; else echo "missing: $n"; fi
done
ls "$OUT" | wc -l
