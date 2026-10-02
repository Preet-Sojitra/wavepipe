import os
import subprocess
import tempfile
import json
import time
import logging
from typing import Dict, Any, List, Optional

logger = logging.getLogger("wavepipe.whisper")

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
WHISPER_DIR = os.path.abspath(os.path.join(BASE_DIR, "../whisper.cpp"))
WHISPER_EXECUTABLE = os.getenv("WHISPER_EXECUTABLE", os.path.join(WHISPER_DIR, "build/bin/whisper-cli"))
DEFAULT_MODEL_PATH = os.getenv("WHISPER_MODEL_PATH", os.path.join(WHISPER_DIR, "models/ggml-base.en.bin"))

def format_timestamp(ts_str: str) -> str:
    """
    Convert whisper timestamp '00:00:04,000' or '00:00:04.000' to '00:04.00' format.
    """
    cleaned = ts_str.replace(",", ".")
    parts = cleaned.split(":")
    if len(parts) == 3:
        mins = int(parts[1])
        secs = float(parts[2])
        total_mins = int(parts[0]) * 60 + mins
        return f"{total_mins:02d}:{secs:05.2f}"
    return ts_str

def convert_to_wav16k(input_path: str, output_wav_path: str) -> bool:
    """
    Convert any audio format to 16kHz mono 16-bit PCM WAV using ffmpeg.
    """
    command = [
        "ffmpeg",
        "-y",
        "-i", input_path,
        "-ar", "16000",
        "-ac", "1",
        "-c:a", "pcm_s16le",
        output_wav_path
    ]
    try:
        subprocess.run(command, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        return True
    except subprocess.CalledProcessError as e:
        err_msg = e.stderr.decode("utf-8", errors="ignore")
        logger.error(f"FFmpeg conversion failed for {input_path}: {err_msg}")
        raise RuntimeError(f"FFmpeg audio conversion error: {err_msg}")

def get_audio_duration(file_path: str) -> float:
    """
    Get audio duration in seconds using ffprobe.
    """
    try:
        cmd = [
            "ffprobe",
            "-v", "error",
            "-show_entries", "format=duration",
            "-of", "default=noprint_wrappers=1:nokey=1",
            file_path
        ]
        result = subprocess.run(cmd, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        return float(result.stdout.decode().strip())
    except Exception:
        return 0.0

def transcribe_audio(
    audio_path: str,
    model_path: Optional[str] = None,
    threads: int = 8
) -> Dict[str, Any]:
    """
    Execute whisper.cpp transcription on the specified audio file.
    Returns structured segments, plain text, duration, and processing time.
    """
    if not os.path.exists(WHISPER_EXECUTABLE):
        raise FileNotFoundError(f"Whisper binary not found at {WHISPER_EXECUTABLE}. Ensure whisper.cpp is compiled.")

    actual_model = model_path if model_path and os.path.exists(model_path) else DEFAULT_MODEL_PATH
    if not os.path.exists(actual_model):
        raise FileNotFoundError(f"Whisper model not found at {actual_model}")

    if not os.path.exists(audio_path):
        raise FileNotFoundError(f"Audio file not found: {audio_path}")

    start_time = time.time()

    with tempfile.TemporaryDirectory() as tmpdir:
        wav_path = os.path.join(tmpdir, "input_16k.wav")
        json_out_base = os.path.join(tmpdir, "whisper_out")
        json_out_file = f"{json_out_base}.json"

        # 1. Convert to 16kHz mono WAV
        convert_to_wav16k(audio_path, wav_path)

        # 2. Get audio duration
        duration = get_audio_duration(wav_path)

        # 3. Run Whisper CLI with JSON export
        cmd = [
            WHISPER_EXECUTABLE,
            "-m", actual_model,
            "-t", str(threads),
            "-f", wav_path,
            "-oj",
            "-of", json_out_base,
            "-np"  # No prints to stdout
        ]

        logger.info(f"Running Whisper inference: {' '.join(cmd)}")
        result = subprocess.run(cmd, capture_output=True, text=True)

        if result.returncode != 0 and not os.path.exists(json_out_file):
            raise RuntimeError(f"Whisper inference failed: {result.stderr}")

        # 4. Parse Whisper JSON output
        segments: List[Dict[str, str]] = []
        plain_text_pieces: List[str] = []

        if os.path.exists(json_out_file):
            with open(json_out_file, "r", encoding="utf-8") as f:
                data = json.load(f)
                transcription_items = data.get("transcription", [])

                for item in transcription_items:
                    raw_text = item.get("text", "").strip()
                    if not raw_text:
                        continue
                    ts = item.get("timestamps", {})
                    start_formatted = format_timestamp(ts.get("from", "00:00:00,000"))
                    end_formatted = format_timestamp(ts.get("to", "00:00:00,000"))

                    segments.append({
                        "start": start_formatted,
                        "end": end_formatted,
                        "speaker": "Speaker 1",
                        "text": raw_text
                    })
                    plain_text_pieces.append(raw_text)

        # Fallback if no structured segments parsed
        if not segments:
            clean_text = result.stdout.strip()
            if clean_text:
                segments.append({
                    "start": "00:00.00",
                    "end": format_timestamp(f"00:00:{int(duration):02d},000"),
                    "speaker": "Speaker 1",
                    "text": clean_text
                })
                plain_text_pieces.append(clean_text)

        full_plain_text = " ".join(plain_text_pieces)
        elapsed_ms = int((time.time() - start_time) * 1000)

        return {
            "plain_text": full_plain_text,
            "segments": segments,
            "transcript_json": json.dumps(segments),
            "duration": round(duration, 2),
            "processing_ms": elapsed_ms
        }

if __name__ == "__main__":
    sample_wav = os.path.abspath(os.path.join(BASE_DIR, "../frontend/public/samples-audio/harvard.wav"))
    if os.path.exists(sample_wav):
        print(f"Testing Whisper pipeline on {sample_wav}...")
        res = transcribe_audio(sample_wav)
        print("Result:")
        print(f"- Text: {res['plain_text']}")
        print(f"- Duration: {res['duration']}s")
        print(f"- Processing Time: {res['processing_ms']}ms")
        print(f"- Segments count: {len(res['segments'])}")
    else:
        print(f"Sample audio not found at {sample_wav}")