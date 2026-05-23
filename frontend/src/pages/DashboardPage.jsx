import { useAuth } from "../lib/AuthContext";

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold text-gray-800 mb-2">
        Welcome, {user?.full_name}!
      </h1>
      <p className="text-gray-500 mb-8">Here's your CareerPilot dashboard.</p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl shadow p-6 border border-gray-100">
          <p className="text-sm text-gray-500 mb-1">CV Status</p>
          <p className="text-xl font-semibold text-indigo-600">Not uploaded</p>
        </div>
        <div className="bg-white rounded-2xl shadow p-6 border border-gray-100">
          <p className="text-sm text-gray-500 mb-1">Skills Found</p>
          <p className="text-xl font-semibold text-indigo-600">—</p>
        </div>
        <div className="bg-white rounded-2xl shadow p-6 border border-gray-100">
          <p className="text-sm text-gray-500 mb-1">Jobs Matched</p>
          <p className="text-xl font-semibold text-indigo-600">—</p>
        </div>
      </div>

      <div className="mt-10 bg-indigo-50 border border-indigo-100 rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-indigo-800 mb-1">Get started</h2>
        <p className="text-sm text-indigo-700">
          Upload your CV to see which jobs match your skills and what you're missing.
        </p>
      </div>
    </div>
  );
}
