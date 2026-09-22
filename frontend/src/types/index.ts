export interface Board {
  id: string;
  name: string;
  created_at: string;
}

export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE';

export interface Task {
  id: string;
  board_id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  created_at: string;
  updated_at: string;
}

export interface ErrorResponse {
  error: string;
  message: string;
  field: string | null;
}
