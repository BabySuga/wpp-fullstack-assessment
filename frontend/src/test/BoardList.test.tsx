import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BoardList } from '../components/BoardList';
import { boardApi } from '../api/boardApi';
import type { Board } from '../types';

// Mock the boardApi module
vi.mock('../api/boardApi');

const mockBoards: Board[] = [
  { id: 'board-1', name: 'Alpha Project', created_at: '2024-01-01T00:00:00Z' },
  { id: 'board-2', name: 'Beta Project', created_at: '2024-01-02T00:00:00Z' },
];

const defaultProps = {
  onSelectBoard: vi.fn(),
  selectedBoardId: null,
  isOpen: false,
  onClose: vi.fn(),
};

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(boardApi.getAll).mockResolvedValue(mockBoards);
  vi.mocked(boardApi.create).mockResolvedValue({
    id: 'board-3',
    name: 'New Board',
    created_at: '2024-01-03T00:00:00Z',
  });
  vi.mocked(boardApi.delete).mockResolvedValue(undefined);
});

describe('BoardList', () => {
  // R29-1: Board list renders boards
  it('renders board names from API', async () => {
    render(<BoardList {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('Alpha Project')).toBeInTheDocument();
      expect(screen.getByText('Beta Project')).toBeInTheDocument();
    });
  });

  // R29-1: Board list renders all fetched boards
  it('calls getAll on mount', async () => {
    render(<BoardList {...defaultProps} />);

    await waitFor(() => {
      expect(boardApi.getAll).toHaveBeenCalledTimes(1);
    });
  });

  // R29-2: Board selection
  it('calls onSelectBoard with the clicked board', async () => {
    const user = userEvent.setup();
    const onSelectBoard = vi.fn();

    render(<BoardList {...defaultProps} onSelectBoard={onSelectBoard} />);

    await waitFor(() => screen.getByText('Alpha Project'));

    await user.click(screen.getByText('Alpha Project'));

    expect(onSelectBoard).toHaveBeenCalledWith(mockBoards[0]);
  });

  // R29-2: Selected board gets visual indicator
  it('marks the selected board with is-selected', async () => {
    render(<BoardList {...defaultProps} selectedBoardId="board-1" />);

    await waitFor(() => screen.getByText('Alpha Project'));

    const boardItem = screen.getByText('Alpha Project').closest('.board-item');
    expect(boardItem).toHaveClass('is-selected');
  });

  // R29-3: Board creation validation — empty
  it('rejects board creation when name is empty', async () => {
    const user = userEvent.setup();
    render(<BoardList {...defaultProps} />);

    await waitFor(() => screen.getByText('Alpha Project'));

    // Submit without typing anything — button is disabled
    const addBtn = screen.getByRole('button', { name: /add/i });
    expect(addBtn).toBeDisabled();

    // Verify API was NOT called
    expect(boardApi.create).not.toHaveBeenCalled();
  });

  // R29-3: Board creation validation — whitespace only
  it('rejects board creation when name is whitespace only', async () => {
    const user = userEvent.setup();
    render(<BoardList {...defaultProps} />);

    await waitFor(() => screen.getByText('Alpha Project'));

    const input = screen.getByPlaceholderText(/new board name/i);
    await user.type(input, '   ');

    // Button remains disabled for whitespace-only input
    const addBtn = screen.getByRole('button', { name: /add/i });
    expect(addBtn).toBeDisabled();

    expect(boardApi.create).not.toHaveBeenCalled();
  });

  // R29-3: Board creation with valid name
  it('creates a board and clears the input on success', async () => {
    const user = userEvent.setup();
    const onSelectBoard = vi.fn();
    render(<BoardList {...defaultProps} onSelectBoard={onSelectBoard} />);

    await waitFor(() => screen.getByText('Alpha Project'));

    const input = screen.getByPlaceholderText(/new board name/i);
    await user.type(input, 'New Board');
    await user.click(screen.getByRole('button', { name: /add/i }));

    await waitFor(() => {
      expect(boardApi.create).toHaveBeenCalledWith('New Board');
      expect(onSelectBoard).toHaveBeenCalledWith(expect.objectContaining({ name: 'New Board' }));
    });

    // Input is cleared after creation
    expect(input).toHaveValue('');
  });

  // R29-8: Task deletion (board delete) calls API
  it('deletes a board when delete button is clicked', async () => {
    const user = userEvent.setup();
    render(<BoardList {...defaultProps} />);

    await waitFor(() => screen.getByText('Alpha Project'));

    const deleteBtn = screen.getByRole('button', { name: /delete board: alpha project/i });
    await user.click(deleteBtn);

    await waitFor(() => {
      expect(boardApi.delete).toHaveBeenCalledWith('board-1');
    });
  });

  // R29-10: API failure displayed
  it('shows an error message when getAll fails', async () => {
    vi.mocked(boardApi.getAll).mockRejectedValue(new Error('Network error'));

    render(<BoardList {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });
});
