# Barber Shop Scheduler

Una aplicación completa de gestión para barberías, construida como práctica para aprender y experimentar con tecnologías web modernas: **FastAPI** en el backend y **React + TypeScript + Vite** en el frontend.

---

## ¿Qué hace esta app?

Es un sistema de gestión de citas para una barbería donde:

- **Admins** pueden gestionar usuarios, clientes, servicios, horarios de trabajo (jornadas) y citas (turnos).
- **Barberos** ven su agenda diaria con los turnos asignados.
- **Clientes** (en futuras versiones) podrán reservar sus propias citas.

---

## La API (Backend)

**Stack:** FastAPI · SQLAlchemy 2 · SQLite · Pydantic · JWT (OAuth2)

- **RESTful** con versionado `/api/v1`
- **Autenticación** con tokens JWT (expiran a las 8h)
- **Roles:** `ADMIN` y `BARBER` — control de acceso por dependencias
- **Validaciones de negocio** en la creación de turnos:
  - Cliente, servicio, jornada y barbero deben existir
  - El barbero debe tener rol `BARBER`
  - El turno debe caber dentro de la jornada
  - No puede solaparse con otro turno del mismo barbero
- **Seed automático:** al arrancar crea las tablas y un admin inicial si no existe
- **CORS** configurado para `localhost:5173` (Vite)

### Endpoints principales

| Recurso | Rutas | Quién accede |
|---|---|---|
| Auth | `POST /auth/login`, `GET /auth/me` | Todos |
| Usuarios | `GET/POST/PUT/DELETE /usuarios` | Solo ADMIN |
| Clientes | `GET/POST/PUT/DELETE /clientes` | Solo ADMIN |
| Servicios | `GET/POST/PUT/DELETE /servicios` | Solo ADMIN |
| Jornadas | `GET/POST/PUT/DELETE /jornadas` | Solo ADMIN |
| Turnos | `GET/POST/PUT/DELETE /turnos` | ADMIN (crear/editar/borrar), BARBER (ver su agenda) |

---

## El Frontend

**Stack:** React 19 · TypeScript · Vite · Tailwind CSS v4 · Material UI (MUI) · React Router 7

- **Arquitectura por features:** `auth`, `users`, `clients`, `services`, `agenda`, `admin`
- **Cliente API tipado** (`src/api/client.ts`) que adjunta el Bearer token automáticamente
- **Hooks reutilizables** (`useApiResource`, `useAuth`) para data fetching y estado de sesión
- **Rutas protegidas** (`ProtectedRoute`, `AdminRoute`) según rol del usuario
- **Linting** con Oxlint (`npm run lint`)
- **Sin tests configurados aún** (pendiente añadir Vitest/Playwright)

---

## Cómo correr el proyecto completo

### 1. Backend (FastAPI)

```bash
cd backend

# Crear entorno virtual (recomendado)
python -m venv .venv
# Windows:
.venv\Scripts\activate
# Linux/Mac:
source .venv/bin/activate

# Instalar dependencias
pip install -r requirements.txt
pip install -r requirements-dev.txt   # incluye pytest + httpx

# Configurar variables de entorno
cp .env.example .env   # edita .env y pon tu SECRET_KEY
# Generar SECRET_KEY si no tienes una:
python -c "import secrets; print(secrets.token_urlsafe(64))"

# Arrancar servidor (con hot-reload)
uvicorn app.main:app --reload
```

La API queda en **http://127.0.0.1:8000/api/v1**  
Health check: **GET http://127.0.0.1:8000/health**

> La primera vez crea `database.db` y siembra un usuario admin con las credenciales de `.env` (`FIRST_ADMIN_NOMBRE`, `FIRST_ADMIN_TELEFONO`, `FIRST_ADMIN_PASSWORD`).

### 2. Frontend (Vite + React)

```bash
cd lab-react

# Instalar dependencias
npm install

# Configurar URL de la API
echo "VITE_API_URL=http://127.0.0.1:8000/api/v1" > .env

# Arrancar en desarrollo
npm run dev
```

La app abre en **http://localhost:5173** (puerto por defecto de Vite).

### 3. ¡A probar!

1. Inicia sesión con el admin que se creó al arrancar el backend
2. Crea servicios, jornadas, barberos y clientes desde la zona de admin
3. Genera turnos y verifica que las validaciones funcionan (solapes, horarios, etc.)

---

## Estructura del repo

```
barber-shop_app/
├── backend/          # FastAPI (ver backend/AGENTS.md)
│   ├── app/
│   │   ├── api/v1/       # Routers y endpoints
│   │   ├── core/         # Settings, DB, security
│   │   ├── models/       # SQLAlchemy models
│   │   ├── schemas/      # Pydantic schemas
│   │   └── crud/         # Lógica de negocio (validación turnos)
│   ├── test/             # Pytest suite
│   └── requirements*.txt
├── lab-react/        # Frontend React + Vite
│   ├── src/
│   │   ├── features/     # Módulos por dominio
│   │   ├── api/          # Cliente HTTP tipado
│   │   ├── hooks/        # Hooks compartidos
│   │   └── components/   # UI compartida
│   └── package.json
└── .gitignore
```

---

## Tecnologías clave usadas (para referencia)

| Capa | Tecnologías |
|---|---|
| **API** | FastAPI, Uvicorn, SQLAlchemy 2, Pydantic, python-jose, pwdlib (Argon2/bcrypt) |
| **DB** | SQLite (dev), migraciones manuales por ahora |
| **Front** | React 19, TypeScript, Vite, Tailwind CSS v4, MUI, React Router 7 |
| **Calidad** | Oxlint, TypeScript strict, Pytest + httpx |
| **Auth** | JWT Bearer tokens, OAuth2 password flow |

---

## Próximos pasos / Ideas

- [ ] Añadir tests al frontend (Vitest + React Testing Library)
- [ ] Tests E2E con Playwright
- [ ] Migraciones con Alembic
- [ ] Panel de cliente para auto-reserva
- [ ] Notificaciones (email/push) para recordatorios de cita
- [ ] Docker Compose para levantar todo de una
