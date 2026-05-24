import SkillTag from "./SkillTag";

export default function JobCard({ job, cvSkills = [] }) {
  const cvSet = new Set(cvSkills.map((s) => s.toLowerCase()));
  const jobSkills = job.required_skills || [];

  const matching = jobSkills.filter((s) => cvSet.has(s.toLowerCase()));
  const missing = jobSkills.filter((s) => !cvSet.has(s.toLowerCase()));
  const coveragePct = jobSkills.length
    ? Math.round((matching.length / jobSkills.length) * 100)
    : null;

  return (
    <div className="bg-white rounded-2xl shadow border border-gray-100 p-6 space-y-3">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-800">{job.title}</h2>
          <p className="text-sm text-gray-500">
            {job.company}
            {job.location ? ` - ${job.location}` : ""}
          </p>
        </div>
        {coveragePct !== null && (
          <span
            className={`text-sm font-bold px-3 py-1 rounded-full shrink-0 ${
              coveragePct >= 70
                ? "bg-green-100 text-green-700"
                : coveragePct >= 40
                ? "bg-yellow-100 text-yellow-700"
                : "bg-red-100 text-red-600"
            }`}
          >
            {coveragePct}% match
          </span>
        )}
      </div>

      <p className="text-sm text-gray-600 line-clamp-3">{job.description}</p>

      {cvSkills.length > 0 ? (
        <div className="space-y-2">
          {matching.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {matching.map((s) => (
                <SkillTag key={s} skill={s} variant="match" />
              ))}
            </div>
          )}
          {missing.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {missing.map((s) => (
                <SkillTag key={s} skill={s} variant="missing" />
              ))}
            </div>
          )}
        </div>
      ) : (
        jobSkills.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {jobSkills.map((s) => (
              <SkillTag key={s} skill={s} />
            ))}
          </div>
        )
      )}
    </div>
  );
}
