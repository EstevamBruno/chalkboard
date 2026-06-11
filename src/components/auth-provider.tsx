"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { api, clearToken, getToken, setToken } from "@/lib/api";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, name: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = React.createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<AuthUser | null>(null);
  const [loading, setLoading] = React.useState(true);
  const router = useRouter();

  // Restore session from a stored token on mount.
  React.useEffect(() => {
    let active = true;
    (async () => {
      if (!getToken()) {
        setLoading(false);
        return;
      }
      try {
        const { user } = await api<{ user: AuthUser }>("/api/auth/me");
        if (active) setUser(user);
      } catch {
        clearToken();
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const login = React.useCallback(async (email: string, password: string) => {
    const { user, token } = await api<{ user: AuthUser; token: string }>("/api/auth/login", {
      method: "POST",
      body: { email, password },
    });
    setToken(token);
    setUser(user);
  }, []);

  const register = React.useCallback(
    async (email: string, name: string, password: string) => {
      const { user, token } = await api<{ user: AuthUser; token: string }>(
        "/api/auth/register",
        { method: "POST", body: { email, name, password } }
      );
      setToken(token);
      setUser(user);
    },
    []
  );

  const logout = React.useCallback(() => {
    clearToken();
    setUser(null);
    router.push("/login");
  }, [router]);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
