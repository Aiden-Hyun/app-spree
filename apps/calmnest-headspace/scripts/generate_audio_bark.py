#!/usr/bin/env python3
"""
Bark Audio Generator for CalmNest
=================================
Generate meditation narrations, sleep stories, and breathing instructions
using Bark by Suno AI.

Usage:
    python generate_audio_bark.py --type meditation --limit 5
    python generate_audio_bark.py --type sleep_story --narrator Emma
    python generate_audio_bark.py --type breathing --all
    python generate_audio_bark.py --custom "Welcome to your meditation session."

Requirements:
    pip install -r requirements.txt
"""

import os
import argparse
import numpy as np
from pathlib import Path
from typing import Optional
from tqdm import tqdm

# Bark imports (lazy loaded to speed up --help)
BARK_LOADED = False
SAMPLE_RATE = 24000  # Bark's sample rate


def load_bark():
    """Lazy load Bark models to avoid slow startup for help/dry-run."""
    global BARK_LOADED, generate_audio, preload_models, SAMPLE_RATE
    if not BARK_LOADED:
        print("🔄 Loading Bark models (this may take a minute on first run)...")
        
        # Fix for PyTorch 2.6+ compatibility with Bark
        # Bark checkpoints use numpy types that aren't in the safe globals list.
        # We monkey-patch torch.load to use weights_only=False for Bark.
        import torch
        _original_torch_load = torch.load
        
        def _patched_torch_load(*args, **kwargs):
            # Force weights_only=False for Bark model loading
            if 'weights_only' not in kwargs:
                kwargs['weights_only'] = False
            return _original_torch_load(*args, **kwargs)
        
        torch.load = _patched_torch_load
        
        from bark import generate_audio as _generate_audio
        from bark import preload_models, SAMPLE_RATE as _SR
        generate_audio = _generate_audio
        SAMPLE_RATE = _SR
        preload_models()
        
        # Restore original torch.load
        torch.load = _original_torch_load
        
        BARK_LOADED = True
        print("✅ Bark models loaded!")


# ==============================================================================
# VOICE PRESETS - Map narrators to Bark speaker presets
# ==============================================================================
# Bark has ~100 voice presets. Format: v2/{language}_speaker_{0-9}
# English presets that work well for meditation/calm content:

NARRATOR_VOICES = {
    # Female voices - soft and calming
    "Sarah": "v2/en_speaker_9",    # Gentle, warm female
    "Emma": "v2/en_speaker_1",     # Soft, soothing female
    
    # Male voices - calm and grounded
    "Michael": "v2/en_speaker_6",  # Deep, calm male
    "James": "v2/en_speaker_0",    # Warm, reassuring male
    
    # Default fallback
    "default": "v2/en_speaker_9",
}

# Special voice styles for different content types
CONTENT_VOICE_HINTS = {
    "meditation": "[soft, calm]",      # Calm meditation voice
    "sleep_story": "[whisper, slow]",  # Sleepy bedtime voice
    "breathing": "[clear, gentle]",    # Clear instruction voice
}


# ==============================================================================
# CONTENT DATA - Meditation scripts, stories, and breathing cues
# ==============================================================================

MEDITATION_SCRIPTS = {
    "gratitude": {
        "intro": "Welcome to this gratitude meditation. Find a comfortable position and gently close your eyes.",
        "body": [
            "Take a deep breath in... and slowly release.",
            "Allow your body to relax with each exhale.",
            "Begin to bring to mind something you're grateful for today.",
            "It could be something simple... a warm cup of tea, a kind word, or the comfort of this moment.",
            "Feel the warmth of gratitude filling your heart.",
            "Notice how this feeling of appreciation softens your body and calms your mind.",
        ],
        "outro": "When you're ready, gently bring your awareness back to your surroundings. Carry this gratitude with you throughout your day."
    },
    "stress": {
        "intro": "Welcome to this stress relief meditation. Let's release the tension you've been carrying.",
        "body": [
            "Take a slow, deep breath... letting your shoulders drop.",
            "With each exhale, imagine stress leaving your body like a gray mist.",
            "Scan your body for any areas of tension... your jaw, your shoulders, your hands.",
            "Breathe into those areas... and let them soften.",
            "You are safe in this moment. There is nothing you need to do right now.",
            "Simply be here, breathing, releasing, finding peace.",
        ],
        "outro": "Slowly open your eyes. Remember, you can return to this calm whenever you need it."
    },
    "focus": {
        "intro": "Welcome to this focus meditation. Let's sharpen your concentration.",
        "body": [
            "Sit with a tall spine, grounded and alert.",
            "Take three deep breaths to clear your mind.",
            "Now, bring your attention to a single point... perhaps the sensation of breath at your nostrils.",
            "When your mind wanders, and it will, gently guide it back without judgment.",
            "Each time you return your focus, you're strengthening your concentration.",
            "Stay present. Stay focused. You are fully here.",
        ],
        "outro": "Take this focused energy with you. Your mind is clear and ready."
    },
    "anxiety": {
        "intro": "Welcome. If you're feeling anxious, know that you're in the right place. Let's find calm together.",
        "body": [
            "Place one hand on your heart and one on your belly.",
            "Feel your heartbeat... you are alive, you are here, you are safe.",
            "Breathe in slowly for four counts... hold for four... and release for six.",
            "Anxiety is just energy in your body. It will pass.",
            "Ground yourself by noticing five things you can see... four things you can touch.",
            "You are stronger than your anxious thoughts.",
        ],
        "outro": "You did beautifully. Remember, this feeling is temporary. You have the tools to find peace."
    },
    "sleep": {
        "intro": "Welcome to your evening meditation. It's time to let go of the day and prepare for restful sleep.",
        "body": [
            "Let your body sink into the surface beneath you.",
            "Your eyes are heavy... your limbs are relaxed.",
            "Release any thoughts about tomorrow... they can wait.",
            "Imagine a warm, golden light washing over you from head to toe.",
            "Each breath takes you deeper into relaxation.",
            "You are drifting... floating... peaceful.",
        ],
        "outro": "Sleep well. Sweet dreams await you."
    },
    "bodyscan": {
        "intro": "Welcome to this body scan meditation. Let's connect with each part of your body.",
        "body": [
            "Starting at the top of your head... notice any sensations without judgment.",
            "Move your attention to your forehead... your eyes... let them soften.",
            "Your jaw... release any tension you find there.",
            "Your neck and shoulders... allow them to drop and relax.",
            "Your arms... your hands... your fingertips... feel the energy there.",
            "Down through your chest... your belly... breathing naturally.",
            "Your hips... your legs... your feet... grounded and connected to the earth.",
        ],
        "outro": "Your whole body is now relaxed and at peace. Carry this awareness with you."
    },
    "selfesteem": {
        "intro": "Welcome to this self-compassion meditation. You are worthy of love and kindness.",
        "body": [
            "Place your hands over your heart.",
            "Repeat after me silently: I am enough, just as I am.",
            "Think of yourself as you would a dear friend... with kindness and understanding.",
            "Any mistakes you've made are part of being human. You are learning and growing.",
            "Say to yourself: I forgive myself. I am doing my best.",
            "Feel a warm glow of self-love radiating from your heart.",
        ],
        "outro": "Remember, you are worthy. You are loved. You are enough."
    },
    "lovingkindness": {
        "intro": "Welcome to this loving-kindness meditation. Let's open our hearts to love.",
        "body": [
            "Begin by sending love to yourself: May I be happy. May I be healthy. May I be at peace.",
            "Now think of someone you love: May they be happy. May they be healthy. May they be at peace.",
            "Extend this love to a neutral person... someone you see but don't know well.",
            "Now, with courage, send love to someone you find difficult.",
            "Finally, radiate love to all beings everywhere: May all beings be happy and free.",
            "Feel your heart expanding with unconditional love.",
        ],
        "outro": "Carry this love with you. Share it freely. It only grows when given away."
    },
}

BREATHING_SCRIPTS = {
    "box_breathing": {
        "intro": "Let's practice box breathing. This technique is used by Navy SEALs to stay calm under pressure.",
        "instructions": [
            "Breathe in for four counts... one, two, three, four.",
            "Hold your breath... one, two, three, four.",
            "Exhale slowly... one, two, three, four.",
            "Hold empty... one, two, three, four.",
            "Continue this pattern. Inhale... hold... exhale... hold.",
        ],
        "outro": "Well done. Your nervous system is now calm and balanced."
    },
    "478_relaxation": {
        "intro": "This is the four-seven-eight breathing technique, a natural tranquilizer for your nervous system.",
        "instructions": [
            "Breathe in through your nose for four counts... one, two, three, four.",
            "Hold your breath for seven counts... one, two, three, four, five, six, seven.",
            "Exhale completely through your mouth for eight counts... one, two, three, four, five, six, seven, eight.",
            "Let's continue. Inhale... hold... exhale slowly.",
        ],
        "outro": "This technique becomes more powerful with practice. Use it whenever you need calm."
    },
    "deep_belly": {
        "intro": "Let's practice diaphragmatic breathing, also known as belly breathing.",
        "instructions": [
            "Place one hand on your chest and one on your belly.",
            "Breathe in deeply, letting your belly rise like a balloon.",
            "Your chest should stay relatively still... only your belly moves.",
            "Exhale slowly, feeling your belly fall.",
            "Continue breathing from your diaphragm. In... and out.",
        ],
        "outro": "This is how we naturally breathe when deeply relaxed. Practice often."
    },
    "energizing": {
        "intro": "This breathing exercise will boost your energy and alertness.",
        "instructions": [
            "Sit up tall with an alert posture.",
            "Take quick, powerful breaths through your nose... in, out, in, out.",
            "Like a bellows, pumping energy into your body.",
            "Now take a deep breath and hold... feel the energy.",
            "Exhale and return to normal breathing.",
        ],
        "outro": "You are now energized and ready to take on your day!"
    },
}

SLEEP_STORY_SCRIPTS = {
    "moonlit_forest": {
        "narrator": "Emma",
        "paragraphs": [
            "You find yourself at the edge of an ancient forest, bathed in soft silver moonlight.",
            "The air is cool and fresh, carrying the scent of pine and wildflowers.",
            "You begin to walk along a winding path, your feet cushioned by a carpet of soft moss.",
            "Fireflies dance between the trees, creating a gentle constellation of warm light.",
            "The leaves whisper secrets in a language older than time.",
            "You come upon a clearing where the moon hangs low and full, illuminating a peaceful meadow.",
            "In the center, a soft bed of clover invites you to rest.",
            "You lie down, gazing up at the stars through the canopy above.",
            "The forest holds you safe as your eyes grow heavy.",
            "Sleep now... the moon watches over you.",
        ]
    },
    "ocean_waves": {
        "narrator": "James",
        "paragraphs": [
            "You're standing on a quiet beach as the sun sets in brilliant oranges and pinks.",
            "The sand is warm beneath your feet, still holding the heat of the day.",
            "Gentle waves roll in and out, creating a soothing rhythm... whoosh... whoosh.",
            "You walk closer to the water's edge, letting the cool foam wash over your toes.",
            "Seagulls call in the distance, then fall silent as twilight settles.",
            "You find a comfortable spot on the soft sand and sit down.",
            "The stars begin to appear, one by one, like diamonds scattered across velvet.",
            "The ocean continues its eternal lullaby... in... and out... in... and out.",
            "Your breathing matches the waves as you drift into peaceful sleep.",
        ]
    },
    "mountain_cabin": {
        "narrator": "Emma",
        "paragraphs": [
            "A winding road has led you to a cozy cabin high in the mountains.",
            "Snow falls gently outside, blanketing the world in pure white silence.",
            "Inside, a fire crackles warmly in the stone fireplace.",
            "You wrap yourself in a soft wool blanket, sinking into a comfortable armchair.",
            "Through the window, you watch snowflakes dance in the glow of the porch light.",
            "A cup of hot cocoa warms your hands as steam rises in lazy spirals.",
            "The cabin is perfectly quiet except for the pop and hiss of the fire.",
            "Your eyelids grow heavy as the warmth surrounds you.",
            "Safe and warm, you drift into a deep, restful sleep.",
        ]
    },
    "gentle_rain": {
        "narrator": "Sarah",
        "paragraphs": [
            "Rain begins to fall outside your window, a gentle patter against the glass.",
            "You're tucked into your bed, cozy and warm, while the world outside is washed clean.",
            "The rhythm of the rain is hypnotic... tap, tap, tap... like nature's lullaby.",
            "Lightning flickers in the distance, too far away to hear, just a soft glow behind the clouds.",
            "The rain grows softer, a whispered conversation between sky and earth.",
            "Each drop carries away the worries of your day, washing them into the night.",
            "You sink deeper into your pillow, surrounded by the peaceful sound.",
            "The rain will continue through the night, watching over your dreams.",
            "Let it carry you now... into soft, gentle sleep.",
        ]
    },
}


# ==============================================================================
# AUDIO GENERATION FUNCTIONS
# ==============================================================================

def generate_segment(text: str, voice_preset: str, hint: str = "") -> np.ndarray:
    """Generate a single audio segment using Bark."""
    load_bark()
    
    # Add voice hint for style
    if hint:
        text = f"{hint} {text}"
    
    # Generate audio
    audio_array = generate_audio(text, history_prompt=voice_preset)
    return audio_array


def generate_long_audio(
    segments: list[str],
    voice_preset: str,
    content_type: str = "meditation",
    silence_between: float = 1.5,
) -> np.ndarray:
    """Generate long-form audio by stitching multiple segments."""
    load_bark()
    
    hint = CONTENT_VOICE_HINTS.get(content_type, "")
    
    # Silence between segments (in samples)
    silence = np.zeros(int(silence_between * SAMPLE_RATE), dtype=np.float32)
    
    all_audio = []
    for segment in tqdm(segments, desc="Generating segments"):
        audio = generate_segment(segment, voice_preset, hint)
        all_audio.append(audio)
        all_audio.append(silence)
    
    # Remove trailing silence
    if all_audio:
        all_audio = all_audio[:-1]
    
    return np.concatenate(all_audio)


def save_audio(audio: np.ndarray, output_path: Path, format: str = "mp3"):
    """Save audio to file in specified format."""
    from scipy.io.wavfile import write as write_wav
    from pydub import AudioSegment
    import tempfile
    
    output_path = Path(output_path)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    
    if format == "wav":
        write_wav(str(output_path), SAMPLE_RATE, audio)
    else:
        # Save as WAV first, then convert
        with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
            write_wav(tmp.name, SAMPLE_RATE, audio)
            audio_segment = AudioSegment.from_wav(tmp.name)
            audio_segment.export(str(output_path), format=format)
            os.unlink(tmp.name)
    
    print(f"✅ Saved: {output_path}")


# ==============================================================================
# CONTENT GENERATION FUNCTIONS
# ==============================================================================

def generate_meditation(
    category: str,
    narrator: str = "Sarah",
    output_dir: Path = None,
) -> Path:
    """Generate a complete meditation audio file."""
    if output_dir is None:
        output_dir = Path(__file__).parent.parent / "assets" / "audio" / "meditation"
    
    script = MEDITATION_SCRIPTS.get(category)
    if not script:
        raise ValueError(f"Unknown meditation category: {category}. Available: {list(MEDITATION_SCRIPTS.keys())}")
    
    voice = NARRATOR_VOICES.get(narrator, NARRATOR_VOICES["default"])
    
    # Combine all segments
    segments = [script["intro"]] + script["body"] + [script["outro"]]
    
    print(f"\n🧘 Generating meditation: {category}")
    print(f"   Narrator: {narrator} ({voice})")
    print(f"   Segments: {len(segments)}")
    
    audio = generate_long_audio(segments, voice, "meditation", silence_between=2.0)
    
    output_path = output_dir / f"{category}.mp3"
    save_audio(audio, output_path)
    
    return output_path


def generate_breathing_exercise(
    exercise: str,
    narrator: str = "Michael",
    output_dir: Path = None,
) -> Path:
    """Generate a breathing exercise audio file."""
    if output_dir is None:
        output_dir = Path(__file__).parent.parent / "assets" / "audio" / "breathing"
    
    script = BREATHING_SCRIPTS.get(exercise)
    if not script:
        raise ValueError(f"Unknown breathing exercise: {exercise}. Available: {list(BREATHING_SCRIPTS.keys())}")
    
    voice = NARRATOR_VOICES.get(narrator, NARRATOR_VOICES["default"])
    
    segments = [script["intro"]] + script["instructions"] + [script["outro"]]
    
    print(f"\n🌬️ Generating breathing exercise: {exercise}")
    print(f"   Narrator: {narrator} ({voice})")
    
    audio = generate_long_audio(segments, voice, "breathing", silence_between=3.0)
    
    output_path = output_dir / f"{exercise}.mp3"
    save_audio(audio, output_path)
    
    return output_path


def generate_sleep_story(
    story: str,
    output_dir: Path = None,
) -> Path:
    """Generate a sleep story audio file."""
    if output_dir is None:
        output_dir = Path(__file__).parent.parent / "assets" / "audio" / "sleep"
    
    script = SLEEP_STORY_SCRIPTS.get(story)
    if not script:
        raise ValueError(f"Unknown sleep story: {story}. Available: {list(SLEEP_STORY_SCRIPTS.keys())}")
    
    narrator = script.get("narrator", "Emma")
    voice = NARRATOR_VOICES.get(narrator, NARRATOR_VOICES["default"])
    
    print(f"\n🌙 Generating sleep story: {story}")
    print(f"   Narrator: {narrator} ({voice})")
    
    audio = generate_long_audio(script["paragraphs"], voice, "sleep_story", silence_between=2.5)
    
    output_path = output_dir / f"{story}.mp3"
    save_audio(audio, output_path)
    
    return output_path


def generate_custom(
    text: str,
    narrator: str = "Sarah",
    output_name: str = "custom_audio",
    output_dir: Path = None,
) -> Path:
    """Generate audio from custom text."""
    if output_dir is None:
        output_dir = Path(__file__).parent.parent / "assets" / "audio"
    
    voice = NARRATOR_VOICES.get(narrator, NARRATOR_VOICES["default"])
    
    print(f"\n🎙️ Generating custom audio")
    print(f"   Narrator: {narrator} ({voice})")
    print(f"   Text: {text[:50]}...")
    
    # Split long text into sentences for better generation
    import re
    sentences = re.split(r'(?<=[.!?])\s+', text)
    sentences = [s.strip() for s in sentences if s.strip()]
    
    if len(sentences) > 1:
        audio = generate_long_audio(sentences, voice, "meditation", silence_between=1.0)
    else:
        audio = generate_segment(text, voice)
    
    output_path = output_dir / f"{output_name}.mp3"
    save_audio(audio, output_path)
    
    return output_path


# ==============================================================================
# CLI
# ==============================================================================

def main():
    parser = argparse.ArgumentParser(
        description="Generate meditation audio content using Bark by Suno AI",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Generate a specific meditation
  python generate_audio_bark.py --type meditation --category gratitude
  
  # Generate all meditations
  python generate_audio_bark.py --type meditation --all
  
  # Generate sleep story with specific narrator
  python generate_audio_bark.py --type sleep_story --category moonlit_forest
  
  # Generate breathing exercise
  python generate_audio_bark.py --type breathing --category box_breathing
  
  # Generate custom audio
  python generate_audio_bark.py --custom "Welcome to your peaceful meditation."
  
  # List available content
  python generate_audio_bark.py --list
        """
    )
    
    parser.add_argument(
        "--type", "-t",
        choices=["meditation", "breathing", "sleep_story"],
        help="Type of content to generate"
    )
    parser.add_argument(
        "--category", "-c",
        help="Specific category/name to generate"
    )
    parser.add_argument(
        "--narrator", "-n",
        choices=list(NARRATOR_VOICES.keys()),
        default=None,
        help="Narrator voice to use"
    )
    parser.add_argument(
        "--all", "-a",
        action="store_true",
        help="Generate all content of the specified type"
    )
    parser.add_argument(
        "--custom",
        type=str,
        help="Generate audio from custom text"
    )
    parser.add_argument(
        "--output", "-o",
        type=str,
        help="Custom output directory"
    )
    parser.add_argument(
        "--list", "-l",
        action="store_true",
        help="List all available content"
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Show what would be generated without actually generating"
    )
    
    args = parser.parse_args()
    
    # List available content
    if args.list:
        print("\n📋 Available Content\n" + "=" * 40)
        print("\n🧘 Meditations:")
        for key in MEDITATION_SCRIPTS.keys():
            print(f"   • {key}")
        print("\n🌬️ Breathing Exercises:")
        for key in BREATHING_SCRIPTS.keys():
            print(f"   • {key}")
        print("\n🌙 Sleep Stories:")
        for key, val in SLEEP_STORY_SCRIPTS.items():
            print(f"   • {key} (narrator: {val.get('narrator', 'default')})")
        print("\n🎙️ Available Narrators:")
        for name, preset in NARRATOR_VOICES.items():
            if name != "default":
                print(f"   • {name}: {preset}")
        return
    
    # Custom text generation
    if args.custom:
        narrator = args.narrator or "Sarah"
        output_dir = Path(args.output) if args.output else None
        
        if args.dry_run:
            print(f"Would generate custom audio with narrator {narrator}")
            return
        
        generate_custom(args.custom, narrator, output_dir=output_dir)
        return
    
    # Type-based generation
    if not args.type:
        parser.print_help()
        return
    
    output_dir = Path(args.output) if args.output else None
    
    if args.type == "meditation":
        categories = list(MEDITATION_SCRIPTS.keys()) if args.all else [args.category]
        if not args.all and not args.category:
            print("Error: Specify --category or use --all")
            return
        
        for cat in categories:
            narrator = args.narrator or "Sarah"
            if args.dry_run:
                print(f"Would generate meditation: {cat} (narrator: {narrator})")
            else:
                generate_meditation(cat, narrator, output_dir)
    
    elif args.type == "breathing":
        exercises = list(BREATHING_SCRIPTS.keys()) if args.all else [args.category]
        if not args.all and not args.category:
            print("Error: Specify --category or use --all")
            return
        
        for ex in exercises:
            narrator = args.narrator or "Michael"
            if args.dry_run:
                print(f"Would generate breathing: {ex} (narrator: {narrator})")
            else:
                generate_breathing_exercise(ex, narrator, output_dir)
    
    elif args.type == "sleep_story":
        stories = list(SLEEP_STORY_SCRIPTS.keys()) if args.all else [args.category]
        if not args.all and not args.category:
            print("Error: Specify --category or use --all")
            return
        
        for story in stories:
            if args.dry_run:
                print(f"Would generate sleep story: {story}")
            else:
                generate_sleep_story(story, output_dir)
    
    print("\n✨ Generation complete!")


if __name__ == "__main__":
    main()

