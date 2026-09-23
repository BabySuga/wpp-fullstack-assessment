import { useState, useEffect } from 'react';
import type { Board } from '../types';
import { boardApi } from '../api/boardApi';
import { getUserFriendlyError } from '../api/client';
import './BoardList.css';

interface BoardListProps {
  onSelectBoard: (board: Board | null) => void;
  selectedBoardId: string | null;
}

export function BoardList({ onSelectBoard, selectedBoardId }: BoardListProps) {
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
      return 'Board name is required.';
    }

    return null;
  };

  const handleCreateBoard = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = newBoardName.trim();
    const validationError = validateBoardName(trimmedName);

    setBoardNameError(validationError);

    if (validationError) {
      return;
    }

    try {
      const newBoard = await boardApi.create(trimmedName);
      setBoards([newBoard, ...boards]);
      setNewBoardName('');
      setBoardNameError(null);
      onSelectBoard(newBoard);
    } catch (caughtError) {
      setBoardNameError(getUserFriendlyError(caughtError));
      setError(null);
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

  if (loading) return <div className="board-sidebar-loading">Loading boards...</div>;

  return (
    <div className="board-sidebar">
      <h2 className="sidebar-title">Boards</h2>
      
      <form onSubmit={handleCreateBoard} className="create-board-form">
        <input
          type="text"
          value={newBoardName}
          onChange={(e) => {
            setNewBoardName(e.target.value);
            if (boardNameError) {
              setBoardNameError(null);
            }
          }}
          placeholder="New Board Name"
          className="create-board-input"
          aria-invalid={Boolean(boardNameError)}
        />
        <button type="submit" className="create-board-btn" disabled={!newBoardName.trim()}>
          Add
        </button>
        {boardNameError && (
          <div role="alert" style={{ color: '#d93025', marginTop: '6px', fontSize: '0.85rem' }}>
            {boardNameError}
          </div>
        )}
      </form>

      {error && (
        <div className="board-state-message board-error">
          <p>{error}</p>
          <button type="button" className="retry-btn" onClick={fetchBoards}>Try again</button>
        </div>
      )}

      <ul className="board-list">
        {boards.map(board => (
          <li 
            key={board.id} 
            className={`board-item ${selectedBoardId === board.id ? 'selected' : ''}`}
            onClick={() => onSelectBoard(board)}
          >
            <span className="board-name">{board.name}</span>
            <button 
              className="delete-board-btn" 
              onClick={(e) => handleDeleteBoard(board.id, e)}
              title="Delete Board"
            >
              &times;
            </button>
          </li>
        ))}
        {!error && boards.length === 0 && (
          <div className="empty-boards">No boards found. Create one above!</div>
        )}
      </ul>
    </div>
  );
}
