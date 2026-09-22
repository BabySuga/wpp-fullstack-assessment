import { useState, useEffect } from 'react';
import type { Board, Task, TaskStatus } from '../types';
import { taskApi } from '../api/taskApi';
import './TaskBoard.css';

interface TaskBoardProps {
  board: Board;
}

export function TaskBoard({ board }: TaskBoardProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const data = await taskApi.getByBoardId(board.id);
      setTasks(data);
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [board.id]);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    try {
      const newTask = await taskApi.create(board.id, newTaskTitle);
      setTasks([newTask, ...tasks]);
      setNewTaskTitle('');
    } catch (error) {
      console.error('Failed to create task:', error);
    }
  };

  const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    try {
      const updatedTask = await taskApi.update(taskId, { status: newStatus });
      setTasks(tasks.map(t => t.id === taskId ? updatedTask : t));
    } catch (error) {
      console.error('Failed to update task status:', error);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      await taskApi.delete(taskId);
      setTasks(tasks.filter(t => t.id !== taskId));
    } catch (error) {
      console.error('Failed to delete task:', error);
    }
  };

  const renderColumn = (status: TaskStatus, title: string) => {
    const columnTasks = tasks.filter(t => t.status === status);
    
    return (
      <div className="task-column">
        <h3 className="column-title">{title} <span className="task-count">{columnTasks.length}</span></h3>
        <div className="task-list">
          {columnTasks.map(task => (
            <div key={task.id} className="task-card">
              <div className="task-header">
                <span className="task-title">{task.title}</span>
                <button 
                  className="delete-task-btn"
                  onClick={() => handleDeleteTask(task.id)}
                  title="Delete Task"
                >
                  &times;
                </button>
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
              </div>
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
        <form onSubmit={handleCreateTask} className="create-task-form">
          <input
            type="text"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            placeholder="What needs to be done?"
            className="create-task-input"
          />
          <button type="submit" className="create-task-btn" disabled={!newTaskTitle.trim()}>
            Add Task
          </button>
        </form>
      </div>

      {loading ? (
        <div className="board-loading">Loading tasks...</div>
      ) : (
        <div className="kanban-board">
          {renderColumn('TODO', 'To Do')}
          {renderColumn('IN_PROGRESS', 'In Progress')}
          {renderColumn('DONE', 'Done')}
        </div>
      )}
    </div>
  );
}
