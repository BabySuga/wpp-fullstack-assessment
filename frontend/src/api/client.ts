import axios from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const getUserFriendlyError = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    if (!error.response) {
      return 'The service is temporarily unavailable. Please try again in a moment.';
    }

    const status = error.response.status;
    if (status >= 500) {
      return 'The service is temporarily unavailable. Please try again in a moment.';
    }

    const responseData = error.response.data as {
      message?: string;
      error?: string;
      detail?: string | Array<{ msg?: string; message?: string }>;
    } | undefined;

    const directMessage = responseData?.message || responseData?.error;
    if (typeof directMessage === 'string' && directMessage.trim()) {
      return directMessage;
    }

    if (Array.isArray(responseData?.detail)) {
      const detailMessage = responseData.detail.find((entry) => typeof entry?.msg === 'string' && entry.msg.trim())
        ?? responseData.detail.find((entry) => typeof entry?.message === 'string' && entry.message.trim());

      if (detailMessage && typeof detailMessage.msg === 'string' && detailMessage.msg.trim()) {
        return detailMessage.msg;
      }

      if (detailMessage && typeof detailMessage.message === 'string' && detailMessage.message.trim()) {
        return detailMessage.message;
      }
    }

    if (typeof responseData?.detail === 'string' && responseData.detail.trim()) {
      return responseData.detail;
    }

    if (status === 404) {
      return 'The requested information could not be found.';
    }

    return 'Something went wrong while loading this data. Please try again.';
  }

  return 'Something went wrong while loading this data. Please try again.';
};

export default apiClient;
