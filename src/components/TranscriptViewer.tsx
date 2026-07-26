import { useEffect, useState } from "react";
import { getTranscriptText, getTranscriptHtml, downloadUrl, transcriptPdfUrl } from "../api/client";
import type { Job } from "../types/job";

type Tab = "formatted" | "raw";

export function TranscriptViewer({ job }: { job: Job }) {
  const [activeTab, setActiveTab]     = useState<Tab>("formatted");
  const [rawText, setRawText]         = useState("");
  const [htmlContent, setHtmlContent] = useState("");
  const [copied, setCopied]           = useState(false);
  const [loadError, setLoadError]     = useState<string | null>(null);

  useEffect(() => {
    setLoadError(null);
    Promise.all([getTranscriptText(job.id), getTranscriptHtml(job.id)])
      .then(([text, html]) => { setRawText(text); setHtmlContent(html); })
      .catch((err) => setLoadError(err instanceof Error ? err.message : String(err)));
  }, [job.id]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(rawText);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const fmtMeta = [
    job.language && `Idioma: ${job.language.toUpperCase()}`,
    job.duration_seconds && `${Math.floor(job.duration_seconds / 60)}:${String(Math.floor(job.duration_seconds % 60)).padStart(2, "0")} min`,
    job.word_count && `${job.word_count.toLocaleString()} palabras`,
  ].filter(Boolean).join(" · ");

  return (
    <div className="card overflow-hidden">
      {/* Franja de acento */}
      <div className="h-1 w-full" style={{
        background: "linear-gradient(90deg, var(--accent), var(--brand-mid))",
      }} />

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3 px-5 pt-4 pb-3"
        style={{ borderBottom: "1px solid var(--border)" }}>
        <div className="min-w-0">
          <h3 className="truncate font-semibold" style={{ color: "var(--text-1)" }}>
            {job.original_filename}
          </h3>
          {fmtMeta && (
            <p className="mt-0.5 text-xs" style={{ color: "var(--text-3)" }}>{fmtMeta}</p>
          )}
        </div>

        {/* Acciones */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors"
            style={{ borderColor: "var(--border)", color: "var(--text-2)", background: "white" }}
          >
            {copied
              ? <><span>✓</span> Copiado</>
              : <><svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round"
                    d="M15.666 3.888A2.25 2.25 0 0 0 13.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 0 1-.75.75H9a.75.75 0 0 1-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 0 1-2.25 2.25H6.75A2.25 2.25 0 0 1 4.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 0 1 1.927-.184" />
                </svg> Copiar</>
            }
          </button>

          <a href={downloadUrl(job.id)}
            className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium"
            style={{ borderColor: "var(--border)", color: "var(--text-2)", background: "white" }}>
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            .txt
          </a>

          <a href={transcriptPdfUrl(job.id)} download
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-white"
            style={{ background: "linear-gradient(135deg, var(--brand-mid), var(--accent))", boxShadow: "0 2px 8px rgb(124 58 237 / .25)" }}>
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            PDF
          </a>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex px-5" style={{ borderBottom: "1px solid var(--border)" }}>
        {(["formatted", "raw"] as Tab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className="mr-5 py-2.5 text-sm font-medium transition-colors"
            style={{
              borderBottom: `2px solid ${activeTab === tab ? "var(--brand-mid)" : "transparent"}`,
              color: activeTab === tab ? "var(--brand-mid)" : "var(--text-3)",
              marginBottom: -1,
            }}
          >
            {tab === "formatted" ? "Vista formateada" : "Texto plano"}
          </button>
        ))}
      </div>

      {/* Contenido */}
      <div className="p-5">
        {loadError ? (
          <p className="text-sm" style={{ color: "var(--danger)" }}>{loadError}</p>
        ) : activeTab === "formatted" ? (
          htmlContent
            ? <iframe srcDoc={htmlContent} title="Transcripción"
                className="w-full rounded-lg border-0"
                style={{ height: 520, background: "white" }}
                sandbox="allow-same-origin" />
            : <Skeleton />
        ) : (
          rawText
            ? <p className="max-h-96 overflow-y-auto whitespace-pre-wrap text-sm leading-7"
                style={{ color: "var(--text-2)", fontFamily: "ui-monospace, 'Cascadia Code', monospace", fontSize: "0.8125rem" }}>
                {rawText}
              </p>
            : <Skeleton />
        )}
      </div>
    </div>
  );
}

function Skeleton() {
  return (
    <div className="space-y-2.5 animate-pulse">
      {[100, 90, 95, 80, 88].map((w, i) => (
        <div key={i} className="h-3 rounded-full" style={{ width: `${w}%`, background: "#ede9fe" }} />
      ))}
    </div>
  );
}
