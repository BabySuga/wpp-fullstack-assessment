import apiClient from './client';
import type { Task, TaskStatus } from '../types';

export const taskApi = {
  getByBoardId: async (boardId: string, status?: TaskStatus): Promise<Task[]> => {
    const params = status ? { status } : {};
    const response = await apiClient.get(`/api/boards/${boardId}/tasks`, { params });
    return response.data;
  },

  create: async (boardId: string, title: string, description?: string): Promise<Task> => {
    const response = await apiClient.post(`/api/boards/${boardId}/tasks`, { title, description });
    return response.data;
  },

  update: async (taskId: string, data: { status?: TaskStatus; title?: string; description?: string }): Promise<Task> => {
    const response = await apiClient.patch(`/api/tasks/${taskId}`, data);
    return response.data;
  },

  delete: async (taskId: string): Promise<void> => {
    await apiClient.delete(`/api/tasks/${taskId}`);
  },
};
