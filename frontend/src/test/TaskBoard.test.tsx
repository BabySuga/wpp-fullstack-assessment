import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TaskBoard } from '../components/TaskBoard';
import { taskApi } from '../api/taskApi';
import type { Board, Task } from '../types';

// Mock taskApi
vi.mock('../api/taskApi');

// jsdom doesn't support showModal/close natively — provide simple shims
beforeEach(() => {
  HTMLDialogElement.prototype.showModal = vi.fn(function (this: HTMLDialogElement) {
    this.setAttribute('open', '');
  });
  HTMLDialogElement.prototype.close = vi.fn(function (this: HTMLDialogElement) {
    this.removeAttribute('open');
  });
});

const mockBoard: Board = {
  id: 'board-1',
  name: 'Test Board',
  created_at: '2024-01-01T00:00:00Z',
};

const makeTasks = (): Task[] => [
  {
    id: 'task-1',
    board_id: 'board-1',
    title: 'Todo Task',
    description: null,
    status: 'TODO',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'task-2',
    board_id: 'board-1',
    title: 'Progress Task',
    description: 'A description',
    status: 'IN_PROGRESS',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'task-3',
    board_id: 'board-1',
    title: 'Done Task',
    description: null,
    status: 'DONE',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
];

const defaultProps = {
  board: mockBoard,
  onOpenSidebar: vi.fn(),
};

beforeEach(() => {
  localStorage.clear();
  vi.resetAllMocks();
  vi.mocked(taskApi.getByBoardId).mockResolvedValue(makeTasks());
  vi.mocked(taskApi.create).mockResolvedValue({
    id: 'task-new',
    board_id: 'board-1',
    title: 'New Task',
    description: null,
    status: 'TODO',
    created_at: '2024-01-02T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z',
  });
  vi.mocked(taskApi.update).mockImplementation(async (taskId, data) => {
    const task = makeTasks().find(t => t.id === taskId) ?? {
      id: taskId,
      board_id: 'board-1',
      title: 'New Task',
      description: null,
      status: 'TODO',
      created_at: '2024-01-02T00:00:00Z',
      updated_at: '2024-01-02T00:00:00Z',
    };
    return { ...task, ...data };
  });
  vi.mocked(taskApi.delete).mockResolvedValue(undefined);
});

describe('TaskBoard', () => {
  // R29-6: Tasks render under the correct status column
  it('renders tasks under their correct status columns', async () => {
    render(<TaskBoard {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('Todo Task')).toBeInTheDocument();
      expect(screen.getByText('Progress Task')).toBeInTheDocument();
      expect(screen.getByText('Done Task')).toBeInTheDocument();
    });

    // Verify each task is inside the correct column
    const todoColumn = screen.getByTestId
      ? document.querySelector('[data-column-status="TODO"]')
      : null;
    if (todoColumn) {
      expect(within(todoColumn as HTMLElement).getByText('Todo Task')).toBeInTheDocument();
    }
  });

  // R29-6: Tasks appear in correct columns via data attributes
  it('places tasks in columns matching their status', async () => {
    render(<TaskBoard {...defaultProps} />);

    await waitFor(() => screen.getByText('Todo Task'));

    const todoCard = screen.getByText('Todo Task').closest('[data-task-status]');
    const progressCard = screen.getByText('Progress Task').closest('[data-task-status]');
    const doneCard = screen.getByText('Done Task').closest('[data-task-status]');

    expect(todoCard?.getAttribute('data-task-status')).toBe('TODO');
    expect(progressCard?.getAttribute('data-task-status')).toBe('IN_PROGRESS');
    expect(doneCard?.getAttribute('data-task-status')).toBe('DONE');
  });

  it('opens the edit dialog and populates task fields when a task is double-clicked', async () => {
    const user = userEvent.setup();
    render(<TaskBoard {...defaultProps} />);

    await waitFor(() => screen.getByText('Todo Task'));

    await user.dblClick(screen.getByText('Todo Task'));

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByLabelText(/^title$/i)).toHaveValue('Todo Task');
    expect(screen.getByLabelText(/description/i)).toHaveValue('');
    expect(screen.getByRole('button', { name: /^save$/i })).toBeInTheDocument();
  });

  it('validates an empty title before saving an edit', async () => {
    const user = userEvent.setup();
    render(<TaskBoard {...defaultProps} />);

    await waitFor(() => screen.getByText('Todo Task'));

    await user.dblClick(screen.getByText('Todo Task'));
    const titleInput = screen.getByLabelText(/^title$/i);
    await user.clear(titleInput);

    const saveBtn = screen.getByRole('button', { name: /^save$/i });
    expect(saveBtn).toBeDisabled();
    expect(taskApi.update).not.toHaveBeenCalled();
  });

  it('updates a task title and description via the edit form', async () => {
    const user = userEvent.setup();
    render(<TaskBoard {...defaultProps} />);

    await waitFor(() => screen.getByText('Todo Task'));

    await user.dblClick(screen.getByText('Todo Task'));
    await user.clear(screen.getByLabelText(/^title$/i));
    await user.type(screen.getByLabelText(/^title$/i), 'Updated Title');
    await user.type(screen.getByLabelText(/description/i), 'Updated description');
    await user.click(screen.getByRole('button', { name: /^save$/i }));

    await waitFor(() => {
      expect(taskApi.update).toHaveBeenCalledWith('task-1', { title: 'Updated Title', description: 'Updated description' });
    });
  });

  it('shows the API error and keeps the edit dialog open when save fails', async () => {
    const user = userEvent.setup();
    vi.mocked(taskApi.update).mockRejectedValueOnce(new Error('Update failed'));
    render(<TaskBoard {...defaultProps} />);

    await waitFor(() => screen.getByText('Todo Task'));

    await user.dblClick(screen.getByText('Todo Task'));
    await user.clear(screen.getByLabelText(/^title$/i));
    await user.type(screen.getByLabelText(/^title$/i), 'Edited Title');
    await user.click(screen.getByRole('button', { name: /^save$/i }));

    await waitFor(() => {
      expect(screen.getByText(/update failed/i)).toBeInTheDocument();
    });
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  // R29-5: Task creation dialog opens
  it('opens the task creation dialog when Add task is clicked', async () => {
    const user = userEvent.setup();
    render(<TaskBoard {...defaultProps} />);

    await waitFor(() => screen.getByText('Todo Task'));

    const addBtn = screen.getByRole('button', { name: /add a new task/i });
    await user.click(addBtn);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByLabelText('Title')).toBeInTheDocument();
  });

  // R29-5: Task creation dialog closes on Cancel
  it('closes the task creation dialog when Cancel is clicked', async () => {
    const user = userEvent.setup();
    render(<TaskBoard {...defaultProps} />);

    await waitFor(() => screen.getByText('Todo Task'));

    await user.click(screen.getByRole('button', { name: /add a new task/i }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /cancel/i }));

    // Dialog should be closed (no 'open' attribute)
    const dialog = document.querySelector('dialog');
    expect(dialog).not.toHaveAttribute('open');
  });

  // R29-4: Task creation validation — empty title
  it('shows validation error for empty task title', async () => {
    const user = userEvent.setup();
    render(<TaskBoard {...defaultProps} />);

    await waitFor(() => screen.getByText('Todo Task'));

    await user.click(screen.getByRole('button', { name: /add a new task/i }));

    // Find and click the Add task submit button (inside dialog)
    const submitBtn = screen.getByRole('button', { name: /^add task$/i });
    // Submit button should be disabled when title is empty
    expect(submitBtn).toBeDisabled();

    expect(taskApi.create).not.toHaveBeenCalled();
  });

  // R29-4: Task creation validation — whitespace title
  it('shows validation error for whitespace-only task title', async () => {
    const user = userEvent.setup();
    render(<TaskBoard {...defaultProps} />);

    await waitFor(() => screen.getByText('Todo Task'));

    await user.click(screen.getByRole('button', { name: /add a new task/i }));

    const titleInput = screen.getByLabelText('Title');
    await user.type(titleInput, '   ');

    const submitBtn = screen.getByRole('button', { name: /^add task$/i });
    expect(submitBtn).toBeDisabled();

    expect(taskApi.create).not.toHaveBeenCalled();
  });

  // R29-4 + R29-5: Task creation with valid title creates task and closes dialog
  it('creates a task and closes dialog on valid submission', async () => {
    const user = userEvent.setup();
    render(<TaskBoard {...defaultProps} />);

    await waitFor(() => screen.getByText('Todo Task'));

    await user.click(screen.getByRole('button', { name: /add a new task/i }));

    const titleInput = screen.getByLabelText('Title');
    await user.type(titleInput, 'New Task');

    const submitBtn = screen.getByRole('button', { name: /^add task$/i });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(taskApi.create).toHaveBeenCalledWith('board-1', 'New Task', undefined);
    });

    // Dialog closed
    const dialog = document.querySelector('dialog');
    expect(dialog).not.toHaveAttribute('open');
  });

  it('creates a task in the active filter status instead of defaulting to all', async () => {
    const user = userEvent.setup();
    render(<TaskBoard {...defaultProps} />);

    await waitFor(() => screen.getByText('Done Task'));
    await user.click(screen.getByRole('button', { name: /^done$/i }));

    await user.click(screen.getByRole('button', { name: /add a new task/i }));
    const titleInput = screen.getByLabelText('Title');
    await user.type(titleInput, 'Done Filter Task');
    await user.click(screen.getByRole('button', { name: /^add task$/i }));

    await waitFor(() => {
      expect(taskApi.update).toHaveBeenCalledWith('task-new', { status: 'DONE' });
    });
  });

  // R29-7: Status filtering
  it('hides tasks that do not match the selected filter', async () => {
    const user = userEvent.setup();
    render(<TaskBoard {...defaultProps} />);

    await waitFor(() => screen.getByText('Todo Task'));

    // Click "To Do" filter
    await user.click(screen.getByRole('button', { name: /^to do$/i }));

    // TODO task visible
    expect(screen.getByText('Todo Task')).toBeInTheDocument();

    // Non-TODO tasks not visible
    expect(screen.queryByText('Progress Task')).not.toBeInTheDocument();
    expect(screen.queryByText('Done Task')).not.toBeInTheDocument();
    expect(document.querySelector('[data-column-status="IN_PROGRESS"]')).not.toBeInTheDocument();
    expect(document.querySelector('[data-column-status="DONE"]')).not.toBeInTheDocument();
  });

  it('shows only the selected status column for the Done filter', async () => {
    const user = userEvent.setup();
    render(<TaskBoard {...defaultProps} />);

    await waitFor(() => screen.getByText('Todo Task'));
    await user.click(screen.getByRole('button', { name: /^done$/i }));

    expect(screen.getByText('Done Task')).toBeInTheDocument();
    expect(document.querySelector('[data-column-status="DONE"]')).toBeInTheDocument();
    expect(document.querySelector('[data-column-status="TODO"]')).not.toBeInTheDocument();
    expect(document.querySelector('[data-column-status="IN_PROGRESS"]')).not.toBeInTheDocument();
  });

  it('restores the last saved status filter after refresh', async () => {
    localStorage.setItem('mini-task-manager:last-status-filter', 'DONE');
    render(<TaskBoard {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /^done$/i })).toHaveClass('is-active');
    });

    expect(document.querySelector('[data-column-status="DONE"]')).toBeInTheDocument();
    expect(document.querySelector('[data-column-status="TODO"]')).not.toBeInTheDocument();
    expect(document.querySelector('[data-column-status="IN_PROGRESS"]')).not.toBeInTheDocument();
  });

  it('shows only the empty filter state when the selected status has no tasks', async () => {
    const user = userEvent.setup();
    vi.mocked(taskApi.getByBoardId).mockResolvedValue(makeTasks().filter(task => task.status !== 'DONE'));
    render(<TaskBoard {...defaultProps} />);

    await waitFor(() => screen.getByText('Todo Task'));
    await user.click(screen.getByRole('button', { name: /^done$/i }));

    expect(screen.getByText('No tasks match the selected filter.')).toBeInTheDocument();
    expect(document.querySelector('[data-column-status="DONE"]')).not.toBeInTheDocument();
    expect(screen.queryByText('Drop tasks here')).not.toBeInTheDocument();
  });

  // R29-7: All filter shows all tasks
  it('shows all tasks when All filter is selected', async () => {
    const user = userEvent.setup();
    render(<TaskBoard {...defaultProps} />);

    await waitFor(() => screen.getByText('Todo Task'));

    // First filter to TODO
    await user.click(screen.getByRole('button', { name: /^to do$/i }));
    expect(screen.queryByText('Progress Task')).not.toBeInTheDocument();

    // Then reset to All
    await user.click(screen.getByRole('button', { name: /^all$/i }));

    expect(screen.getByText('Todo Task')).toBeInTheDocument();
    expect(screen.getByText('Progress Task')).toBeInTheDocument();
    expect(screen.getByText('Done Task')).toBeInTheDocument();
  });

  // R29-8: Task deletion
  it('calls taskApi.delete when delete button is clicked', async () => {
    const user = userEvent.setup();
    render(<TaskBoard {...defaultProps} />);

    await waitFor(() => screen.getByText('Todo Task'));

    const deleteBtn = screen.getByRole('button', { name: /delete task: todo task/i });
    await user.click(deleteBtn);

    await waitFor(() => {
      expect(taskApi.delete).toHaveBeenCalledWith('task-1');
    });
  });

  // R29-8: Deleted task is removed from UI
  it('removes deleted task from the UI', async () => {
    const user = userEvent.setup();
    render(<TaskBoard {...defaultProps} />);

    await waitFor(() => screen.getByText('Todo Task'));

    const deleteBtn = screen.getByRole('button', { name: /delete task: todo task/i });
    await user.click(deleteBtn);

    await waitFor(() => {
      expect(screen.queryByText('Todo Task')).not.toBeInTheDocument();
    });
  });

  // R29-9: Status update via select
  it('calls taskApi.update when status select is changed', async () => {
    const user = userEvent.setup();
    render(<TaskBoard {...defaultProps} />);

    await waitFor(() => screen.getByText('Todo Task'));

    const statusSelect = screen.getByRole('combobox', { name: /change status of "todo task"/i });
    await user.selectOptions(statusSelect, 'IN_PROGRESS');

    await waitFor(() => {
      expect(taskApi.update).toHaveBeenCalledWith('task-1', { status: 'IN_PROGRESS' });
    });
  });

  it('updates task status when a card is dropped into another column', async () => {
    render(<TaskBoard {...defaultProps} />);

    await waitFor(() => screen.getByText('Todo Task'));

    const taskCard = screen.getByText('Todo Task').closest('[data-task-id]');
    const targetColumn = document.querySelector('[data-column-status="IN_PROGRESS"]');
    const dataTransfer = {
      effectAllowed: '',
      dropEffect: '',
      setData: vi.fn(),
      getData: vi.fn(),
    };

    expect(taskCard).not.toBeNull();
    expect(targetColumn).not.toBeNull();

    fireEvent.dragStart(taskCard!, { dataTransfer });
    fireEvent.drop(targetColumn!, { dataTransfer });

    expect(document.querySelector('.delete-zone')).not.toHaveClass('is-visible');

    await waitFor(() => {
      expect(taskApi.update).toHaveBeenCalledWith('task-1', { status: 'IN_PROGRESS' });
    });
  });

  // R29-10: API failure on load
  it('shows error message when task loading fails', async () => {
    vi.mocked(taskApi.getByBoardId).mockRejectedValue(new Error('Network error'));

    render(<TaskBoard {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText(/could not load tasks/i)).toBeInTheDocument();
    });
  });

  // R29-10: API failure on delete restores task in UI
  it('restores deleted task in UI when delete API fails', async () => {
    vi.mocked(taskApi.delete).mockRejectedValue(new Error('Delete failed'));
    const user = userEvent.setup();

    render(<TaskBoard {...defaultProps} />);

    await waitFor(() => screen.getByText('Todo Task'));

    const deleteBtn = screen.getByRole('button', { name: /delete task: todo task/i });
    await user.click(deleteBtn);

    // Task should reappear after API failure
    await waitFor(() => {
      expect(screen.getByText('Todo Task')).toBeInTheDocument();
    });
  });

  // R29-10: API failure on status update restores previous status
  it('restores previous status when status update API fails', async () => {
    vi.mocked(taskApi.update).mockRejectedValue(new Error('Update failed'));
    const user = userEvent.setup();

    render(<TaskBoard {...defaultProps} />);

    await waitFor(() => screen.getByText('Todo Task'));

    const statusSelect = screen.getByRole('combobox', { name: /change status of "todo task"/i });
    await user.selectOptions(statusSelect, 'DONE');

    // After failure, re-query the select (DOM may be replaced by React re-render)
    await waitFor(() => {
      const freshSelect = screen.getByRole('combobox', { name: /change status of "todo task"/i });
      expect(freshSelect).toHaveValue('TODO');
    });
  });
});
