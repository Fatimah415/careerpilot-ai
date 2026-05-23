def skill_overlap(cv_skills: list, job_skills: list) -> dict:
    """
    Compute skill overlap between a CV and a job.

    Returns matching skills, missing job skills, extra CV skills,
    and a coverage fraction/percentage.
    All comparisons are case-insensitive.
    """
    cv_set = {s.lower() for s in cv_skills}
    job_set = {s.lower() for s in job_skills}

    cv_original = {s.lower(): s for s in cv_skills}
    job_original = {s.lower(): s for s in job_skills}

    matching_lower = cv_set & job_set
    missing_lower = job_set - cv_set
    extra_lower = cv_set - job_set

    coverage = len(matching_lower) / len(job_set) if job_set else 0.0

    return {
        "matching": sorted(job_original[s] for s in matching_lower),
        "missing": sorted(job_original[s] for s in missing_lower),
        "extra": sorted(cv_original[s] for s in extra_lower),
        "coverage": round(coverage, 3),
        "coverage_pct": int(round(coverage * 100)),
    }
