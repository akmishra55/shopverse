
import axios from 'axios';

/**
 * Axios instance with an automatic token-refresh interceptor:
 *   1. Attaches the short-lived JWT to every request.
 *   2. On a 401, tries /auth/refresh ONCE (refresh cookie is httpOnly),
 *      then silently retries the original request.
 *   3. Concurrent 401s share a single refresh (promise-deduplication).
 */
const api = axios.create({ baseURL: '/api', withCredentials: true });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('sv_access');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let refreshing = null;
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retried) {
      original._retried = true;
      try {
        refreshing = refreshing || api.post('/auth/refresh');
        const { data } = await refreshing;
        refreshing = null;
        localStorage.setItem('sv_access', data.accessToken);
        original.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(original);
      } catch {
        refreshing = null;
        localStorage.removeItem('sv_access');
        if (!location.pathname.startsWith('/login')) {
          location.href = '/login?expired=1';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
