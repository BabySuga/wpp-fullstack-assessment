import { useState, useEffect, useRef, useCallback } from 'react';
import type { Board, Task, TaskStatus } from '../types';
import { taskApi } from '../api/taskApi';
import { getUserFriendlyError } from '../api/client';
import { KanbanColumn } from './KanbanColumn';
import { TaskDialog } from './TaskDialog';
import './TaskBoard.css';

interface TaskBoardProps {
  board: Board;
  onOpenSidebar: () => void;
}

const COLUMNS: { status: TaskStatus; title: string }[] = [
  { status: 'TODO', title: 'To Do' },
  { status: 'IN_PROGRESS', title: 'In Progress' },
  { status: 'DONE', title: 'Done' },
];

const STATUS_FILTER_OPTIONS: { value: TaskStatus | 'ALL'; label: string }[] = [
  { value: 'ALL', label: 'All' },
  { value: 'TODO', label: 'To Do' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'DONE', label: 'Done' },
];

const LAST_STATUS_FILTER_KEY = 'mini-task-manager:last-status-filter';

const getStoredStatusFilter = (): TaskStatus | 'ALL' => {
  try {
    const savedFilter = localStorage.getItem(LAST_STATUS_FILTER_KEY);
    if (savedFilter === 'ALL' || savedFilter === 'TODO' || savedFilter === 'IN_PROGRESS' || savedFilter === 'DONE') {
      return savedFilter;
    }
  } catch {
    // ignore storage issues and fall back to default
  }

  return 'ALL';
};

export function TaskBoard({ board, onOpenSidebar }: TaskBoardProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  // loadError replaces the board view; actionError shows as an inline banner
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'ALL'>(getStoredStatusFilter);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  useEffect(() => {
    localStorage.setItem(LAST_STATUS_FILTER_KEY, statusFilter);
  }, [statusFilter]);

  // Drag state
  const draggingTaskRef = useRef<Task | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOverColumn, setDragOverColumn] = useState<TaskStatus | null>(null);
  const [isDragOverDelete, setIsDragOverDelete] = useState(false);

  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      setLoadError(null);
      const data = await taskApi.getByBoardId(board.id);
      setTasks(data);
    } catch (caughtError) {
      setLoadError(getUserFriendlyError(caughtError));
    } finally {
      setLoading(false);
    }
  }, [board.id]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // ===================================================
  // Task creation
  // ===================================================
  const handleCreateTask = async (title: string, description: string) => {
    try {
      const newTask = await taskApi.create(board.id, title, description || undefined);

      const targetStatus = statusFilter === 'ALL' ? newTask.status : statusFilter;
      const taskToDisplay = targetStatus === newTask.status
        ? newTask
        : { ...newTask, status: targetStatus };

      if (targetStatus !== newTask.status) {
        const updatedTask = await taskApi.update(newTask.id, { status: targetStatus });
        setTasks(prev => [updatedTask, ...prev.filter(task => task.id !== newTask.id)]);
      } else {
        setTasks(prev => [taskToDisplay, ...prev]);
      }

      setIsDialogOpen(false);
    } catch (caughtError) {
      setActionError(getUserFriendlyError(caughtError));
      throw caughtError;
    }
  };

  const handleEditTask = async (taskId: string, title: string, description: string) => {
    try {
      const payload: { title?: string; description?: string } = {};
      const trimmedTitle = title.trim();
      const trimmedDescription = description.trim();

      if (trimmedTitle !== (tasks.find(task => task.id === taskId)?.title ?? '')) {
        payload.title = trimmedTitle;
      }
      if (trimmedDescription !== (tasks.find(task => task.id === taskId)?.description ?? '')) {
        payload.description = trimmedDescription;
      }

      const updatedTask = await taskApi.update(taskId, payload);
      setTasks(prev => prev.map(task => task.id === taskId ? updatedTask : task));
      setEditingTask(null);
      setIsDialogOpen(false);
    } catch (caughtError) {
      setActionError(getUserFriendlyError(caughtError));
      throw caughtError;
    }
  };

  // ===================================================
  // Status change (select fallback)
  // ===================================================
  const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    const prevTasks = tasks;
    // Optimistic update
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
    try {
      const updatedTask = await taskApi.update(taskId, { status: newStatus });
      setTasks(prev => prev.map(t => t.id === taskId ? updatedTask : t));
    } catch (caughtError) {
      setTasks(prevTasks); // Restore on failure
      setActionError(getUserFriendlyError(caughtError));
    }
  };

  // ===================================================
  // Delete task
  // ===================================================
  const handleDeleteTask = async (taskId: string) => {
    const prevTasks = tasks;
    setTasks(prev => prev.filter(t => t.id !== taskId));
    try {
      await taskApi.delete(taskId);
    } catch (caughtError) {
      setTasks(prevTasks);
      setActionError(getUserFriendlyError(caughtError));
    }
  };

  const openEditDialog = (task: Task) => {
    setEditingTask(task);
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingTask(null);
    setActionError(null);
  };

  // ===================================================
  // Drag-and-drop: column to column
  // ===================================================
  const handleDragStart = useCallback((e: React.DragEvent, task: Task) => {
    draggingTaskRef.current = task;
    setIsDragging(true);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', task.id);
    // Add visual class to the dragged element
    const el = e.currentTarget as HTMLElement;
    requestAnimationFrame(() => el.classList.add('is-dragging'));
  }, []);

  const handleDragEnd = useCallback((e: React.DragEvent) => {
    setIsDragging(false);
    setDragOverColumn(null);
    setIsDragOverDelete(false);
    draggingTaskRef.current = null;
    const el = e.currentTarget as HTMLElement;
    el.classList.remove('is-dragging');
  }, []);

  const handleColumnDragOver = useCallback((e: React.DragEvent, status: TaskStatus) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverColumn(status);
    setIsDragOverDelete(false);
  }, []);

  const handleColumnDragLeave = useCallback((e: React.DragEvent) => {
    // Only clear if leaving to outside the column (not into a child)
    const relatedTarget = e.relatedTarget as Node | null;
    const column = e.currentTarget as HTMLElement;
    if (!column.contains(relatedTarget)) {
      setDragOverColumn(null);
    }
  }, []);

  const handleColumnDrop = useCallback(async (e: React.DragEvent, targetStatus: TaskStatus) => {
    e.preventDefault();
    setDragOverColumn(null);
    setIsDragging(false);
    setIsDragOverDelete(false);

    const task = draggingTaskRef.current;
    if (!task || task.status === targetStatus) return;

    const prevTasks = tasks;
    // Optimistic update
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: targetStatus } : t));

    try {
      const updatedTask = await taskApi.update(task.id, { status: targetStatus });
      setTasks(prev => prev.map(t => t.id === task.id ? updatedTask : t));
    } catch (caughtError) {
      setTasks(prevTasks);
      setActionError(getUserFriendlyError(caughtError));
    }
  }, [tasks]);

  // ===================================================
  // Drag-to-delete zone
  // ===================================================
  const handleDeleteZoneDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setIsDragOverDelete(true);
    setDragOverColumn(null);
  }, []);

  const handleDeleteZoneDragLeave = useCallback(() => {
    setIsDragOverDelete(false);
  }, []);

  const handleDeleteZoneDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOverDelete(false);
    setIsDragging(false);

    const task = draggingTaskRef.current;
    if (!task) return;

    await handleDeleteTask(task.id);
  }, [tasks]); // eslint-disable-line react-hooks/exhaustive-deps

  // ===================================================
  // Filtering
  // ===================================================
  const visibleTasks = statusFilter === 'ALL'
    ? tasks
    : tasks.filter(t => t.status === statusFilter);

  const getColumnTasks = (status: TaskStatus) =>
    visibleTasks.filter(t => t.status === status);

  const visibleColumns = statusFilter === 'ALL'
    ? COLUMNS
    : COLUMNS.filter(column => column.status === statusFilter);

  // ===================================================
  // Render
  // ===================================================
  return (
    <div className="task-board">
      {/* Board Header */}
      <div className="board-header">
        <button
          className="btn btn-ghost board-menu-toggle menu-toggle"
          onClick={onOpenSidebar}
          aria-label="Open navigation"
        >
          ☰
        </button>

        <h1 className="board-title">{board.name}</h1>

        {/* Status filter */}
        <div className="status-filter" role="group" aria-label="Filter tasks by status">
          {STATUS_FILTER_OPTIONS.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              className={`status-filter-btn${statusFilter === value ? ' is-active' : ''}`}
              onClick={() => setStatusFilter(value)}
              aria-pressed={statusFilter === value}
            >
              {label}
            </button>
          ))}
        </div>

        <button
          type="button"
          className="btn btn-primary"
          onClick={() => setIsDialogOpen(true)}
          aria-label="Add a new task"
        >
          + Add task
        </button>
      </div>

      {/* Task creation dialog */}
      <TaskDialog
        isOpen={isDialogOpen}
        mode={editingTask ? 'edit' : 'create'}
        initialTitle={editingTask?.title ?? ''}
        initialDescription={editingTask?.description ?? ''}
        onClose={closeDialog}
        onSubmit={editingTask ? (title, description) => handleEditTask(editingTask.id, title, description) : handleCreateTask}
      />

      {/* Board content */}
      {loading ? (
        <div className="board-state">
          <div className="board-state-inner">
            <p>Loading tasks…</p>
          </div>
        </div>
      ) : loadError ? (
        <div className="board-state board-error-state">
          <div className="board-state-inner">
            <h3>Could not load tasks</h3>
            <p>{loadError}</p>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => { setLoadError(null); fetchTasks(); }}
            >
              Try again
            </button>
          </div>
        </div>
      ) : (
        <>
          {actionError && (
            <div className="action-error-banner" role="alert">
              <span>{actionError}</span>
              <button
                type="button"
                className="btn-icon"
                onClick={() => setActionError(null)}
                aria-label="Dismiss error"
              >
                ✕
              </button>
            </div>
          )}
          {visibleTasks.length === 0 ? (
            <div className="board-empty-area">
              <p className="filter-empty-hint">No tasks match the selected filter.</p>
            </div>
          ) : (
            <div className={`kanban-board${statusFilter === 'ALL' ? '' : ' is-filtered'}`}>
              {visibleColumns.map(({ status, title }) => (
                <KanbanColumn
                  key={status}
                  status={status}
                  title={title}
                  tasks={getColumnTasks(status)}
                  isFiltered={statusFilter !== 'ALL'}
                  isDragOver={dragOverColumn === status}
                  onDragOver={handleColumnDragOver}
                  onDragLeave={handleColumnDragLeave}
                  onDrop={handleColumnDrop}
                  onDeleteTask={handleDeleteTask}
                  onEditTask={openEditDialog}
                  onStatusChange={handleStatusChange}
                  onDragStart={handleDragStart}
                  onDragEnd={handleDragEnd}
                />
              ))}
            </div>
          )}
        </>
      )}

      <div className="task-board-tutorial" aria-label="Mini tutorial">
        <div className="tutorial-item" title="Drag and drop to move task to another status" aria-label="Drag and drop to move task to another status">
          <svg className="tutorial-icon" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M8 7h9m0 0 2 2m-2-2-2 2M16 17H7m0 0-2-2m2 2 2-2" />
            <path d="M7 4v16" opacity="0.25" />
          </svg>
          <span>Drag and drop to move</span>
        </div>

        <div className="tutorial-item" title="Drag task to delete" aria-label="Drag task to delete">
          <svg className="tutorial-icon" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M4 7h16" />
            <path d="M9 7V4h6v3" />
            <path d="M7 7l1 12h8l1-12" />
            <path d="M10 11v5M14 11v5" />
          </svg>
          <span>Drag to delete</span>
        </div>

        <div className="tutorial-item tutorial-item--accent" title="Double click to edit" aria-label="Double click to edit">
          <svg className="tutorial-icon" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M4 20h4l10.5-10.5a2.121 2.121 0 0 0-3-3L5 17v3Z" />
            <path d="m13.5 6.5 4 4" />
          </svg>
          <span>Double click to edit</span>
        </div>
      </div>

      {/* Delete drop zone — appears at bottom only while dragging */}
      <div
        className={`delete-zone${isDragging ? ' is-visible' : ''}${isDragOverDelete ? ' is-hovered' : ''}`}
        onDragOver={handleDeleteZoneDragOver}
        onDragLeave={handleDeleteZoneDragLeave}
        onDrop={handleDeleteZoneDrop}
        aria-hidden="true"
        role="presentation"
      >
        🗑 Drop here to delete
      </div>
    </div>
  );
}
