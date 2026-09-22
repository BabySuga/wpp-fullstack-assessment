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
The backend requires a PostgreSQL database to store boards and tasks.

1. Ensure PostgreSQL is installed and running, or use Docker:
```bash
docker run --name postgres-db -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=taskmanager -p 5432:5432 -d postgres
```
*(The default configuration in `backend/app/config.py` expects a database named `taskmanager` accessible at `postgresql://postgres:postgres@localhost:5432/taskmanager`)*

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
4. Run database migrations to create the schema:
```bash
alembic upgrade head
```
5. Start the FastAPI server:
```bash
uvicorn app.main:app --reload --port 8000
```
The API will be running at `http://localhost:8000`.

## 5. Frontend Setup
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

## 6. API Documentation

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
  "error": "NOT_FOUND | VALIDATION_ERROR | INTERNAL_ERROR",
  "message": "Human readable error message",
  "field": "Optional field name that caused the error"
}
```

## 7. Testing
Backend tests are written using `pytest`. They use a real PostgreSQL database to ensure constraints and cascades work properly.

To run the tests:
1. Ensure a PostgreSQL database named `taskmanager_test` is available.
2. Navigate to the backend folder and run:
```bash
cd backend
source venv/bin/activate
pytest -v
```

## 8. Build
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

## 9. Assumptions and Trade-offs
- **Schema Decision**: We used `UUID` for primary keys to ensure globally unique identifiers and avoid ID enumeration attacks. 
- **Database Constraints**: `ON DELETE CASCADE` is enforced at the database level for tasks linked to a board, ensuring data integrity without needing application-level cleanup logic. We use PostgreSQL `CheckConstraint` to prevent empty strings for titles and names.
- **Trade-off**: The frontend does not use robust global state management (like Redux or Zustand) because the application is simple enough that React's built-in `useState` and prop drilling is sufficient and keeps the codebase lightweight.
