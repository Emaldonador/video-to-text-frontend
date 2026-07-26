/**
 * AnalysisViewer
 * --------------
 * Permite al usuario elegir qué quiere generar antes de analizar:
 *   ✅ Análisis de texto  (resumen, puntos, tareas, conceptos) — siempre activo
 *   ☐  Diagrama visual   (mapa mental / flowchart / grafo según tipo de video)
 *
 * El análisis corre en background (no bloquea el hilo HTTP).
 * El diagrama se pide al backend solo si el usuario lo activó.
 */
import { useState, useEffect, useRef, type ReactNode } from "react";
import {
  analyzeJob, getAnalysis, getAnalysisStatus, getDiagram, getHealth, documentUrl,
} from "../api/client";
import type { AnalysisResult, ContentSection, DiagramResult, HealthStatus } from "../api/client";
import { DiagramViewer } from "./DiagramViewer";
import type { Job } from "../types/job";

const PRIORITY_COLORS: Record<string, string> = {
  alta:  "bg-red-100 text-red-700 border-red-200",
  media: "bg-yellow-100 text-yellow-700 border-yellow-200",
  baja:  "bg-green-100 text-green-700 border-green-200",
};

const CONTENT_TYPE_LABELS: Record<string, string> = {
  clase:   "Clase / Lección",
  reunion: "Reunión",
  charla:  "Charla / Presentación",
  general: "Contenido general",
};

type ViewState = "checking" | "idle" | "running" | "done" | "error";

interface AnalysisOptions {
  diagram: boolean;
}

export function AnalysisViewer({ job }: { job: Job }) {
  const [analysis, setAnalysis]     = useState<AnalysisResult | null>(null);
  const [diagram, setDiagram]       = useState<DiagramResult | null>(null);
  const [viewState, setViewState]   = useState<ViewState>("checking");
  const [error, setError]           = useState<string | null>(null);
  const [options, setOptions]       = useState<AnalysisOptions>({ diagram: false });
  const [loadingDiagram, setLoadingDiagram] = useState(false);
  const [health, setHealth]         = useState<HealthStatus | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = () => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
  };

  const fetchDiagramIfNeeded = async (wantDiagram: boolean) => {
    if (!wantDiagram) return;
    setLoadingDiagram(true);
    try {
      const d = await getDiagram(job.id);
      setDiagram(d);
    } catch {
      // El diagrama es opcional; si falla, no bloqueamos el análisis de texto
    } finally {
      setLoadingDiagram(false);
    }
  };

  const startPolling = (wantDiagram: boolean) => {
    stopPolling();
    pollRef.current = setInterval(async () => {
      try {
        const st = await getAnalysisStatus(job.id);
        if (st.status === "done") {
          stopPolling();
          const result = await getAnalysis(job.id);
          setAnalysis(result);
          setViewState("done");
          await fetchDiagramIfNeeded(wantDiagram);
        } else if (st.status === "error") {
          stopPolling();
          setError(st.error ?? "Error en el análisis.");
          setViewState("error");
        }
      } catch { /* error de red transitorio */ }
    }, 3000);
  };

  // Verificar al montar: estado del análisis + disponibilidad de Ollama
  useEffect(() => {
    let cancelled = false;
    (async () => {
      // Chequear health en paralelo con el status del análisis
      const [healthResult, st] = await Promise.allSettled([
        getHealth(),
        getAnalysisStatus(job.id),
      ]);

      if (cancelled) return;

      if (healthResult.status === "fulfilled") {
        setHealth(healthResult.value);
      }

      if (st.status === "fulfilled") {
        const status = st.value;
        if (status.status === "done") {
          const result = await getAnalysis(job.id);
          if (!cancelled) { setAnalysis(result); setViewState("done"); }
          try {
            const d = await getDiagram(job.id);
            if (!cancelled) setDiagram(d);
          } catch { /* no hay diagrama previo */ }
        } else if (status.status === "running") {
          setViewState("running");
          startPolling(options.diagram);
        } else if (status.status === "error") {
          setError(status.error ?? "Error desconocido.");
          setViewState("error");
        } else {
          setViewState("idle");
        }
      } else {
        if (!cancelled) setViewState("idle");
      }
    })();
    return () => { cancelled = true; stopPolling(); };
  }, [job.id]);

  const handleAnalyze = async () => {
    setError(null);
    setDiagram(null);
    setViewState("running");
    try {
      await analyzeJob(job.id);
      startPolling(options.diagram);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setViewState("error");
    }
  };

  const handleRequestDiagram = async () => {
    setLoadingDiagram(true);
    try {
      const d = await getDiagram(job.id);
      setDiagram(d);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoadingDiagram(false);
    }
  };

  // ── Estado: verificando ───────────────────────────────────────────────────
  if (viewState === "checking") {
    return (
      <div className="mt-4 rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-400">
        Verificando análisis previo…
      </div>
    );
  }

  // ── Estado: analizando ────────────────────────────────────────────────────
  if (viewState === "running") {
    return (
      <div className="mt-4 rounded-xl border border-indigo-100 bg-indigo-50 p-5">
        <div className="flex items-center gap-3">
          <svg className="h-5 w-5 animate-spin text-indigo-500" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          <div>
            <p className="text-sm font-medium text-indigo-800">Analizando con IA…</p>
            <p className="text-xs text-indigo-500">
              Puede tardar 30–60 s. Podés seguir leyendo la transcripción mientras tanto.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── Estado: sin análisis / error ──────────────────────────────────────────
  if (viewState === "idle" || viewState === "error") {
    const ollamaOk = health?.ollama_available !== false; // true si health aún no cargó (optimista)
    const ollamaKnown = health !== null;

    return (
      <div className="mt-4 rounded-xl border border-slate-200 bg-white p-5 space-y-4">
        <div>
          <h3 className="font-medium text-slate-800">Análisis con IA</h3>
          <p className="text-sm text-slate-500 mt-0.5">
            Elegí qué querés generar. Solo se procesa lo que seleccionás.
          </p>
        </div>

        {/* Banner Ollama no disponible */}
        {ollamaKnown && !ollamaOk && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
            <div className="flex items-start gap-3">
              <span className="text-xl leading-none">⚠️</span>
              <div className="space-y-1.5">
                <p className="text-sm font-semibold text-amber-800">
                  Ollama no está corriendo
                </p>
                <p className="text-xs text-amber-700">
                  El análisis con IA necesita Ollama activo en tu computadora.
                </p>
                <div className="rounded bg-amber-100 px-3 py-2 font-mono text-xs text-amber-900">
                  Ejecutá <strong>4_arrancar_ollama.bat</strong> y volvé aquí.
                </div>
                <p className="text-xs text-amber-600">
                  Una vez iniciado, recargá la página o esperá unos segundos.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Opciones */}
        <div className="space-y-2">
          {/* Análisis de texto — siempre activo */}
          <label className="flex items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 cursor-not-allowed">
            <input type="checkbox" checked readOnly
              className="mt-0.5 h-4 w-4 rounded text-indigo-600" />
            <div>
              <p className="text-sm font-medium text-slate-800">Análisis de texto</p>
              <p className="text-xs text-slate-500">
                Resumen ejecutivo, puntos principales, tareas identificadas y conceptos clave.
              </p>
            </div>
          </label>

          {/* Diagrama visual — opcional */}
          <label className="flex items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 cursor-pointer hover:bg-violet-50 hover:border-violet-200 transition-colors">
            <input
              type="checkbox"
              checked={options.diagram}
              onChange={(e) => setOptions(o => ({ ...o, diagram: e.target.checked }))}
              className="mt-0.5 h-4 w-4 rounded text-violet-600"
            />
            <div>
              <p className="text-sm font-medium text-slate-800">Diagrama visual</p>
              <p className="text-xs text-slate-500">
                La app elige el mejor tipo según el video: mapa mental (clases), diagrama de flujo (reuniones) o grafo de conceptos (charlas).
              </p>
            </div>
          </label>
        </div>

        <div className="flex items-center justify-between gap-3">
          {/* Indicador de estado de Ollama */}
          <div className="flex items-center gap-1.5">
            <span className={`h-2 w-2 rounded-full ${
              !ollamaKnown ? "bg-slate-300" :
              ollamaOk     ? "bg-green-400" : "bg-amber-400"
            }`} />
            <p className="text-xs text-slate-500">
              {!ollamaKnown ? "Verificando Ollama…" :
               ollamaOk     ? `Ollama activo · ${health?.ollama_model ?? ""}` :
               "Ollama inactivo"}
            </p>
          </div>

          <button
            onClick={handleAnalyze}
            disabled={ollamaKnown && !ollamaOk}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors ${
              ollamaKnown && !ollamaOk
                ? "bg-slate-300 cursor-not-allowed"
                : "bg-indigo-600 hover:bg-indigo-700"
            }`}
          >
            ✨ Analizar
          </button>
        </div>

        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        )}
      </div>
    );
  }

  // ── Estado: análisis disponible ───────────────────────────────────────────
  if (!analysis) return null;

  return (
    <div className="mt-4 space-y-4">
      {/* Cabecera */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-indigo-100 bg-indigo-50 px-5 py-3">
        <div>
          <span className="text-xs font-medium uppercase tracking-wide text-indigo-500">
            {CONTENT_TYPE_LABELS[analysis.content_type] ?? analysis.content_type}
          </span>
          <h3 className="font-semibold text-indigo-900">Análisis de IA</h3>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* Generar diagrama a pedido si no se generó antes */}
          {!diagram && !loadingDiagram && (
            <button
              onClick={handleRequestDiagram}
              className="flex items-center gap-1.5 rounded-lg border border-violet-300 px-3 py-1.5 text-xs font-medium text-violet-700 hover:bg-violet-50"
            >
              🗺 Generar diagrama
            </button>
          )}
          {loadingDiagram && (
            <span className="flex items-center gap-1.5 text-xs text-violet-500">
              <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
              </svg>
              Generando diagrama…
            </span>
          )}
          <a
            href={documentUrl(job.id)}
            download
            className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3" />
            </svg>
            Descargar .docx
          </a>
          <button
            onClick={handleAnalyze}
            className="text-xs text-indigo-500 underline hover:text-indigo-700"
          >
            Re-analizar
          </button>
        </div>
      </div>

      {/* Resumen ejecutivo */}
      {analysis.summary && (
        <Section title="Resumen ejecutivo">
          <p className="text-sm leading-relaxed text-slate-700">{analysis.summary}</p>
        </Section>
      )}

      {/* Secciones temáticas */}
      {analysis.sections && analysis.sections.length > 0 && (
        <Section title="Contenido detallado">
          <div className="space-y-4">
            {analysis.sections.map((section: ContentSection, i: number) => (
              <div key={i} className="rounded-lg border border-slate-100 bg-slate-50 p-4">
                <div className="mb-2 flex items-center gap-2">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700">
                    {i + 1}
                  </span>
                  <h5 className="text-sm font-semibold text-slate-800">{section.title}</h5>
                </div>
                {section.items.length > 0 && (
                  <ul className="ml-8 space-y-1">
                    {section.items.map((item: string, j: number) => (
                      <li key={j} className="flex items-start gap-2 text-sm text-slate-600">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-300" />
                        {item}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Tareas identificadas */}
      {analysis.tasks.length > 0 && (
        <Section title={`Tareas identificadas (${analysis.tasks.length})`}>
          <ul className="space-y-2">
            {analysis.tasks.map((task, i) => (
              <li key={i} className="flex items-start gap-2 rounded-lg border border-slate-100 bg-slate-50 p-3">
                <span className={`shrink-0 rounded border px-2 py-0.5 text-xs font-semibold capitalize ${PRIORITY_COLORS[task.priority] ?? "bg-slate-100 text-slate-600"}`}>
                  {task.priority}
                </span>
                <span className="text-sm text-slate-800">{task.description}</span>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* Conceptos clave */}
      {analysis.key_concepts.length > 0 && (
        <Section title="Conceptos clave">
          <dl className="space-y-3">
            {analysis.key_concepts.map((concept, i) => (
              <div key={i} className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                <dt className="text-sm font-semibold text-slate-800">{concept.term}</dt>
                <dd className="mt-0.5 text-sm text-slate-600">{concept.explanation}</dd>
              </div>
            ))}
          </dl>
        </Section>
      )}

      {/* Diagrama visual */}
      {diagram && <DiagramViewer diagram={diagram} />}

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <h4 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">{title}</h4>
      {children}
    </div>
  );
}
