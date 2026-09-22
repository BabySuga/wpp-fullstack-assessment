# Implementation Plan — Mini Task Management Application

**Assessment:** Study Case – Full Stack Developer, WPP Media Indonesia  
**Role:** Senior Software Architect / Technical Planner  
**Purpose:** Architecture and task breakdown for incremental execution by coding models

---

## 1. Assessment Summary

The assessment asks for a **mini task management application** where tasks are grouped into boards. A board is a named container (e.g., "Q3 Website Refresh"). Each task has a title, an optional description, and a status that moves between `TODO`, `IN_PROGRESS`, and `DONE`.

The PDF explicitly states the **three things they look at hardest** are:

1. **Unit testing** — meaningful tests on business rules, especially failure paths
2. **Clear documentation** — setup, API contract, schema, assumptions, trade-offs
3. **Database design** — real schema with real constraints, and reasoning

The goal is NOT to build an impressive product. The goal is a **clean, maintainable, testable** implementation that satisfies R1–R31 and can be explained in an interview.

---

## 2. Source-of-Truth Requirements

Every requirement below is taken directly from the PDF. Nothing is added; nothing is removed.

### R1 — Board Model
A Board with: an id, a name (required, non-empty), and a created timestamp.

### R2 — Task Model
A Task with: an id, a reference to the board it belongs to (required), a title (required, non-empty), a description (optional), a status that is one of `TODO`, `IN_PROGRESS` or `DONE` (defaulting to `TODO`), a created timestamp and a last-updated timestamp.

### R3 — Foreign Key Constraint
Enforce the board-to-task relationship as a real database constraint — an actual foreign key. A task must not be able to reference a board that does not exist, even if someone inserts a row directly with SQL.

### R4 — Board Delete Behavior
Decide what happens to a board's tasks when the board is deleted, and make the schema enforce it. Either reject the delete while tasks remain, or remove the tasks with the board. The choice must be deliberate, documented, and enforced at the database level.

### R5 — Schema Documentation
Document the schema: every table with each column and its type; primary keys and foreign keys; constraints (not-null, unique, check); any indexes added and why. If no indexes beyond primary keys, say so and explain why.

### R6 — Schema Creation
State how the schema gets created — migration tool, ORM schema generation, or plain SQL script. A reviewer starting from an empty database must be able to get the schema in place by following the README.

### R7 — Rejected Schema Decision
Write one or two sentences on a schema decision considered and rejected.

### R8 — GET /api/boards
List all boards.

### R9 — POST /api/boards
Create a board. Reject a missing or empty name with 400 (or 422) and a useful message.

### R10 — GET /api/boards/{boardId}/tasks
List tasks on one board. Support optional `?status=` filter. Return 404 if board does not exist. An empty board returns an empty list, not an error.

### R11 — POST /api/boards/{boardId}/tasks
Create a task on a board. Return 201. Reject missing or empty title. Return 404 if board does not exist.

### R12 — PATCH /api/tasks/{taskId}
Update a task's status. Reject invalid status value. Return 404 if task does not exist. Updating title and description is optional.

### R13 — DELETE /api/tasks/{taskId}
Delete a task. Return 204. Return 404 if not found.

### R14 — DELETE /api/boards/{boardId}
Delete a board, behaving as decided in R4.

### R15 — HTTP Status Codes
200 for successful read, 201 for create, 204 for delete with no body, 400 or 422 for validation failure, 404 for not found, 500 only for genuine unexpected fault.

### R16 — Consistent Error Body
Return a consistent JSON error body for every failure, of our own design, documented once.

### R17 — Layer Separation
Separate layers: controller → service → repository → model. Business rules and validation must live somewhere testable without starting a web server.

### R18 — CORS
Allow cross-origin requests from the frontend's development origin.

### R19 — Board List UI
Show the list of boards. Let someone select one and create a new one.

### R20 — Task Display
For the selected board, show its tasks with title, description, status and created time, in a readable layout.

### R21 — Create Task Form
Create a task from a form with title and description. Validate in browser before sending. Also handle API validation errors.

### R22 — Change Task Status
Change a task's status directly from the list, using a dropdown or equivalent. Reflect result without full page reload.

### R23 — Delete Task
Delete a task.

### R24 — Filter Tasks by Status
Filter the visible tasks by status.

### R25 — Error/Edge States
Handle: request in flight, request failure, backend not running, board with no tasks. Backend down must never produce blank screen or uncaught error.

### R26 — HTTP-Only Communication
Frontend reaches backend only over HTTP. Backend base URL configurable through environment variable or config file — not hardcoded across components.

### R27 — Backend Unit Tests (Happy Paths)
Unit test backend business rules without a running web server. At minimum: creating a task on an existing board; filtering tasks by status; board-deletion behavior.

### R28 — Backend Unit Tests (Failure Paths)
Test failure cases: empty title, whitespace-only title, empty board name, task on nonexistent board, invalid status, update nonexistent task, delete nonexistent task.

### R29 — Frontend Tests (Optional)
Optional. If written, one or two tests around loading and error states are more valuable than broad shallow coverage.

### R30 — Tests Must Run
Tests must actually run. Command must be in README. A failing suite reads worse than a smaller passing one.

### R31 — Documentation
Root README pointing at both services, plus a README in each service. Cover: prerequisites, setup, URLs/ports, schema creation, test commands, API contract, schema docs, stack choice, rejected schema decision, assumptions, trade-offs, unfinished work.

---

## 3. Hard Architectural Requirements

### 3.1 Two Separate Services (NON-NEGOTIABLE)

The backend and frontend **must** be two completely separate services:

- Each starts independently with its own process and run command
- Each is runnable without the other service present
- Communication only through HTTP via a documented REST API
- No shared code, no shared compilation, no single artifact

**Self-checks that must pass:**

| Check | Procedure | Expected |
|-------|-----------|----------|
| SELF-CHECK 1 | Stop frontend. Leave backend running. `curl http://localhost:8000/api/boards` | Returns JSON data |
| SELF-CHECK 2 | Stop backend. Start frontend. Open browser. | Frontend loads and shows error state — no blank screen, no crash |

### 3.2 Data Persistence

Data must survive a backend restart. In-memory storage does not meet the requirement.

### 3.3 Free Stack

Nothing requires a paid account, credit card, cloud subscription, or licence key.

---

## 4. Technology Stack

| Layer | Technology | Version | Rationale |
|-------|-----------|---------|-----------|
| Backend Language | Python | 3.11+ | PDF Option B; strong for rapid development, clean syntax |
| Backend Framework | FastAPI | 0.100+ | PDF-approved; async, auto-generates OpenAPI docs (satisfies R31 API contract), Pydantic validation |
| Database | PostgreSQL | 15+ | PDF-preferred; real constraints, real foreign keys, production-grade |
| ORM | SQLAlchemy | 2.0+ | Mature, well-documented, pairs naturally with Alembic |
| Migrations | Alembic | 1.12+ | PDF mentions Alembic explicitly; standard for SQLAlchemy projects |
| Backend Testing | pytest | 7+ | Standard Python test runner |
| Frontend Framework | React | 18+ | PDF-required |
| Frontend Language | TypeScript | 5+ | PDF says "welcome"; adds type safety for API types |
| Frontend Tooling | Vite | 5+ | Fast dev server, simple config, stays a separate service |
| Frontend Testing | Vitest + React Testing Library | — | Optional (R29), only if time permits |

### README Stack Explanation (draft)

> **Backend:** Python with FastAPI was chosen because FastAPI provides automatic OpenAPI documentation, built-in request validation via Pydantic, and clean async support. Python is one of the two PDF-approved options.
>
> **Database:** PostgreSQL is the PDF-preferred database. It enforces real constraints (foreign keys, CHECK, NOT NULL) at the database level, which is a core assessment requirement.

---

## 5. System Architecture

```
┌─────────────────┐         HTTP/REST          ┌──────────────────┐
│                 │  ◄───────────────────────►  │                  │
│    Frontend     │        JSON over            │     Backend      │
│  (React + TS)   │     localhost:5173          │   (FastAPI)      │
│    Port 5173    │    → localhost:8000         │    Port 8000     │
│                 │                             │                  │
└─────────────────┘                             └────────┬─────────┘
                                                         │
                                                         │ SQLAlchemy
                                                         │
                                                ┌────────▼─────────┐
                                                │   PostgreSQL     │
                                                │    Port 5432     │
                                                └──────────────────┘
```

### Backend Internal Layers

```
HTTP Request
    │
    ▼
┌─────────────────────┐
│   API Layer          │  ← FastAPI routers, request/response schemas
│   (routers/)         │     No business logic here
├─────────────────────┤
│   Service Layer      │  ← Business rules, validation
│   (services/)        │     Testable without web server
├─────────────────────┤
│   Repository Layer   │  ← Database queries, CRUD operations
│   (repositories/)    │     SQLAlchemy queries
├─────────────────────┤
│   Model Layer        │  ← SQLAlchemy ORM models
│   (models/)          │     Database table definitions
├─────────────────────┤
│   Schema Layer       │  ← Pydantic schemas for request/response
│   (schemas/)         │     Validation, serialization
└─────────────────────┘
```

---

## 6. Repository Structure

```
wpp-fullstack-assessment/
├── README.md                          # Root README: overview, links to both services
│
├── backend/
│   ├── README.md                      # Backend README: prerequisites, setup, API docs, schema
│   ├── requirements.txt               # Python dependencies
│   ├── alembic.ini                    # Alembic configuration
│   ├── .env.example                   # Example environment variables
│   │
│   ├── alembic/
│   │   ├── env.py                     # Alembic environment config
│   │   └── versions/                  # Migration files
│   │       └── 001_initial_schema.py
│   │
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                    # FastAPI app creation, CORS, router registration
│   │   ├── config.py                  # Settings from environment (DB URL, CORS origins)
│   │   ├── database.py                # SQLAlchemy engine, session factory
│   │   │
│   │   ├── models/
│   │   │   ├── __init__.py
│   │   │   ├── board.py               # Board SQLAlchemy model
│   │   │   └── task.py                # Task SQLAlchemy model
│   │   │
│   │   ├── schemas/
│   │   │   ├── __init__.py
│   │   │   ├── board.py               # Board Pydantic schemas
│   │   │   ├── task.py                # Task Pydantic schemas
│   │   │   └── error.py               # Error response schema
│   │   │
│   │   ├── repositories/
│   │   │   ├── __init__.py
│   │   │   ├── board_repository.py    # Board CRUD operations
│   │   │   └── task_repository.py     # Task CRUD operations
│   │   │
│   │   ├── services/
│   │   │   ├── __init__.py
│   │   │   ├── board_service.py       # Board business logic
│   │   │   └── task_service.py        # Task business logic
│   │   │
│   │   ├── routers/
│   │   │   ├── __init__.py
│   │   │   ├── board_router.py        # Board API endpoints
│   │   │   └── task_router.py         # Task API endpoints
│   │   │
│   │   └── exceptions.py             # Custom exception classes
│   │
│   └── tests/
│       ├── __init__.py
│       ├── conftest.py                # Shared fixtures (mock repos, test DB)
│       ├── test_board_service.py      # Board service tests
│       └── test_task_service.py       # Task service tests
│
├── frontend/
│   ├── README.md                      # Frontend README: prerequisites, setup, config
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   ├── index.html
│   ├── .env.example                   # VITE_API_BASE_URL=http://localhost:8000
│   │
│   └── src/
│       ├── main.tsx                   # React entry point
│       ├── App.tsx                    # Root component, board selection state
│       ├── api/
│       │   └── client.ts              # API client — single source for base URL + fetch calls
│       ├── types/
│       │   └── index.ts               # Board, Task, TaskStatus, ErrorResponse types
│       ├── components/
│       │   ├── BoardList.tsx           # Board list + create board
│       │   ├── TaskList.tsx            # Task list with status filter
│       │   ├── TaskCard.tsx            # Single task display with status dropdown + delete
│       │   ├── CreateTaskForm.tsx      # Task creation form
│       │   ├── StatusFilter.tsx        # Status filter control
│       │   ├── ErrorMessage.tsx        # Reusable error display
│       │   └── LoadingSpinner.tsx      # Loading indicator
│       └── App.css                    # Minimal styling — clean and readable only
│
└── docker-compose.yml                 # (Optional) PostgreSQL + backend + frontend
```

### What belongs where

| Location | Contents |
|----------|----------|
| Root `README.md` | One-paragraph project description, links to `backend/README.md` and `frontend/README.md`, tech stack overview |
| `backend/` | Everything Python: app code, tests, migrations, dependencies, its own README |
| `frontend/` | Everything React/TypeScript: components, API client, types, its own README |

---

## 7. Database Design

### 7.1 Boards Table

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | `UUID` | `PRIMARY KEY`, `DEFAULT gen_random_uuid()` | Avoids sequential ID enumeration |
| `name` | `VARCHAR(255)` | `NOT NULL`, `CHECK (TRIM(name) <> '')` | Required, non-empty per R1 |
| `created_at` | `TIMESTAMP WITH TIME ZONE` | `NOT NULL`, `DEFAULT NOW()` | Per R1 |

### 7.2 Tasks Table

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | `UUID` | `PRIMARY KEY`, `DEFAULT gen_random_uuid()` | Consistent with boards |
| `board_id` | `UUID` | `NOT NULL`, `FOREIGN KEY → boards(id) ON DELETE CASCADE` | Per R2, R3, R4 |
| `title` | `VARCHAR(255)` | `NOT NULL`, `CHECK (TRIM(title) <> '')` | Required, non-empty per R2 |
| `description` | `TEXT` | Nullable | Optional per R2 |
| `status` | `VARCHAR(20)` | `NOT NULL`, `DEFAULT 'TODO'`, `CHECK (status IN ('TODO','IN_PROGRESS','DONE'))` | Enum enforcement per R2 |
| `created_at` | `TIMESTAMP WITH TIME ZONE` | `NOT NULL`, `DEFAULT NOW()` | Per R2 |
| `updated_at` | `TIMESTAMP WITH TIME ZONE` | `NOT NULL`, `DEFAULT NOW()` | Per R2, updated on every modification |

### 7.3 Relationships

```
boards 1 ──────── * tasks
         boards.id ← tasks.board_id (FK)
```

- One board has zero or more tasks
- Each task belongs to exactly one board
- Enforced by `FOREIGN KEY` constraint at the database level (R3)

### 7.4 Constraints Summary

| Constraint | Table | Column(s) | Type |
|------------|-------|-----------|------|
| `boards_pkey` | boards | id | PRIMARY KEY |
| `tasks_pkey` | tasks | id | PRIMARY KEY |
| `tasks_board_id_fkey` | tasks | board_id | FOREIGN KEY → boards(id) |
| `boards_name_check` | boards | name | CHECK — `TRIM(name) <> ''` |
| `tasks_title_check` | tasks | title | CHECK — `TRIM(title) <> ''` |
| `tasks_status_check` | tasks | status | CHECK — `status IN ('TODO','IN_PROGRESS','DONE')` |
| `boards_name_nn` | boards | name | NOT NULL |
| `tasks_board_id_nn` | tasks | board_id | NOT NULL |
| `tasks_title_nn` | tasks | title | NOT NULL |
| `tasks_status_nn` | tasks | status | NOT NULL |

### 7.5 Delete Behavior

**Decision: `ON DELETE CASCADE`**

**Reasoning:**
- This is a small task management app for a single team. A board is a container; deleting it logically means "we're done with this work stream."
- Orphaned tasks (board deleted but tasks remain) would be unreachable through the API since tasks are accessed via `GET /api/boards/{boardId}/tasks`.
- `RESTRICT` would require the user to manually delete every task before deleting a board, which is tedious for an app of this scope.
- The behavior is enforced at the database level via `ON DELETE CASCADE`, not by application cleanup code.

**Database constraint:** `FOREIGN KEY (board_id) REFERENCES boards(id) ON DELETE CASCADE`

**Required test:** A test that creates a board with tasks, deletes the board, and verifies that both the board and its tasks are gone.

**Documentation:** Stated in backend README under "Schema" and "Assumptions" sections.

### 7.6 Indexes

| Index | Table | Column(s) | Reason |
|-------|-------|-----------|--------|
| `boards_pkey` (implicit) | boards | id | Primary key — automatic |
| `tasks_pkey` (implicit) | tasks | id | Primary key — automatic |
| `ix_tasks_board_id` | tasks | board_id | Every task listing query filters by `board_id`. Without this index, listing tasks for a board requires a full table scan. This is the most frequently executed query pattern. |
| `ix_tasks_board_id_status` | tasks | (board_id, status) | **Alternative to the single-column index above.** The `?status=` filter (R10) queries by `(board_id, status)` simultaneously. A composite index serves both the filtered and unfiltered listing queries. **Recommendation: use this composite index instead of the single-column index.** |

> [!NOTE]
> We choose the composite index `(board_id, status)` because it efficiently supports both `GET /api/boards/{boardId}/tasks` (prefix scan on `board_id`) and `GET /api/boards/{boardId}/tasks?status=TODO` (exact match on both columns). A single-column index on `board_id` alone would still require a filter for status queries. Since the dataset is small, the practical difference is negligible, but the composite index demonstrates deliberate design thinking — which is what the assessment values.

### 7.7 Migration Strategy

**Tool:** Alembic (PDF explicitly mentions it for Python projects)

**Setup:**
1. `alembic init alembic` — creates Alembic directory structure
2. Configure `alembic.ini` to read `DATABASE_URL` from environment
3. Configure `alembic/env.py` to import SQLAlchemy models
4. Generate initial migration: `alembic revision --autogenerate -m "initial schema"`
5. Apply migration: `alembic upgrade head`

**Reviewer workflow (from empty database):**
```bash
cd backend
createdb taskmanager              # or use psql / Docker
cp .env.example .env              # edit DATABASE_URL
pip install -r requirements.txt
alembic upgrade head              # creates tables
uvicorn app.main:app --reload     # start server
```

### 7.8 Rejected Schema Decision

**Decision considered:** Creating a separate `statuses` lookup table with `id` and `name` columns, and referencing it via foreign key from `tasks.status_id`.

**Why rejected:** The status values (`TODO`, `IN_PROGRESS`, `DONE`) are a small, fixed, well-known set specified in the assessment brief. A lookup table adds a join on every task query, requires seeding the table during setup, and adds complexity (migration, repository, model) without benefit. Storing status as a `VARCHAR` with a `CHECK` constraint is simpler, equally enforced at the database level, and directly readable in query results. If the status set ever grew or needed metadata (e.g., display color, sort order), a lookup table would become worthwhile — but that is not the case here.

---

## 8. REST API Contract

### Base URL

`http://localhost:8000`

All endpoints are prefixed with `/api`.

### Endpoints

---

#### R8 — List Boards

```
GET /api/boards
```

**Response:** `200 OK`
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Q3 Website Refresh",
    "created_at": "2026-09-22T12:00:00Z"
  }
]
```

---

#### R9 — Create Board

```
POST /api/boards
Content-Type: application/json

{
  "name": "Onboarding"
}
```

**Success:** `201 Created`
```json
{
  "id": "660e8400-e29b-41d4-a716-446655440001",
  "name": "Onboarding",
  "created_at": "2026-09-22T12:05:00Z"
}
```

**Error — empty name:** `422 Unprocessable Entity`
```json
{
  "error": "VALIDATION_ERROR",
  "message": "Name must not be empty",
  "field": "name"
}
```

---

#### R10 — List Tasks for Board

```
GET /api/boards/{boardId}/tasks
GET /api/boards/{boardId}/tasks?status=TODO
```

**Success (with tasks):** `200 OK`
```json
[
  {
    "id": "770e8400-e29b-41d4-a716-446655440002",
    "board_id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "Design homepage",
    "description": "Create wireframes",
    "status": "TODO",
    "created_at": "2026-09-22T12:10:00Z",
    "updated_at": "2026-09-22T12:10:00Z"
  }
]
```

**Success (empty board):** `200 OK`
```json
[]
```

**Error — board not found:** `404 Not Found`
```json
{
  "error": "NOT_FOUND",
  "message": "Board not found",
  "field": null
}
```

---

#### R11 — Create Task

```
POST /api/boards/{boardId}/tasks
Content-Type: application/json

{
  "title": "Design homepage",
  "description": "Create wireframes for the new homepage"
}
```

**Success:** `201 Created`
```json
{
  "id": "770e8400-e29b-41d4-a716-446655440002",
  "board_id": "550e8400-e29b-41d4-a716-446655440000",
  "title": "Design homepage",
  "description": "Create wireframes for the new homepage",
  "status": "TODO",
  "created_at": "2026-09-22T12:10:00Z",
  "updated_at": "2026-09-22T12:10:00Z"
}
```

**Error — empty title:** `422 Unprocessable Entity`
```json
{
  "error": "VALIDATION_ERROR",
  "message": "Title must not be empty",
  "field": "title"
}
```

**Error — board not found:** `404 Not Found`
```json
{
  "error": "NOT_FOUND",
  "message": "Board not found",
  "field": null
}
```

---

#### R12 — Update Task

```
PATCH /api/tasks/{taskId}
Content-Type: application/json

{
  "status": "IN_PROGRESS"
}
```

**Success:** `200 OK`
```json
{
  "id": "770e8400-e29b-41d4-a716-446655440002",
  "board_id": "550e8400-e29b-41d4-a716-446655440000",
  "title": "Design homepage",
  "description": "Create wireframes",
  "status": "IN_PROGRESS",
  "created_at": "2026-09-22T12:10:00Z",
  "updated_at": "2026-09-22T14:30:00Z"
}
```

**Error — invalid status:** `422 Unprocessable Entity`
```json
{
  "error": "VALIDATION_ERROR",
  "message": "Status must be one of: TODO, IN_PROGRESS, DONE",
  "field": "status"
}
```

**Error — task not found:** `404 Not Found`
```json
{
  "error": "NOT_FOUND",
  "message": "Task not found",
  "field": null
}
```

> **Design decision: PATCH over PUT.**  
> PATCH is chosen because R12 requires updating status, and optionally title/description. PATCH semantics (partial update) align with sending only the fields being changed. PUT would require sending the complete resource representation, which is unnecessary when only changing status. This is documented in the backend README.

---

#### R13 — Delete Task

```
DELETE /api/tasks/{taskId}
```

**Success:** `204 No Content` (empty body)

**Error — task not found:** `404 Not Found`
```json
{
  "error": "NOT_FOUND",
  "message": "Task not found",
  "field": null
}
```

---

#### R14 — Delete Board

```
DELETE /api/boards/{boardId}
```

**Success:** `204 No Content` (empty body, tasks cascade-deleted)

**Error — board not found:** `404 Not Found`
```json
{
  "error": "NOT_FOUND",
  "message": "Board not found",
  "field": null
}
```

---

### Status Code Summary (R15)

| Code | Meaning | Used For |
|------|---------|----------|
| 200 | OK | Successful read, successful update |
| 201 | Created | Successful create (board, task) |
| 204 | No Content | Successful delete |
| 422 | Unprocessable Entity | Validation failure |
| 404 | Not Found | Resource does not exist |
| 500 | Internal Server Error | Unexpected server fault only |

> **Why 422 over 400:** FastAPI's built-in validation uses 422 by default (Pydantic). Using 422 consistently avoids fighting the framework and is semantically correct — the request is syntactically valid JSON but semantically invalid. This is documented as a trade-off.

---

## 9. Error Handling Strategy

### Error Response Schema (R16)

Every API error returns this consistent JSON shape:

```json
{
  "error": "ERROR_CODE",
  "message": "Human-readable description",
  "field": "field_name_or_null"
}
```

| Field | Type | Description |
|-------|------|-------------|
| `error` | `string` | Machine-readable error code: `VALIDATION_ERROR`, `NOT_FOUND`, `INTERNAL_ERROR` |
| `message` | `string` | Human-readable explanation |
| `field` | `string \| null` | The field that caused the error, or `null` for non-field errors |

### Error Codes

| Code | HTTP Status | When |
|------|-------------|------|
| `VALIDATION_ERROR` | 422 | Missing/empty name, title, or invalid status |
| `NOT_FOUND` | 404 | Board or task ID does not exist |
| `INTERNAL_ERROR` | 500 | Unexpected exception |

### Implementation

1. Define custom exception classes in `app/exceptions.py`: `ValidationError`, `NotFoundError`
2. Register FastAPI exception handlers in `app/main.py` that catch these and return the standard error body
3. Override FastAPI's default `RequestValidationError` handler to return the same shape
4. Services raise domain exceptions; routers let the global handlers convert them to HTTP responses

### Frontend Consumption

The frontend API client checks `response.ok`. If false, it parses the JSON body as `ErrorResponse` and can display `message` to the user. The `error` code can be used for programmatic handling if needed.

---

## 10. Backend Architecture

### Layer Responsibilities

| Layer | Module | Responsibility | Can Reference |
|-------|--------|---------------|---------------|
| **Routers** | `app/routers/` | HTTP handling, request parsing, response serialization. **No business logic.** | Services, Schemas |
| **Services** | `app/services/` | Business rules, validation (empty name, whitespace title, valid status). **Testable in isolation.** | Repositories, Exceptions |
| **Repositories** | `app/repositories/` | Database CRUD. SQLAlchemy queries. **No validation.** | Models, Database session |
| **Models** | `app/models/` | SQLAlchemy ORM table definitions | Nothing (leaf) |
| **Schemas** | `app/schemas/` | Pydantic models for request/response serialization | Nothing (leaf) |
| **Exceptions** | `app/exceptions.py` | Custom domain exceptions | Nothing (leaf) |
| **Config** | `app/config.py` | Environment variable loading | Nothing (leaf) |
| **Database** | `app/database.py` | Engine, session factory, dependency | Config |

### Key Design Decisions

1. **Services receive repository as parameter** — This allows unit tests to inject mock repositories without starting a database. Services are pure business logic.

2. **Validation in services, not routers** — Pydantic handles basic type validation at the schema level. Business validation (e.g., whitespace-only title, board existence check) lives in services where it can be tested without HTTP.

3. **Repository pattern** — Repositories encapsulate all SQLAlchemy queries. Services never touch the ORM directly. This keeps services database-agnostic for testing.

4. **Dependency injection via FastAPI's `Depends`** — Routers get services via `Depends()`, services get repositories via `Depends()`, repositories get DB sessions via `Depends()`. Standard FastAPI pattern.

---

## 11. Frontend Architecture

### Structure

```
src/
├── main.tsx              # ReactDOM.createRoot, renders <App />
├── App.tsx               # Root: manages selectedBoardId state
├── App.css               # Minimal CSS for readable layout
│
├── api/
│   └── client.ts         # Single API client module
│
├── types/
│   └── index.ts          # TypeScript interfaces: Board, Task, TaskStatus, ErrorResponse
│
└── components/
    ├── BoardList.tsx      # Lists boards, create board form, board selection
    ├── TaskList.tsx       # Lists tasks for selected board, status filter
    ├── TaskCard.tsx       # Single task: title, desc, status dropdown, delete button
    ├── CreateTaskForm.tsx # Title + description form with client-side validation
    ├── StatusFilter.tsx   # "All / TODO / IN_PROGRESS / DONE" filter
    ├── ErrorMessage.tsx   # Reusable error display component
    └── LoadingSpinner.tsx # Simple loading indicator
```

### API Client (`api/client.ts`)

- Reads `VITE_API_BASE_URL` from environment (Vite exposes `import.meta.env.VITE_API_BASE_URL`)
- Defaults to `http://localhost:8000` if not set
- Exports typed functions: `getBoards()`, `createBoard()`, `getTasks()`, `createTask()`, `updateTask()`, `deleteTask()`, `deleteBoard()`
- Every function returns a typed result or throws a structured error
- **Single source of truth** for the base URL — no other file references the backend URL

### State Management

**No state management library.** React's built-in `useState` and `useEffect` are sufficient for this scope:

- `App.tsx`: `selectedBoardId` state
- `BoardList.tsx`: `boards` state, `loading`, `error` states
- `TaskList.tsx`: `tasks` state, `statusFilter`, `loading`, `error` states

This is a small app with no complex state flows. Adding Redux, Zustand, or similar would be overengineering explicitly cautioned against by the PDF.

### Error/Edge State Handling (R25)

| State | What the user sees |
|-------|-------------------|
| Loading | Loading spinner/text |
| Backend unavailable | "Unable to connect to server. Please ensure the backend is running." |
| Request failure | Error message from API displayed inline |
| Empty board (no tasks) | "No tasks yet. Create your first task." |
| Network error during action | Error message with option to retry |

### Client-Side Validation (R21)

The `CreateTaskForm` component validates before submitting:
- Title must not be empty
- Title must not be whitespace-only
- Shows inline validation message if violated
- Also handles and displays API-returned validation errors

---

## 12. Testing Strategy

### Priority

Testing is **first-class** (PDF: "one of the three things we look at hardest"). The strategy is:

1. **Backend service-layer unit tests** — Required (R27, R28)
2. **Backend integration tests** — Not required, but useful for verifying database constraints
3. **Frontend tests** — Optional (R29), lowest priority

### Backend Test Approach

**Test the service layer** by injecting mock repositories. This satisfies R17's requirement that business rules be testable "without starting a web server."

**Test framework:** pytest

**Mock approach:** Services accept repositories as constructor/function parameters. Tests pass in fake/mock repository implementations that return predetermined data or raise exceptions.

### Required Tests (R27 — Happy Paths)

| Test | Service | What it verifies |
|------|---------|-----------------|
| Create task on existing board | `TaskService` | Returns created task with correct fields, status defaults to TODO |
| Filter tasks by status | `TaskService` | When filtering by `IN_PROGRESS`, only matching tasks are returned |
| Board deletion cascades tasks | `BoardService` | After deleting a board, its tasks are also deleted |

### Required Tests (R28 — Failure Paths)

| Test | Service | What it verifies |
|------|---------|-----------------|
| Empty task title | `TaskService` | Raises `ValidationError` |
| Whitespace-only task title | `TaskService` | Raises `ValidationError` (e.g., `"   "`) |
| Empty board name | `BoardService` | Raises `ValidationError` |
| Task on nonexistent board | `TaskService` | Raises `NotFoundError` |
| Invalid task status | `TaskService` | Raises `ValidationError` (e.g., `"INVALID"`) |
| Update nonexistent task | `TaskService` | Raises `NotFoundError` |
| Delete nonexistent task | `TaskService` | Raises `NotFoundError` |

### Test Execution

```bash
cd backend
pytest -v
```

This command must be in the backend README.

### Frontend Tests (R29 — Optional)

If time permits after all core requirements are complete:

- Test that `BoardList` shows loading spinner during fetch
- Test that `TaskList` shows error message when API fails
- Test that `TaskList` shows "no tasks" message for empty board

**Framework:** Vitest + React Testing Library

**Command:** `cd frontend && npm test`

---

## 13. Documentation Strategy

### Document Locations

| Document | Location | Content |
|----------|----------|---------|
| Root README | `/README.md` | Project overview, tech stack, links to backend/frontend READMEs |
| Backend README | `/backend/README.md` | Prerequisites, setup, run, test commands, API contract, schema, assumptions, trade-offs |
| Frontend README | `/frontend/README.md` | Prerequisites, setup, run, config, test commands (if applicable) |

### Backend README Structure

```markdown
# Task Manager — Backend

## Stack Choice
## Prerequisites
## Setup
## Running the Server
## Running Tests
## API Documentation
## Database Schema
### Tables
### Constraints
### Indexes
### Schema Creation (Alembic)
### Rejected Schema Decision
## Assumptions
## Trade-offs
## Unfinished Work
```

### API Documentation Approach

FastAPI auto-generates OpenAPI/Swagger UI at `/docs`. This satisfies R31's API contract requirement. The backend README will reference this URL and also include a condensed hand-written table of all endpoints for reviewers who prefer reading a README.

### Frontend README Structure

```markdown
# Task Manager — Frontend

## Prerequisites
## Setup
## Configuration
## Running the Dev Server
## Running Tests (if applicable)
## Architecture Notes
```

---

## 14. Assumptions

Each assumption is identified by the ambiguity in the PDF, the decision made, and where it is documented.

| # | Ambiguity | Assumption | Impact | Documented In |
|---|-----------|-----------|--------|---------------|
| A1 | PDF does not specify board name maximum length | Max 255 characters. Reasonable for a name field; prevents abuse. | `VARCHAR(255)` column type | Backend README → Assumptions |
| A2 | PDF does not specify task title maximum length | Max 255 characters. Same reasoning as A1. | `VARCHAR(255)` column type | Backend README → Assumptions |
| A3 | PDF does not specify task description maximum length | Unlimited (`TEXT` type). Descriptions may be multi-paragraph. | `TEXT` column type | Backend README → Assumptions |
| A4 | PDF does not specify whether board names must be unique | Board names are **not** required to be unique. The PDF only says "required, non-empty." Adding uniqueness is a constraint not in the requirements. Two boards may share a name. | No `UNIQUE` constraint on `boards.name` | Backend README → Assumptions |
| A5 | PDF does not specify ID type (integer vs UUID) | UUIDs are used for both boards and tasks. Avoids sequential enumeration, standard for REST APIs. | `UUID` primary keys | Backend README → Assumptions |
| A6 | PDF says "created time" for task display (R20) but does not specify timezone handling | All timestamps stored as `TIMESTAMP WITH TIME ZONE` and serialized as ISO 8601 UTC. Frontend displays in local time. | `TIMESTAMPTZ` columns, ISO 8601 serialization | Backend README → Assumptions |
| A7 | PDF does not specify whether PATCH should support partial updates of title/description | PATCH supports updating `status`, and optionally `title` and `description` in the same request. All fields in the PATCH body are optional; only provided fields are updated. If title is provided, the same non-empty validation applies. | PATCH schema has all-optional fields | Backend README → Assumptions |
| A8 | PDF does not specify ordering of boards or tasks in list endpoints | Boards returned by `created_at` descending (newest first). Tasks returned by `created_at` descending. | `ORDER BY created_at DESC` | Backend README → Assumptions |
| A9 | PDF does not specify whether the status filter is case-sensitive | Status filter is case-insensitive on input but stored as uppercase (`TODO`, `IN_PROGRESS`, `DONE`). API accepts `todo`, `Todo`, etc., and normalizes to uppercase. | Service-layer normalization + validation | Backend README → Assumptions |

---

## 15. Trade-offs

| Decision | Alternative Considered | Why This Choice | Consequence |
|----------|----------------------|-----------------|-------------|
| **PATCH** over PUT (R12) | PUT requires full resource body | Only status updates are required; PATCH allows sending only changed fields | Frontend sends smaller payloads; API accepts partial bodies |
| **422** over 400 for validation | 400 is more traditional | FastAPI/Pydantic default to 422; consistent with framework; semantically correct (syntactically valid JSON, semantically invalid content) | Frontend must handle 422 as the validation error code |
| **VARCHAR + CHECK** for status over Enum type or lookup table | PostgreSQL `ENUM` type, or `statuses` lookup table | VARCHAR+CHECK is simpler to migrate (adding a status doesn't require `ALTER TYPE`), readable in query results, and doesn't require joins | Slightly less type-safe than PG ENUM, but more practical for a small fixed set |
| **UUID** over integer IDs | Auto-incrementing integers are simpler | UUIDs prevent enumeration, are URL-safe, and don't leak creation order | Slightly larger storage; UUIDs in URLs are longer |
| **ON DELETE CASCADE** over RESTRICT | RESTRICT forces manual cleanup | CASCADE is more practical for this app's scale; orphaned tasks would be unreachable through the API | Deleting a board is destructive — tasks are gone. This is acceptable for a single-user app; in production, a confirmation dialog and/or soft deletes would be considered. |
| **Mock-based service tests** over integration tests with real DB | Integration tests with test PostgreSQL | Mock-based tests are faster, don't require a database, and isolate business logic. The PDF explicitly says "test without starting a web server." | Tests don't verify actual SQL queries; database constraint tests would require integration tests (added as a separate optional task) |
| **No state management library** | Redux, Zustand, Jotai | The app has ~3 pieces of state. A library adds bundle size and complexity for no benefit at this scale. | If the app grew significantly, state management might become harder to maintain |
| **Vite** over Create React App or Next.js | CRA (deprecated), Next.js (SSR adds complexity) | Vite is fast, minimal, and creates a pure client-side SPA that stays a separate service. No SSR complexity. | Standard, well-supported choice |

---

## 16. Out-of-Scope Items

The following are **explicitly not expected** per the PDF (Section 10). Do not implement:

- Authentication, login, users, roles, or permissions
- Production hardening — rate limiting, secrets management, audit logging
- CI/CD pipelines, GitHub Actions, automated deployment
- Deployment to any cloud
- Coverage percentage targets
- Designer-grade or pixel-perfect UI, custom branding, animation, CSS effort
- Performance tuning, caching, load testing
- Monitoring, metrics, tracing, structured log aggregation
- Real-time updates, WebSockets, optimistic locking
- Multi-tenancy, internationalization, accessibility audit, mobile app
- Pagination or infinite scroll

---

## 17. Optional Extras

Only after **all R1–R31 are complete, tests pass, and documentation is done:**

| Priority | Extra | Scope | Effort |
|----------|-------|-------|--------|
| 1 | Docker Compose | `docker-compose.yml` with PostgreSQL, backend, frontend services | Low |
| 2 | Edit task title/description | PATCH already supports it if A7 is implemented; just needs frontend UI | Low |
| 3 | Task status counts | Add counts to board list or task list view | Low |
| 4 | Frontend tests | 2-3 tests for loading/error states | Medium |
| 5 | CSV bulk import | New endpoint, row-level validation, duplicate detection | High — **Track B only; skip for Track A** |

---

## 18. Implementation Phases

```mermaid
graph LR
    P1["Phase 1\nProject Setup"] --> P2["Phase 2\nDatabase Layer"]
    P2 --> P3["Phase 3\nBackend Logic"]
    P3 --> P4["Phase 4\nAPI Layer"]
    P4 --> P5["Phase 5\nBackend Tests"]
    P5 --> P6["Phase 6\nFrontend Core"]
    P6 --> P7["Phase 7\nFrontend Features"]
    P7 --> P8["Phase 8\nDocumentation"]
    P8 --> P9["Phase 9\nVerification"]
    P9 --> P10["Phase 10\nOptional Extras"]
```

| Phase | Name | Tasks | Depends On |
|-------|------|-------|------------|
| 1 | Project Setup | TASK-01, TASK-02 | — |
| 2 | Database Layer | TASK-03, TASK-04, TASK-05 | Phase 1 |
| 3 | Backend Logic | TASK-06, TASK-07, TASK-08, TASK-09 | Phase 2 |
| 4 | API Layer | TASK-10, TASK-11, TASK-12 | Phase 3 |
| 5 | Backend Tests | TASK-13 | Phase 3 |
| 6 | Frontend Core | TASK-14, TASK-15 | Phase 1 |
| 7 | Frontend Features | TASK-16, TASK-17 | Phase 4, Phase 6 |
| 8 | Documentation | TASK-18 | Phase 5, Phase 7 |
| 9 | Verification | TASK-19 | Phase 8 |
| 10 | Optional Extras | TASK-20, TASK-21, TASK-22 | Phase 9 |

---

## 19. Detailed Implementation Tasks

---

### TASK-01: Repository Initialization and Root README

**Objective:** Create the monorepo structure with the two top-level service directories and a root README.

**Dependencies:** None

**Files to create:**
- `README.md`
- `backend/` (empty directory with placeholder)
- `frontend/` (empty directory with placeholder)
- `.gitignore`

**Implementation requirements:**
- Root `README.md` with project title, one-paragraph description, links to `backend/README.md` and `frontend/README.md`, and tech stack summary
- `.gitignore` covering Python (`__pycache__`, `*.pyc`, `.venv`, `.env`), Node (`node_modules`, `dist`), IDE files, and OS files
- Do NOT create any application code yet

**Constraints:**
- Root README must not contain setup instructions — those belong in service READMEs
- Repository structure must match Section 6

**Tests:** None

**Acceptance criteria:**
- Repository has `backend/`, `frontend/`, `README.md`, `.gitignore`
- Root README links to both service READMEs
- `.gitignore` is comprehensive for Python + Node

**Suggested model:** LOW  
**Recommended model:** CHEAP

---

### TASK-02: Backend Project Initialization

**Objective:** Initialize the Python backend project with FastAPI, dependencies, configuration, and project structure.

**Dependencies:** TASK-01

**Files to create:**
- `backend/requirements.txt`
- `backend/.env.example`
- `backend/app/__init__.py`
- `backend/app/main.py` (minimal FastAPI app with health endpoint)
- `backend/app/config.py` (settings via pydantic-settings or os.environ)
- `backend/app/database.py` (SQLAlchemy engine + session factory)
- `backend/app/models/__init__.py`
- `backend/app/schemas/__init__.py`
- `backend/app/repositories/__init__.py`
- `backend/app/services/__init__.py`
- `backend/app/routers/__init__.py`
- `backend/app/exceptions.py` (empty, placeholder)
- `backend/tests/__init__.py`
- `backend/tests/conftest.py` (empty, placeholder)

**Implementation requirements:**
- `requirements.txt` must include: `fastapi`, `uvicorn[standard]`, `sqlalchemy[asyncio]`, `psycopg2-binary` (or `asyncpg`), `alembic`, `pydantic-settings`, `pytest`
- `config.py`: Read `DATABASE_URL` and `CORS_ORIGINS` from environment variables, with sensible defaults
- `database.py`: Create SQLAlchemy engine from `DATABASE_URL`, create `SessionLocal` factory, create `get_db` dependency
- `main.py`: Create FastAPI app instance, add a `GET /health` endpoint returning `{"status": "ok"}`, placeholder for router registration
- `.env.example`: Template with `DATABASE_URL=postgresql://postgres:postgres@localhost:5432/taskmanager` and `CORS_ORIGINS=http://localhost:5173`

**Constraints:**
- Use synchronous SQLAlchemy (simpler, sufficient for this scale)
- Do NOT add CORS middleware yet (TASK-12)
- Do NOT add routers yet
- Verify the app starts with `uvicorn app.main:app --reload`

**Tests:** None yet

**Acceptance criteria:**
- `cd backend && pip install -r requirements.txt` succeeds
- `uvicorn app.main:app` starts without error
- `GET /health` returns `{"status": "ok"}`
- `config.py` reads `DATABASE_URL` from environment

**Suggested model:** LOW  
**Recommended model:** CHEAP

---

### TASK-03: Database Models (Board and Task)

**Objective:** Define the SQLAlchemy ORM models for the `boards` and `tasks` tables with all constraints from R1–R4.

**Dependencies:** TASK-02

**Files to create:**
- `backend/app/models/board.py`
- `backend/app/models/task.py`

**Files to modify:**
- `backend/app/models/__init__.py` (import models)

**Implementation requirements:**

**Board model (`models/board.py`):**
- Table name: `boards`
- Columns per Section 7.1: `id` (UUID, PK, server_default=`gen_random_uuid()`), `name` (VARCHAR(255), NOT NULL), `created_at` (TIMESTAMP WITH TIME ZONE, NOT NULL, server_default=`now()`)
- CHECK constraint: `TRIM(name) <> ''`
- Relationship: `tasks` (one-to-many, cascade delete)

**Task model (`models/task.py`):**
- Table name: `tasks`
- Columns per Section 7.2: `id` (UUID, PK), `board_id` (UUID, FK → boards.id, ON DELETE CASCADE, NOT NULL), `title` (VARCHAR(255), NOT NULL), `description` (TEXT, nullable), `status` (VARCHAR(20), NOT NULL, default='TODO'), `created_at` (TIMESTAMPTZ, NOT NULL), `updated_at` (TIMESTAMPTZ, NOT NULL)
- CHECK constraint on title: `TRIM(title) <> ''`
- CHECK constraint on status: `status IN ('TODO', 'IN_PROGRESS', 'DONE')`
- Index: composite index on `(board_id, status)`
- Relationship: `board` (many-to-one, back_populates)

**Constraints:**
- Use `sqlalchemy.dialects.postgresql.UUID` for UUID type
- Use `sqlalchemy.CheckConstraint` for CHECK constraints
- Foreign key must specify `ondelete="CASCADE"`
- `updated_at` must have `onupdate=func.now()` or equivalent

**Tests:** None at this stage (models are tested through services)

**Acceptance criteria:**
- Both models import without error
- Foreign key references `boards.id` with `ON DELETE CASCADE`
- CHECK constraints are defined on `name`, `title`, and `status`
- Composite index exists on `(board_id, status)`

**Suggested model:** MEDIUM  
**Recommended model:** CHEAP

---

### TASK-04: Alembic Migration Setup

**Objective:** Initialize Alembic and generate the initial migration that creates the `boards` and `tasks` tables.

**Dependencies:** TASK-03

**Files to create:**
- `backend/alembic.ini`
- `backend/alembic/env.py`
- `backend/alembic/script.py.mako`
- `backend/alembic/versions/` (directory)
- `backend/alembic/versions/001_initial_schema.py` (auto-generated)

**Implementation requirements:**
1. Run `alembic init alembic` inside `backend/`
2. Modify `alembic.ini` to read `sqlalchemy.url` from environment (or configure `env.py` to use `app.config`)
3. Modify `alembic/env.py` to:
   - Import `Base` from `app.models` (which imports all models)
   - Set `target_metadata = Base.metadata`
   - Read `DATABASE_URL` from `app.config` or environment
4. Generate migration: `alembic revision --autogenerate -m "initial schema"`
5. Review generated migration — verify it includes:
   - `CREATE TABLE boards` with all columns and constraints
   - `CREATE TABLE tasks` with all columns, constraints, and foreign key
   - Composite index on `(board_id, status)`
6. Apply migration: `alembic upgrade head`
7. Verify tables exist in PostgreSQL

**Constraints:**
- Migration must be reviewable — auto-generated is fine but must be inspected
- `alembic.ini` must NOT contain hardcoded database credentials
- The migration must create both tables and all constraints in a single migration file

**Tests:** None

**Acceptance criteria:**
- `alembic upgrade head` creates both tables from an empty database
- `alembic downgrade base` drops both tables
- Tables have correct columns, types, constraints, and foreign key as verified by `\d boards` and `\d tasks` in psql
- `INSERT INTO tasks (id, board_id, title, status) VALUES (gen_random_uuid(), gen_random_uuid(), 'test', 'TODO')` fails with foreign key violation

**Suggested model:** MEDIUM  
**Recommended model:** CHEAP

---

### TASK-05: Pydantic Schemas (Request/Response)

**Objective:** Define all Pydantic schemas for API request bodies and response bodies, plus the error schema.

**Dependencies:** TASK-02

**Files to create:**
- `backend/app/schemas/board.py`
- `backend/app/schemas/task.py`
- `backend/app/schemas/error.py`

**Files to modify:**
- `backend/app/schemas/__init__.py`

**Implementation requirements:**

**Board schemas (`schemas/board.py`):**
- `BoardCreate`: `name: str` (required)
- `BoardResponse`: `id: UUID`, `name: str`, `created_at: datetime` — with `model_config = ConfigDict(from_attributes=True)`

**Task schemas (`schemas/task.py`):**
- `TaskStatus`: Python `enum.Enum` with values `TODO`, `IN_PROGRESS`, `DONE` — used for validation
- `TaskCreate`: `title: str` (required), `description: Optional[str] = None`
- `TaskUpdate`: `status: Optional[TaskStatus] = None`, `title: Optional[str] = None`, `description: Optional[str] = None` — all optional for PATCH semantics
- `TaskResponse`: `id: UUID`, `board_id: UUID`, `title: str`, `description: Optional[str]`, `status: str`, `created_at: datetime`, `updated_at: datetime` — with `from_attributes=True`

**Error schema (`schemas/error.py`):**
- `ErrorResponse`: `error: str`, `message: str`, `field: Optional[str] = None`

**Constraints:**
- Pydantic schemas must use v2 syntax (`model_config = ConfigDict(...)`)
- `TaskStatus` enum values must be uppercase strings matching database CHECK constraint
- `TaskUpdate` must allow all fields to be `None` (PATCH semantics) but at least one field must be provided (validate in service layer)
- Do NOT put validation logic (e.g., whitespace check) in schemas — that belongs in services

**Tests:** None (schemas are validated through service tests)

**Acceptance criteria:**
- All schemas import without error
- `BoardCreate(name="test")` succeeds
- `TaskCreate(title="test")` succeeds, `description` defaults to `None`
- `TaskUpdate(status="TODO")` succeeds
- `ErrorResponse(error="NOT_FOUND", message="Board not found")` succeeds
- `TaskStatus` enum has exactly three values

**Suggested model:** LOW  
**Recommended model:** CHEAP

---

### TASK-06: Repository Layer (Board and Task)

**Objective:** Implement the data access layer with CRUD operations for boards and tasks.

**Dependencies:** TASK-03, TASK-05

**Files to create:**
- `backend/app/repositories/board_repository.py`
- `backend/app/repositories/task_repository.py`

**Files to modify:**
- `backend/app/repositories/__init__.py`

**Implementation requirements:**

**BoardRepository (`repositories/board_repository.py`):**
- `get_all(db: Session) -> List[Board]` — returns all boards, ordered by `created_at` desc
- `get_by_id(db: Session, board_id: UUID) -> Optional[Board]` — returns board or None
- `create(db: Session, name: str) -> Board` — creates and returns board
- `delete(db: Session, board_id: UUID) -> bool` — deletes board, returns True if found, False if not

**TaskRepository (`repositories/task_repository.py`):**
- `get_by_board_id(db: Session, board_id: UUID, status: Optional[str] = None) -> List[Task]` — returns tasks for board, optionally filtered by status, ordered by `created_at` desc
- `get_by_id(db: Session, task_id: UUID) -> Optional[Task]` — returns task or None
- `create(db: Session, board_id: UUID, title: str, description: Optional[str] = None) -> Task` — creates and returns task
- `update(db: Session, task: Task, **fields) -> Task` — updates provided fields, sets `updated_at`, returns task
- `delete(db: Session, task_id: UUID) -> bool` — deletes task, returns True if found, False if not

**Constraints:**
- Repositories accept `Session` as first parameter (injected by dependency)
- Repositories contain NO validation logic — only database operations
- Repositories return ORM model instances or `None`/`bool`
- Use SQLAlchemy 2.0 query syntax (`select()`, `session.execute()`)

**Tests:** Repositories are tested indirectly through service tests

**Acceptance criteria:**
- All repository methods handle the happy path
- `get_by_id` returns `None` for nonexistent IDs
- `delete` returns `False` for nonexistent IDs
- `get_by_board_id` supports optional `status` filter
- No validation or business logic in repository code

**Suggested model:** MEDIUM  
**Recommended model:** CHEAP

---

### TASK-07: Custom Exceptions

**Objective:** Define custom exception classes for domain errors.

**Dependencies:** TASK-02

**Files to modify:**
- `backend/app/exceptions.py`

**Implementation requirements:**

```
class NotFoundError(Exception):
    def __init__(self, message: str):
        self.message = message

class ValidationError(Exception):
    def __init__(self, message: str, field: str | None = None):
        self.message = message
        self.field = field
```

**Constraints:**
- Keep exception classes simple — just data carriers
- Do NOT reference HTTP concepts (status codes) in these exceptions
- These are domain exceptions, not HTTP exceptions

**Tests:** None (tested through service tests)

**Acceptance criteria:**
- `NotFoundError("Board not found")` creates exception with `.message`
- `ValidationError("Title must not be empty", field="title")` creates exception with `.message` and `.field`

**Suggested model:** LOW  
**Recommended model:** CHEAP

---

### TASK-08: Service Layer (Board)

**Objective:** Implement board business logic with validation, using repository for data access.

**Dependencies:** TASK-06, TASK-07

**Files to create:**
- `backend/app/services/board_service.py`

**Files to modify:**
- `backend/app/services/__init__.py`

**Implementation requirements:**

**BoardService (`services/board_service.py`):**
- `get_all_boards(db: Session) -> List[Board]`
  - Delegates to `BoardRepository.get_all()`
- `get_board_by_id(db: Session, board_id: UUID) -> Board`
  - Calls `BoardRepository.get_by_id()`
  - If `None`, raises `NotFoundError("Board not found")`
- `create_board(db: Session, name: str) -> Board`
  - Validates: `name` is not None, not empty, not whitespace-only (`name.strip() == ""`)
  - If invalid, raises `ValidationError("Name must not be empty", field="name")`
  - Delegates to `BoardRepository.create()`
- `delete_board(db: Session, board_id: UUID) -> None`
  - Calls `BoardRepository.get_by_id()` to verify existence
  - If `None`, raises `NotFoundError("Board not found")`
  - Calls `BoardRepository.delete()` — cascade handles tasks at DB level

**Constraints:**
- Service methods accept `Session` and primitive values — NOT Pydantic schemas
- Business validation (empty/whitespace name) happens HERE, not in router or schema
- Service does NOT know about HTTP, status codes, or JSON
- Functions are designed to be testable with mock repositories

**Tests:** See TASK-13

**Acceptance criteria:**
- `create_board` with valid name returns board
- `create_board` with empty name raises `ValidationError`
- `create_board` with whitespace-only name raises `ValidationError`
- `delete_board` on nonexistent board raises `NotFoundError`
- `delete_board` succeeds and cascade is handled by database

**Suggested model:** MEDIUM  
**Recommended model:** CHEAP

---

### TASK-09: Service Layer (Task)

**Objective:** Implement task business logic with validation, using repository for data access.

**Dependencies:** TASK-06, TASK-07, TASK-08

**Files to create:**
- `backend/app/services/task_service.py`

**Files to modify:**
- `backend/app/services/__init__.py`

**Implementation requirements:**

**TaskService (`services/task_service.py`):**
- `get_tasks_by_board(db: Session, board_id: UUID, status: Optional[str] = None) -> List[Task]`
  - First verify board exists via `BoardRepository.get_by_id()` — raise `NotFoundError` if not
  - If `status` is provided, normalize to uppercase and validate against allowed values
  - If invalid status filter, raise `ValidationError("Status must be one of: TODO, IN_PROGRESS, DONE", field="status")`
  - Delegate to `TaskRepository.get_by_board_id()`
- `create_task(db: Session, board_id: UUID, title: str, description: Optional[str] = None) -> Task`
  - Verify board exists — raise `NotFoundError` if not
  - Validate title: not None, not empty, not whitespace-only — raise `ValidationError` if invalid
  - Delegate to `TaskRepository.create()`
- `update_task(db: Session, task_id: UUID, status: Optional[str] = None, title: Optional[str] = None, description: Optional[str] = None) -> Task`
  - Verify task exists — raise `NotFoundError` if not
  - If `status` provided: normalize to uppercase, validate against allowed values
  - If `title` provided: validate not empty, not whitespace-only
  - Delegate to `TaskRepository.update()`
- `delete_task(db: Session, task_id: UUID) -> None`
  - Call `TaskRepository.delete()` — returns False if not found
  - If not found, raise `NotFoundError("Task not found")`

**Constraints:**
- VALID_STATUSES = {"TODO", "IN_PROGRESS", "DONE"} — defined as a constant
- Status normalization: `status.strip().upper()`
- Whitespace check: `title.strip() == ""`
- Service NEVER references HTTP concepts

**Tests:** See TASK-13

**Acceptance criteria:**
- `create_task` with valid inputs returns task with status `TODO`
- `create_task` with empty title raises `ValidationError`
- `create_task` with whitespace-only title raises `ValidationError`
- `create_task` on nonexistent board raises `NotFoundError`
- `update_task` with invalid status raises `ValidationError`
- `update_task` on nonexistent task raises `NotFoundError`
- `delete_task` on nonexistent task raises `NotFoundError`
- `get_tasks_by_board` on nonexistent board raises `NotFoundError`
- `get_tasks_by_board` with status filter returns only matching tasks

**Suggested model:** MEDIUM  
**Recommended model:** CHEAP

---

### TASK-10: Error Handling and Exception Handlers

**Objective:** Register global exception handlers in FastAPI that convert domain exceptions to the consistent error JSON shape (R16).

**Dependencies:** TASK-07, TASK-05

**Files to modify:**
- `backend/app/main.py`

**Implementation requirements:**

Register exception handlers in `main.py`:

1. **`NotFoundError` → 404**
   ```python
   @app.exception_handler(NotFoundError)
   async def not_found_handler(request, exc):
       return JSONResponse(status_code=404, content={
           "error": "NOT_FOUND",
           "message": exc.message,
           "field": None
       })
   ```

2. **`ValidationError` → 422**
   ```python
   @app.exception_handler(ValidationError)
   async def validation_handler(request, exc):
       return JSONResponse(status_code=422, content={
           "error": "VALIDATION_ERROR",
           "message": exc.message,
           "field": exc.field
       })
   ```

3. **`RequestValidationError` (Pydantic) → 422**
   Override FastAPI's default handler to return the same error shape.

4. **Unhandled exceptions → 500**
   ```python
   @app.exception_handler(Exception)
   async def internal_error_handler(request, exc):
       return JSONResponse(status_code=500, content={
           "error": "INTERNAL_ERROR",
           "message": "An unexpected error occurred",
           "field": None
       })
   ```

**Constraints:**
- ALL error responses must use the same `{"error", "message", "field"}` shape
- Do NOT log sensitive information in error messages
- The 500 handler must NOT expose exception details to the client

**Tests:** Error handlers are tested implicitly through service tests raising exceptions

**Acceptance criteria:**
- `NotFoundError` → `404` with consistent JSON body
- `ValidationError` → `422` with consistent JSON body including `field`
- Pydantic `RequestValidationError` → `422` with consistent JSON body
- Unhandled exception → `500` with generic message
- No error response deviates from the defined schema

**Suggested model:** MEDIUM  
**Recommended model:** CHEAP

---

### TASK-11: API Routers (Board and Task Endpoints)

**Objective:** Implement all REST endpoints as defined in R8–R14, delegating to services.

**Dependencies:** TASK-08, TASK-09, TASK-10, TASK-05

**Files to create:**
- `backend/app/routers/board_router.py`
- `backend/app/routers/task_router.py`

**Files to modify:**
- `backend/app/main.py` (register routers)

**Implementation requirements:**

**Board router (`routers/board_router.py`):**
- `GET /api/boards` → calls `BoardService.get_all_boards()`, returns `List[BoardResponse]`, status 200
- `POST /api/boards` → accepts `BoardCreate` body, calls `BoardService.create_board()`, returns `BoardResponse`, status 201
- `DELETE /api/boards/{board_id}` → calls `BoardService.delete_board()`, returns status 204 (no body)

**Task router (`routers/task_router.py`):**
- `GET /api/boards/{board_id}/tasks` → accepts optional `?status=` query param, calls `TaskService.get_tasks_by_board()`, returns `List[TaskResponse]`, status 200
- `POST /api/boards/{board_id}/tasks` → accepts `TaskCreate` body, calls `TaskService.create_task()`, returns `TaskResponse`, status 201
- `PATCH /api/tasks/{task_id}` → accepts `TaskUpdate` body, calls `TaskService.update_task()`, returns `TaskResponse`, status 200
- `DELETE /api/tasks/{task_id}` → calls `TaskService.delete_task()`, returns status 204 (no body)

**Constraints:**
- Routers contain ZERO business logic — they serialize/deserialize and delegate
- Use `response_model` parameter on route decorators for auto-documentation
- Use `status_code` parameter to set correct response codes
- Use `Response(status_code=204)` for DELETE endpoints (no response body)
- `board_id` and `task_id` path parameters should be typed as `UUID`
- Register routers in `main.py` with `app.include_router()`

**Tests:** Routers are tested indirectly through manual verification and service tests

**Acceptance criteria:**
- All 7 endpoints respond with correct status codes per R15
- Validation errors return 422 with consistent error body
- Not-found errors return 404 with consistent error body
- `POST` endpoints return 201
- `DELETE` endpoints return 204 with no body
- FastAPI auto-generated docs at `/docs` show all endpoints with correct schemas

**Suggested model:** MEDIUM  
**Recommended model:** CHEAP

---

### TASK-12: CORS Configuration

**Objective:** Configure CORS to allow the frontend development server to make cross-origin requests (R18).

**Dependencies:** TASK-02

**Files to modify:**
- `backend/app/main.py`

**Implementation requirements:**

Add FastAPI CORS middleware:

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,  # from config.py
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

Where `settings.cors_origins` reads from the `CORS_ORIGINS` environment variable, defaulting to `["http://localhost:5173"]` (Vite's default dev server port).

**Constraints:**
- CORS origins must be configurable, not hardcoded
- Default must match Vite's default dev server URL
- Do NOT use `allow_origins=["*"]` in the documented setup — be explicit about the frontend origin

**Tests:** Verification: make a request from the frontend and check for CORS headers in the response

**Acceptance criteria:**
- `OPTIONS` preflight request from `http://localhost:5173` returns appropriate CORS headers
- Frontend can successfully make API calls to backend without CORS errors
- CORS origin is configurable via environment variable

**Suggested model:** LOW  
**Recommended model:** CHEAP

---

### TASK-13: Backend Unit Tests

**Objective:** Implement all required unit tests for R27 (happy paths) and R28 (failure paths). This is a FIRST-CLASS requirement.

**Dependencies:** TASK-08, TASK-09

**Files to create:**
- `backend/tests/conftest.py` (test fixtures)
- `backend/tests/test_board_service.py`
- `backend/tests/test_task_service.py`

**Implementation requirements:**

**Test setup (`conftest.py`):**
- Create mock/fake repository classes that store data in-memory (dict/list)
- Create fixtures that provide fresh service instances with mock repositories
- No database connection required — tests run without PostgreSQL

**Option A (recommended): Use an in-memory SQLite database for testing**
- Create a test database fixture using SQLAlchemy with `sqlite:///:memory:`
- This tests the actual repository + service integration without needing PostgreSQL
- Note: SQLite doesn't enforce CHECK constraints the same way — some tests may need to test at the service level

**Option B: Pure mock repositories**
- Create `FakeBoardRepository` and `FakeTaskRepository` that implement the same interface but store data in Python dicts
- Services are tested with these fakes — purely tests business logic

> **Recommendation: Use Option A for most tests (integration with SQLite), but test whitespace validation and other business rules at the service level with mocks.** This approach tests the most code without requiring a running PostgreSQL instance.

**Required tests — `test_board_service.py`:**

| Test Name | Requirement | Type |
|-----------|-------------|------|
| `test_create_board_success` | R27 | Happy |
| `test_create_board_empty_name` | R28 | Failure |
| `test_create_board_whitespace_name` | R28 | Failure |
| `test_delete_board_cascades_tasks` | R27 | Happy |
| `test_delete_board_not_found` | R28 | Failure |
| `test_get_all_boards` | R27 | Happy |

**Required tests — `test_task_service.py`:**

| Test Name | Requirement | Type |
|-----------|-------------|------|
| `test_create_task_success` | R27 | Happy |
| `test_create_task_default_status_todo` | R27 | Happy |
| `test_create_task_empty_title` | R28 | Failure |
| `test_create_task_whitespace_title` | R28 | Failure |
| `test_create_task_nonexistent_board` | R28 | Failure |
| `test_filter_tasks_by_status` | R27 | Happy |
| `test_update_task_status` | R27 | Happy |
| `test_update_task_invalid_status` | R28 | Failure |
| `test_update_task_not_found` | R28 | Failure |
| `test_delete_task_success` | R27 | Happy |
| `test_delete_task_not_found` | R28 | Failure |

**Constraints:**
- Tests must run with `pytest -v` and NO running web server
- Tests must NOT require a running PostgreSQL instance
- Every test must assert something meaningful — not just "no exception thrown"
- Failure path tests must assert the specific exception type AND message content
- Do NOT write tests merely for coverage — each test must catch a real regression

**Tests:** This IS the test task

**Acceptance criteria:**
- `cd backend && pytest -v` passes with all tests green
- Happy paths: R27 minimum coverage met (create task, filter by status, cascade delete)
- Failure paths: R28 minimum coverage met (all 7 specified failure cases)
- No test requires a web server or PostgreSQL to run
- Whitespace-only title test exists (commonly forgotten)

**Suggested model:** HIGH  
**Recommended model:** MEDIUM

---

### TASK-14: Frontend Project Initialization

**Objective:** Initialize the React + TypeScript frontend project with Vite.

**Dependencies:** TASK-01

**Files to create:**
- `frontend/` directory with Vite + React + TypeScript template
- `frontend/.env.example`

**Implementation requirements:**
1. Initialize Vite project: `npm create vite@latest ./ -- --template react-ts` (inside `frontend/`)
2. Install dependencies: `npm install`
3. Create `.env.example` with `VITE_API_BASE_URL=http://localhost:8000`
4. Create `.env` (gitignored) with same content
5. Verify `npm run dev` starts the dev server on port 5173
6. Clean up default Vite template content (remove logo, counter, etc.)
7. Set up minimal `App.css` with clean, readable styling (nothing fancy — per PDF: "unstyled is fine")

**Constraints:**
- TypeScript is required
- Do NOT install additional dependencies beyond what Vite provides
- Do NOT install a CSS framework, component library, or state management library
- `VITE_API_BASE_URL` must be the only configuration point for the backend URL

**Tests:** None

**Acceptance criteria:**
- `cd frontend && npm install && npm run dev` starts dev server
- Browser loads the app at `http://localhost:5173`
- `.env.example` documents `VITE_API_BASE_URL`
- No default Vite template content remains

**Suggested model:** LOW  
**Recommended model:** CHEAP

---

### TASK-15: Frontend Types and API Client

**Objective:** Create TypeScript types matching the API contract and a centralized API client.

**Dependencies:** TASK-14, TASK-05 (for schema reference)

**Files to create:**
- `frontend/src/types/index.ts`
- `frontend/src/api/client.ts`

**Implementation requirements:**

**Types (`types/index.ts`):**
```typescript
export type TaskStatus = "TODO" | "IN_PROGRESS" | "DONE";

export interface Board {
  id: string;
  name: string;
  created_at: string;
}

export interface Task {
  id: string;
  board_id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  created_at: string;
  updated_at: string;
}

export interface ErrorResponse {
  error: string;
  message: string;
  field: string | null;
}
```

**API client (`api/client.ts`):**
- Read base URL from `import.meta.env.VITE_API_BASE_URL` with fallback to `http://localhost:8000`
- Export functions:
  - `getBoards(): Promise<Board[]>`
  - `createBoard(name: string): Promise<Board>`
  - `deleteBoard(boardId: string): Promise<void>`
  - `getTasks(boardId: string, status?: TaskStatus): Promise<Task[]>`
  - `createTask(boardId: string, title: string, description?: string): Promise<Task>`
  - `updateTask(taskId: string, updates: { status?: TaskStatus; title?: string; description?: string }): Promise<Task>`
  - `deleteTask(taskId: string): Promise<void>`
- Each function uses `fetch()` — no axios dependency
- Each function checks `response.ok`; if false, parses error body as `ErrorResponse` and throws a custom `ApiError` class
- Define `ApiError` class that holds the `ErrorResponse` data

**Constraints:**
- Base URL is read ONCE from environment, not scattered across functions
- All fetch calls go through a shared helper (e.g., `apiRequest()`) to avoid duplication
- No additional HTTP libraries — `fetch()` is sufficient
- Error handling must be consistent — every function propagates structured errors

**Tests:** None (tested through component usage)

**Acceptance criteria:**
- All functions are typed correctly
- Base URL is configurable via `VITE_API_BASE_URL`
- Network errors and API errors are both handled
- `ApiError` class preserves the error response fields

**Suggested model:** MEDIUM  
**Recommended model:** CHEAP

---

### TASK-16: Frontend Components (Board Management)

**Objective:** Build the board list view, board selection, and board creation components.

**Dependencies:** TASK-15

**Files to create:**
- `frontend/src/components/BoardList.tsx`
- `frontend/src/components/ErrorMessage.tsx`
- `frontend/src/components/LoadingSpinner.tsx`

**Files to modify:**
- `frontend/src/App.tsx`

**Implementation requirements:**

**`App.tsx`:**
- Manages `selectedBoardId: string | null` state
- Renders `BoardList` on the left/top, and task view area when a board is selected
- Simple two-panel layout (sidebar + main area, or stacked — doesn't matter, just readable)

**`BoardList.tsx`:**
- Fetches boards from API on mount (`useEffect` + `getBoards()`)
- Displays loading state while fetching (R25)
- Displays error state if fetch fails (R25)
- Displays "No boards yet" if list is empty (R25)
- Shows list of board names, each clickable to select
- Highlights currently selected board
- Includes a "Create Board" form (inline or modal — simple is fine):
  - Text input for name
  - Submit button
  - Client-side validation: name must not be empty/whitespace
  - Handles API validation errors
  - After creation, refreshes board list and selects new board

**`ErrorMessage.tsx`:**
- Reusable component: accepts `message: string` prop
- Displays error message in a visible, non-alarming way

**`LoadingSpinner.tsx`:**
- Simple loading indicator (text "Loading..." is fine — PDF says no CSS effort needed)

**Constraints:**
- Use `useState` and `useEffect` — no external state management
- Handle API errors gracefully — never crash, never blank screen
- Board creation must validate client-side AND handle server errors
- Keep styling minimal — readable is sufficient

**Tests:** None (optional per R29)

**Acceptance criteria:**
- Board list loads and displays boards
- Can create a new board
- Can select a board
- Loading state shows during fetch
- Error state shows if backend is unavailable
- Empty state shows if no boards exist
- No blank screens, no crashes, no uncaught errors

**Suggested model:** MEDIUM  
**Recommended model:** CHEAP

---

### TASK-17: Frontend Components (Task Management)

**Objective:** Build the task list, task creation, status change, status filter, and task deletion components.

**Dependencies:** TASK-16

**Files to create:**
- `frontend/src/components/TaskList.tsx`
- `frontend/src/components/TaskCard.tsx`
- `frontend/src/components/CreateTaskForm.tsx`
- `frontend/src/components/StatusFilter.tsx`

**Files to modify:**
- `frontend/src/App.tsx` (render task components when board selected)

**Implementation requirements:**

**`TaskList.tsx`:**
- Receives `boardId: string` prop
- Fetches tasks from API when `boardId` changes
- Manages `statusFilter: TaskStatus | null` state (null = show all)
- Re-fetches when status filter changes (pass `status` query param to API)
- Displays loading state (R25)
- Displays error state (R25)
- Displays "No tasks yet. Create your first task." for empty board (R25)
- Renders `StatusFilter` and `CreateTaskForm` above task list
- Renders list of `TaskCard` components

**`TaskCard.tsx`:**
- Displays: title, description (if present), status, created time (formatted readably)
- Status dropdown (`<select>`) with TODO, IN_PROGRESS, DONE options (R22)
  - On change: calls `updateTask()`, updates local state without full page reload
  - Shows loading state during update
  - Shows error if update fails
- Delete button (R23)
  - Confirms deletion (optional — simple `window.confirm` is fine)
  - Calls `deleteTask()`, removes from list without full page reload
  - Shows error if delete fails

**`CreateTaskForm.tsx`:**
- Form with title (required) and description (optional) inputs
- Client-side validation (R21): title must not be empty or whitespace-only
- Shows inline validation error
- On submit: calls `createTask()`, clears form, refreshes task list
- Handles and displays API validation errors (R21)
- Shows loading state during submission

**`StatusFilter.tsx`:**
- Buttons or dropdown: "All", "TODO", "IN_PROGRESS", "DONE" (R24)
- Clicking sets the filter; active filter is visually indicated
- Triggers parent to re-fetch with the selected status

**Constraints:**
- Status change must update WITHOUT full page reload (R22)
- All API errors must be caught and displayed — never ignored
- Client-side validation must happen BEFORE API call (R21)
- Backend unavailability must show error message, not blank screen (R25)
- Keep styling minimal — readable layout per R20

**Tests:** None (optional per R29)

**Acceptance criteria:**
- Tasks display with title, description, status, created time (R20)
- Can create a task with validation (R21)
- Can change task status via dropdown without page reload (R22)
- Can delete a task (R23)
- Can filter tasks by status (R24)
- Loading, error, backend-down, and empty states all handled (R25)
- All API calls go through the centralized client (R26)

**Suggested model:** MEDIUM  
**Recommended model:** MEDIUM

---

### TASK-18: Documentation

**Objective:** Write all three READMEs covering every item in R31. This is a FIRST-CLASS requirement.

**Dependencies:** TASK-13, TASK-17

**Files to create:**
- `backend/README.md`
- `frontend/README.md`

**Files to modify:**
- `README.md` (root — update with final content)

**Implementation requirements:**

**Root `README.md`:**
- Project title and one-paragraph description
- Tech stack overview
- Link to `backend/README.md` and `frontend/README.md`
- Brief architecture diagram (text-based is fine)

**`backend/README.md` must cover:**

1. **Stack Choice and Why** — Python + FastAPI + PostgreSQL, 2-3 sentences (R31 item 7)
2. **Prerequisites** — Python 3.11+, PostgreSQL 15+, pip (R31 item 1)
3. **Setup Instructions** — Clone, create virtualenv, install deps, copy `.env`, create database (R31 item 2)
4. **Database Setup** — How to create the database, `alembic upgrade head` (R31 item 3, R6)
5. **Running the Server** — `uvicorn app.main:app --reload`, URL and port (R31 item 2)
6. **Running Tests** — `pytest -v` (R31 item 4, R30)
7. **API Documentation** — Either reference `/docs` (Swagger UI) or include hand-written table of all endpoints with method, path, params, example request, example success response, example error response (R31 item 5)
8. **Database Schema** — Tables, columns, types, keys, constraints, indexes with reasons (R31 item 6, R5)
9. **Rejected Schema Decision** — The status lookup table reasoning (R31 item 8, R7)
10. **Assumptions** — All items from Section 14 (R31 item 9)
11. **Trade-offs** — Key decisions from Section 15 (R31 item 10)
12. **Unfinished Work** — Honest list of anything not completed (R31 item 10)

**`frontend/README.md` must cover:**

1. **Prerequisites** — Node.js 18+, npm
2. **Setup Instructions** — `npm install`, copy `.env`
3. **Configuration** — `VITE_API_BASE_URL` explained
4. **Running the Dev Server** — `npm run dev`, URL and port
5. **Architecture** — Brief explanation of component structure and API client

**Constraints:**
- Documentation must be HONEST — do not claim something works if it doesn't
- README must be followable from a clean clone — no undocumented steps
- API documentation must include at least one error example per endpoint
- "A README that says 'all tests pass' when two fail costs you considerably more than an honest note saying 'filtering is not implemented'"

**Tests:** None

**Acceptance criteria:**
- All 10 items from R31 are covered between the three READMEs
- Setup instructions work from a clean clone
- Test command is documented and works
- API contract is fully documented
- Schema is fully documented with reasons for indexes
- Assumptions are explicit
- Trade-offs are stated
- Unfinished work is honestly noted

**Suggested model:** MEDIUM  
**Recommended model:** MEDIUM

---

### TASK-19: Final Verification and Self-Checks

**Objective:** Execute the two mandatory self-checks and the final submission checklist.

**Dependencies:** TASK-18

**Files to create:** None (verification only)

**Implementation requirements:**

Execute the following verification procedure:

**1. Clean clone test:**
```bash
# Simulate a clean clone
git clone <repo> /tmp/test-clone
cd /tmp/test-clone/backend
pip install -r requirements.txt
cp .env.example .env  # edit DATABASE_URL if needed
alembic upgrade head
uvicorn app.main:app &

cd /tmp/test-clone/frontend
npm install
cp .env.example .env
npm run dev &
```

**2. Self-check 1 (backend independent):**
```bash
# Stop frontend (Ctrl+C the npm process)
curl http://localhost:8000/api/boards
# Must return JSON (e.g., [])
```

**3. Self-check 2 (frontend independent):**
```bash
# Stop backend (Ctrl+C the uvicorn process)
# Open http://localhost:5173 in browser
# Must show error state, NOT blank screen, NOT crash
```

**4. Data persistence:**
```bash
# Start backend
curl -X POST http://localhost:8000/api/boards -H "Content-Type: application/json" -d '{"name":"Test Board"}'
# Stop backend
# Start backend again
curl http://localhost:8000/api/boards
# Must return the board created earlier
```

**5. Database constraint check:**
```sql
-- In psql
INSERT INTO tasks (id, board_id, title, status)
VALUES (gen_random_uuid(), gen_random_uuid(), 'test', 'TODO');
-- Must fail with foreign key violation
```

**6. Run full test suite:**
```bash
cd backend && pytest -v
# All tests must pass
```

**7. Final submission checklist (from PDF):**
- [ ] Backend and frontend are two separate services, each with its own run command
- [ ] Both self-checks pass
- [ ] Each service has its own README with working run instructions
- [ ] Someone else could follow README on a clean machine and get it running
- [ ] Data survives a backend restart
- [ ] Board-to-task foreign key is a real database constraint
- [ ] Delete behavior is enforced at the database level
- [ ] Schema is documented — types, keys, constraints, indexes and why
- [ ] Tests run with documented command, and the result is known
- [ ] At least one test per validation and failure path
- [ ] API documentation covers every endpoint including error examples
- [ ] Assumptions, trade-offs and unfinished work are written down honestly
- [ ] Nothing in the project needs a paid account

**Constraints:**
- Every failing check must be fixed before submission
- If something cannot be fixed, document it honestly in the README

**Tests:** This IS the verification

**Acceptance criteria:**
- All 13 checklist items pass
- Both self-checks pass
- All tests pass
- Documentation is complete and honest

**Suggested model:** HIGH  
**Recommended model:** OPUS REVIEW

---

### TASK-20: (Optional) Docker Compose

**Objective:** Add a `docker-compose.yml` that starts PostgreSQL, backend, and frontend together.

**Dependencies:** TASK-19 (only after all core requirements pass)

**Files to create:**
- `docker-compose.yml`
- `backend/Dockerfile`
- `frontend/Dockerfile`

**Implementation requirements:**
- PostgreSQL service with volume for persistence
- Backend service depending on PostgreSQL, running migrations on startup
- Frontend service with `VITE_API_BASE_URL` configured
- `docker compose up` starts everything
- `docker compose down` stops everything

**Constraints:**
- Local run instructions remain the primary method
- Docker Compose is supplementary, not required
- Must work without any paid services

**Tests:** `docker compose up` starts all services; frontend loads; API responds

**Acceptance criteria:**
- `docker compose up` starts all three services
- Frontend can create boards and tasks through the backend
- Data persists across `docker compose down && docker compose up`

**Suggested model:** MEDIUM  
**Recommended model:** CHEAP

---

### TASK-21: (Optional) Edit Task Title and Description

**Objective:** Allow editing a task's title and description from the frontend, not just its status.

**Dependencies:** TASK-19 (only after all core requirements pass)

**Files to modify:**
- `frontend/src/components/TaskCard.tsx` (add edit mode)

**Implementation requirements:**
- Add an "Edit" button to `TaskCard`
- Clicking "Edit" shows inline input fields for title and description
- Validate title (non-empty, non-whitespace) before sending
- Uses existing `PATCH /api/tasks/{taskId}` endpoint (already supports title/description per A7)
- Save and Cancel buttons

**Constraints:**
- Backend PATCH endpoint already supports this if TASK-09/TASK-11 implemented A7
- Keep the UI simple — inline editing is sufficient

**Tests:** None

**Acceptance criteria:**
- Can edit a task's title and description
- Validation prevents empty/whitespace title
- Changes persist after page refresh

**Suggested model:** LOW  
**Recommended model:** CHEAP

---

### TASK-22: (Optional) Task Status Counts

**Objective:** Display how many tasks sit in each status for the selected board.

**Dependencies:** TASK-19 (only after all core requirements pass)

**Files to modify:**
- `frontend/src/components/TaskList.tsx` (add counts display)

**Implementation requirements:**
- Calculate counts from the already-fetched task list (client-side count)
- Display: `TODO: 4 | IN_PROGRESS: 2 | DONE: 5`
- Update counts when tasks are created, updated, or deleted

**Constraints:**
- Do NOT add a new API endpoint — calculate from existing data
- Keep it simple: a line of text above the task list

**Tests:** None

**Acceptance criteria:**
- Status counts display for the selected board
- Counts update in real-time as tasks change status

**Suggested model:** LOW  
**Recommended model:** CHEAP

---

## 20. Dependency Graph

```mermaid
graph TD
    T01["TASK-01: Repo Init"] --> T02["TASK-02: Backend Init"]
    T01 --> T14["TASK-14: Frontend Init"]

    T02 --> T03["TASK-03: DB Models"]
    T02 --> T05["TASK-05: Pydantic Schemas"]
    T02 --> T07["TASK-07: Exceptions"]

    T03 --> T04["TASK-04: Alembic Migration"]
    T03 --> T06["TASK-06: Repositories"]
    T05 --> T06

    T06 --> T08["TASK-08: Board Service"]
    T06 --> T09["TASK-09: Task Service"]
    T07 --> T08
    T07 --> T09
    T08 --> T09

    T05 --> T10["TASK-10: Error Handlers"]
    T07 --> T10

    T08 --> T11["TASK-11: API Routers"]
    T09 --> T11
    T10 --> T11
    T05 --> T11

    T02 --> T12["TASK-12: CORS"]

    T08 --> T13["TASK-13: Backend Tests"]
    T09 --> T13

    T14 --> T15["TASK-15: Types + API Client"]
    T15 --> T16["TASK-16: Board Components"]
    T16 --> T17["TASK-17: Task Components"]

    T13 --> T18["TASK-18: Documentation"]
    T17 --> T18

    T18 --> T19["TASK-19: Verification"]

    T19 --> T20["TASK-20: Docker (Optional)"]
    T19 --> T21["TASK-21: Edit Task (Optional)"]
    T19 --> T22["TASK-22: Status Counts (Optional)"]
```

**Parallelizable work:**
- TASK-02 and TASK-14 can run in parallel (backend and frontend init)
- TASK-03, TASK-05, and TASK-07 can run in parallel (models, schemas, exceptions)
- TASK-08 and TASK-09 can run sequentially but both depend on TASK-06+07
- TASK-15, TASK-16, TASK-17 (frontend) can proceed in parallel with TASK-08–TASK-13 (backend)

---

## 21. R1–R31 Acceptance Matrix

| Req | Description | Verification Method | Verified By Task |
|-----|-------------|--------------------|--------------------|
| R1 | Board model: id, name (required, non-empty), created_at | Inspect `\d boards` in psql; verify columns, types, NOT NULL, CHECK | TASK-03, TASK-04 |
| R2 | Task model: id, board_id (required), title (required, non-empty), description (optional), status (enum, default TODO), created_at, updated_at | Inspect `\d tasks` in psql | TASK-03, TASK-04 |
| R3 | Real foreign key constraint | `INSERT INTO tasks (..., board_id=random_uuid, ...)` must fail | TASK-04, TASK-19 |
| R4 | Board delete behavior (CASCADE), enforced at DB level | Delete board with tasks; verify tasks are gone; verify via psql | TASK-03, TASK-13 |
| R5 | Schema documentation | Read backend README schema section | TASK-18 |
| R6 | Schema creation method documented | Follow README from empty DB to running app | TASK-04, TASK-18 |
| R7 | Rejected schema decision documented | Read backend README | TASK-18 |
| R8 | `GET /api/boards` returns board list | `curl GET /api/boards` → 200 with JSON array | TASK-11 |
| R9 | `POST /api/boards` creates board, rejects empty name | `curl POST` with valid name → 201; empty name → 422 | TASK-11, TASK-13 |
| R10 | `GET /api/boards/{id}/tasks` with `?status=` filter, 404 for missing board | Test with/without filter; nonexistent board → 404; empty board → `[]` | TASK-11, TASK-13 |
| R11 | `POST /api/boards/{id}/tasks` creates task, rejects empty title, 404 for missing board | curl tests + unit tests | TASK-11, TASK-13 |
| R12 | `PATCH /api/tasks/{id}` updates status, rejects invalid status, 404 for missing task | curl + unit tests; PATCH documented | TASK-11, TASK-13 |
| R13 | `DELETE /api/tasks/{id}` → 204, 404 if missing | curl tests | TASK-11 |
| R14 | `DELETE /api/boards/{id}` per R4 | curl test; verify cascade | TASK-11 |
| R15 | Correct HTTP status codes | Review all endpoint responses | TASK-11 |
| R16 | Consistent error body JSON shape | Every error returns `{error, message, field}` | TASK-10 |
| R17 | Layer separation: no business logic in router | Code review: routers delegate to services | TASK-08, TASK-09, TASK-11 |
| R18 | CORS configured for frontend origin | Frontend makes API call without CORS error | TASK-12 |
| R19 | Board list, select, create in UI | Manual browser test | TASK-16 |
| R20 | Task display: title, description, status, created time | Manual browser test | TASK-17 |
| R21 | Create task form with client + server validation | Create task; try empty title in browser | TASK-17 |
| R22 | Change status via dropdown, no page reload | Change status; page does not reload | TASK-17 |
| R23 | Delete task from UI | Delete task; it disappears | TASK-17 |
| R24 | Filter tasks by status | Use filter; only matching tasks shown | TASK-17 |
| R25 | Loading, error, backend-down, empty states | Test each state manually | TASK-16, TASK-17 |
| R26 | HTTP-only communication, configurable base URL | Inspect `api/client.ts`; change env var; verify | TASK-15 |
| R27 | Backend unit tests: happy paths | `pytest -v` passes with required tests | TASK-13 |
| R28 | Backend unit tests: failure paths | `pytest -v` passes with all failure tests | TASK-13 |
| R29 | Frontend tests (optional) | If implemented, they pass | Optional |
| R30 | Tests run with documented command | `pytest -v` works per README | TASK-13, TASK-18 |
| R31 | Three READMEs covering all 10 items | Read each README | TASK-18 |

---

## 22. Final Verification Procedure

This procedure should be executed by an OPUS-level model after all tasks are complete.

### Step 1: Repository Structure Audit

Verify the repository contains:
```
wpp-fullstack-assessment/
├── README.md
├── backend/
│   ├── README.md
│   ├── requirements.txt
│   ├── alembic.ini
│   ├── alembic/
│   ├── app/
│   └── tests/
└── frontend/
    ├── README.md
    ├── package.json
    └── src/
```

### Step 2: Backend Startup

```bash
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# Create database if needed
alembic upgrade head
uvicorn app.main:app --port 8000
```

### Step 3: API Endpoint Testing

Test every endpoint from Section 8 with curl:

```bash
# R8
curl -s http://localhost:8000/api/boards | python -m json.tool

# R9 — success
curl -s -X POST http://localhost:8000/api/boards \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Board"}' | python -m json.tool

# R9 — failure (empty name)
curl -s -X POST http://localhost:8000/api/boards \
  -H "Content-Type: application/json" \
  -d '{"name":""}' | python -m json.tool

# R10
curl -s http://localhost:8000/api/boards/{id}/tasks | python -m json.tool
curl -s http://localhost:8000/api/boards/{id}/tasks?status=TODO | python -m json.tool

# R11 — success
curl -s -X POST http://localhost:8000/api/boards/{id}/tasks \
  -H "Content-Type: application/json" \
  -d '{"title":"Test Task"}' | python -m json.tool

# R12 — status update
curl -s -X PATCH http://localhost:8000/api/tasks/{id} \
  -H "Content-Type: application/json" \
  -d '{"status":"IN_PROGRESS"}' | python -m json.tool

# R13 — delete task
curl -s -X DELETE http://localhost:8000/api/tasks/{id} -w "%{http_code}"

# R14 — delete board (cascade)
curl -s -X DELETE http://localhost:8000/api/boards/{id} -w "%{http_code}"
```

### Step 4: Database Constraint Verification

```sql
-- Foreign key test (R3)
INSERT INTO tasks (id, board_id, title, status)
VALUES (gen_random_uuid(), gen_random_uuid(), 'test', 'TODO');
-- MUST fail

-- Status CHECK test (R2)
INSERT INTO boards (id, name) VALUES (gen_random_uuid(), 'Test');
INSERT INTO tasks (id, board_id, title, status)
VALUES (gen_random_uuid(), (SELECT id FROM boards LIMIT 1), 'test', 'INVALID');
-- MUST fail

-- Name CHECK test (R1)
INSERT INTO boards (id, name) VALUES (gen_random_uuid(), '');
-- MUST fail (or violate CHECK)
```

### Step 5: Test Suite

```bash
cd backend
pytest -v
# All tests must pass
```

### Step 6: Self-Checks

1. Stop frontend → `curl http://localhost:8000/api/boards` → must respond
2. Stop backend → open `http://localhost:5173` → must show error state

### Step 7: Documentation Audit

Review all three READMEs against R31's 10 items:

| # | Item | Present? |
|---|------|----------|
| 1 | Prerequisites | |
| 2 | Setup + run from clean clone | |
| 3 | Schema creation | |
| 4 | Test command | |
| 5 | API contract | |
| 6 | Schema documentation | |
| 7 | Stack choice + why | |
| 8 | Rejected schema decision | |
| 9 | Assumptions | |
| 10 | Trade-offs + unfinished | |

### Step 8: Code Quality Audit

- [ ] No business logic in routers
- [ ] No HTTP concepts in services
- [ ] Consistent error handling shape
- [ ] No hardcoded backend URLs in frontend
- [ ] No commented-out code blocks
- [ ] No debugging output (console.log, print statements)
- [ ] Consistent naming patterns
- [ ] Two files solving the same problem solve it the same way

### Step 9: Report

For each R1–R31, report:

| Status | Meaning |
|--------|---------|
| **PASS** | Requirement fully satisfied |
| **PARTIAL** | Requirement partially satisfied; state what's missing |
| **FAIL** | Requirement not met |

---

## 23. Final Submission Checklist

Directly from the PDF's final checklist, plus additions from the brief:

- [ ] Backend and frontend are two separate services, each with its own run command
- [ ] Both self-checks in section 4 pass
- [ ] Each service has its own README with working run instructions
- [ ] Someone else could follow README on a clean machine, create schema, get it running — no undocumented step
- [ ] Data survives a backend restart
- [ ] Board-to-task foreign key is a real database constraint, and delete behavior is enforced by the schema
- [ ] Schema is documented — types, keys, constraints, indexes and why
- [ ] Tests run with documented command, and the result is known
- [ ] At least one test per validation and failure path
- [ ] API documentation covers every endpoint, including error examples
- [ ] Assumptions, trade-offs and unfinished work are written down, and nothing is claimed that does not work
- [ ] Nothing in the project needs a paid account
- [ ] Optional features (if any) are clearly separated from core and do not compromise core quality
