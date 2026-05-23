import { useEffect, useState } from "react";
import api from "../lib/api";

export default function JobsPage() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/jobs")
      .then((res) => setJobs(res.data.jobs))
      .catch(() => setError("Could not load jobs."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-10 text-center text-gray-500">Loading jobs…</div>;
  if (error) return <div className="p-10 text-center text-red-500">{error}</div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Browse Jobs</h1>
      <div className="space-y-4">
        {jobs.map((job) => (
          <div key={job.id} className="bg-white rounded-2xl shadow border border-gray-100 p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-800">{job.title}</h2>
                <p className="text-sm text-gray-500">{job.company} · {job.location || "Location not specified"}</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 mt-3 line-clamp-3">{job.description}</p>
            {job.required_skills?.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {job.required_skills.map((skill) => (
                  <span
                    key={skill}
                    className="bg-indigo-50 text-indigo-700 text-xs font-medium px-3 py-1 rounded-full"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
