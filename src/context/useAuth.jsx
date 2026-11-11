import { createContext, useState, useContext, useEffect, useRef } from 'react';
import axios from 'axios';
import { injectAuthStore } from '../api/axios';
import { getProfile } from '../api/endpoints';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const tokenRef = useRef(token);

  useEffect(() => {
    tokenRef.current = token;
  }, [token]);

  const effectRan = useRef(false);

  const login = (newToken, userData) => {
    setToken(newToken);
    setUser(userData);
  };

  const logout = async () => {
    try {
      await axios.post(
        'http://localhost:3000/api/v1/auth/logout',
        {},
        { withCredentials: true }
      );
    } catch {
      // cookie may already be gone — still clear local state
    }
    setToken(null);
    setUser(null);
  };

  useEffect(() => {
    injectAuthStore(
      () => tokenRef.current,
      (newToken) => setToken(newToken),
      logout
    );
  }, []);

  useEffect(() => {
    if (effectRan.current) return;

    async function updateToken() {
      try {
        if (!tokenRef.current) {
          const response = await axios.post(
            'http://localhost:3000/api/v1/auth/refresh',
            {},
            { withCredentials: true }
          );

          const { accessToken } = response.data;
          setToken(accessToken);

          // Fetch the full profile so `user` has name/subjects/streak etc.
          const profile = await getProfile();
          setUser(profile);
        }
      } catch {
        // No active session — stay logged out
      } finally {
        setLoading(false);
      }
    }

    updateToken();

    return () => {
      effectRan.current = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-100">
        <div className="w-6 h-6 border-2 border-stone-300 border-t-amber-700 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ token, setToken, user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  return useContext(AuthContext);
};
