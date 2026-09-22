import { useState, useEffect } from 'react';
import type { Board } from '../types';
import { boardApi } from '../api/boardApi';
import './BoardList.css';

interface BoardListProps {
  onSelectBoard: (board: Board) => void;
  selectedBoardId: string | null;
}

export function BoardList({ onSelectBoard, selectedBoardId }: BoardListProps) {
  const [boards, setBoards] = useState<Board[]>([]);
  const [newBoardName, setNewBoardName] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchBoards = async () => {
    try {
      const data = await boardApi.getAll();
      setBoards(data);
    } catch (error) {
      console.error('Failed to fetch boards:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBoards();
  }, []);

  const handleCreateBoard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBoardName.trim()) return;
    try {
      const newBoard = await boardApi.create(newBoardName);
      setBoards([newBoard, ...boards]);
      setNewBoardName('');
      onSelectBoard(newBoard);
    } catch (error) {
      console.error('Failed to create board:', error);
    }
  };

  const handleDeleteBoard = async (boardId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await boardApi.delete(boardId);
      setBoards(boards.filter(b => b.id !== boardId));
      if (selectedBoardId === boardId) {
        onSelectBoard(null as any); // Type safety compromised for simplicity
      }
    } catch (error) {
      console.error('Failed to delete board:', error);
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
          onChange={(e) => setNewBoardName(e.target.value)}
          placeholder="New Board Name"
          className="create-board-input"
        />
        <button type="submit" className="create-board-btn" disabled={!newBoardName.trim()}>
          Add
        </button>
      </form>

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
        {boards.length === 0 && (
          <div className="empty-boards">No boards found. Create one above!</div>
        )}
      </ul>
    </div>
  );
}
