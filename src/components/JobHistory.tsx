import type { Job } from "../types/job";

const STATUS_CONFIG: Record<string, { label: string; color: string; dot: string }> = {
  done:             { label: "Listo",      color: "#059669", dot: "#34d399" },
  error:            { label: "Error",      color: "#dc2626", dot: "#f87171" },
  cancelled:        { label: "Cancelado",  color: "#6b7280", dot: "#9ca3af" },
  queued:           { label: "En cola",    color: "#7c3aed", dot: "#a78bfa" },
  extracting_audio: { label: "Procesando", color: "#7c3aed", dot: "#a78bfa" },
  transcribing:     { label: "Transcrib.", color: "#4f46e5", dot: "#818cf8" },
};

function fmtTime(ts: number): string {
  return new Date(ts * 1000).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
}

interface Props {
  jobs: Job[];
  activeJobId: string | null;
  onSelect: (jobId: string) => void;
}

export function JobHistory({ jobs, activeJobId, onSelect }: Props) {
  if (jobs.length === 0) return null;

  return (
    <div className="card p-4">
      <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest"
        style={{ color: "var(--text-3)" }}>
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round"
            d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
        </svg>
        Recientes
      </h3>

      <ul className="space-y-1">
        {jobs.map((job) => {
          const cfg      = STATUS_CONFIG[job.status] ?? STATUS_CONFIG.queued;
          const isActive = activeJobId === job.id;
          return (
            <li key={job.id}>
              <button
                onClick={() => onSelect(job.id)}
                className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2.5 text-left transition-all"
                style={{
                  background: isActive ? "var(--brand-light)" : "transparent",
                  outline: isActive ? `1.5px solid ${cfg.dot}` : "none",
                }}
              >
                <span className="h-2 w-2 shrink-0 rounded-full"
                  style={{ background: cfg.dot, boxShadow: `0 0 0 2px ${cfg.dot}33` }} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium" style={{ color: "var(--text-1)" }}>
                    {job.original_filename}
                  </p>
                  <p className="text-xs" style={{ color: "var(--text-3)" }}>
                    {fmtTime(job.created_at)}
                  </p>
                </div>
                <span className="shrink-0 rounded-full px-1.5 py-0.5 text-xs font-semibold"
                  style={{ background: `${cfg.dot}22`, color: cfg.color }}>
                  {cfg.label}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
