import logging
from typing import Optional

logger = logging.getLogger("wavepipe.summarization")

def summarize_text(text: str, max_length: int = 150) -> str:
    """
    Summarize transcript text.
    Uses lightweight frequency/sentence extraction by default, 
    with optional transformers/FLAN-T5 pipeline if available.
    """
    if not text or not text.strip():
        return ""

    clean_text = text.strip()
    sentences = [s.strip() for s in clean_text.replace("\n", " ").split(".") if len(s.strip()) > 10]
    
    if len(sentences) <= 2:
        return clean_text

    # Try transformer-based summarizer if PyTorch / HuggingFace is loaded
    try:
        from transformers import pipeline
        # Use a small fast summarizer model or fallback
        summarizer = pipeline("summarization", model="sshleifer/distilbart-cnn-12-6", framework="pt")
        res = summarizer(clean_text[:1024], max_length=max_length, min_length=30, do_sample=False)
        if res and len(res) > 0:
            return res[0].get("summary_text", "")
    except Exception as e:
        logger.debug(f"Neural summarizer not loaded ({e}), using extractive summarization fallback.")

    # Lightweight Extractive Fallback: Key sentences based on word frequency
    words = [w.lower() for w in clean_text.split() if w.isalnum()]
    if not words:
        return sentences[0] + "."

    freq = {}
    for w in words:
        if len(w) > 3:
            freq[w] = freq.get(w, 0) + 1

    scored_sentences = []
    for s in sentences:
        score = sum(freq.get(w.lower(), 0) for w in s.split() if w.isalnum())
        scored_sentences.append((score / (len(s.split()) + 1), s))

    scored_sentences.sort(key=lambda x: x[0], reverse=True)
    top_sentences = [s[1] for s in scored_sentences[:3]]
    return ". ".join(top_sentences) + "."
