import os
import json
import logging
from typing import Optional, List, Dict, Any
import psycopg
from dotenv import load_dotenv

# Load env from frontend .env
load_dotenv(os.path.join(os.path.dirname(__file__), "../frontend/.env"))

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise ValueError("DATABASE_URL is not set. Please set it in .env or as an environment variable.")

# Strip schema param if needed for psycopg
clean_db_url = DATABASE_URL.split("?")[0] if "?" in DATABASE_URL else DATABASE_URL

logger = logging.getLogger("wavepipe.db")

def get_connection():
    """Get a raw psycopg connection to PostgreSQL."""
    return psycopg.connect(clean_db_url)

def update_job_status(job_id: str, status: str, current_stage: Optional[str] = None) -> bool:
    """Update job status and current stage in PostgreSQL."""
    try:
        with get_connection() as conn:
            with conn.cursor() as cur:
                if current_stage:
                    cur.execute(
                        """
                        UPDATE "Job"
                        SET status = %s::"JobStatus", "currentStage" = %s, "updatedAt" = NOW()
                        WHERE id = %s
                        """,
                        (status, current_stage, job_id)
                    )
                else:
                    cur.execute(
                        """
                        UPDATE "Job"
                        SET status = %s::"JobStatus", "updatedAt" = NOW()
                        WHERE id = %s
                        """,
                        (status, job_id)
                    )
                conn.commit()
                return cur.rowcount > 0
    except Exception as e:
        logger.error(f"Failed to update job status for {job_id}: {e}")
        return False

def update_job_completed(
    job_id: str,
    transcript: str,
    duration: float,
    processing_ms: int,
    summary: Optional[str] = None,
    keywords: Optional[List[str]] = None,
    sentiment: Optional[str] = None
) -> bool:
    """Update job upon successful Whisper transcription in PostgreSQL."""
    try:
        with get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    UPDATE "Job"
                    SET status = 'COMPLETED'::"JobStatus",
                        "currentStage" = 'completed',
                        transcript = %s,
                        duration = %s,
                        "processingMs" = %s,
                        summary = COALESCE(%s, summary),
                        keywords = COALESCE(%s, keywords),
                        sentiment = COALESCE(%s, sentiment),
                        "errorMessage" = NULL,
                        "updatedAt" = NOW()
                    WHERE id = %s
                    """,
                    (
                        transcript,
                        duration,
                        processing_ms,
                        summary,
                        keywords if keywords is not None else None,
                        sentiment,
                        job_id
                    )
                )
                conn.commit()
                return cur.rowcount > 0
    except Exception as e:
        logger.error(f"Failed to mark job completed for {job_id}: {e}")
        return False

def update_job_failed(job_id: str, error_message: str) -> bool:
    """Update job upon failure in PostgreSQL."""
    try:
        with get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    UPDATE "Job"
                    SET status = 'FAILED'::"JobStatus",
                        "currentStage" = 'failed',
                        "errorMessage" = %s,
                        "updatedAt" = NOW()
                    WHERE id = %s
                    """,
                    (error_message, job_id)
                )
                conn.commit()
                return cur.rowcount > 0
    except Exception as e:
        logger.error(f"Failed to mark job failed for {job_id}: {e}")
        return False

def get_job(job_id: str) -> Optional[Dict[str, Any]]:
    """Retrieve job details by ID."""
    try:
        with get_connection() as conn:
            with conn.cursor(row_factory=psycopg.rows.dict_row) as cur:
                cur.execute('SELECT * FROM "Job" WHERE id = %s', (job_id,))
                return cur.fetchone()
    except Exception as e:
        logger.error(f"Failed to get job {job_id}: {e}")
        return None
