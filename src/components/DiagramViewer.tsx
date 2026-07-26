/**
 * DiagramViewer
 * -------------
 * Renderiza el diagrama Mermaid devuelto por GET /api/jobs/{id}/diagram.
 * El tipo de diagrama (mindmap, flowchart, graph) lo decide el backend
 * según el content_type detectado en el análisis.
 */
import { useEffect, useRef, useState } from "react";
import mermaid from "mermaid";
import type { DiagramResult } from "../api/client";

// Inicializar Mermaid una sola vez (idempotente)
mermaid.initialize({
  startOnLoad: false,
  theme: "neutral",
  fontFamily: "ui-sans-serif, system-ui, sans-serif",
  mindmap: { padding: 16, useMaxWidth: true },
  flowchart: { useMaxWidth: true, htmlLabels: true },
});

const DIAGRAM_LABELS: Record<string, string> = {
  mindmap:   "Mapa mental",
  flowchart: "Diagrama de flujo",
  graph:     "Grafo de conceptos",
};

let _uid = 0;

interface Props {
  diagram: DiagramResult;
}

export function DiagramViewer({ diagram }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [renderError, setRenderError] = useState<string | null>(null);
  const [isRendering, setIsRendering] = useState(true);

  useEffect(() => {
    if (!containerRef.current) return;
    setIsRendering(true);
    setRenderError(null);

    const id = `mermaid-${++_uid}`;

    mermaid
      .render(id, diagram.mermaid_code)
      .then(({ svg }) => {
        if (containerRef.current) {
          containerRef.current.innerHTML = svg;
          // Hacer el SVG responsivo
          const svgEl = containerRef.current.querySelector("svg");
          if (svgEl) {
            svgEl.style.maxWidth = "100%";
            svgEl.style.height = "auto";
          }
        }
        setIsRendering(false);
      })
      .catch((err) => {
        console.error("Mermaid render error:", err);
        setRenderError("No se pudo renderizar el diagrama.");
        setIsRendering(false);
      });
  }, [diagram.mermaid_code]);

  const label = DIAGRAM_LABELS[diagram.diagram_type] ?? diagram.diagram_type;

  return (
    <div className="rounded-xl border border-violet-100 bg-white shadow-sm">
      {/* Cabecera */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-violet-100 bg-violet-50 px-5 py-3">
        <div>
          <span className="text-xs font-medium uppercase tracking-wide text-violet-500">
            {label}
          </span>
          <h3 className="font-semibold text-violet-900">{diagram.title}</h3>
        </div>
        <span className="rounded-full bg-violet-100 px-3 py-1 text-xs text-violet-600">
          {diagram.rationale}
        </span>
      </div>

      {/* Diagrama */}
      <div className="overflow-x-auto p-5">
        {isRendering && (
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            Renderizando diagrama…
          </div>
        )}
        {renderError && (
          <p className="text-sm text-red-600">{renderError}</p>
        )}
        <div ref={containerRef} className={isRendering ? "hidden" : "w-full"} />
      </div>
    </div>
  );
}
