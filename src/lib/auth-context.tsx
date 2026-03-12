"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { UserResponse } from "@/types";
import { getMe, login as apiLogin, register as apiRegister, getPendingReceived, ApiError } from "@/lib/api";
import type { UserCreate, UserLogin } from "@/types";

interface AuthContextType {
  user: UserResponse | null;
  loading: boolean;
  login: (data: UserLogin) => Promise<void>;
  register: (data: UserCreate) => Promise<void>;
  logout: () => void;
  pendingFriendsCount: number;
  refreshPendingCount: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [pendingFriendsCount, setPendingFriendsCount] = useState(0);

  const refreshPendingCount = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const pending = await getPendingReceived();
      setPendingFriendsCount(pending.length);
    } catch {
      // silently ignore
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setLoading(false);
      return;
    }
    (async () => {
      try {
        const me = await getMe();
        setUser(me);
        const pending = await getPendingReceived();
        setPendingFriendsCount(pending.length);
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
          localStorage.removeItem("token");
        }
      } finally {
        setLoading(false);
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Poll for pending requests every 60s
  useEffect(() => {
    const interval = setInterval(refreshPendingCount, 60_000);
    return () => clearInterval(interval);
  }, [refreshPendingCount]);

  const login = async (data: UserLogin) => {
    const res = await apiLogin(data);
    localStorage.setItem("token", res.access_token);
    const me = await getMe();
    setUser(me);
    // Persist identity for "Bem-vindo de volta" UX on next login
    localStorage.setItem("saved_identifier", data.identifier);
    localStorage.setItem("saved_name", me.full_name || me.username);
    await refreshPendingCount();
  };

  const register = async (data: UserCreate) => {
    await apiRegister(data);
    await login({ identifier: data.email, password: data.password });
  };

  const logout = () => {
    localStorage.removeItem("token");
    // Keep saved_identifier / saved_name so the login page can show "Bem-vindo de volta"
    setUser(null);
    setPendingFriendsCount(0);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, pendingFriendsCount, refreshPendingCount }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
