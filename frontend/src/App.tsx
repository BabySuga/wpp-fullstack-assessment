import { useState } from 'react';
import { BoardList } from './components/BoardList';
import { TaskBoard } from './components/TaskBoard';
import type { Board } from './types';
import './App.css';

function App() {
  const [selectedBoard, setSelectedBoard] = useState<Board | null>(null);

  return (
    <div className="app-container">
      <BoardList 
        onSelectBoard={setSelectedBoard} 
        selectedBoardId={selectedBoard?.id || null} 
      />
      
      {selectedBoard ? (
        <TaskBoard board={selectedBoard} />
      ) : (
        <div className="no-board-selected">
          <div className="empty-state-content">
            <h2>Welcome to Mini Task Manager</h2>
            <p>Select a board from the sidebar or create a new one to get started.</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
