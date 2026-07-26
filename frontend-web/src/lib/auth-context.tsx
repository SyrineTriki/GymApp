"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useRouter } from "next/navigation";
import * as api from "@/lib/api";

interface AuthState {
  token: string | null;
  role: string | null;
  name: string | null;
  isLoggedIn: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [name, setName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    setToken(localStorage.getItem("token"));
    setRole(localStorage.getItem("role"));
    setName(localStorage.getItem("name"));
    setLoading(false);
  }, []);

  async function login(email: string, password: string) {
    const res = await api.login(email, password);
    localStorage.setItem("token", res.access_token);
    localStorage.setItem("role", res.role);
    localStorage.setItem("name", res.name);
    setToken(res.access_token);
    setRole(res.role);
    setName(res.name);
  }

  function logout() {
    localStorage.clear();
    setToken(null);
    setRole(null);
    setName(null);
    router.push("/login");
  }

  const value: AuthState = {
    token,
    role,
    name,
    isLoggedIn: !!token,
    isAdmin: role === "admin",
    isSuperAdmin: role === "super_admin",
    loading,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
