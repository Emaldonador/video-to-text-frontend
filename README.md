# Video a Texto — Frontend

Interfaz web para subir videos, seguir el progreso de la transcripción y
consultar transcripciones, análisis y mapas mentales.

Backend correspondiente: [video-to-text-backend](https://github.com/TU_USUARIO/video-to-text-backend)

## Stack

| Componente | Tecnología |
|---|---|
| Framework | React 19 |
| Build | Vite 8 |
| Lenguaje | TypeScript 6 |
| Estilos | Tailwind CSS 4 |
| Diagramas | Mermaid 11 |
| Linter | Oxlint |

## Estructura

```
src/
├── api/          # Cliente HTTP — único módulo que conoce el backend
├── components/   # UploadZone, JobProgress, JobHistory, TranscriptViewer,
│                 # AnalysisViewer, DiagramViewer
├── hooks/        # useJobPolling — sondeo del estado de los trabajos
├── types/        # Tipos compartidos
└── App.tsx
```

## Requisitos

- Node.js 20+
- El backend corriendo (por defecto en `http://127.0.0.1:8000`)

## Instalación en macOS

```bash
# Node.js
brew install node

# Clonar
git clone https://github.com/TU_USUARIO/video-to-text-frontend.git
cd video-to-text-frontend

# Dependencias
npm install
```

## Ejecución

```bash
npm run dev
```

Abre http://localhost:5173

El backend tiene que estar corriendo en paralelo, o la app no podrá subir ni
consultar nada.

## Configuración

| Variable | Por defecto | Descripción |
|---|---|---|
| `VITE_API_BASE_URL` | `http://127.0.0.1:8000` | URL del backend |

Para apuntar a otro backend, crea un `.env.local`:

```bash
VITE_API_BASE_URL=https://mi-api.ejemplo.com
```

## Comandos

```bash
npm run dev       # Servidor de desarrollo
npm run build     # Compila TypeScript y genera dist/
npm run preview   # Sirve el build de producción
npm run lint      # Oxlint
```

## Scripts de Windows

`scripts/` contiene los `.bat` y `.ps1` de arranque para Windows.
En macOS y Linux se usan los comandos de este README.
