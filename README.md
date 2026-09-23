# Mini Task Management Application

## 1. Project Overview
A mini task management application built as a study case. It allows users to create boards and manage tasks within those boards using a Kanban-style interface. 
- **Architecture**: Monolithic repository containing separate backend and frontend services.
- **Technologies**: 
  - **Backend**: Python, FastAPI, SQLAlchemy, Alembic, PostgreSQL, Pydantic, Pytest.
  - **Frontend**: React, TypeScript, Vite, Axios, Vanilla CSS.

## 2. Project Structure
```text
wpp-fullstack-assessment/
├── README.md
├── backend/
│   ├── alembic/              # Database migrations
│   ├── alembic.ini           # Alembic configuration
│   ├── app/                  # FastAPI application code
│   │   ├── models/           # SQLAlchemy models
│   │   ├── routers/          # API endpoints
│   │   ├── schemas/          # Pydantic validation schemas
│   │   ├── services/         # Business logic
│   │   ├── repositories/     # Database access
│   │   ├── database.py       # Database connection setup
│   │   ├── exceptions.py     # Custom exceptions
│   │   └── main.py           # FastAPI app initialization
│   ├── tests/                # Pytest unit and integration tests
│   └── requirements.txt      # Python dependencies
└── frontend/
    ├── package.json          # Node dependencies and scripts
    └── src/
        ├── api/              # Axios API clients
        ├── components/       # React UI components
        ├── types/            # TypeScript interfaces
        ├── App.tsx           # Main React component
        └── main.tsx          # React application entry point
```

## 3. Database Setup
The backend requires PostgreSQL. The project expects a local PostgreSQL instance with the default credentials and database name defined in `backend/app/config.py` and `backend/.env.example`:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/taskmanager
CORS_ORIGINS=["http://localhost:5173"]
```

### Clean database setup
1. Start PostgreSQL and create the database used by the app:
```bash
createdb -U postgres taskmanager
# or
psql -U postgres -d postgres -c "CREATE DATABASE taskmanager;"
```
2. In the `backend/` folder, copy the example environment file (or export the variable manually):
```bash
cp .env.example .env
```
3. The same `DATABASE_URL` is used by both the FastAPI app and Alembic. `backend/app/config.py` loads it into `settings.database_url`, and `backend/alembic/env.py` sets `sqlalchemy.url` from that same value before running migrations.
4. Create the schema from the existing migration:
```bash
cd backend
alembic upgrade head
```
This runs the initial migration in `backend/alembic/versions/7b722de3df3e_initial_schema.py`, which creates the `boards` and `tasks` tables, validation checks, and the `ix_tasks_board_id_status` index.
5. After the schema is ready, start the backend:
```bash
uvicorn app.main:app --reload --port 8000
```
The API will be running at `http://localhost:8000`.

> Note: the repository’s `compose.yaml` sets `DATABASE_URL` for the backend container to `postgresql://postgres:postgres@postgres-db:5432/taskmanager`, but the project’s default working setup remains a PostgreSQL instance at `localhost:5432` for local development.

## 4. Backend Setup
The backend API is built with FastAPI. To start the backend:

1. Navigate to the backend directory:
```bash
cd backend
```
2. Create and activate a virtual environment:
```bash
python3 -m venv venv
source venv/bin/activate
```
3. Install dependencies:
```bash
pip install -r requirements.txt
```
4. Ensure the PostgreSQL database exists and then run the schema migration:
```bash
alembic upgrade head
```
5. Start the FastAPI server:
```bash
uvicorn app.main:app --reload --port 8000
```
The API will be running at `http://localhost:8000`.

## 5. Database Schema

The schema is created by the initial Alembic migration. It contains the following tables.

### `boards`

| Column | PostgreSQL type | Nullable | Default |
| --- | --- | --- | --- |
| `id` | `UUID` | No | `gen_random_uuid()` |
| `name` | `VARCHAR(255)` | No | None |
| `created_at` | `TIMESTAMPTZ` | No | `now()` |

Primary key: `id`.

### `tasks`

| Column | PostgreSQL type | Nullable | Default |
| --- | --- | --- | --- |
| `id` | `UUID` | No | `gen_random_uuid()` |
| `board_id` | `UUID` | No | None |
| `title` | `VARCHAR(255)` | No | None |
| `description` | `TEXT` | Yes | None |
| `status` | `VARCHAR(20)` | No | `'TODO'` |
| `created_at` | `TIMESTAMPTZ` | No | `now()` |
| `updated_at` | `TIMESTAMPTZ` | No | `now()` |

Primary key: `id`.

### Relationships

- `tasks.board_id` references `boards.id`.
- The foreign key uses `ON DELETE CASCADE`, so deleting a board deletes its tasks.

### Constraints

- `boards_name_check`: `TRIM(boards.name) <> ''`.
- `tasks_title_check`: `TRIM(tasks.title) <> ''`.
- `tasks_status_check`: `tasks.status` must be one of `TODO`, `IN_PROGRESS`, or `DONE`.
- The primary keys are non-null UUID values, and `tasks.board_id` is a required foreign key.
- No other unique constraints are defined by the current schema.

### Indexes

- `ix_tasks_board_id_status` covers `tasks(board_id, status)`.
- It supports retrieving a board's tasks, including queries that filter by status, without adding a separate index for each status value.

### Design Rationale

- UUID primary keys provide globally unique identifiers without exposing sequential record counts.
- A required foreign key keeps every task associated with a board, while database-level cascading preserves referential integrity when a board is removed.
- Non-empty checks prevent whitespace-only board names and task titles; the status check keeps task state within the three supported workflow values.
- Time-zone-aware timestamps record creation and update times consistently, and the composite index matches the board task-list and status-filter query pattern.

### Rejected schema decision

- Alternative considered: allow tasks to remain without a board and handle deletion cleanup in application code instead of enforcing a foreign-key relationship.
- Why it was rejected: this would allow orphaned task rows and move important referential integrity into the API layer, where it is easier to forget or bypass.
- Chosen design: `tasks.board_id` is required and references `boards.id` with `ON DELETE CASCADE` in the migration, so deleting a board automatically removes its tasks.
- Trade-off: the schema is slightly less flexible because a task cannot exist without a board, but it is safer and much simpler to reason about than managing board deletion manually.

## 6. Frontend Setup
The frontend is a React application created with Vite. To start the frontend:

1. Navigate to the frontend directory:
```bash
cd frontend
```
2. Install dependencies:
```bash
npm install
```
3. Start the development server:
```bash
npm run dev
```
The frontend will be accessible at `http://localhost:5173`.

## 7. API Documentation

### Boards
- **`GET /api/boards`**
  - **Description**: Returns a list of all boards.
  - **Response (200)**: `[{"id": "uuid", "name": "string", "created_at": "datetime"}]`
- **`POST /api/boards`**
  - **Description**: Creates a new board.
  - **Request Body**: `{"name": "string"}` (name cannot be empty or whitespace)
  - **Response (201)**: The created board object.
  - **Error (422)**: If name is invalid.
- **`DELETE /api/boards/{id}`**
  - **Description**: Deletes a board and all of its tasks (ON DELETE CASCADE).
  - **Response (204)**: No Content.
  - **Error (404)**: If board is not found.

### Tasks
- **`GET /api/boards/{id}/tasks`**
  - **Description**: Retrieves tasks for a specific board. Supports optional `?status=` filter.
  - **Response (200)**: `[{"id": "uuid", "board_id": "uuid", "title": "string", "description": "string", "status": "TODO|IN_PROGRESS|DONE", "created_at": "datetime", "updated_at": "datetime"}]`
  - **Error (404)**: If board is not found.
- **`POST /api/boards/{id}/tasks`**
  - **Description**: Creates a new task in a board.
  - **Request Body**: `{"title": "string", "description": "string"}` (title cannot be empty)
  - **Response (201)**: The created task object.
  - **Error (404)**: If board is not found.
- **`PATCH /api/tasks/{id}`**
  - **Description**: Updates an existing task (e.g., status, title).
  - **Request Body**: `{"status": "TODO|IN_PROGRESS|DONE", "title": "string", "description": "string"}`
  - **Response (200)**: The updated task object.
  - **Error (404)**: If task is not found.
- **`DELETE /api/tasks/{id}`**
  - **Description**: Deletes a specific task.
  - **Response (204)**: No Content.
  - **Error (404)**: If task is not found.

### Error Handling
All API errors return a unified JSON payload:
```json
{
  "error": "NOT_FOUND | VALIDATION_ERROR | HTTP_ERROR | INTERNAL_ERROR",
  "message": "Human readable error message",
  "field": "Optional field name that caused the error"
}
```
This shape is used for application errors, request validation errors, HTTP errors,
framework-generated 404 responses, and unexpected server errors. Internal exception
details are not returned to clients.

## 8. Testing
Backend tests are written using `pytest`. They use a real PostgreSQL database to ensure constraints and cascades work properly.

To run the tests:
1. Ensure a PostgreSQL database named `taskmanager_test` is available.
2. Navigate to the backend folder and run:
```bash
cd backend
source venv/bin/activate
pytest -v
```

## 9. Build
To build the frontend for production:
1. Navigate to the frontend directory:
```bash
cd frontend
```
2. Run the build command:
```bash
npm run build
```
This generates the optimized static files in the `dist/` directory.

## 10. Assumptions and Trade-offs
- **Schema Decision**: We used `UUID` primary keys to keep identifiers globally unique and avoid sequential ID exposure.
- **Rejected design**: We did not choose a nullable or application-managed board relationship for tasks; that would allow orphaned data and duplicate deletion logic across the backend.
- **Chosen design**: `tasks.board_id` is mandatory, references `boards.id`, and uses PostgreSQL `ON DELETE CASCADE` to preserve referential integrity at the database level.
- **Trade-off**: This removes some flexibility because tasks cannot exist independently of a board, but it keeps the data model consistent and makes deletes predictable for the application.
