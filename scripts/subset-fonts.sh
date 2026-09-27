#!/usr/bin/env sh
# Builds the woff2 variants of the IBM Plex Sans variable fonts from the TTFs:
# Latin + Latin Extended subset, width axis pinned to 100 (unused in lx-ui).
# Requires: pip install "fonttools[woff]" brotli
set -eu
cd "$(dirname "$0")/../src/lx-fonts"
UNICODES="U+0000-00FF,U+0100-024F,U+02BB-02BC,U+02C6,U+02C7,U+02D8-02DD,U+0300-0308,U+0326-0328,U+1E00-1EFF,U+2000-206F,U+20A0-20C0,U+2113,U+2122,U+2190-2199,U+2212,U+2215,U+2260,U+2264-2265,U+FEFF,U+FFFD"
for name in IBMPlexSansVar IBMPlexSansVar-Italic; do
  tmp="$(mktemp -t "$name.XXXXXX.ttf")"
  fonttools varLib.instancer -q -o "$tmp" "$name.ttf" wdth=100
  pyftsubset "$tmp" --unicodes="$UNICODES" --flavor=woff2 --layout-features='*' \
    --no-hinting --desubroutinize --output-file="$name.woff2"
  rm -f "$tmp"
done
