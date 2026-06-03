export default function EmptyState({ icon, title, description, action }) {
  return (
    <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-8 text-center">
      <div className="text-5xl mb-3">{icon}</div>
      <h3 className="text-lg font-semibold text-slate-800 mb-1">{title}</h3>
      <p className="text-sm text-slate-600 mb-4 max-w-sm mx-auto">{description}</p>
      {action}
    </div>
  );
}
