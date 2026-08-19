# Central de Inteligencia de Contenido y Programación Omnicanal

Sistema para que creadores de contenido transformen una idea/premisa en
múltiples formatos (hilos, artículos, boletines) optimizados por canal, con
un flujo de aprobación y programación/distribución automática.

## Estructura

```
├── frontend/   # React + TypeScript + Vite + TailwindCSS
├── backend/    # FastAPI + Pydantic + SQLModel + APScheduler + IA
│   └── app/
│       ├── api/       # routers (content, channels, schedule)
│       ├── core/      # config y seguridad
│       ├── models/    # SQLModel/Pydantic
│       ├── services/  # lógica de negocio
│       ├── ai/        # integración con IA y prompts versionados
│       └── workers/   # tareas programadas / distribución
├── docker-compose.yml
├── .env.example
└── README.md
```

## Estado actual

Solo estructura del monorepo. La lógica de negocio, endpoints e integración
con IA se implementan en el sprint.
