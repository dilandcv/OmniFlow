# Central de Inteligencia de Contenido y Programación Omnicanal

Sistema para que creadores de contenido transformen una idea/premisa en
múltiples formatos (hilos, artículos, boletines) optimizados por canal, con
un flujo de aprobación y programación/distribución automática.

## Flujo del dominio

```
Idea (premisa + tono + canales elegidos)
  → IA genera ContentVariant por canal (hilo, artículo, boletín)
  → el usuario revisa / edita / aprueba cada variante
  → se programa la variante aprobada (ScheduledPost)
  → un worker revisa periódicamente lo vencido y lo "distribuye"
```

Estados de una variante: `borrador → aprobado → programado → publicado`

## Stack

- **Frontend (`frontend/`)**: React 19 + TypeScript + Vite + TailwindCSS 4
- **Backend (`backend/`)**: FastAPI + Pydantic + SQLModel (SQLite) + APScheduler
- **IA (backend)**: cliente HTTP para Anthropic/OpenAI con prompts versionados por formato
- **Infra**: Docker (Dockerfiles esqueleto) + `docker-compose.yml`

## Estructura

```
├── frontend/                # React + TypeScript + Vite + TailwindCSS
│   └── src/
│       ├── api/             # cliente tipado (fetch) + mock con la misma forma
│       ├── components/      # Layout, EstadoBadge, Loading, ErrorAlert
│       ├── pages/           # NuevaIdea, Variantes, Programacion
│       ├── state/           # navegación ligera + catálogo de ideas (Context)
│       └── lib/             # utilidades (fechas)
├── backend/
│   └── app/
│       ├── api/             # routers: /api/ideas, /api/canales, /api/programaciones
│       ├── core/            # config (pydantic-settings) y conexión SQLite
│       ├── models/          # SQLModel: Idea, Channel, ContentVariant, ScheduledPost
│       ├── schemas/         # Pydantic request/response (separados de la DB)
│       ├── services/        # lógica de negocio y transiciones de estado
│       ├── ai/              # cliente IA, generador y prompts versionados
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
- La BD (SQLite) se crea sola al arrancar y siembra 4 canales por defecto
  (X, LinkedIn, Boletín, Blog) si está vacía.
- **IA**: `AI_PROVIDER` (`anthropic`|`openai`), `AI_API_KEY` obligatoria para
  generar contenido real. Sin clave, `generar_variantes` lanza un error claro.
  Pruebas del pipeline sin API real: `.venv/bin/python -m app.ai.manual_tests`.
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
| POST | `/api/ideas` | Crea idea + genera variantes vía IA |
| GET | `/api/ideas/{id}/variantes` | Lista variantes de una idea |
| PATCH | `/api/variantes/{id}` | Edita variante (solo borrador) |
| POST | `/api/variantes/{id}/aprobar` | borrador → aprobado |
| POST | `/api/variantes/{id}/rechazar` | Marca rechazada (queda en borrador) |
| GET/POST | `/api/canales` | Lista / crea canales |
| POST | `/api/programaciones` | Programa una variante aprobada |
| GET | `/api/programaciones?estado=` | Lista programaciones |
| DELETE | `/api/programaciones/{id}` | Cancela una programación |
| GET | `/health` | Healthcheck |

## Estado actual

Backend funcional (modelos, servicios con validación de transiciones de estado,
routers, cliente IA con stub → generador real + prompts versionados, worker de
distribución). Frontend funcional con las 3 vistas (Nueva idea, Variantes,
Programación) y navegación ligera. Docker quedó como esqueleto.

## Variables de entorno

Ver `.env.example` (raíz) y `backend/.env.example` (detalle con IA + worker).