# Backend

The backend is a FastAPI REST service for boards and tasks. It uses SQLAlchemy with PostgreSQL, Alembic migrations, Pydantic schemas, and a controller/router -> service -> repository -> model separation. Service-layer rules are testable without starting Uvicorn.

## Stack and structure

- FastAPI: HTTP routing and generated OpenAPI documentation.
- Pydantic: request validation and response serialization.
- SQLAlchemy: ORM and database access.
- Alembic: versioned schema creation.
- PostgreSQL: durable relational storage and database-level constraints.
- Pytest: business-rule and API error tests.

```text
app/routers/       HTTP endpoints
app/services/      business rules
app/repositories/  SQLAlchemy queries
app/models/        ORM table mappings
app/schemas/       Pydantic request/response types
app/config.py      environment-backed settings
alembic/           migration environment and revisions
tests/             backend tests
```

## Configuration and local run

Python 3.11+ and PostgreSQL on `localhost:5432` are required. Create the database and environment file:

```bash
createdb -U postgres taskmanager
cd backend
python3 -m venv .venv
. .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
alembic upgrade head
uvicorn app.main:app --reload --port 8000
```

`backend/.env` is read by `app/config.py`; Alembic uses the same settings in `alembic/env.py`.

| Variable | Default | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | `postgresql://postgres:postgres@localhost:5432/taskmanager` | SQLAlchemy and Alembic connection. |
| `CORS_ORIGINS` | `["http://localhost:5173"]` | JSON list of allowed browser origins. |

The API listens on `http://localhost:8000`, Swagger UI is `http://localhost:8000/docs`, and `GET /health` returns `{"status":"ok"}`.

## Migrations and schema

Run `alembic upgrade head` against an empty database. Revision `7b722de3df3e` creates `boards` and `tasks`; schema data is not committed to the repository.

### `boards`

| Column | Type | Null | Default | Constraints |
| --- | --- | --- | --- | --- |
| `id` | UUID | no | `gen_random_uuid()` | primary key |
| `name` | `VARCHAR(255)` | no | none | `TRIM(name) <> ''` |
| `created_at` | `TIMESTAMPTZ` | no | `now()` | none |

### `tasks`

| Column | Type | Null | Default | Constraints |
| --- | --- | --- | --- | --- |
| `id` | UUID | no | `gen_random_uuid()` | primary key |
| `board_id` | UUID | no | none | foreign key to `boards.id`, `ON DELETE CASCADE` |
| `title` | `VARCHAR(255)` | no | none | `TRIM(title) <> ''` |
| `description` | `TEXT` | yes | none | none |
| `status` | `VARCHAR(20)` | no | `TODO` | `TODO`, `IN_PROGRESS`, or `DONE` |
| `created_at` | `TIMESTAMPTZ` | no | `now()` | none |
| `updated_at` | `TIMESTAMPTZ` | no | `now()` | none |

The migration adds `ix_tasks_board_id_status` on `(board_id, status)` for the board task listing and status-filter query. There are no additional unique constraints.

The chosen delete behavior is deliberate: deleting a board deletes its tasks through `ON DELETE CASCADE`. Allowing tasks without a board and cleaning up orphan rows in application code was considered and rejected because it would allow invalid task records.

## API contract

All resource routes use the `/api` prefix. UUID path parameters are validated by FastAPI.

| Method and path | Behavior | Success |
| --- | --- | --- |
| `GET /api/boards` | List boards. | `200` and an array. |
| `POST /api/boards` | Body `{ "name": "Marketing" }`; creates a board. | `201` and the board. |
| `DELETE /api/boards/{board_id}` | Deletes a board and its tasks. | `204` with no body. |
| `GET /api/boards/{board_id}/tasks` | Lists tasks; optional `?status=TODO`, `IN_PROGRESS`, or `DONE`. | `200` and an array. |
| `POST /api/boards/{board_id}/tasks` | Body `{ "title": "...", "description": "..." }`; creates a TODO task. | `201` and the task. |
| `PATCH /api/tasks/{task_id}` | Updates `status`; optional `title` and `description` editing is also implemented. | `200` and the task. |
| `DELETE /api/tasks/{task_id}` | Deletes one task. | `204` with no body. |

Board names and task titles must be non-empty after trimming. A task must reference an existing board. Missing boards/tasks return `404`; invalid UUIDs, invalid statuses, and invalid request bodies return `422`. An empty task list is a successful empty array. `updated_at` is refreshed when a task is changed.

Errors use one JSON shape:

```json
{
  "error": "NOT_FOUND | VALIDATION_ERROR | HTTP_ERROR | INTERNAL_ERROR",
  "message": "Human readable message",
  "field": "field name or null"
}
```

The API maps validation failures to `422`, missing resources/routes to `404`, and unexpected exceptions to `500`. The route-level error test also verifies the canonical shape for an invalid UUID and an unmatched route.

## Tests

Tests use a real PostgreSQL database named `taskmanager_test`, not the development database:

```bash
createdb -U postgres taskmanager_test
cd backend
. .venv/bin/activate
pytest -q
```

The suite covers board/task service success paths, status filtering, board deletion, empty and whitespace-only names/titles, missing boards/tasks, invalid status, updates/deletes, and API error shapes. Tests create and drop their tables for each test function; the database itself must exist first.

## Assumptions and limitations

The backend assumes a single local PostgreSQL instance and does not provide authentication, multi-user isolation, pagination, real-time updates, deployment, monitoring, or production hardening. Those items are outside the assessment scope. The optional UI editing behavior is supported by the `PATCH` endpoint; no additional user or organization model is introduced.