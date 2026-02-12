"""
Step 4: Post-process audio — normalize loudness and encode to MP3.
"""

import os
import subprocess
import shutil
import json


def _get_loudness(wav_path: str) -> float | None:
    """Measure integrated loudness in LUFS using ffmpeg."""
    try:
        ffmpeg_bin = _resolve_ffmpeg_bin()
        result = subprocess.run(
            [
                ffmpeg_bin, "-i", wav_path,
                "-af", "loudnorm=print_format=json",
                "-f", "null", "-"
            ],
            capture_output=True,
            text=True,
            timeout=120,
        )
        # Parse the loudnorm JSON output from stderr
        output = result.stderr
        json_start = output.rfind('{')
        json_end = output.rfind('}') + 1
        if json_start >= 0 and json_end > json_start:
            data = json.loads(output[json_start:json_end])
            return float(data.get("input_i", -99))
    except Exception as e:
        print(f"  [audio] Loudness measurement failed: {e}")
    return None


def post_process_audio(wav_path: str) -> str:
    """
    Normalize audio to -16 LUFS and encode as 192kbps MP3.

    Returns path to the output MP3 file.
    """
    print("  [audio] Post-processing audio...")

    mp3_path = wav_path.replace(".wav", ".mp3")

    # Check current loudness
    current_lufs = _get_loudness(wav_path)
    target_lufs = -16.0
    tolerance = 3.0

    needs_normalize = (
        current_lufs is None
        or abs(current_lufs - target_lufs) > tolerance
    )

    if needs_normalize:
        print(f"  [audio] Normalizing: {current_lufs} LUFS -> {target_lufs} LUFS")
        audio_filter = (
            f"loudnorm=I={target_lufs}:LRA=11:TP=-1.5"
        )
    else:
        print(f"  [audio] Loudness OK ({current_lufs:.1f} LUFS), skipping normalize")
        audio_filter = None

    # Encode to MP3
    ffmpeg_bin = _resolve_ffmpeg_bin()
    cmd = [ffmpeg_bin, "-y", "-i", wav_path]
    if audio_filter:
        cmd.extend(["-af", audio_filter])
    cmd.extend([
        "-codec:a", "libmp3lame",
        "-b:a", "192k",
        "-ar", "44100",
        "-ac", "1",  # mono
        mp3_path,
    ])

    result = subprocess.run(cmd, capture_output=True, text=True, timeout=300)

    if result.returncode != 0:
        raise RuntimeError(f"ffmpeg encoding failed: {result.stderr[-500:]}")

    if not os.path.isfile(mp3_path):
        raise RuntimeError(f"MP3 file not created: {mp3_path}")

    size_mb = os.path.getsize(mp3_path) / (1024 * 1024)
    print(f"  [audio] MP3 encoded: {size_mb:.1f} MB")

    # Clean up WAV to save disk space
    try:
        os.remove(wav_path)
    except OSError:
        pass

    return mp3_path


def _resolve_ffmpeg_bin() -> str:
    """Find ffmpeg binary; allow override via FFMPEG_BIN."""
    env_override = os.environ.get("FFMPEG_BIN", "").strip()
    if env_override:
        return env_override

    found = shutil.which("ffmpeg")
    if found:
        return found

    # Common Homebrew locations
    for path in ("/opt/homebrew/bin/ffmpeg", "/usr/local/bin/ffmpeg"):
        if os.path.isfile(path) and os.access(path, os.X_OK):
            return path

    raise RuntimeError(
        "ffmpeg not found. Install it (e.g., `brew install ffmpeg`) or set FFMPEG_BIN."
    )
