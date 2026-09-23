import { useEffect, useState } from 'react';
import { BoardList } from './components/BoardList';
import { TaskBoard } from './components/TaskBoard';
import type { Board } from './types';
import './App.css';

const LAST_SELECTED_BOARD_KEY = 'mini-task-manager:last-board';

function App() {
  const [selectedBoard, setSelectedBoard] = useState<Board | null>(() => {
    try {
      const savedBoard = localStorage.getItem(LAST_SELECTED_BOARD_KEY);
      return savedBoard ? JSON.parse(savedBoard) as Board : null;
    } catch {
      return null;
    }
  });
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (selectedBoard) {
      localStorage.setItem(LAST_SELECTED_BOARD_KEY, JSON.stringify(selectedBoard));
    } else {
      localStorage.removeItem(LAST_SELECTED_BOARD_KEY);
    }
  }, [selectedBoard]);

  const handleSelectBoard = (board: Board | null) => {
    setSelectedBoard(board);
    setSidebarOpen(false); // close mobile drawer on selection
  };

  return (
    <div className="app">
      {/* Mobile overlay */}
      <div
        className={`sidebar-overlay ${sidebarOpen ? 'is-visible' : ''}`}
        onClick={() => setSidebarOpen(false)}
        aria-hidden="true"
      />

      <BoardList
        onSelectBoard={handleSelectBoard}
        selectedBoardId={selectedBoard?.id ?? null}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <main className="app-main">
        {selectedBoard ? (
          <TaskBoard
            board={selectedBoard}
            onOpenSidebar={() => setSidebarOpen(true)}
          />
        ) : (
          <div className="no-board-selected">
            <div className="no-board-topbar">
              <button
                className="menu-toggle"
                onClick={() => setSidebarOpen(true)}
                aria-label="Open navigation"
              >
                ☰
              </button>
              <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
                Mini Task Manager
              </span>
            </div>
            <div className="no-board-empty">
              <div className="empty-state">
                <h2>No board selected</h2>
                <p>Select a board from the sidebar, or create a new one to get started.</p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
