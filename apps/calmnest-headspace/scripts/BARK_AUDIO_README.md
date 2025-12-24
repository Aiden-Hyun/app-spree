# 🎙️ Bark Audio Generator for CalmNest

Generate meditation narrations, sleep stories, and breathing exercise guidance using [Bark by Suno AI](https://github.com/suno-ai/bark).

## Prerequisites

### Hardware Requirements
- **Full quality**: ~12GB GPU VRAM (NVIDIA recommended)
- **Small model**: ~2GB VRAM (set `SUNO_USE_SMALL_MODELS=True`)
- **CPU only**: Works but very slow (~10x slower)

### Software Requirements
- Python 3.8+
- FFmpeg (for MP3 conversion)

## Installation

```bash
# Navigate to scripts directory
cd apps/calmnest-headspace/scripts

# Create virtual environment (recommended)
python -m venv bark-env
source bark-env/bin/activate  # On Windows: bark-env\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Install FFmpeg if not present
# macOS:
brew install ffmpeg

# Ubuntu/Debian:
sudo apt install ffmpeg

# Windows: Download from https://ffmpeg.org/download.html
```

### For Low VRAM GPUs (< 12GB)

Set environment variable before running:

```bash
export SUNO_USE_SMALL_MODELS=True
python generate_audio_bark.py --type meditation --category gratitude
```

### For CPU-only (slow but works)

```bash
export SUNO_OFFLOAD_CPU=True
python generate_audio_bark.py --type meditation --category gratitude
```

## Usage

### List Available Content

```bash
python generate_audio_bark.py --list
```

### Generate Specific Content

```bash
# Generate a gratitude meditation with Sarah's voice
python generate_audio_bark.py --type meditation --category gratitude --narrator Sarah

# Generate box breathing exercise
python generate_audio_bark.py --type breathing --category box_breathing

# Generate a sleep story
python generate_audio_bark.py --type sleep_story --category moonlit_forest
```

### Generate All Content of a Type

```bash
# Generate all meditations
python generate_audio_bark.py --type meditation --all

# Generate all breathing exercises
python generate_audio_bark.py --type breathing --all

# Generate all sleep stories
python generate_audio_bark.py --type sleep_story --all
```

### Custom Text

```bash
python generate_audio_bark.py --custom "Welcome to your peaceful meditation. Take a deep breath and relax."
```

### Dry Run (Preview)

```bash
python generate_audio_bark.py --type meditation --all --dry-run
```

### Custom Output Directory

```bash
python generate_audio_bark.py --type meditation --category gratitude --output ./my-audio/
```

## Available Narrators

| Narrator | Voice Style | Best For |
|----------|-------------|----------|
| **Sarah** | Gentle, warm female | Meditations, gratitude |
| **Emma** | Soft, soothing female | Sleep stories, relaxation |
| **Michael** | Deep, calm male | Body scans, focus |
| **James** | Warm, reassuring male | Breathing, grounding |

## Available Content

### Meditations (8 categories)
- `gratitude` - Morning gratitude practice
- `stress` - Stress relief and tension release
- `focus` - Concentration and productivity
- `anxiety` - Anxiety ease and grounding
- `sleep` - Evening wind-down
- `bodyscan` - Full body awareness
- `selfesteem` - Self-compassion and love
- `lovingkindness` - Metta meditation

### Breathing Exercises (4 types)
- `box_breathing` - 4-4-4-4 Navy SEAL technique
- `478_relaxation` - 4-7-8 sleep technique
- `deep_belly` - Diaphragmatic breathing
- `energizing` - Quick energy boost

### Sleep Stories (4 stories)
- `moonlit_forest` - Enchanted forest journey
- `ocean_waves` - Peaceful beach at sunset
- `mountain_cabin` - Cozy cabin in snow
- `gentle_rain` - Rainy night comfort

## Extending Content

### Add New Meditation Script

Edit `generate_audio_bark.py` and add to `MEDITATION_SCRIPTS`:

```python
MEDITATION_SCRIPTS["your_category"] = {
    "intro": "Welcome to this meditation...",
    "body": [
        "First instruction...",
        "Second instruction...",
        "Third instruction...",
    ],
    "outro": "Thank you for practicing..."
}
```

### Add New Narrator Voice

Find a Bark preset you like and add to `NARRATOR_VOICES`:

```python
NARRATOR_VOICES["NewName"] = "v2/en_speaker_3"
```

Available presets: `v2/en_speaker_0` through `v2/en_speaker_9`

## Tips for Best Results

1. **Keep segments short**: Bark works best with 1-2 sentences per generation
2. **Add natural pauses**: Use `[pause]` or `...` in text for natural breathing
3. **Use emotion hints**: `[soft]`, `[whisper]`, `[calm]` can influence delivery
4. **Avoid special characters**: Stick to basic punctuation
5. **First run is slow**: Models download on first use (~5GB)

## Troubleshooting

### "CUDA out of memory"
Use small models: `export SUNO_USE_SMALL_MODELS=True`

### Audio sounds robotic
- Try different speaker presets
- Add more natural punctuation (commas, periods)
- Break long sentences into shorter ones

### No sound output
- Check FFmpeg installation: `ffmpeg -version`
- Try WAV output first: edit script to save as `.wav`

### First run takes forever
Models are downloading (~5GB). This only happens once.

## Output Structure

Generated files are saved to:
```
assets/audio/
├── meditation/
│   ├── gratitude.mp3
│   ├── stress.mp3
│   └── ...
├── breathing/
│   ├── box_breathing.mp3
│   └── ...
└── sleep/
    ├── moonlit_forest.mp3
    └── ...
```

## License

Bark is released under MIT license and is free for commercial use.

