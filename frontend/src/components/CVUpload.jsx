import { useState, useRef } from "react";
import api from "../lib/api";
import SkillTag from "./SkillTag";

export default function CVUpload({ onParsed }) {
  const [status, setStatus] = useState("idle"); // idle | uploading | done | error
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const inputRef = useRef();

  async function handleFile(file) {
    if (!file) return;
    setStatus("uploading");
    setError("");

    const form = new FormData();
    form.append("file", file);

    try {
      const res = await api.post("/cv/upload", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setResult(res.data);
      setStatus("done");
      onParsed?.(res.data);
    } catch (err) {
      setError(err.response?.data?.error || "Upload failed.");
      setStatus("error");
    }
  }

  function handleDrop(e) {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }

  return (
    <div className="space-y-4">
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => inputRef.current?.click()}
        className="border-2 border-dashed border-indigo-300 rounded-2xl p-8 text-center cursor-pointer hover:bg-indigo-50 transition"
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
        {status === "uploading" ? (
          <p className="text-indigo-600 font-medium">Uploading and parsing…</p>
        ) : (
          <>
            <p className="text-gray-600 font-medium">Drop your CV here or click to browse</p>
            <p className="text-xs text-gray-400 mt-1">PDF only · Max 5 MB</p>
          </>
        )}
      </div>

      {status === "error" && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
          {error}
        </div>
      )}

      {status === "done" && result && (
        <div className="bg-white border border-gray-100 rounded-2xl shadow p-6 space-y-3">
          <p className="text-sm font-semibold text-gray-700">
            CV parsed — {result.text_length} characters extracted
          </p>
          {result.skills?.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {result.skills.map((s) => (
                <SkillTag key={s} skill={s} variant="match" />
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400">No skills detected.</p>
          )}
          {result.sections_present && (
            <div className="flex flex-wrap gap-2 mt-2">
              {Object.entries(result.sections_present)
                .filter(([, v]) => v)
                .map(([k]) => (
                  <span key={k} className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded">
                    {k}
                  </span>
                ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
