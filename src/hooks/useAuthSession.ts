'use client';

import { useState, useEffect, useCallback } from 'react';

export interface AuthUser {
  id: string;
  email: string;
  isAdmin: boolean;
}

export interface AuthSession {
  user: AuthUser | null;
  isAuthenticated: boolean;
  loading: boolean;
  refresh: () => void;
}

export function useAuthSession(): AuthSession {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSession = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/me', { credentials: 'include' });
      const data = await res.json().catch(() => ({ user: null }));
      setUser(data?.user ?? null);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  return {
    user,
    isAuthenticated: user !== null,
    loading,
    refresh: fetchSession,
  };
}
