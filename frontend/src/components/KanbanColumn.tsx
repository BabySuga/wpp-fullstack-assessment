import type { Task, TaskStatus } from '../types';
import { TaskCard } from './TaskCard';
import './KanbanColumn.css';

interface KanbanColumnProps {
  status: TaskStatus;
  title: string;
  tasks: Task[];
  isFiltered: boolean;
  isDragOver: boolean;
  onDragOver: (e: React.DragEvent, status: TaskStatus) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, status: TaskStatus) => void;
  onDeleteTask: (taskId: string) => void;
  onEditTask: (task: Task) => void;
  onStatusChange: (taskId: string, status: TaskStatus) => void;
  onDragStart: (e: React.DragEvent, task: Task) => void;
  onDragEnd: (e: React.DragEvent) => void;
}

export function KanbanColumn({
  status,
  title,
  tasks,
  isFiltered,
  isDragOver,
  onDragOver,
  onDragLeave,
  onDrop,
  onDeleteTask,
  onEditTask,
  onStatusChange,
  onDragStart,
  onDragEnd,
}: KanbanColumnProps) {
  return (
    <div
      className={`kanban-column kanban-column--${status.toLowerCase().replace('_', '-')}${isDragOver ? ' is-drag-over' : ''}`}
      onDragOver={(e) => onDragOver(e, status)}
      onDragLeave={onDragLeave}
      onDrop={(e) => onDrop(e, status)}
      data-column-status={status}
    >
      <div className={`column-header${isFiltered ? ' is-filtered' : ''}`}>
        <span className="column-title">{title}</span>
        <span className="column-badge" aria-label={`${tasks.length} tasks`}>
          {tasks.length}
        </span>
      </div>

      <div className="column-task-list">
        {tasks.map(task => (
          <TaskCard
            key={task.id}
            task={task}
            onDelete={onDeleteTask}
            onEdit={onEditTask}
            onStatusChange={onStatusChange}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
          />
        ))}

        {tasks.length === 0 && (
          <div className="column-empty">
            Drop tasks here
          </div>
        )}
      </div>
    </div>
  );
}
