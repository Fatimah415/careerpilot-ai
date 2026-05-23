import { useEffect, useState } from "react";
import api from "../lib/api";
import JobCard from "../components/JobCard";

export default function JobsPage() {
  const [jobs, setJobs] = useState([]);
  const [cvSkills, setCvSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    Promise.all([
      api.get("/jobs"),
      api.get("/cv/me").catch(() => null),
    ]).then(([jobsRes, cvRes]) => {
      setJobs(jobsRes.data.jobs);
      if (cvRes) setCvSkills(cvRes.data.skills || []);
    }).catch(() => {
      setError("Could not load jobs.");
    }).finally(() => setLoading(false));
  }, []);

  const filtered = jobs.filter((job) => {
    const q = search.toLowerCase();
    return (
      job.title.toLowerCase().includes(q) ||
      job.company.toLowerCase().includes(q) ||
      (job.location || "").toLowerCase().includes(q)
    );
  });

  const sorted = cvSkills.length
    ? [...filtered].sort((a, b) => {
        const cvSet = new Set(cvSkills.map((s) => s.toLowerCase()));
        const score = (job) => {
          const skills = job.required_skills || [];
          return skills.length
            ? skills.filter((s) => cvSet.has(s.toLowerCase())).length / skills.length
            : 0;
        };
        return score(b) - score(a);
      })
    : filtered;

  if (loading) return <div className="p-10 text-center text-gray-400">Loading jobs…</div>;
  if (error) return <div className="p-10 text-center text-red-500">{error}</div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Browse Jobs</h1>
        <input
          type="text"
          placeholder="Search by title, company, location…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border border-gray-300 rounded-lg px-4 py-2 text-sm w-full sm:w-72 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {cvSkills.length > 0 && (
        <p className="text-sm text-indigo-600 mb-4">
          Showing {sorted.length} jobs — sorted by your skill match
        </p>
      )}

      {sorted.length === 0 ? (
        <p className="text-gray-400 text-center py-10">No jobs found.</p>
      ) : (
        <div className="space-y-4">
          {sorted.map((job) => (
            <JobCard key={job.id} job={job} cvSkills={cvSkills} />
          ))}
        </div>
      )}
    </div>
  );
}
