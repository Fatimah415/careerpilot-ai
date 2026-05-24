"""
Generate seed_jobs.json from the real LinkedIn dataset.
Picks 30 diverse tech/professional jobs and extracts skills from descriptions.
Run: python generate_seed.py
"""
import csv
import json
import random
import re
import os

BASE = os.path.join(os.path.dirname(__file__), "Dataset")

# Load flat skills list from our skills.json dictionary
with open(os.path.join(os.path.dirname(__file__), "backend", "skills.json"), encoding="utf-8") as f:
    skills_data = json.load(f)

ALL_SKILLS = []
for items in skills_data.values():
    ALL_SKILLS.extend(items)

def extract_skills(text):
    text_lower = text.lower()
    found = []
    for skill in ALL_SKILLS:
        pattern = r'\b' + re.escape(skill.lower()) + r'\b'
        if re.search(pattern, text_lower):
            found.append(skill)
    return found[:10]

TITLE_KEYWORDS = [
    "python", "data", "software", "backend", "frontend", "full stack",
    "machine learning", "analyst", "developer", "engineer", "react",
    "django", "flask", "sql", "cloud", "devops", "java", "javascript",
    "web", "mobile", "android", "ios", "cyber", "network", "database",
    "product manager", "ui", "ux", "qa", "test", "ai", "ml",
]

candidates = []
seen_titles = set()

with open(os.path.join(BASE, "postings.csv"), encoding="utf-8", errors="replace") as f:
    reader = csv.DictReader(f)
    for row in reader:
        title = (row.get("title") or "").strip()
        company = (row.get("company_name") or "").strip()
        location = (row.get("location") or "").strip()
        description = (row.get("description") or "").strip()

        if not title or not company or not description:
            continue
        if len(description.split()) < 80:
            continue

        title_lower = title.lower()
        if not any(kw in title_lower for kw in TITLE_KEYWORDS):
            continue

        norm = title_lower.strip()
        if norm in seen_titles:
            continue
        seen_titles.add(norm)

        skills = extract_skills(description)
        if len(skills) < 2:
            continue

        candidates.append({
            "title": title,
            "company": company,
            "location": location,
            "description": description[:1200].strip(),
            "required_skills": skills,
        })

        if len(candidates) >= 300:
            break

random.seed(42)
selected = random.sample(candidates, min(30, len(candidates)))
selected.sort(key=lambda j: j["title"])

out_path = os.path.join(os.path.dirname(__file__), "backend", "seed_jobs.json")
with open(out_path, "w", encoding="utf-8") as f:
    json.dump(selected, f, indent=2, ensure_ascii=False)

print(f"Written {len(selected)} jobs to backend/seed_jobs.json")
for j in selected:
    print(f"  {j['title']} @ {j['company']} | skills: {j['required_skills'][:4]}")
