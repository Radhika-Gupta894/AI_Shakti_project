import { useState, useCallback } from 'react';

/**
 * Custom hook to handle API calls with loading, error, and data states.
 */
export const useApi = (apiFunc) => {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  const request = useCallback(async (...args) => {
    setLoading(true);
    setError(null);
    setProgress(0);
    try {
      // For file uploads, we might pass an onUploadProgress callback
      const response = await apiFunc(...args, (progressEvent) => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        setProgress(percentCompleted);
      });
      setData(response.data);
      return response.data;
    } catch (err) {
      const msg = err.response?.data?.detail || err.message || 'Request failed';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [apiFunc]);

  return { data, error, loading, progress, request, setData };
};
