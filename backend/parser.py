"""
CV Parser — extracts text, skills, and entities from a PDF.

Architecture:
  PDF file path
       |
       v
  pdfplumber.extract_text() -> raw text
       |
       v
  --- 3 parallel extractors ---
  |            |             |
skills      entities      sections
(Trie)      (spaCy)       (regex)
  |            |             |
  +------------+-------------+
               v
          parsed dict
"""
import re
import pdfplumber
import spacy
from backend.trie import SKILL_TRIE

NLP = spacy.load("en_core_web_sm")

SECTION_HEADERS = [
    "education", "experience", "work experience", "employment",
    "skills", "technical skills", "projects", "certifications",
    "summary", "objective", "achievements", "contact",
]


def extract_text(pdf_path: str) -> str:
    """Extract plain text from a PDF using pdfplumber.
    Returns empty string if extraction fails (corrupt PDF, scanned image, etc.)."""
    try:
        pages = []
        with pdfplumber.open(pdf_path) as pdf:
            for page in pdf.pages:
                text = page.extract_text()
                if text:
                    pages.append(text)
        return "\n\n".join(pages)
    except Exception as e:
        print(f"[parser] extract_text failed: {e}")
        return ""


def extract_skills(text: str) -> list:
    """Use the Day 2 Trie to find known skills in the text."""
    return SKILL_TRIE.extract_skills(text)


def extract_entities(text: str) -> dict:
    """Run spaCy NER and return categorized entities."""
    if not text:
        return {"names": [], "organisations": [], "dates": [], "locations": []}

    doc = NLP(text[:50_000])  # cap at 50k chars to avoid blowing memory

    persons = []
    orgs = []
    dates = []
    gpes = []

    for ent in doc.ents:
        if ent.label_ == "PERSON" and ent.text not in persons:
            persons.append(ent.text)
        elif ent.label_ == "ORG" and ent.text not in orgs:
            orgs.append(ent.text)
        elif ent.label_ == "DATE" and ent.text not in dates:
            dates.append(ent.text)
        elif ent.label_ == "GPE" and ent.text not in gpes:
            gpes.append(ent.text)

    return {
        "names": persons[:5],
        "organisations": orgs[:15],
        "dates": dates[:15],
        "locations": gpes[:10],
    }


def detect_sections(text: str) -> dict:
    """Find which standard CV sections are present.
    Used by the ATS formatting score in Week 2."""
    text_lower = text.lower()
    found = {}
    for header in SECTION_HEADERS:
        pattern = r"(?:^|\n)\s*" + re.escape(header) + r"\s*[:\n]"
        found[header] = bool(re.search(pattern, text_lower))
    return found


def parse_cv(pdf_path: str) -> dict:
    """Full pipeline: PDF -> parsed CV dict."""
    raw_text = extract_text(pdf_path)
    success = bool(raw_text.strip())

    if not success:
        return {
            "raw_text": "",
            "skills": [],
            "entities": {"names": [], "organisations": [], "dates": [], "locations": []},
            "sections_present": {},
            "text_length": 0,
            "parse_success": False,
        }

    return {
        "raw_text": raw_text,
        "skills": extract_skills(raw_text),
        "entities": extract_entities(raw_text),
        "sections_present": detect_sections(raw_text),
        "text_length": len(raw_text),
        "parse_success": True,
    }
