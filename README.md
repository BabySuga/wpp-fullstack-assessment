# Mini Task Management Application

This repository contains a small board-and-task application for the WPP Media Fullstack Developer assessment. It is intentionally split into two independently runnable services:

- `backend/`: FastAPI REST API with PostgreSQL persistence.
- `frontend/`: React and TypeScript Kanban client.

The browser communicates with the API over HTTP. PostgreSQL is the persistent store. The application covers boards, task CRUD, status changes, validation, meaningful tests, and the database constraints required by the assessment.

## Architecture

```text
Browser (localhost:5173) -- HTTP/JSON --> FastAPI (localhost:8000) -- SQLAlchemy --> PostgreSQL (localhost:5432)
```

Docker Compose runs the backend and frontend containers only. PostgreSQL is **not** a Compose service; a PostgreSQL server must already be running on the host. The Compose backend reaches it through `postgres-db:host-gateway`.

## Technology stack

| Area | Technology | Reason |
| --- | --- | --- |
| API | Python, FastAPI | Clear HTTP routing, automatic OpenAPI, and request validation. |
| Persistence | PostgreSQL, SQLAlchemy | Real relational constraints and durable storage. |
| Migrations | Alembic | Repeatable schema creation from an empty database. |
| Validation | Pydantic | Typed request and response contracts. |
| Backend tests | Pytest | Tests business rules without starting the web server. |
| UI | React, TypeScript, Vite | A typed, independently runnable frontend with a fast dev server. |
| HTTP client | Axios | Centralized browser-to-API requests and error handling. |
| Packaging | Docker Compose | Optional local orchestration for the two application services. |

## Prerequisites

- Docker and Docker Compose plugin for the container workflow.
- Python 3.11+ for local backend development.
- Node.js 20+ and npm for local frontend development.
- PostgreSQL running on `localhost:5432` for local development and on the Docker host for Compose.
- A PostgreSQL role/password matching the connection string used below (`postgres` / `postgres` by default).

## PostgreSQL setup

The normal development database is `taskmanager`. Create it before starting the backend:

```bash
createdb -U postgres taskmanager
```

The application connection is configured by `DATABASE_URL`. The default is:

```text
postgresql://postgres:postgres@localhost:5432/taskmanager
```

The backend reads `backend/.env` through `app/config.py`. Alembic reads the same setting through `backend/alembic/env.py`:

```bash
cd backend
cp .env.example .env
alembic upgrade head
```

On an empty database, revision `7b722de3df3e` creates `boards`, `tasks`, the constraints, and the `(board_id, status)` index. Database data is not committed to this repository; schema creation is migration-driven.

The clean migration verification used a separate database, `taskmanager_clean_clone`, only for verification:

```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/taskmanager_clean_clone \
./venv/bin/alembic upgrade head
```

That database was verified to contain `alembic_version`, `boards`, and `tasks`, including UUID keys, non-empty name/title checks, allowed statuses, the board foreign key with `ON DELETE CASCADE`, and the `(board_id, status)` index. The application does not permanently use this database; normal development remains `taskmanager`.

## Local development

### Backend

```bash
cd backend
python3 -m venv .venv
. .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
createdb -U postgres taskmanager
alembic upgrade head
uvicorn app.main:app --reload --port 8000
```

The API is at `http://localhost:8000`, Swagger UI is at `http://localhost:8000/docs`, and the health check is at `http://localhost:8000/health`.

### Frontend

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

The UI is at `http://localhost:5173`. The browser API URL is configured by `VITE_API_BASE_URL`, defaulting to `http://localhost:8000`. It must use `localhost` because requests originate in the user's browser, not inside the frontend container.

## Docker Compose

Before running Compose, create and start the host PostgreSQL database described above. Compose does not bootstrap PostgreSQL, persist database data, or run a PostgreSQL health check.

```bash
docker compose up --build
```

This starts:

- `backend` on `http://localhost:8000`; its container runs `alembic upgrade head` before Uvicorn.
- `frontend` on `http://localhost:5173`.

The Compose backend receives `DATABASE_URL=postgresql://postgres:postgres@postgres-db:5432/taskmanager` and `CORS_ORIGINS=["http://localhost:5173", "http://127.0.0.1:5173"]`. `postgres-db` is mapped to the Docker host by `extra_hosts`. The Compose frontend receives `VITE_API_BASE_URL=http://localhost:8000`, which is correct for browser requests.

Stop the application containers with:

```bash
docker compose down
```

## Tests and build

Backend tests use a separate real PostgreSQL database named `taskmanager_test`:

```bash
createdb -U postgres taskmanager_test
cd backend
. .venv/bin/activate
pytest -q
```

The frontend commands are:

```bash
cd frontend
npm test
npm run build
npm run lint
```

`npm run preview` serves the built frontend locally when needed. The backend suite exercises service-layer success and failure paths plus API error shapes; the frontend suite covers board/task loading and interaction behavior.

## Repository structure

```text
backend/app/       API, services, repositories, models, schemas, configuration
backend/alembic/   migration environment and revisions
backend/tests/     backend tests
frontend/src/      React components, API clients, types, and tests
compose.yaml       backend/frontend container orchestration
context/           assessment requirements and walkthrough records
```

## API overview

The backend exposes `GET /api/boards`, `POST /api/boards`, `DELETE /api/boards/{board_id}`, `GET/POST /api/boards/{board_id}/tasks`, `PATCH /api/tasks/{task_id}`, and `DELETE /api/tasks/{task_id}`. Task listing accepts an optional `status` query parameter. Swagger at `/docs` is the authoritative interactive contract; detailed request/response behavior is documented in [backend/README.md](backend/README.md).

Successful reads return `200`, creates return `201`, and deletes return `204`. Validation failures return `422`, missing resources return `404`, and failures use `{error, message, field}`.

## Assumptions, decisions, and scope

- A task must belong to a board. Deleting a board cascades to its tasks through a database foreign key. Allowing orphan tasks and cleaning them up in application code was considered and rejected because it permits invalid rows.
- The service assumes one local PostgreSQL instance and does not implement authentication or multi-user isolation.
- Title/description editing, drag-and-drop status movement, drag-to-delete, status counts, and local persistence of the selected board/status filter are implemented UI extensions.
- In scope: boards, task management and status operations, PostgreSQL persistence, REST API, frontend, validation, tests, and documentation.
- Intentionally out of scope: authentication, production hardening, CI/CD, cloud deployment, production monitoring, real-time/WebSockets, pagination, a coverage percentage target, designer-grade or pixel-perfect styling, and unnecessary infrastructure.

The project is an assessment implementation, not a claim of production hardening. Known operational limitations include the external PostgreSQL prerequisite for Compose and the absence of authentication, deployment, monitoring, and pagination.

See [backend/README.md](backend/README.md) and [frontend/README.md](frontend/README.md) for service-specific details.