export default function SkillTag({ skill, variant = "default" }) {
  const styles = {
    default: "bg-indigo-50 text-indigo-700",
    match: "bg-green-50 text-green-700",
    missing: "bg-red-50 text-red-600",
    extra: "bg-gray-100 text-gray-600",
  };
  return (
    <span className={`${styles[variant]} text-xs font-medium px-3 py-1 rounded-full`}>
      {skill}
    </span>
  );
}
