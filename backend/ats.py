from backend.matcher import MATCHER
from backend.matching import skill_overlap

WEIGHTS = {"keyword": 0.40, "skill_coverage": 0.30, "formatting": 0.20, "completeness": 0.10}


def _keyword_score(cv_text, cv_skills, job_id):
    if MATCHER.vectorizer is None or job_id not in MATCHER.jobs_by_id:
        return 0.0
    try:
        result = MATCHER.match_cv_to_job(cv_text, cv_skills, job_id)
        return float(result["cosine"])
    except Exception:
        return 0.0


def _coverage_score(cv_skills, job_required_skills):
    overlap = skill_overlap(cv_skills or [], job_required_skills or [])
    return float(overlap["coverage"])


def _formatting_score(cv_text, sections_present):
    if not cv_text:
        return 0.0
    score = 1.0
    word_count = len(cv_text.split())
    if word_count < 150:
        score -= 0.30
    elif word_count > 1500:
        score -= 0.15
    required_sections = ["education", "experience", "skills"]
    missing = [s for s in required_sections if not sections_present.get(s, False)]
    score -= 0.15 * len(missing)
    if sections_present.get("summary") or sections_present.get("objective"):
        score += 0.05
    return max(0.0, min(1.0, score))


def _completeness_score(sections_present):
    core = ["education", "experience", "skills"]
    nice = ["summary", "objective", "projects", "certifications"]
    core_found = sum(1 for s in core if sections_present.get(s, False))
    nice_found = sum(1 for s in nice if sections_present.get(s, False))
    core_ratio = core_found / len(core)
    nice_ratio = nice_found / len(nice)
    return 0.8 * core_ratio + 0.2 * nice_ratio


def score_cv_against_job(cv_text, cv_skills, sections_present, job):
    k = _keyword_score(cv_text, cv_skills, job.id)
    s = _coverage_score(cv_skills, job.required_skills or [])
    f = _formatting_score(cv_text, sections_present or {})
    c = _completeness_score(sections_present or {})
    total = (
        WEIGHTS["keyword"] * k
        + WEIGHTS["skill_coverage"] * s
        + WEIGHTS["formatting"] * f
        + WEIGHTS["completeness"] * c
    )

    tips = []
    if k < 0.4:
        tips.append("Your CV vocabulary doesn't strongly match this job's description. Mirror keywords from the job posting.")
    if s < 0.5:
        missing = skill_overlap(cv_skills or [], job.required_skills or [])["missing"]
        if missing:
            tips.append(f"Add experience with these required skills if you have it: {', '.join(missing[:3])}.")
    if f < 0.7:
        tips.append("Improve formatting: add standard sections (Education, Experience, Skills) and aim for 1-2 pages.")
    if c < 0.7:
        tips.append("Your CV is missing some standard sections. Consider adding a Summary, Projects, or Certifications section.")

    return {
        "total": int(round(total * 100)),
        "sub_scores": {
            "keyword": int(round(k * 100)),
            "skill_coverage": int(round(s * 100)),
            "formatting": int(round(f * 100)),
            "completeness": int(round(c * 100)),
        },
        "tips": tips,
    }
