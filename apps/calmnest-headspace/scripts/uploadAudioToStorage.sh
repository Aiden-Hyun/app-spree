#!/bin/bash
#
# Upload audio files to Firebase Storage using gsutil
#
# Prerequisites:
# 1. Install Google Cloud SDK: https://cloud.google.com/sdk/docs/install
# 2. Run: gcloud auth login
# 3. Run: gcloud config set project calmnest-e910e
#
# Then run this script: ./scripts/uploadAudioToStorage.sh

BUCKET="gs://calmnest-e910e.firebasestorage.app"
AUDIO_DIR="$(dirname "$0")/../assets/audio"

echo "=== Uploading audio files to Firebase Storage ==="
echo "Bucket: $BUCKET"
echo ""

# Upload meditation files
echo "📤 Uploading meditation files..."
gsutil -m cp -r "$AUDIO_DIR/meditation/*.mp3" "$BUCKET/audio/meditation/"

# Upload sleep files
echo "📤 Uploading sleep files..."
gsutil -m cp -r "$AUDIO_DIR/sleep/*.mp3" "$BUCKET/audio/sleep/"

# Upload breathing files
echo "📤 Uploading breathing files..."
gsutil -m cp -r "$AUDIO_DIR/breathing/*.mp3" "$BUCKET/audio/breathing/"

# Make files public
echo ""
echo "🔓 Making files publicly accessible..."
gsutil -m acl ch -r -u AllUsers:R "$BUCKET/audio/"

echo ""
echo "=== Upload Complete ==="
echo ""
echo "Your audio files are now available at:"
echo "https://storage.googleapis.com/calmnest-e910e.firebasestorage.app/audio/"
echo ""
echo "Example URLs:"
echo "  - https://storage.googleapis.com/calmnest-e910e.firebasestorage.app/audio/meditation/gratitude.mp3"
echo "  - https://storage.googleapis.com/calmnest-e910e.firebasestorage.app/audio/sleep/nature.mp3"
echo "  - https://storage.googleapis.com/calmnest-e910e.firebasestorage.app/audio/breathing/calm.mp3"

