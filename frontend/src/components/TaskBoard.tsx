import { useState, useEffect } from 'react';
import type { Board, Task, TaskStatus } from '../types';
import { taskApi } from '../api/taskApi';
import { getUserFriendlyError } from '../api/client';
import './TaskBoard.css';

interface TaskBoardProps {
  board: Board;
}

export function TaskBoard({ board }: TaskBoardProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [taskTitleError, setTaskTitleError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'ALL'>('ALL');

  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editTaskTitle, setEditTaskTitle] = useState('');
  const [editTaskDescription, setEditTaskDescription] = useState('');
  const [editTaskTitleError, setEditTaskTitleError] = useState<string | null>(null);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await taskApi.getByBoardId(
        board.id,
        statusFilter === 'ALL' ? undefined : statusFilter
      );
      setTasks(data);
    } catch (caughtError) {
      setError(getUserFriendlyError(caughtError));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [board.id, statusFilter]);

  const validateTaskTitle = (value: string): string | null => {
    if (!value.trim()) {
      return 'Task title is required.';
    }

    return null;
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedTitle = newTaskTitle.trim();
    const validationError = validateTaskTitle(trimmedTitle);

    setTaskTitleError(validationError);

    if (validationError) {
      return;
    }

    try {
      const newTask = await taskApi.create(board.id, trimmedTitle, newTaskDescription.trim());
      setTasks([newTask, ...tasks]);
      setNewTaskTitle('');
      setNewTaskDescription('');
      setTaskTitleError(null);
    } catch (caughtError) {
      setTaskTitleError(getUserFriendlyError(caughtError));
      setError(null);
    }
  };

  const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    try {
      const updatedTask = await taskApi.update(taskId, { status: newStatus });
      setTasks(tasks.map(t => t.id === taskId ? updatedTask : t));
    } catch (caughtError) {
      setError(getUserFriendlyError(caughtError));
    }
  };

  const handleEditTask = (task: Task) => {
    setEditingTaskId(task.id);
    setEditTaskTitle(task.title);
    setEditTaskDescription(task.description || '');
  };

  const handleUpdateTask = async (e: React.FormEvent, taskId: string) => {
    e.preventDefault();
    const trimmedTitle = editTaskTitle.trim();
    const validationError = validateTaskTitle(trimmedTitle);

    setEditTaskTitleError(validationError);

    if (validationError) {
      return;
    }

    try {
      const updatedTask = await taskApi.update(taskId, {
        title: trimmedTitle,
        description: editTaskDescription.trim()
      });
      setTasks(tasks.map(t => t.id === taskId ? updatedTask : t));
      setEditingTaskId(null);
      setEditTaskTitleError(null);
    } catch (caughtError) {
      setEditTaskTitleError(getUserFriendlyError(caughtError));
      setError(null);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      await taskApi.delete(taskId);
      setTasks(tasks.filter(t => t.id !== taskId));
    } catch (caughtError) {
      setError(getUserFriendlyError(caughtError));
    }
  };

  const visibleTasks = statusFilter === 'ALL'
    ? tasks
    : tasks.filter(task => task.status === statusFilter);

  const renderColumn = (status: TaskStatus, title: string) => {
    const columnTasks = visibleTasks.filter(t => t.status === status);

    return (
      <div className="task-column">
        <h3 className="column-title">{title} <span className="task-count">{columnTasks.length}</span></h3>
        <div className="task-list">
          {columnTasks.map(task => (
            <div key={task.id} className="task-card">
              {editingTaskId === task.id ? (
                <form onSubmit={(e) => handleUpdateTask(e, task.id)} className="edit-task-form">
                  <input
                    type="text"
                    value={editTaskTitle}
                    onChange={(e) => {
                      setEditTaskTitle(e.target.value);
                      if (editTaskTitleError) {
                        setEditTaskTitleError(null);
                      }
                    }}
                    className="edit-task-input"
                    placeholder="Task title"
                    required
                    aria-invalid={Boolean(editTaskTitleError)}
                  />
                  {editTaskTitleError && (
                    <div role="alert" style={{ color: '#d93025', marginTop: '4px', fontSize: '0.85rem' }}>
                      {editTaskTitleError}
                    </div>
                  )}
                  <textarea
                    value={editTaskDescription}
                    onChange={(e) => setEditTaskDescription(e.target.value)}
                    className="edit-task-textarea"
                    placeholder="Task description (optional)"
                    rows={3}
                  />
                  <div className="edit-task-actions">
                    <button type="submit" className="save-btn">Save</button>
                    <button type="button" className="cancel-btn" onClick={() => setEditingTaskId(null)}>Cancel</button>
                  </div>
                </form>
              ) : (
                <>
                  <div className="task-header">
                    <span className="task-title" onClick={() => handleEditTask(task)} style={{cursor: 'pointer'}} title="Click to edit">{task.title}</span>
                    <button
                      className="delete-task-btn"
                      onClick={() => handleDeleteTask(task.id)}
                      title="Delete Task"
                    >
                      &times;
                    </button>
                  </div>
                  {task.description && <div className="task-description">{task.description}</div>}
                  <div className="task-created-at">
                    Created {new Date(task.created_at).toLocaleString()}
                  </div>
                  <div className="task-actions">
                    <select
                      value={task.status}
                      onChange={(e) => handleStatusChange(task.id, e.target.value as TaskStatus)}
                      className="status-select"
                    >
                      <option value="TODO">To Do</option>
                      <option value="IN_PROGRESS">In Progress</option>
                      <option value="DONE">Done</option>
                    </select>
                    <button type="button" className="edit-task-btn" onClick={() => handleEditTask(task)} style={{marginLeft: 'auto', fontSize: '0.8rem', padding: '2px 8px'}}>Edit</button>
                  </div>
                </>
              )}
            </div>
          ))}
          {columnTasks.length === 0 && (
            <div className="empty-column">No tasks</div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="task-board-container">
      <div className="board-header">
        <h2 className="board-title">{board.name}</h2>
        <label className="status-filter-control">
          <span>Status</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as TaskStatus | 'ALL')}
            className="status-select"
          >
            <option value="ALL">All</option>
            <option value="TODO">TODO</option>
            <option value="IN_PROGRESS">IN_PROGRESS</option>
            <option value="DONE">DONE</option>
          </select>
        </label>
        <form onSubmit={handleCreateTask} className="create-task-form">
          <input
            type="text"
            value={newTaskTitle}
            onChange={(e) => {
              setNewTaskTitle(e.target.value);
              if (taskTitleError) {
                setTaskTitleError(null);
              }
            }}
            placeholder="What needs to be done?"
            className="create-task-input"
            required
            aria-invalid={Boolean(taskTitleError)}
          />
          {taskTitleError && (
            <div role="alert" style={{ color: '#d93025', marginTop: '4px', fontSize: '0.85rem' }}>
              {taskTitleError}
            </div>
          )}
          <input
            type="text"
            value={newTaskDescription}
            onChange={(e) => setNewTaskDescription(e.target.value)}
            placeholder="Description (optional)"
            className="create-task-input"
            style={{marginTop: '4px'}}
          />
          <button type="submit" className="create-task-btn" disabled={!newTaskTitle.trim()} style={{marginTop: '4px'}}>
            Add Task
          </button>
        </form>
      </div>

      {loading ? (
        <div className="board-loading">Loading tasks...</div>
      ) : error ? (
        <div className="board-state-panel board-error-panel">
          <h3>Unable to load tasks</h3>
          <p>{error}</p>
          <button type="button" className="retry-btn" onClick={fetchTasks}>Try again</button>
        </div>
      ) : tasks.length === 0 ? (
        <div className="board-empty-state">
          <h3>No tasks yet</h3>
          <p>This board has no tasks. Add one to get started.</p>
        </div>
      ) : (
        <>
          {visibleTasks.length === 0 && (
            <div className="filter-empty-state">
              <p>No tasks match the selected status filter.</p>
            </div>
          )}
          <div className="kanban-board">
            {renderColumn('TODO', 'To Do')}
            {renderColumn('IN_PROGRESS', 'In Progress')}
            {renderColumn('DONE', 'Done')}
          </div>
        </>
      )}
    </div>
  );
}
