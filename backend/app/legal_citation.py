import os
import glob
from typing import List, Dict

LEGAL_DOCS_PATH = os.path.join(os.path.dirname(__file__), '../data/legal_docs/*.txt')

def find_citations(question: str, top_k: int = 2) -> List[Dict]:
    """
    Find the most relevant sections from the legal docs for the given question.
    Returns a list of dicts: {file, section, text}
    """
    import re
    import difflib
    citations = []
    files = glob.glob(LEGAL_DOCS_PATH)
    question_lower = question.lower()

    for file_path in files:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        # Split by section headers if present, else by paragraphs
        sections = re.split(r'(?i)(section \d+[:.])', content)
        if len(sections) > 1:
            # Pair section headers with their content
            section_chunks = []
            for i in range(1, len(sections), 2):
                header = sections[i].strip()
                text = sections[i+1].strip() if i+1 < len(sections) else ''
                section_chunks.append((header, text))
        else:
            section_chunks = [(None, content)]
        # Find best matching section(s)
        best = sorted(
            section_chunks,
            key=lambda tup: difflib.SequenceMatcher(None, question_lower, tup[1].lower()).ratio(),
            reverse=True
        )[:top_k]
        for header, text in best:
            if text.strip():
                citations.append({
                    'file': os.path.basename(file_path),
                    'section': header or '',
                    'text': text[:350] + ('...' if len(text) > 350 else '')
                })
    # Sort all matches by best similarity (top_k overall)
    citations = sorted(citations, key=lambda c: difflib.SequenceMatcher(None, question_lower, c['text'].lower()).ratio(), reverse=True)[:top_k]
    return citations
