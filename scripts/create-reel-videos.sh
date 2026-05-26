#!/bin/bash
# Create short Ken Burns effect videos from reel thumbnail images
# This makes the reels page look realistic with auto-playing video content

INPUT_DIR="public/images/reels"
OUTPUT_DIR="public/videos/reels"
DURATION=10  # seconds per video

mkdir -p "$OUTPUT_DIR"

for img in "$INPUT_DIR"/reel*.jpg; do
    filename=$(basename "$img" .jpg)
    output="$OUTPUT_DIR/${filename}.mp4"
    
    if [ -f "$output" ]; then
        echo "Skipping $filename (already exists)"
        continue
    fi
    
    echo "Creating video for $filename..."
    
    # Get image dimensions
    dims=$(identify -format "%w %h" "$img" 2>/dev/null || echo "800 1200")
    w=$(echo $dims | awk '{print $1}')
    h=$(echo $dims | awk '{print $2}')
    
    # Ken Burns zoom-in effect (slow zoom from 100% to 120%)
    # Using zoompan filter for smooth cinematic feel
    # Output at 720x1280 (9:16 vertical format like real reels)
    ffmpeg -y -loop 1 -i "$img" \
        -vf "scale=1920:2880,zoompan=z='min(zoom+0.0015,1.25)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=$((DURATION*30)):s=720x1280:fps=30" \
        -c:v libx264 -preset fast -crf 28 \
        -t $DURATION -pix_fmt yuv420p \
        -movflags +faststart \
        "$output" 2>/dev/null
    
    if [ $? -eq 0 ]; then
        size=$(du -h "$output" | cut -f1)
        echo "  ✅ $filename → $output ($size)"
    else
        echo "  ❌ Failed for $filename, trying simpler approach..."
        # Fallback: simpler zoom
        ffmpeg -y -loop 1 -i "$img" \
            -vf "scale=720:1280,zoompan=z='min(zoom+0.002,1.3)':d=$((DURATION*30)):s=720x1280:fps=30" \
            -c:v libx264 -preset fast -crf 28 \
            -t $DURATION -pix_fmt yuv420p \
            -movflags +faststart \
            "$output" 2>/dev/null
        if [ $? -eq 0 ]; then
            size=$(du -h "$output" | cut -f1)
            echo "  ✅ $filename → $output ($size) [fallback]"
        else
            echo "  ❌ Completely failed for $filename"
        fi
    fi
done

echo ""
echo "All reel videos created!"
ls -lh "$OUTPUT_DIR"
