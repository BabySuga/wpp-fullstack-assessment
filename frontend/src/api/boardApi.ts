import apiClient from './client';
import type { Board } from '../types';

export const boardApi = {
  getAll: async (): Promise<Board[]> => {
    const response = await apiClient.get('/api/boards');
    return response.data;
  },

  create: async (name: string): Promise<Board> => {
    const response = await apiClient.post('/api/boards', { name });
    return response.data;
  },

  delete: async (boardId: string): Promise<void> => {
    await apiClient.delete(`/api/boards/${boardId}`);
  },
};
