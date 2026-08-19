// Configuración del cliente API.
//
// Para apuntar al backend real (FastAPI):
//   VITE_API_URL=http://localhost:8000/api   (base URL SIN slash final)
//   VITE_USE_MOCK=false
//
// Si VITE_USE_MOCK está ausente o es distinto de "false", se usan datos mock
// (misma forma que el backend) para poder desarrollar el frontend en paralelo.

const url = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:8000/api'

export const API_BASE_URL = url.replace(/\/+$/, '')

export const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false'