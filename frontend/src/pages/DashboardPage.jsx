import { useEffect, useState } from "react";
import { useAuth } from "../lib/AuthContext";
import api from "../lib/api";
import CVUpload from "../components/CVUpload";
import ProfileEditor from "../components/ProfileEditor";
import SkillTag from "../components/SkillTag";

export default function DashboardPage() {
  const { user } = useAuth();
  const [cv, setCv] = useState(null);
  const [tab, setTab] = useState("cv");

  useEffect(() => {
    api.get("/cv/me")
      .then((res) => setCv(res.data))
      .catch(() => setCv(null));
  }, []);

  function handleParsed(data) {
    setCv({ skills: data.skills, text_length: data.text_length });
  }

  const tabClass = (t) =>
    `px-4 py-2 text-sm font-medium rounded-lg transition ${
      tab === t ? "bg-indigo-600 text-white" : "text-gray-600 hover:bg-gray-100"
    }`;

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold text-gray-800 mb-1">
        Welcome, {user?.full_name}!
      </h1>
      <p className="text-gray-500 mb-8 text-sm">Manage your CV and profile below.</p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
        <div className="bg-white rounded-2xl shadow border border-gray-100 p-5">
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">CV Status</p>
          <p className="text-lg font-semibold text-indigo-600">
            {cv ? "Uploaded" : "Not uploaded"}
          </p>
        </div>
        <div className="bg-white rounded-2xl shadow border border-gray-100 p-5">
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Skills Found</p>
          <p className="text-lg font-semibold text-indigo-600">
            {cv ? cv.skills?.length ?? 0 : "-"}
          </p>
        </div>
        <div className="bg-white rounded-2xl shadow border border-gray-100 p-5">
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Target Role</p>
          <p className="text-lg font-semibold text-indigo-600">
            {user?.target_role || "-"}
          </p>
        </div>
      </div>

      <div className="flex gap-2 mb-6">
        <button className={tabClass("cv")} onClick={() => setTab("cv")}>CV &amp; Skills</button>
        <button className={tabClass("profile")} onClick={() => setTab("profile")}>Profile</button>
      </div>

      {tab === "cv" && (
        <div className="bg-white rounded-2xl shadow border border-gray-100 p-6 space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Upload your CV</h2>
            <CVUpload onParsed={handleParsed} />
          </div>
          {cv?.skills?.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Detected Skills</h3>
              <div className="flex flex-wrap gap-2">
                {cv.skills.map((s) => (
                  <SkillTag key={s} skill={s} variant="match" />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {tab === "profile" && (
        <div className="bg-white rounded-2xl shadow border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Edit Profile</h2>
          <ProfileEditor />
        </div>
      )}
    </div>
  );
}
