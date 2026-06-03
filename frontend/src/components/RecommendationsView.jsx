import { useState, useEffect } from "react";
import api from "../lib/api";
import SkillTag from "./SkillTag";
import { SkeletonLine, SkeletonCard } from "./Skeleton";
import EmptyState from "./EmptyState";
import ErrorState from "./ErrorState";

export default function RecommendationsView({ refreshTrigger }) {
  const [recs, setRecs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [loadCount, setLoadCount] = useState(0);
  const [slow, setSlow] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError("");
    setSlow(false);
    api.get("/recommendations?limit=10")
      .then((res) => setRecs(res.data.recommendations || []))
      .catch((err) => {
        if (err.response?.status === 404) {
          setRecs([]);
        } else {
          setError(err.message || "Could not load recommendations");
        }
      })
      .finally(() => setLoading(false));
  }, [refreshTrigger, loadCount]);

  useEffect(() => {
    if (!loading) return;
    const timer = setTimeout(() => setSlow(true), 5000);
    return () => clearTimeout(timer);
  }, [loading]);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow border border-gray-100 p-6">
        {slow && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4 text-xs text-amber-800">
            Server is warming up after sleep — may take 30s on first request.
          </div>
        )}
        <div className="flex justify-between items-center mb-4">
          <SkeletonLine width="1/4" className="h-6" />
          <SkeletonLine width="1/4" className="h-3" />
        </div>
        <div className="space-y-3">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <ErrorState
        message={error}
        onRetry={() => setLoadCount((n) => n + 1)}
      />
    );
  }

  if (recs.length === 0) {
    return (
      <EmptyState
        icon="🎯"
        title="No matches yet"
        description="Upload your CV and we'll find the jobs that fit you best — with explanations for each match."
      />
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
            {matching_skills.map((s) => <SkillTag key={s} skill={s} variant="match" />)}
          </div>
        </div>
      )}
      {missing_skills.length > 0 && (
        <div className="mt-2">
          <p className="text-xs text-gray-400 mb-1">Skills to learn:</p>
          <div className="flex flex-wrap gap-1.5">
            {missing_skills.map((s) => <SkillTag key={s} skill={s} variant="missing" />)}
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
      <div className={`px-3 py-1 rounded-full border text-sm font-bold ${style}`}>{score}%</div>
      <p className="text-xs text-gray-400 mt-1">{label}</p>
    </div>
  );
}
