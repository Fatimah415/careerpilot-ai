import { useState, useEffect } from "react";
import api from "../lib/api";
import SkillTag from "./SkillTag";

export default function RecommendationsView({ refreshTrigger }) {
  const [recs, setRecs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    api.get("/recommendations?limit=10")
      .then((res) => setRecs(res.data.recommendations || []))
      .catch((err) => {
        if (err.response?.status === 404) {
          setRecs([]);
          setError("");
        } else {
          setError(err.response?.data?.error || "Failed to load recommendations");
        }
      })
      .finally(() => setLoading(false));
  }, [refreshTrigger]);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow border border-gray-100 p-6">
        <p className="text-gray-400 text-sm">Calculating matches...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-sm text-red-700">
        {error}
      </div>
    );
  }

  if (recs.length === 0) {
    return (
      <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-6 text-sm text-indigo-800">
        Upload your CV to see your top job matches.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-800">Your Top Matches</h2>
        <span className="text-xs text-gray-400">{recs.length} jobs ranked</span>
      </div>
      <div className="space-y-3">
        {recs.map((r) => (
          <MatchRow key={r.job.id} rec={r} />
        ))}
      </div>
    </div>
  );
}

function MatchRow({ rec }) {
  const { job, score, matching_skills, missing_skills } = rec;

  return (
    <div className="border border-gray-100 rounded-xl p-4 hover:shadow-sm transition">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-800 truncate">{job.title}</h3>
          <p className="text-sm text-gray-500">
            {job.company}{job.location ? ` · ${job.location}` : ""}
          </p>
        </div>
        <ScoreBadge score={score} />
      </div>

      {matching_skills.length > 0 && (
        <div className="mt-3">
          <p className="text-xs text-gray-400 mb-1">You have these required skills:</p>
          <div className="flex flex-wrap gap-1.5">
            {matching_skills.map((s) => (
              <SkillTag key={s} skill={s} variant="match" />
            ))}
          </div>
        </div>
      )}

      {missing_skills.length > 0 && (
        <div className="mt-2">
          <p className="text-xs text-gray-400 mb-1">Skills to learn:</p>
          <div className="flex flex-wrap gap-1.5">
            {missing_skills.map((s) => (
              <SkillTag key={s} skill={s} variant="missing" />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ScoreBadge({ score }) {
  let style, label;
  if (score >= 75) {
    style = "bg-green-100 text-green-800 border-green-200";
    label = "Strong match";
  } else if (score >= 50) {
    style = "bg-yellow-100 text-yellow-800 border-yellow-200";
    label = "Good match";
  } else {
    style = "bg-gray-100 text-gray-600 border-gray-200";
    label = "Weak match";
  }

  return (
    <div className="text-right shrink-0">
      <div className={`px-3 py-1 rounded-full border text-sm font-bold ${style}`}>
        {score}%
      </div>
      <p className="text-xs text-gray-400 mt-1">{label}</p>
    </div>
  );
}
