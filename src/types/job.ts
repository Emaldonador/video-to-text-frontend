// Tipos del dominio en el frontend. Se mantienen alineados con los
// esquemas que devuelve la API (app/api/schemas.py en el backend).

export type JobStatus =
  | "queued"
  | "extracting_audio"
  | "transcribing"
  | "done"
  | "error"
  | "cancelled";

export interface Job {
  id: string;
  original_filename: string;
  status: JobStatus;
  progress: number;
  error: string | null;
  language: string | null;
  duration_seconds: number | null;
  word_count: number | null;
  created_at: number;
  updated_at: number;
}

export const STATUS_LABELS: Record<JobStatus, string> = {
  queued: "En cola",
  extracting_audio: "Extrayendo audio",
  transcribing: "Transcribiendo",
  done: "Completado",
  error: "Error",
  cancelled: "Cancelado",
};
