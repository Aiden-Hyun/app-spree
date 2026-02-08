"""
Step 3: Convert formatted script text to audio using TTS.

Handles [PAUSE Xs] markers by splitting the script into segments,
synthesizing each segment, and concatenating with silence gaps.
"""

import os
import re
import tempfile
import wave
import struct
import shutil

from models.registry import get_tts
import config

# Cache loaded TTS model across jobs
_cached_tts = None
_cached_tts_id = None
_cached_voice_id = None

SAMPLE_RATE = 22050  # Standard for Piper


def _generate_silence(duration_sec: float, output_path: str, sample_rate: int = SAMPLE_RATE):
    """Generate a silent WAV file of the specified duration."""
    num_samples = int(sample_rate * duration_sec)
    with wave.open(output_path, 'w') as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)  # 16-bit
        wf.setframerate(sample_rate)
        silence = struct.pack('<' + 'h' * num_samples, *([0] * num_samples))
        wf.writeframes(silence)


def _split_on_pauses(script: str) -> list[dict]:
    """Split script into segments and pause markers."""
    parts = []
    pattern = r'\[PAUSE (\d+)s\]'
    last_end = 0

    for match in re.finditer(pattern, script):
        # Text before the pause
        text = script[last_end:match.start()].strip()
        if text:
            parts.append({"type": "text", "content": text})
        # The pause itself
        parts.append({"type": "pause", "seconds": int(match.group(1))})
        last_end = match.end()

    # Remaining text after last pause
    text = script[last_end:].strip()
    if text:
        parts.append({"type": "text", "content": text})

    return parts


def _concatenate_wavs(wav_paths: list[str], output_path: str):
    """Concatenate multiple WAV files into one."""
    if not wav_paths:
        raise ValueError("No WAV files to concatenate")

    with wave.open(wav_paths[0], 'r') as first:
        params = first.getparams()

    with wave.open(output_path, 'w') as out:
        out.setparams(params)
        for path in wav_paths:
            with wave.open(path, 'r') as wf:
                out.writeframes(wf.readframes(wf.getnframes()))


def convert_to_audio(script: str, job_data: dict) -> str:
    """Convert script to WAV audio, handling pause markers."""
    global _cached_tts, _cached_tts_id, _cached_voice_id

    tts_model_id = job_data.get("ttsModel", "piper")
    voice_id = job_data.get("ttsVoice", "en_US-amy-medium")

    print(f"  [tts] Converting to audio with {tts_model_id} / {voice_id}...")

    # Load TTS model (reuse if same)
    if (_cached_tts is None
            or _cached_tts_id != tts_model_id
            or _cached_voice_id != voice_id):
        if _cached_tts is not None:
            _cached_tts.unload()
        _cached_tts = get_tts(tts_model_id)
        _cached_tts.load(config.MODEL_DIR, voice_id)
        _cached_tts_id = tts_model_id
        _cached_voice_id = voice_id

    # Split script on pause markers
    segments = _split_on_pauses(script)
    print(f"  [tts] Script split into {len(segments)} segments")

    # Synthesize each segment
    tmp_dir = tempfile.mkdtemp(prefix="calmdemy_tts_")
    wav_parts = []

    try:
        for i, seg in enumerate(segments):
            part_path = os.path.join(tmp_dir, f"part_{i:04d}.wav")

            if seg["type"] == "pause":
                _generate_silence(seg["seconds"], part_path)
            else:
                _cached_tts.synthesize(seg["content"], part_path)

            wav_parts.append(part_path)

        # Concatenate all parts
        output_path = os.path.join(tmp_dir, "full_output.wav")
        _concatenate_wavs(wav_parts, output_path)

        # Get duration
        with wave.open(output_path, 'r') as wf:
            duration = wf.getnframes() / wf.getframerate()
        print(f"  [tts] Full audio: {duration:.1f}s")

        return output_path

    except Exception:
        # Clean up on error
        shutil.rmtree(tmp_dir, ignore_errors=True)
        raise
