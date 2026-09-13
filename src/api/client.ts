// Cliente de la API: el único módulo del frontend que sabe cómo hablar
// HTTP con el backend. El resto de la app (componentes, hooks) llama a
// estas funciones y no sabe nada de fetch, URLs o JSON. Si en una fase
// futura se cambia de FastAPI a otra cosa, solo este archivo cambia.
import type { Job } from "../types/job";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000";

async function handle<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let detail = res.statusText;
    try {
      const body = await res.json();
      detail = body.detail ?? detail;
    } catch {
      // sin cuerpo JSON, se usa el statusText
    }
    throw new Error(detail);
  }
  return res.json() as Promise<T>;
}

export async function uploadVideo(file: File): Promise<Job> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch(`${API_BASE_URL}/api/jobs`, {
    method: "POST",
    body: formData,
  });
  return handle<Job>(res);
}

export async function getJob(jobId: string): Promise<Job> {
  const res = await fetch(`${API_BASE_URL}/api/jobs/${jobId}`);
  return handle<Job>(res);
}

export async function listJobs(): Promise<Job[]> {
  const res = await fetch(`${API_BASE_URL}/api/jobs`);
  return handle<Job[]>(res);
}

export async function getTranscriptText(jobId: string): Promise<string> {
  const res = await fetch(`${API_BASE_URL}/api/jobs/${jobId}/text`);
  if (!res.ok) throw new Error("No se pudo obtener la transcripción.");
  return res.text();
}

export async function getTranscriptHtml(jobId: string): Promise<string> {
  const res = await fetch(`${API_BASE_URL}/api/jobs/${jobId}/html`);
  if (!res.ok) throw new Error("No se pudo obtener la transcripción formateada.");
  return res.text();
}

export function downloadUrl(jobId: string): string {
  return `${API_BASE_URL}/api/jobs/${jobId}/download`;
}

export function transcriptPdfUrl(jobId: string): string {
  return `${API_BASE_URL}/api/jobs/${jobId}/transcript.pdf`;
}

export function documentUrl(jobId: string): string {
  return `${API_BASE_URL}/api/jobs/${jobId}/document`;
}

export function analysisPdfUrl(jobId: string, diagramType?: DiagramType): string {
  const url = `${API_BASE_URL}/api/jobs/${jobId}/analysis.pdf`;
  return diagramType ? `${url}?tipo=${diagramType}` : url;
}

export async function cancelJob(jobId: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/api/jobs/${jobId}/cancel`, { method: "POST" });
  if (!res.ok) throw new Error("No se pudo cancelar el trabajo.");
}

export async function deleteJob(jobId: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/api/jobs/${jobId}`, { method: "DELETE" });
  if (!res.ok) throw new Error("No se pudo eliminar el trabajo.");
}

export async function getDiagram(jobId: string, diagramType?: DiagramType): Promise<DiagramResult> {
  const url = `${API_BASE_URL}/api/jobs/${jobId}/diagram`;
  const res = await fetch(diagramType ? `${url}?tipo=${diagramType}` : url);
  if (!res.ok) {
    let detail = res.statusText;
    try { detail = (await res.json()).detail ?? detail; } catch { /* sin cuerpo */ }
    throw new Error(detail);
  }
  return res.json() as Promise<DiagramResult>;
}

export async function analyzeJob(jobId: string): Promise<AnalysisStatus> {
  const res = await fetch(`${API_BASE_URL}/api/jobs/${jobId}/analyze`, { method: "POST" });
  if (!res.ok) {
    let detail = res.statusText;
    try { detail = (await res.json()).detail ?? detail; } catch { /* sin cuerpo */ }
    throw new Error(detail);
  }
  return res.json() as Promise<AnalysisStatus>;
}

export async function getAnalysisStatus(jobId: string): Promise<AnalysisStatus> {
  const res = await fetch(`${API_BASE_URL}/api/jobs/${jobId}/analysis/status`);
  if (!res.ok) return { status: "none" };
  return res.json() as Promise<AnalysisStatus>;
}

export async function getHealth(): Promise<HealthStatus> {
  const res = await fetch(`${API_BASE_URL}/api/health`);
  if (!res.ok) throw new Error("No se pudo conectar con el backend.");
  return res.json() as Promise<HealthStatus>;
}

export async function getAnalysis(jobId: string): Promise<AnalysisResult | null> {
  const res = await fetch(`${API_BASE_URL}/api/jobs/${jobId}/analysis`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error("No se pudo obtener el análisis.");
  return res.json() as Promise<AnalysisResult>;
}

export interface HealthStatus {
  status: string;
  ffmpeg_available: boolean;
  whisper_model: string;
  ollama_available: boolean;
  ollama_model: string;
}

export interface IdentifiedTask {
  description: string;
  priority: "alta" | "media" | "baja";
  category: string;
}

export interface KeyConcept {
  term: string;
  explanation: string;
}

export interface ContentSection {
  title: string;
  items: string[];
}

export type DiagramType = "mindmap" | "flowchart" | "graph" | "table";

export interface TableRow {
  category: string;
  label: string;
  detail: string;
}

export interface DiagramResult {
  diagram_type: DiagramType;
  mermaid_code: string;
  table_rows: TableRow[] | null;
  title: string;
  rationale: string;
}

export interface AnalysisStatus {
  status: "none" | "running" | "done" | "error";
  error?: string | null;
}

export interface AnalysisResult {
  content_type: string;
  summary: string;
  main_points: string[];
  tasks: IdentifiedTask[];
  key_concepts: KeyConcept[];
  sections: ContentSection[];
  language: string | null;
}
