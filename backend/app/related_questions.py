# related_questions.py
"""
Returns related legal questions based on a user query, using simple keyword and fuzzy matching.
"""
from typing import List
import difflib

# Example legal topics/questions database (expandable)
LEGAL_QUESTIONS = [
    "What is bail under Indian law?",
    "How to file an FIR?",
    "What are fundamental rights?",
    "How to get anticipatory bail?",
    "What is a bailable offence?",
    "How to file a police complaint?",
    "What is the process of divorce in India?",
    "What are the rights of an arrested person?",
    "What is a non-bailable offence?",
    "How to get a certified copy of a judgment?",
    "What is anticipatory bail?",
    "How to file a writ petition?",
    "What is the difference between civil and criminal law?",
    "How to get legal aid in India?",
    "What is an FIR?",
    "What is a charge sheet?",
    "What is a legal notice?"
]

def get_related_questions(query: str, top_k: int = 6) -> List[str]:
    """
    Returns a list of related legal questions based on the input query.
    """
    if not query or not query.strip():
        return LEGAL_QUESTIONS[:top_k]
    query = query.lower()
    # Use difflib for fuzzy matching
    ranked = sorted(
        LEGAL_QUESTIONS,
        key=lambda q: difflib.SequenceMatcher(None, query, q.lower()).ratio(),
        reverse=True
    )
    # Always include some diversity
    results = ranked[:top_k]
    if all(difflib.SequenceMatcher(None, query, q.lower()).ratio() < 0.3 for q in results):
        # If nothing is relevant, just return the top N
        return LEGAL_QUESTIONS[:top_k]
    return results
