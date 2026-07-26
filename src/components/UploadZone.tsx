import { useCallback, useRef, useState } from "react";

interface Props {
  onFileSelected: (file: File) => void;
  disabled?: boolean;
}

export function UploadZone({ onFileSelected, disabled }: Props) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);
      if (disabled) return;
      const file = e.dataTransfer.files?.[0];
      if (file) onFileSelected(file);
    },
    [disabled, onFileSelected]
  );

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); if (!disabled) setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      onClick={() => !disabled && inputRef.current?.click()}
      role="button"
      tabIndex={disabled ? -1 : 0}
      onKeyDown={(e) => e.key === "Enter" && !disabled && inputRef.current?.click()}
      style={{
        background: isDragging
          ? "linear-gradient(135deg, #ede9fe, #e0e7ff)"
          : "linear-gradient(135deg, #faf9ff 0%, #f5f3ff 100%)",
        border: `2px dashed ${isDragging ? "var(--brand-mid)" : disabled ? "#d1d5db" : "#c4b5fd"}`,
        borderRadius: "var(--radius)",
        boxShadow: isDragging ? "0 0 0 4px rgb(124 58 237 / .12)" : "none",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.55 : 1,
        transition: "all .2s ease",
      }}
      className="relative flex flex-col items-center justify-center gap-4 px-8 py-12 text-center select-none"
    >
      <input
        ref={inputRef}
        type="file"
        accept="video/*,audio/*"
        className="hidden"
        disabled={disabled}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onFileSelected(file);
          e.target.value = "";
        }}
      />

      {/* Ícono */}
      <div
        className={isDragging ? "animate-bounce-icon" : ""}
        style={{
          display: "flex", alignItems: "center", justifyContent: "center",
          width: 64, height: 64, borderRadius: 18,
          background: "linear-gradient(135deg, var(--brand-mid), var(--accent))",
          boxShadow: "0 8px 24px rgb(124 58 237 / .3)",
        }}
      >
        <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
          {isDragging
            ? <path strokeLinecap="round" strokeLinejoin="round"
                d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
            : <path strokeLinecap="round" strokeLinejoin="round"
                d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 7.5m0 0L7.5 12M12 7.5v9" />
          }
        </svg>
      </div>

      <div>
        <p className="text-base font-semibold" style={{ color: "var(--text-1)" }}>
          {isDragging ? "¡Soltá el archivo!" : "Arrastrá tu video o hacé clic"}
        </p>
        <p className="mt-1 text-sm" style={{ color: "var(--text-3)" }}>
          MP4, MKV, MOV, AVI, WEBM, MP3, WAV · cualquier duración
        </p>
      </div>

      <div className="flex flex-wrap justify-center gap-2">
        {["🔒 Sin internet", "⚡ Sin límite de duración", "🎯 Alta precisión"].map((tag) => (
          <span key={tag} className="rounded-full px-3 py-1 text-xs font-medium"
            style={{ background: "var(--brand-light)", color: "var(--brand-mid)" }}>
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
}
