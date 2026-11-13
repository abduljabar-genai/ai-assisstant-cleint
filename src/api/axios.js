import axios from 'axios';

const api = axios.create({
  baseURL: 'https://ai-assisstant-backend-ryl3.vercel.app/api/v1',
  withCredentials: true, // Required for req.cookies.refresh_token
});

let getTokenFunc = null;
let setTokenFunc = null;
let logoutFunc = null;

export const injectAuthStore = (getToken, setToken, logout) => {
  getTokenFunc = getToken;
  setTokenFunc = setToken;
  logoutFunc = logout;
};

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Request Interceptor: Attach Access Token
api.interceptors.request.use(
  (config) => {
    const token = getTokenFunc ? getTokenFunc() : null;
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Catch 401 & Silent Refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers['Authorization'] = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const response = await axios.post(
          'http://localhost:3000/api/v1/auth/refresh',
          {},
          { withCredentials: true }
        );

        const { accessToken } = response.data;

        if (setTokenFunc) setTokenFunc(accessToken);

        processQueue(null, accessToken);
        originalRequest.headers['Authorization'] = `Bearer ${accessToken}`;

        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        if (logoutFunc) logoutFunc();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
