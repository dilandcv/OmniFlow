# Central de Inteligencia de Contenido y Programación Omnicanal

Sistema para que creadores de contenido transformen una idea/premisa en
múltiples formatos (hilos, artículos, boletines) optimizados por canal, con
un flujo de aprobación y programación/distribución automática.

## Flujo del dominio

```
Idea (premisa + tono + canales elegidos)
  → (plataformas sociales) Gemini actúa como ESTRATEGA: genera ContentConcept
      (5 propuestas por plataforma: TikTok / Instagram / Facebook)
  → el usuario selecciona un concepto
  → [fase posterior] Gemini desarrolla el concepto -> ContentVariant
  → (canales legacy: X, LinkedIn, Boletín, Blog) IA genera ContentVariant directo
  → el usuario revisa / edita / aprueba cada variante
  → se programa la variante aprobada (ScheduledPost)
  → un worker revisa periódicamente lo vencido y lo "distribuye"
```

Diferencia clave:

- **ContentConcept** responde "¿qué contenido podría crear?" (propuesta: título,
  hook, formato, objetivo, audiencia, CTA, duración, racional).
- **ContentVariant** responde "¿cuál es el contenido final?" (texto/guión completo).

Estados de una variante: `borrador → aprobado → programado → publicado`

## Stack

- **Frontend (`frontend/`)**: React 19 + TypeScript + Vite + TailwindCSS 4
- **Backend (`backend/`)**: FastAPI + Pydantic + SQLModel (SQLite) + APScheduler
- **IA (backend)**: cliente HTTP para Anthropic/OpenAI/Gemini con prompts versionados por formato
- **Infra**: Docker (Dockerfiles esqueleto) + `docker-compose.yml`

## Estructura

```
├── frontend/                # React + TypeScript + Vite + TailwindCSS
│   └── src/
│       ├── api/             # cliente tipado (fetch) + mock con la misma forma
│       ├── components/      # Layout, EstadoBadge, Loading, ErrorAlert
│       ├── pages/           # NuevaIdea, Conceptos, Variantes, Programacion, ConfiguracionIA
│       ├── state/           # navegación ligera + catálogo de ideas + estado IA (Context)
│       └── lib/             # utilidades (fechas)
├── backend/
│   └── app/
│       ├── api/             # routers: /api/ideas, /api/canales, /api/programaciones, /api/ai, /api/.../concepts
│       ├── core/            # config (pydantic-settings) y conexión SQLite
│       ├── models/          # SQLModel: Idea, Channel, ContentConcept, ContentVariant, ScheduledPost
│       ├── schemas/         # Pydantic request/response (separados de la DB)
│       ├── services/        # lógica de negocio y transiciones de estado
│       ├── ai/              # cliente IA, generador, estratega (conceptos), prompts y config runtime
│       └── workers/         # scheduler APScheduler (distribución)
├── docker-compose.yml
├── .env.example
└── README.md
```

## Cómo levantar

### Backend

```bash
cd backend
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
cp .env.example .env        # completar AI_API_KEY, etc.
.venv/bin/uvicorn app.main:app --reload
```

- Docs interactivas: http://localhost:8000/docs
- La BD (SQLite) se crea sola al arrancar y siembra canales por defecto si está
  vacía: X, LinkedIn, Boletín, Blog, **TikTok, Instagram, Facebook** (los
  sociales se agregan idempotentemente a bases ya existentes).
- **IA (dos modos, el primero es el recomendado)**:
  1. **Configuración runtime** (sin tocar el código): entrá a la vista
     **“Configuración de IA”** del frontend, elegí proveedor (Gemini,
     Anthropic u OpenAI), pegá tu API key y guardá. La clave se guarda **solo
     en memoria del backend** (`app/ai/runtime.py`): no se persiste en BD, en
     archivos, en localStorage ni en logs, y **se pierde si el backend se
     reinicia**. El frontend nunca vuelve a recibir la clave.
  2. **Variables de entorno**: `AI_PROVIDER`
     (`anthropic`|`openai`|`gemini`) + `AI_API_KEY` en `backend/.env`, como
     fallback para desarrollo. Sin proveedor configurado en ninguno de los dos
     modos, `POST /api/ideas` responde `503 AI provider is not configured`.
  - Pruebas del pipeline sin API real: `.venv/bin/python -m app.ai.manual_tests`.
  - Pruebas del motor de estrategia (conceptos): `.venv/bin/python -m app.ai.concept_tests`.
- **Worker**: `registrar_en_fastapi(app)` arranca APScheduler para marcar como
  publicadas las programaciones vencidas (`WORKER_INTERVAL_MINUTES`).

### Frontend

```bash
cd frontend
npm install        # (node_modules ya presente; re-ejecutar si hace falta)
npm run dev        # -> http://localhost:5173
```

- Por defecto usa **datos mock** (misma forma que el backend) para avanzar en
  paralelo: `VITE_USE_MOCK=false` + `VITE_API_URL=http://localhost:8000/api`
  para apuntar al backend real.
- `npm run build` (tsc + vite) y `npm run lint` (oxlint) para validar.

## Endpoints principales (backend)

| Método | Ruta | Descripción |
|---|---|---|
| POST | `/api/ideas` | Crea idea (variantes vía IA solo para canales legacy) |
| POST | `/api/ideas/{id}/concepts/generate` | Genera conceptos por plataforma (5 por plataforma) |
| GET | `/api/ideas/{id}/concepts` | Lista conceptos de una idea |
| POST | `/api/concepts/{id}/select` | Selecciona un concepto (deselecciona el resto de la idea) |
| GET | `/api/ideas/{id}/variantes` | Lista variantes de una idea |
| PATCH | `/api/variantes/{id}` | Edita variante (solo borrador) |
| POST | `/api/variantes/{id}/aprobar` | borrador → aprobado |
| POST | `/api/variantes/{id}/rechazar` | Marca rechazada (queda en borrador) |
| GET/POST | `/api/canales` | Lista / crea canales |
| POST | `/api/programaciones` | Programa una variante aprobada |
| GET | `/api/programaciones?estado=` | Lista programaciones |
| DELETE | `/api/programaciones/{id}` | Cancela una programación |
| GET | `/api/ai/status` | Estado de la config de IA (nunca la API key) |
| POST | `/api/ai/config` | Guarda proveedor + API key + modelo **en memoria** |
| POST | `/api/ai/test` | Prueba la conexión sin guardar credenciales |
| DELETE | `/api/ai/config` | Elimina la config de IA de la memoria |
| GET | `/health` | Healthcheck |

## Estado actual

Backend funcional: modelos (Idea, Channel, ContentConcept, ContentVariant,
ScheduledPost), servicios con validación de transiciones de estado, router de
configuración de IA en memoria, motor de estrategia (estratega → ContentConcept
por plataforma con prompt versionado y structured output) y worker de
distribución. Frontend con 5 vistas (Nueva idea, Conceptos, Variantes,
Programación y Configuración de IA) y navegación ligera.

Pendiente (próxima fase): generar `ContentVariant` a partir del concepto
seleccionado (rol "content writer"), y la publicación real en APIs sociales
(sigue siendo simulada). Docker quedó como esqueleto.

## Variables de entorno

Ver `.env.example` (raíz) y `backend/.env.example` (detalle con IA + worker).