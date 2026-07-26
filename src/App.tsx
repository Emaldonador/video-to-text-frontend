import { useEffect, useState } from "react";
import { uploadVideo, listJobs } from "./api/client";
import { useJobPolling } from "./hooks/useJobPolling";
import { UploadZone } from "./components/UploadZone";
import { JobProgress } from "./components/JobProgress";
import { TranscriptViewer } from "./components/TranscriptViewer";
import { AnalysisViewer } from "./components/AnalysisViewer";
import { JobHistory } from "./components/JobHistory";
import type { Job } from "./types/job";

function App() {
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [history, setHistory]         = useState<Job[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const { job, error: pollError } = useJobPolling(activeJobId);

  const refreshHistory = async () => {
    try { setHistory(await listJobs()); } catch { /* no bloquea */ }
  };

  useEffect(() => { refreshHistory(); }, []);
  useEffect(() => {
    if (job && (job.status === "done" || job.status === "error")) refreshHistory();
  }, [job?.status]);

  const handleFile = async (file: File) => {
    setUploadError(null);
    setIsUploading(true);
    try {
      const created = await uploadVideo(file);
      setActiveJobId(created.id);
      await refreshHistory();
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsUploading(false);
    }
  };

  const isProcessing = job && job.status !== "done" && job.status !== "error";

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header style={{
        background: "linear-gradient(135deg, #2e1065 0%, #4c1d95 45%, #312e81 100%)",
        boxShadow: "0 4px 24px rgb(0 0 0 / .25)",
      }}>
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl"
              style={{ background: "rgb(255 255 255 / .15)", backdropFilter: "blur(8px)" }}>
              <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-white">VideoATexto</h1>
              <p className="text-xs" style={{ color: "rgb(196 181 253)" }}>
                Transcripción local · privada · sin límites
              </p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium"
            style={{ background: "rgb(255 255 255 / .1)", color: "rgb(221 214 254)" }}>
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 inline-block" />
            100% local
          </div>
        </div>
      </header>

      {/* ── Main ───────────────────────────────────────────────────────────── */}
      <main className="mx-auto grid max-w-5xl grid-cols-1 gap-6 px-4 py-8 md:grid-cols-[1fr_272px] md:px-6">

        <div className="space-y-5 min-w-0">
          <UploadZone onFileSelected={handleFile} disabled={isUploading || !!isProcessing} />

          {(uploadError || pollError) && (
            <div className="animate-float-up flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
              <svg className="mt-0.5 h-4 w-4 shrink-0 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
              </svg>
              <p className="text-sm text-red-700">{uploadError || pollError}</p>
            </div>
          )}

          {job && job.status !== "done" && job.status !== "cancelled" && (
            <div className="animate-float-up"><JobProgress job={job} /></div>
          )}

          {job && job.status === "done" && (
            <div className="animate-float-up space-y-5">
              <TranscriptViewer job={job} />
              <AnalysisViewer job={job} />
            </div>
          )}
        </div>

        <aside>
          <JobHistory jobs={history} activeJobId={activeJobId} onSelect={setActiveJobId} />
        </aside>
      </main>
    </div>
  );
}

export default App;
