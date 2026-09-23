import { useState, useEffect } from 'react';
import type { Board } from '../types';
import { boardApi } from '../api/boardApi';
import { getUserFriendlyError } from '../api/client';
import './BoardList.css';

interface BoardListProps {
  onSelectBoard: (board: Board | null) => void;
  selectedBoardId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export function BoardList({ onSelectBoard, selectedBoardId, isOpen, onClose }: BoardListProps) {
  const [boards, setBoards] = useState<Board[]>([]);
  const [newBoardName, setNewBoardName] = useState('');
  const [boardNameError, setBoardNameError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBoards = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await boardApi.getAll();
      setBoards(data);
    } catch (caughtError) {
      setError(getUserFriendlyError(caughtError));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBoards();
  }, []);

  const validateBoardName = (value: string): string | null => {
    if (!value.trim()) {
      return 'Board name cannot be empty.';
    }
    return null;
  };

  const handleCreateBoard = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = newBoardName.trim();
    const validationError = validateBoardName(trimmedName);

    setBoardNameError(validationError);
    if (validationError) return;

    try {
      const newBoard = await boardApi.create(trimmedName);
      setBoards([newBoard, ...boards]);
      setNewBoardName('');
      setBoardNameError(null);
      onSelectBoard(newBoard);
    } catch (caughtError) {
      setBoardNameError(getUserFriendlyError(caughtError));
    }
  };

  const handleDeleteBoard = async (boardId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await boardApi.delete(boardId);
      setBoards(boards.filter(b => b.id !== boardId));
      if (selectedBoardId === boardId) {
        onSelectBoard(null);
      }
    } catch (caughtError) {
      setError(getUserFriendlyError(caughtError));
    }
  };

  return (
    <nav
      className={`sidebar${isOpen ? ' is-open' : ''}`}
      aria-label="Boards navigation"
    >
      <div className="sidebar-header">
        <span className="sidebar-title">Boards</span>
        <button
          className="sidebar-close"
          onClick={onClose}
          aria-label="Close navigation"
        >
          ✕
        </button>
      </div>

      <div className="create-board-section">
        <form onSubmit={handleCreateBoard} className="create-board-form">
          <input
            id="new-board-name"
            type="text"
            value={newBoardName}
            onChange={(e) => {
              setNewBoardName(e.target.value);
              if (boardNameError) setBoardNameError(null);
            }}
            placeholder="New board name…"
            className="input create-board-input"
            aria-label="New board name"
            aria-invalid={Boolean(boardNameError)}
            aria-describedby={boardNameError ? 'board-name-error' : undefined}
          />
          <button
            type="submit"
            className="btn btn-primary"
            disabled={!newBoardName.trim()}
          >
            Add
          </button>
        </form>
        {boardNameError && (
          <p
            id="board-name-error"
            role="alert"
            className="field-error create-board-error"
          >
            {boardNameError}
          </p>
        )}
      </div>

      {error && (
        <div className="sidebar-error" role="alert">
          <p>{error}</p>
          <button type="button" className="btn btn-secondary" onClick={fetchBoards}>
            Try again
          </button>
        </div>
      )}

      <div className="board-list-section">
        {loading ? (
          <div className="sidebar-loading">Loading…</div>
        ) : (
          <ul className="board-list" role="list">
            {boards.map(board => (
              <li key={board.id}>
                <div
                  className={`board-item${selectedBoardId === board.id ? ' is-selected' : ''}`}
                  onClick={() => onSelectBoard(board)}
                  role="button"
                  tabIndex={0}
                  aria-pressed={selectedBoardId === board.id}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onSelectBoard(board);
                    }
                  }}
                >
                  <span className="board-name" title={board.name}>{board.name}</span>
                  <button
                    className="delete-board-btn"
                    onClick={(e) => handleDeleteBoard(board.id, e)}
                    aria-label={`Delete board: ${board.name}`}
                  >
                    ✕
                  </button>
                </div>
              </li>
            ))}
            {!loading && !error && boards.length === 0 && (
              <li className="board-list-empty">No boards yet. Create one above.</li>
            )}
          </ul>
        )}
      </div>
    </nav>
  );
}
