# Mini Task Management Application - Walkthrough

> [!NOTE]
> **UPDATE:** A comprehensive verification audit has been completed, confirming that all required features and phases (TASK-01 through TASK-19) are fully implemented, functional, and meet all original assessment criteria. Documentation has been finalized in the project root.


I have fully implemented the **Mini Task Management Application** based on the study case requirements and the approved implementation plan.

## Completed Work

### 1. Project Initialization & Database Setup
- Created a monolithic repository with `backend/` and `frontend/` directories.
- Designed database models for `Board` and `Task` using SQLAlchemy, with UUID primary keys and proper foreign key cascading (`ON DELETE CASCADE`).
- Initialized Alembic and created the first database migration.
- Set up an automatic testing environment with PostgreSQL (or SQLite compatible defaults depending on environment configuration).

### 2. Backend Implementation (FastAPI)
- **Schemas**: Created Pydantic request and response schemas conforming strictly to the required types.
- **Repositories**: Implemented repository pattern for isolated database access (`BoardRepository`, `TaskRepository`).
- **Services**: Extracted business logic (validation rules, custom errors) into the service layer (`BoardService`, `TaskService`).
- **Routers**: Implemented RESTful API endpoints for Boards and Tasks, returning correct HTTP status codes (200, 201, 204).
- **Error Handling**: Configured unified global exception handlers returning consistent `{"error", "message", "field"}` JSON payloads for 404 Not Found, 422 Unprocessable Entity, and 500 Internal Error.

### 3. Backend Tests
- Implemented comprehensive `pytest` unit tests for `BoardService` and `TaskService`.
- 100% pass rate on all validation, CRUD, and edge-case behaviors (including testing string emptiness validation).

### 4. Frontend Implementation (React + TypeScript)
- Scaffolded a modern, lightweight React + Vite + TypeScript application.
- Configured a reusable `axios` API client configured to communicate with `http://localhost:8000`.
- Implemented **BoardList**: A sidebar component displaying all boards with creation and deletion capabilities.
- Implemented **TaskBoard**: A Kanban-style layout with columns for "To Do", "In Progress", and "Done", supporting task creation, status updates, and deletion.
- Applied responsive vanilla CSS to create a clean, minimalist design matching modern aesthetic principles (using CSS variables, flexbox layouts, hover states).

## How to Run the Application

> [!TIP]
> Ensure you have Docker running to launch the PostgreSQL database for the backend.

### Database Setup
If you haven't already, start a PostgreSQL container and create the database:
```bash
docker run --name postgres-db -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=taskmanager -p 5432:5432 -d postgres
```

### Starting the Backend
```bash
cd backend
source venv/bin/activate
alembic upgrade head
uvicorn app.main:app --reload --port 8000
```

### Starting the Frontend
In a new terminal window:
```bash
cd frontend
npm install
npm run dev
```

The frontend will be available at `http://localhost:5173` and will communicate with the API at `http://localhost:8000`.
