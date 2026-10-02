import logging
import re
from typing import List

logger = logging.getLogger("wavepipe.keywords")

STOPWORDS = {
    "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for", "with",
    "by", "about", "against", "between", "into", "through", "during", "before",
    "after", "above", "below", "from", "up", "down", "in", "out", "off", "over",
    "under", "again", "further", "then", "once", "here", "there", "when", "where",
    "why", "how", "all", "any", "both", "each", "few", "more", "most", "other",
    "some", "such", "no", "nor", "not", "only", "own", "same", "so", "than",
    "too", "very", "s", "t", "can", "will", "just", "don", "should", "now",
    "i", "you", "he", "she", "it", "we", "they", "me", "him", "her", "us", "them",
    "my", "your", "his", "their", "our", "its", "is", "am", "are", "was", "were",
    "be", "been", "being", "have", "has", "had", "having", "do", "does", "did",
    "doing", "would", "could", "that", "this", "these", "those"
}

def extract_keywords(text: str, top_n: int = 5) -> List[str]:
    """
    Extract top keywords from text using KeyBERT if available,
    otherwise fast frequency-based keyword ranking.
    """
    if not text or not text.strip():
        return []

    # Try KeyBERT if available
    try:
        from keybert import KeyBERT
        kw_model = KeyBERT()
        keywords = kw_model.extract_keywords(text, keyphrase_ngram_range=(1, 2), stop_words='english', top_n=top_n)
        if keywords:
            return [kw[0] for kw in keywords]
    except Exception as e:
        logger.debug(f"KeyBERT not loaded ({e}), using frequency keyword extraction fallback.")

    # Lightweight Fallback: Frequency ranking with stopword filtering
    words = re.findall(r'\b[a-zA-Z]{3,}\b', text.lower())
    filtered = [w for w in words if w not in STOPWORDS]

    freq = {}
    for w in filtered:
        freq[w] = freq.get(w, 0) + 1

    sorted_keywords = sorted(freq.items(), key=lambda x: x[1], reverse=True)
    return [kw[0] for kw in sorted_keywords[:top_n]]
