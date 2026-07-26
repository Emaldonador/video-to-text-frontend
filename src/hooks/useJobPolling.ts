// Hook que mantiene un job actualizado: mientras esté en curso, consulta
// el backend cada POLL_INTERVAL_MS y detiene el sondeo automáticamente
// al llegar a un estado final (done / error). Aislar este detalle aquí
// evita que los componentes de UI tengan que preocuparse por timers.
import { useEffect, useRef, useState } from "react";
import { getJob } from "../api/client";
import type { Job } from "../types/job";

const POLL_INTERVAL_MS = 1200;

export function useJobPolling(jobId: string | null) {
  const [job, setJob] = useState<Job | null>(null);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (!jobId) {
      setJob(null);
      return;
    }

    let cancelled = false;

    const tick = async () => {
      try {
        const updated = await getJob(jobId);
        if (cancelled) return;
        setJob(updated);
        if (updated.status === "done" || updated.status === "error") {
          if (intervalRef.current) window.clearInterval(intervalRef.current);
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : String(err));
      }
    };

    tick();
    intervalRef.current = window.setInterval(tick, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      if (intervalRef.current) window.clearInterval(intervalRef.current);
    };
  }, [jobId]);

  return { job, error };
}
