#!/bin/bash

# Audio Volume Normalization Script
# Uses ffmpeg's loudnorm filter (EBU R128 standard)
# Target: -16 LUFS (streaming standard)
#
# Usage: ./scripts/normalizeAudio.sh
#
# Prerequisites:
#   brew install ffmpeg

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
AUDIO_DIR="$SCRIPT_DIR/../assets/audio"
TEMP_DIR="/tmp/calmnest_audio_normalize"

echo "🎵 Audio Volume Normalization Script"
echo "====================================="
echo ""

# Check if ffmpeg is installed
if ! command -v ffmpeg &> /dev/null; then
    echo "Error: ffmpeg is not installed"
    echo "Install with: brew install ffmpeg"
    exit 1
fi

echo "✓ ffmpeg found"
echo ""

# Create temp directory
rm -rf "$TEMP_DIR"
mkdir -p "$TEMP_DIR"

# Change to audio directory
cd "$AUDIO_DIR" || exit 1

# Count files
FILE_COUNT=$(find . -name "*.mp3" -type f | wc -l | tr -d ' ')

echo "📁 Found $FILE_COUNT MP3 files to normalize"
echo "📍 Audio directory: $(pwd)"
echo ""

SUCCESS=0
FAILED=0
CURRENT=0

# Use a temp file to store the file list
find . -name "*.mp3" -type f > "$TEMP_DIR/filelist.txt"

while IFS= read -r file; do
    CURRENT=$((CURRENT + 1))
    
    # Clean up the path (remove leading ./)
    CLEAN_PATH="${file#./}"
    TEMP_FILE="$TEMP_DIR/temp_normalized.mp3"
    
    echo "[$CURRENT/$FILE_COUNT] Processing: $CLEAN_PATH"
    
    # Run ffmpeg loudnorm
    if ffmpeg -y -i "$file" \
        -af "loudnorm=I=-16:TP=-1.5:LRA=11" \
        -ar 44100 -b:a 192k \
        "$TEMP_FILE" 2>/dev/null; then
        
        # Replace original with normalized version
        mv "$TEMP_FILE" "$file"
        echo "    ✓ Normalized"
        SUCCESS=$((SUCCESS + 1))
    else
        echo "    ✗ Failed"
        FAILED=$((FAILED + 1))
        rm -f "$TEMP_FILE"
    fi
done < "$TEMP_DIR/filelist.txt"

# Cleanup
rm -rf "$TEMP_DIR"

echo ""
echo "====================================="
echo "📊 Normalization Complete!"
echo "   ✓ Successful: $SUCCESS"
echo "   ✗ Failed: $FAILED"
echo ""
echo "Run 'node scripts/uploadAudioToStorage.js --force' to re-upload"
