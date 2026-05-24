from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from backend.matching import skill_overlap

COSINE_WEIGHT = 0.6
COVERAGE_WEIGHT = 0.4


class JobMatcher:
    def __init__(self):
        self.vectorizer = None
        self.job_ids = []
        self.job_vectors = None
        self.jobs_by_id = {}

    def build_from_jobs(self, jobs: list) -> None:
        if not jobs:
            print("[matcher] no jobs to build from")
            return

        corpus = []
        for j in jobs:
            skill_str = " ".join(j.required_skills or [])
            text = f"{j.title} {j.title} {skill_str} {skill_str} {j.description}"
            corpus.append(text)
            self.jobs_by_id[j.id] = j

        self.job_ids = [j.id for j in jobs]
        self.vectorizer = TfidfVectorizer(
            lowercase=True,
            stop_words="english",
            ngram_range=(1, 2),
            min_df=1,
            max_df=0.95,
            sublinear_tf=True,
        )
        self.job_vectors = self.vectorizer.fit_transform(corpus)
        print(f"[ok] Matcher: indexed {len(jobs)} jobs, vocab size = {len(self.vectorizer.vocabulary_)}")

    def _cv_to_vector(self, cv_text: str, cv_skills: list):
        skill_str = " ".join(cv_skills or [])
        text = f"{skill_str} {skill_str} {cv_text or ''}"
        return self.vectorizer.transform([text])

    def match_cv_to_job(self, cv_text: str, cv_skills: list, job_id: int) -> dict:
        if self.vectorizer is None:
            raise RuntimeError("Matcher not built. Call build_from_jobs() first.")
        if job_id not in self.jobs_by_id:
            raise ValueError(f"Job {job_id} not in matcher index")

        job = self.jobs_by_id[job_id]
        job_idx = self.job_ids.index(job_id)

        cv_vec = self._cv_to_vector(cv_text, cv_skills)
        cosine = float(cosine_similarity(cv_vec, self.job_vectors[job_idx])[0][0])

        overlap = skill_overlap(cv_skills or [], job.required_skills or [])
        final = (COSINE_WEIGHT * cosine) + (COVERAGE_WEIGHT * overlap["coverage"])

        return {
            "score": int(round(final * 100)),
            "cosine": round(cosine, 3),
            "coverage": overlap["coverage"],
            "matching_skills": overlap["matching"],
            "missing_skills": overlap["missing"],
        }

    def rank_jobs_for_cv(self, cv_text: str, cv_skills: list, top_n: int = 10) -> list:
        if self.vectorizer is None:
            raise RuntimeError("Matcher not built. Call build_from_jobs() first.")

        cv_vec = self._cv_to_vector(cv_text, cv_skills)
        cosines = cosine_similarity(cv_vec, self.job_vectors)[0]

        results = []
        for i, job_id in enumerate(self.job_ids):
            job = self.jobs_by_id[job_id]
            overlap = skill_overlap(cv_skills or [], job.required_skills or [])
            cosine = float(cosines[i])
            final = (COSINE_WEIGHT * cosine) + (COVERAGE_WEIGHT * overlap["coverage"])
            results.append({
                "job": job.to_dict(),
                "score": int(round(final * 100)),
                "cosine": round(cosine, 3),
                "coverage": overlap["coverage"],
                "matching_skills": overlap["matching"],
                "missing_skills": overlap["missing"][:5],
            })

        results.sort(key=lambda r: r["score"], reverse=True)
        return results[:top_n]


MATCHER = JobMatcher()
