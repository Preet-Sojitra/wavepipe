import os
import time
import json
import signal
import sys
import logging
from typing import Optional, List
import redis
from dotenv import load_dotenv

import whisper
import db
import summerization
import keyword_extraction

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] [QueueWorker]: %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S"
)
logger = logging.getLogger("wavepipe.worker")

# Load environment
load_dotenv(os.path.join(os.path.dirname(__file__), "../frontend/.env"))
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")
QUEUE_NAME = os.getenv("QUEUE_NAME", "wavepipe:jobs:transcribe")

running = True

def signal_handler(sig, frame):
    global running
    logger.info("Shutdown signal received. Finishing active job and exiting...")
    running = False

signal.signal(signal.SIGINT, signal_handler)
signal.signal(signal.SIGTERM, signal_handler)

def connect_redis():
    """Establish Redis connection with retry logic."""
    while running:
        try:
            client = redis.from_url(REDIS_URL, decode_responses=True)
            client.ping()
            logger.info(f"Connected to Redis at {REDIS_URL}")
            return client
        except Exception as e:
            logger.warning(f"Could not connect to Redis ({e}). Retrying in 3 seconds...")
            time.sleep(3)
    return None

def process_job(payload: dict):
    """Process a multi-stage audio processing pipeline job."""
    job_id = payload.get("job_id")
    audio_path = payload.get("audio_path")
    model = payload.get("model", "whisper-base.en")
    raw_stages = payload.get("stages", ["transcribe", "summary", "keywords"])
    stages = [s.lower().strip() for s in raw_stages] if isinstance(raw_stages, list) else ["transcribe"]

    if not job_id or not audio_path:
        logger.error(f"Invalid payload received: {payload}")
        return

    logger.info(f"==================================================")
    logger.info(f"==> Processing Job ID: {job_id}")
    logger.info(f"    Audio Path: {audio_path}")
    logger.info(f"    Model: {model}")
    logger.info(f"    Pipeline Stages: {stages}")
    logger.info(f"==================================================")

    if not os.path.exists(audio_path):
        err_msg = f"Audio file not found on disk: {audio_path}"
        logger.error(err_msg)
        db.update_job_failed(job_id, err_msg)
        return

    start_time = time.time()
    summary_result: Optional[str] = None
    keywords_result: Optional[List[str]] = None

    try:
        # ----------------------------------------------------
        # STAGE 1: Whisper Audio Transcription (ASR)
        # ----------------------------------------------------
        logger.info(f"[{job_id}] Stage 1/3: Starting Whisper Transcription...")
        db.update_job_status(job_id, status="PROCESSING", current_stage="transcribing")

        t_start = time.time()
        result = whisper.transcribe_audio(audio_path)
        t_duration_ms = int((time.time() - t_start) * 1000)

        plain_text = result.get("plain_text", "").strip()
        transcript_json = result.get("transcript_json", "[]")
        audio_duration = result.get("duration", 0.0)

        logger.info(f"✓ [{job_id}] Stage 1 (Transcription) finished in {t_duration_ms}ms")
        logger.info(f"  Transcript snippet: {plain_text[:100]}...")

        # ----------------------------------------------------
        # STAGE 2: Text Summarization (FLAN-T5)
        # ----------------------------------------------------
        if "summary" in stages or "summarize" in stages or "summarization" in stages:
            logger.info(f"[{job_id}] Stage 2/3: Starting Summarization...")
            db.update_job_status(job_id, status="PROCESSING", current_stage="summarizing")

            if plain_text:
                s_start = time.time()
                try:
                    summary_result = summerization.summarize_text(plain_text)
                    s_duration_ms = int((time.time() - s_start) * 1000)
                    logger.info(f"✓ [{job_id}] Stage 2 (Summarization) finished in {s_duration_ms}ms")
                    logger.info(f"  Summary: {summary_result}")
                except Exception as sum_err:
                    logger.error(f"✗ [{job_id}] Stage 2 Summarization failed: {sum_err}", exc_info=True)
                    summary_result = f"Summary generation failed: {sum_err}"
            else:
                logger.warning(f"[{job_id}] Skipping summarization: empty transcript.")
        else:
            logger.info(f"[{job_id}] Stage 2 (Summarization) skipped (not in requested stages).")

        # ----------------------------------------------------
        # STAGE 3: Keyword Extraction (KeyBERT)
        # ----------------------------------------------------
        if "keywords" in stages or "keyword_extraction" in stages or "tags" in stages:
            logger.info(f"[{job_id}] Stage 3/3: Starting Keyword Extraction...")
            db.update_job_status(job_id, status="PROCESSING", current_stage="extracting_keywords")

            if plain_text:
                k_start = time.time()
                try:
                    keywords_result = keyword_extraction.extract_keywords(plain_text, top_n=5)
                    k_duration_ms = int((time.time() - k_start) * 1000)
                    logger.info(f"✓ [{job_id}] Stage 3 (Keywords) finished in {k_duration_ms}ms")
                    logger.info(f"  Keywords: {keywords_result}")
                except Exception as kw_err:
                    logger.error(f"✗ [{job_id}] Stage 3 Keyword Extraction failed: {kw_err}", exc_info=True)
                    keywords_result = []
            else:
                logger.warning(f"[{job_id}] Skipping keyword extraction: empty transcript.")
        else:
            logger.info(f"[{job_id}] Stage 3 (Keyword Extraction) skipped (not in requested stages).")

        # ----------------------------------------------------
        # FINAL: Mark Job COMPLETED
        # ----------------------------------------------------
        total_elapsed_ms = int((time.time() - start_time) * 1000)
        db.update_job_completed(
            job_id=job_id,
            transcript=transcript_json,
            duration=audio_duration,
            processing_ms=total_elapsed_ms,
            summary=summary_result,
            keywords=keywords_result
        )

        logger.info(f"==================================================")
        logger.info(f"✓✓ Job {job_id} COMPLETED ALL STAGES in {total_elapsed_ms}ms")
        logger.info(f"==================================================")

    except Exception as e:
        logger.error(f"✗ Failed to process pipeline for job {job_id}: {e}", exc_info=True)
        db.update_job_failed(job_id, str(e))

def main():
    logger.info("==================================================")
    logger.info("  WavePipe Audio Processing Multi-Stage Worker Starting")
    logger.info(f"  Listening on Redis Queue: '{QUEUE_NAME}'")
    logger.info("==================================================")

    r = connect_redis()
    if not r:
        return

    logger.info("Worker is ready and waiting for jobs...")

    while running:
        try:
            # BRPOP blocks until a job is pushed, with 2s timeout for graceful shutdown checks
            item = r.brpop(QUEUE_NAME, timeout=2)
            if item is None:
                continue

            # item is a tuple: (queue_name, json_data)
            raw_data = item[1]
            try:
                payload = json.loads(raw_data)
                process_job(payload)
            except json.JSONDecodeError as json_err:
                logger.error(f"Failed to decode message JSON: {raw_data} ({json_err})")

        except redis.ConnectionError as conn_err:
            logger.warning(f"Redis connection dropped: {conn_err}. Reconnecting...")
            time.sleep(2)
            r = connect_redis()
        except Exception as e:
            logger.error(f"Unexpected worker loop error: {e}", exc_info=True)
            time.sleep(1)

    logger.info("Worker stopped cleanly.")

if __name__ == "__main__":
    main()

