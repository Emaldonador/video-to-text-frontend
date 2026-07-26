import { useState } from "react";
import type { Job } from "../types/job";
import { cancelJob } from "../api/client";

const STATUS_LABELS: Record<string, string> = {
  queued:           "En cola…",
  extracting_audio: "Extrayendo audio…",
  transcribing:     "Transcribiendo…",
  done:             "Completado",
  error:            "Error",
  cancelled:        "Cancelado",
};

const IN_PROGRESS = new Set(["queued", "extracting_audio", "transcribing"]);

export function JobProgress({ job, onCancelled }: { job: Job; onCancelled?: () => void }) {
  const pct         = Math.round(job.progress * 100);
  const inProgress  = IN_PROGRESS.has(job.status);
  const isError     = job.status === "error";
  const isCancelled = job.status === "cancelled";
  const [cancelling, setCancelling]   = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  const handleCancel = async () => {
    setCancelError(null);
    setCancelling(true);
    try { await cancelJob(job.id); onCancelled?.(); }
    catch (err) { setCancelError(err instanceof Error ? err.message : "Error al cancelar"); }
    finally { setCancelling(false); }
  };

  return (
    <div className="card overflow-hidden">
      {/* Franja superior de color */}
      <div className="h-1 w-full" style={{
        background: isError ? "var(--danger)"
          : isCancelled ? "#9ca3af"
          : "linear-gradient(90deg, var(--brand-mid), var(--accent))",
      }} />

      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate font-semibold" style={{ color: "var(--text-1)" }}>
              {job.original_filename}
            </p>
            <p className="mt-0.5 text-sm" style={{ color: "var(--text-3)" }}>
              {STATUS_LABELS[job.status] ?? job.status}
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {inProgress && (
              <span className="rounded-full px-2.5 py-0.5 text-xs font-bold tabular-nums"
                style={{ background: "var(--brand-light)", color: "var(--brand-mid)" }}>
                {pct}%
              </span>
            )}
            {inProgress && (
              <button onClick={handleCancel} disabled={cancelling}
                className="flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors disabled:opacity-50"
                style={{ borderColor: "#fecaca", background: "#fff1f2", color: "var(--danger)" }}>
                {cancelling
                  ? <><svg className="h-3 w-3 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                    </svg>Cancelando…</>
                  : <>✕ Cancelar</>}
              </button>
            )}
          </div>
        </div>

        {/* Barra de progreso */}
        <div className="mt-4 h-2 w-full overflow-hidden rounded-full" style={{ background: "#ede9fe" }}>
          <div
            className={inProgress ? "h-full rounded-full progress-shimmer" : "h-full rounded-full"}
            style={{
              width: `${isError || isCancelled ? 100 : Math.max(pct, 4)}%`,
              background: inProgress ? undefined
                : isError ? "var(--danger)"
                : isCancelled ? "#9ca3af"
                : "var(--success)",
              transition: "width .5s ease",
            }}
          />
        </div>

        {isError && job.error && (
          <p className="mt-3 text-sm" style={{ color: "var(--danger)" }}>{job.error}</p>
        )}
        {isCancelled && (
          <p className="mt-2 text-sm" style={{ color: "var(--text-3)" }}>Transcripción cancelada.</p>
        )}
        {cancelError && (
          <p className="mt-2 text-sm" style={{ color: "var(--danger)" }}>{cancelError}</p>
        )}
      </div>
    </div>
  );
}
