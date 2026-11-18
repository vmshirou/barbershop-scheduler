# Barberia API — AGENTS.md

## Quickstart

| Goal | Command |
|---|---|
| Install deps | `pip install -r requirements.txt` |
| Install dev deps | `pip install -r requirements-dev.txt` |
| Run dev server | `uvicorn app.main:app --reload` |
| API base | `http://127.0.0.1:8000/api/v1` |
| Health check | `GET /health` |

## Environment

1. Copy `.env.example` to `.env` and set values.
2. **Must set** `SECRET_KEY` — generate with: `python -c "import secrets; print(secrets.token_urlsafe(64))"`
3. `DATABASE_URL` defaults to `sqlite:///./barberia.db`

## Database

- SQLite by default. Foreign keys are **disabled by default** — the app enables them via a SQLAlchemy event hook (`PRAGMA foreign_keys=ON`).
- On first run, the lifespan creates all tables (`Base.metadata.create_all`) and seeds an admin user if one doesn't exist.
- Admin credentials come from `FIRST_ADMIN_NOMBRE`, `FIRST_ADMIN_TELEFONO`, `FIRST_ADMIN_PASSWORD` in `.env`.

## Authentication

- OAuth2 password flow at `POST /api/v1/auth/login` (username=phone_number, password=plain).
- Token is Bearer auth on subsequent requests.
- `GET /api/v1/auth/me` returns the current user's profile.
- Token expires in 480 minutes (8 hours) by default (`ACCESS_TOKEN_EXPIRE_MINUTES`).

## Admin-only endpoints

These require `current_user.rol == ADMIN` (enforced via `require_admin` dependency):
- `GET/POST/PUT/DELETE /api/v1/usuarios` — user management
- `GET/POST/PUT/DELETE /api/v1/clientes` — client management
- `GET/POST/PUT/DELETE /api/v1/servicios` — service management
- `GET/POST/PUT/DELETE /api/v1/jornadas` — workday schedules
- `POST/PUT/DELETE /api/v1/turnos` — appointment scheduling

Non-admin users can access `GET /api/v1/auth/login` and `GET /api/v1/auth/me`.

## Key validation rules (turn creation/editing)

When creating/updating a turn, the system validates:

1. **Client exists** — `id_client` must reference an existing `Client`.
2. **Service exists** — `id_service` must reference an existing `Service`.
3. **Workday exists** — `id_workday` must reference an existing `Workday`.
4. **Barber exists and is BARBER rol** — `id_barber` must reference a `User` with `rol == BARBER`.
5. **Turn within workday** — `start_time` + `service.duration` must not exceed the workday's `start_time` + `workday.duration`.
6. **No overlap** — no existing turn for the same barber at the same time window (using `UniqueConstraint(id_workday, id_barber, start_time)`).

The validation logic lives in `app/crud/turn.py::validate_turn()`.

## Testing

| Command | Description |
|---|---|
| `pytest` | Run all tests |
| `pytest -k NAME` | Run tests matching `NAME` |

- Tests use `httpx` client against the running app.
- No external services required — all are in-memory/SQLite.
- Fixtures and test configuration are minimal; look at `conftest.py` or test files if present.

## Project structure

```
app/
  api/        → v1 router + endpoint handlers
  core/       → settings, database, security
  models/     → SQLAlchemy ORM models
  schemas/    → Pydantic request/response models
  crud/       → business logic (turn validation)
main.py       → FastAPI entrypoint with lifespan seeding
```