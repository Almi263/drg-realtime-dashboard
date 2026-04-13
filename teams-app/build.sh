#!/usr/bin/env bash
# Build the Teams app package (manifest + icons → drg-ims-teams.zip)
# Usage:
#   ./build.sh <hostname>
# Example:
#   ./build.sh drg-ims.vercel.app
set -euo pipefail

if [ $# -lt 1 ]; then
  echo "usage: $0 <hostname>  (e.g. drg-ims.vercel.app)" >&2
  exit 1
fi

HOST="$1"
DIR="$(cd "$(dirname "$0")" && pwd)"
WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT

cp "$DIR/icons/color.png" "$WORK/"
cp "$DIR/icons/outline.png" "$WORK/"

# Generate a stable UUID per host so Teams treats updates as the same app.
APP_ID="$(uuidgen | tr '[:upper:]' '[:lower:]')"
if [ -f "$DIR/.app-id" ]; then
  APP_ID="$(cat "$DIR/.app-id")"
else
  echo "$APP_ID" > "$DIR/.app-id"
fi

sed -e "s|__APP_HOST__|${HOST}|g" \
    -e "s|__APP_ID__|${APP_ID}|g" \
    "$DIR/manifest.template.json" > "$WORK/manifest.json"

cd "$WORK"
zip -q -r "$DIR/drg-ims-teams.zip" manifest.json color.png outline.png

echo "✓ built $DIR/drg-ims-teams.zip"
echo "  app id:  $APP_ID"
echo "  host:    $HOST"
echo
echo "next: upload the zip in Teams admin center"
echo "      (Apps → Manage apps → Upload new app)"
echo "      or sideload via Teams desktop client:"
echo "      Apps → Manage your apps → Upload an app → Upload a custom app"
