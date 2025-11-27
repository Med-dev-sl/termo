import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, onAuthStateChange, getUser } from './supabaseClient';

const AuthContext = createContext({ user: null, session: null });

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    // get initial session/user
    getUser().then(res => {
      if (!mounted) return;
      const u = res?.data?.user || null;
      setUser(u);
      setSession(res?.data?.session || null);
      setLoading(false);
    }).catch(err => {
      console.warn('getUser error', err);
      setLoading(false);
    });

    const { data: listener } = onAuthStateChange((event, session) => {
      // event: SIGNED_IN, SIGNED_OUT, etc.
      setSession(session ?? null);
      setUser(session?.user ?? null);
    });

    return () => {
      mounted = false;
      if (listener && typeof listener.unsubscribe === 'function') listener.unsubscribe();
    };
  }, []);

  const value = { user, session, loading, supabase };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
