/**
 * DiagramViewer
 * -------------
 * Renderiza el diagrama Mermaid devuelto por GET /api/jobs/{id}/diagram.
 * El tipo de diagrama (mindmap, flowchart, graph) lo decide el backend
 * según el content_type detectado en el análisis.
 */
import { useEffect, useRef, useState } from "react";
import mermaid from "mermaid";
import type { DiagramResult, DiagramType } from "../api/client";

// Inicializar Mermaid una sola vez (idempotente)
mermaid.initialize({
  startOnLoad: false,
  theme: "neutral",
  fontFamily: "ui-sans-serif, system-ui, sans-serif",
  mindmap: { padding: 16, useMaxWidth: true },
  flowchart: { useMaxWidth: true, htmlLabels: true },
});

const DIAGRAM_LABELS: Record<DiagramType, string> = {
  mindmap:   "Mapa mental",
  flowchart: "Diagrama de flujo",
  graph:     "Grafo de conceptos",
  table:     "Tabla",
};

const DIAGRAM_TYPES: DiagramType[] = ["mindmap", "flowchart", "graph", "table"];

let _uid = 0;

interface Props {
  diagram: DiagramResult;
  onTypeChange?: (type: DiagramType) => void;
  isSwitching?: boolean;
}

export function DiagramViewer({ diagram, onTypeChange, isSwitching }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [renderError, setRenderError] = useState<string | null>(null);
  const [isRendering, setIsRendering] = useState(true);
  const isTable = diagram.diagram_type === "table";

  useEffect(() => {
    if (isTable) {
      setIsRendering(false);
      return;
    }
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
  }, [diagram.mermaid_code, isTable]);

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

      {/* Selector de herramienta visual */}
      {onTypeChange && (
        <div className="flex flex-wrap gap-1.5 border-b border-violet-100 bg-white px-5 py-2.5">
          {DIAGRAM_TYPES.map((type) => (
            <button
              key={type}
              onClick={() => onTypeChange(type)}
              disabled={isSwitching}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                diagram.diagram_type === type
                  ? "bg-violet-600 text-white"
                  : "bg-violet-50 text-violet-600 hover:bg-violet-100"
              }`}
            >
              {DIAGRAM_LABELS[type]}
            </button>
          ))}
        </div>
      )}

      {/* Diagrama o tabla */}
      <div className="overflow-x-auto p-5">
        {isSwitching && (
          <div className="mb-3 flex items-center gap-2 text-sm text-slate-400">
            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            Cambiando de vista…
          </div>
        )}

        {isTable ? (
          <TableView rows={diagram.table_rows ?? []} />
        ) : (
          <>
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
          </>
        )}
      </div>
    </div>
  );
}

function TableView({ rows }: { rows: DiagramResult["table_rows"] }) {
  if (!rows || rows.length === 0) {
    return <p className="text-sm text-slate-400">No hay suficiente contenido analizado para mostrar una tabla.</p>;
  }
  return (
    <table className="w-full border-collapse text-sm">
      <thead>
        <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
          <th className="py-2 pr-3 font-semibold">Categoría</th>
          <th className="py-2 pr-3 font-semibold">Título</th>
          <th className="py-2 font-semibold">Detalle</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row, i) => (
          <tr key={i} className="border-b border-slate-100 align-top">
            <td className="py-2.5 pr-3 whitespace-nowrap text-xs font-medium text-violet-600">{row.category}</td>
            <td className="py-2.5 pr-3 font-medium text-slate-800">{row.label}</td>
            <td className="py-2.5 text-slate-600">{row.detail}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
