# Frontend

The frontend is a Vite + React + TypeScript client for the task manager. It presents boards and their tasks as a Kanban board and communicates with the FastAPI backend using Axios over HTTP JSON.

## Stack and structure

- React and TypeScript: component-based UI with typed board/task models.
- Vite: development server and production build.
- Axios: centralized API client and backend error messages.
- Vitest and React Testing Library: component behavior tests.

```text
src/App.tsx                 board selection and page shell
src/components/             board list, task board, columns, cards, dialog
src/api/                    Axios client and board/task requests
src/types/                  frontend API types
src/test/                   Vitest setup and component tests
```

## Configuration and development

Node.js 20+ and npm are required. The backend must be running at `http://localhost:8000`.

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

The development UI is `http://localhost:5173`. Configure the browser API base URL with:

```env
VITE_API_BASE_URL=http://localhost:8000
```

The default is the same URL. The value uses `localhost` because the request is made by the browser; it is not the internal Docker service name.

## Docker

From the repository root, with the host PostgreSQL database and backend prerequisites in place:

```bash
docker compose up --build
```

Compose serves the frontend at `http://localhost:5173`. Its container runs Vite on `0.0.0.0`, while `VITE_API_BASE_URL=http://localhost:8000` keeps browser requests directed to the published backend port. Stop it with `docker compose down`. PostgreSQL is not managed by Compose; see the root README.

## User-facing behavior

- Boards load in the sidebar; a board can be selected, created, or deleted.
- The selected board shows task title, optional description, status, created timestamp, and per-column counts.
- Tasks can be created through a dialog, edited through the same dialog, deleted directly, or moved between `TODO`, `IN_PROGRESS`, and `DONE`.
- Status can be changed with the task select or by dragging a task between columns.
- The status filter shows all tasks or one status. The last selected board and status filter are stored in `localStorage`.
- Dragging a task to the delete zone deletes it.

Client-side validation prevents empty board names and task titles before requests are sent. API validation and other request failures are shown in the relevant error state.

## Loading, empty, and error states

The board list and task board show loading indicators while requests are in flight. No-board and no-task states are explicit. If the backend is unavailable or a request fails, the UI shows an error message and retry control rather than a blank screen. Failed optimistic status changes and deletions are restored locally and report the error.

## Commands

```bash
cd frontend
npm test          # Vitest test run
npm run build     # TypeScript build and Vite production build
npm run lint      # oxlint
npm run preview   # serve the production build locally
```

The tests cover board loading/creation/deletion and task loading, creation, editing, filtering, status changes, deletion, drag behavior, and error states.

## Backend endpoints used

The frontend calls `GET/POST/DELETE /api/boards`, `GET/POST /api/boards/{board_id}/tasks`, `PATCH /api/tasks/{task_id}`, and `DELETE /api/tasks/{task_id}`. It does not use WebSockets or share backend code.

## Limitations and scope

The frontend assumes the API is reachable over HTTP and does not implement authentication, real-time updates, pagination, cloud deployment, monitoring, or production hardening. Visual styling is assessment-oriented rather than a claim of designer-grade or pixel-perfect production UI. These items are outside the assessment scope.