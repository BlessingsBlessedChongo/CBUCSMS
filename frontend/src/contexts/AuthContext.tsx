import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useRef,
} from 'react';
import type { ReactNode } from 'react';
import api from '../services/api';
import type { AuthResponse, User } from '../types';

const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<User>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function getStoredAccessToken(): string | null {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

function getStoredRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

function persistTokens(access: string, refresh: string) {
  localStorage.setItem(ACCESS_TOKEN_KEY, access);
  localStorage.setItem(REFRESH_TOKEN_KEY, refresh);
}

function purgeAuthStorage() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const initialCheckDone = useRef(false);

  // Logout simply clears everything – no side effects that trigger re‑checks.
  const logout = useCallback(() => {
    purgeAuthStorage();
    setUser(null);
    setIsLoading(false);
  }, []);

  // Login returns the user and persists tokens.
  const login = useCallback(async (username: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await api.post<AuthResponse>('/auth/login/', { username, password });
      persistTokens(response.data.access, response.data.refresh);
      setUser(response.data.user);
      setIsLoading(false);
      return response.data.user;
    } catch (error) {
      purgeAuthStorage();
      setUser(null);
      setIsLoading(false);
      throw error;
    }
  }, []);

  // One‑time check on mount: if there's an access token, fetch the user.
  useEffect(() => {
    if (initialCheckDone.current) return;
    initialCheckDone.current = true;

    const token = getStoredAccessToken();
    if (!token) {
      setIsLoading(false);
      return;
    }

    api
      .get<User>('/auth/me/')
      .then((response) => setUser(response.data))
      .catch(() => {
        purgeAuthStorage();
        setUser(null);
      })
      .finally(() => setIsLoading(false));
  }, []); // empty dependency – runs exactly once

  // Silent token refresh interval (only when user is logged in)
  useEffect(() => {
    if (!user) return;

    const intervalId = window.setInterval(async () => {
      const refresh = getStoredRefreshToken();
      if (!refresh) {
        logout();
        return;
      }
      try {
        const response = await api.post<{ access: string }>('/auth/token/refresh/', { refresh });
        localStorage.setItem(ACCESS_TOKEN_KEY, response.data.access);
      } catch {
        logout();
      }
    }, 1000 * 60 * 4); // refresh every 4 minutes

    return () => window.clearInterval(intervalId);
  }, [user, logout]);

  const isAuthenticated = Boolean(user);

  const value = useMemo(
    () => ({ user, isAuthenticated, isLoading, login, logout }),
    [user, isAuthenticated, isLoading, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}