import { useState, useEffect } from "react";
import api from "../lib/api";
import { SkeletonLine, SkeletonBox } from "./Skeleton";
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
} from "recharts";

export default function ATSScoreView({ jobs }) {
  const [selectedJobId, setSelectedJobId] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!selectedJobId) {
      setResult(null);
      setError("");
      return;
    }
    setLoading(true);
    setError("");
    api
      .get(`/cv/ats?job_id=${selectedJobId}`)
      .then((res) => setResult(res.data))
      .catch((err) => {
        setResult(null);
        if (err.response?.status === 404) {
          setError("Upload your CV first to get an ATS score.");
        } else {
          setError(err.response?.data?.error || "Failed to load ATS score.");
        }
      })
      .finally(() => setLoading(false));
  }, [selectedJobId]);

  const radarData = result
    ? [
        { axis: "Keywords", value: result.sub_scores.keyword },
        { axis: "Skills", value: result.sub_scores.skill_coverage },
        { axis: "Formatting", value: result.sub_scores.formatting },
        { axis: "Completeness", value: result.sub_scores.completeness },
      ]
    : [];

  return (
    <div className="bg-white rounded-2xl shadow border border-gray-100 p-6 space-y-4">
      <h2 className="text-base font-semibold text-gray-800">ATS Score</h2>

      <div>
        <label className="block text-xs text-gray-500 mb-1">Select a job to score against</label>
        <select
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          value={selectedJobId}
          onChange={(e) => setSelectedJobId(e.target.value)}
        >
          <option value="">— choose a job —</option>
          {jobs.map((j) => (
            <option key={j.id} value={j.id}>
              {j.title} @ {j.company}
            </option>
          ))}
        </select>
      </div>

      {!selectedJobId && (
        <div className="text-center py-8 text-slate-500 text-sm">
          Pick a job from the dropdown to see your ATS Score
        </div>
      )}

      {loading && selectedJobId && (
        <div className="space-y-3 mt-2">
          <SkeletonLine width="1/2" className="h-8" />
          <SkeletonBox className="h-48 w-full" />
          <div className="grid grid-cols-2 gap-2">
            <SkeletonBox className="h-16" />
            <SkeletonBox className="h-16" />
            <SkeletonBox className="h-16" />
            <SkeletonBox className="h-16" />
          </div>
        </div>
      )}

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      {result && !loading && (
        <>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-400">Total ATS Score</p>
              <p className="text-4xl font-bold text-indigo-600">{result.total}%</p>
              <p className="text-xs text-gray-500 mt-0.5">
                {result.job_title} @ {result.job_company}
              </p>
            </div>
            <ScoreRing score={result.total} />
          </div>

          <div style={{ height: 250 }}>
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="axis" tick={{ fontSize: 12 }} />
                <Radar
                  dataKey="value"
                  stroke="#C9A24A"
                  fill="#C9A24A"
                  fillOpacity={0.5}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {Object.entries(result.sub_scores).map(([key, val]) => (
              <SubScoreCard key={key} label={LABELS[key] || key} value={val} />
            ))}
          </div>

          {result.tips.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-1">
              <p className="text-xs font-semibold text-amber-800 mb-2">Improvement tips</p>
              {result.tips.map((tip, i) => (
                <p key={i} className="text-xs text-amber-700">• {tip}</p>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

const LABELS = {
  keyword: "Keywords",
  skill_coverage: "Skill Coverage",
  formatting: "Formatting",
  completeness: "Completeness",
};

function SubScoreCard({ label, value }) {
  const color =
    value >= 75 ? "text-green-600" : value >= 50 ? "text-yellow-600" : "text-red-500";
  return (
    <div className="bg-gray-50 rounded-lg p-3">
      <p className="text-xs text-gray-400">{label}</p>
      <p className={`text-xl font-bold ${color}`}>{value}%</p>
    </div>
  );
}

function ScoreRing({ score }) {
  const radius = 30;
  const circ = 2 * Math.PI * radius;
  const offset = circ - (score / 100) * circ;
  const color = score >= 75 ? "#16a34a" : score >= 50 ? "#d97706" : "#dc2626";
  return (
    <svg width="80" height="80" viewBox="0 0 80 80">
      <circle cx="40" cy="40" r={radius} fill="none" stroke="#e5e7eb" strokeWidth="8" />
      <circle
        cx="40"
        cy="40"
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth="8"
        strokeDasharray={circ}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform="rotate(-90 40 40)"
      />
      <text x="40" y="45" textAnchor="middle" fontSize="14" fontWeight="bold" fill={color}>
        {score}%
      </text>
    </svg>
  );
}
