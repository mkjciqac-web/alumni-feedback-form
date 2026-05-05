import { useEffect, useState } from "react";

const STORAGE_KEY = "adminAuth";
const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "admin@318";

export function isAdminAuthenticated(): boolean {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return false;
    const data = JSON.parse(stored) as { authenticated?: boolean };
    return data?.authenticated === true;
  } catch {
    return false;
  }
}

export function useAdminAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() =>
    isAdminAuthenticated(),
  );

  useEffect(() => {
    setIsAuthenticated(isAdminAuthenticated());
  }, []);

  function login(username: string, password: string): boolean {
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ authenticated: true }),
      );
      setIsAuthenticated(true);
      return true;
    }
    return false;
  }

  function logout() {
    localStorage.removeItem(STORAGE_KEY);
    setIsAuthenticated(false);
  }

  return { isAuthenticated, login, logout };
}
