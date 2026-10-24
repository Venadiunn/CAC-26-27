import { createContext, useContext, useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { isSupabaseConfigured, supabase, supabaseConfigurationError } from './supabase';
import { syncLocalDataToCloud } from './storage';

type AuthContextValue = {
  session: Session | null;
  loading: boolean;
  syncing: boolean;
  syncError: string;
  isConfigured: boolean;
  configurationError: string;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<boolean>;
  signOut: () => Promise<void>;
  retryLocalSync: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Authentication request failed. Please try again.';
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState('');

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    let active = true;
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (active) {
        setSession(nextSession);
        setSyncError('');
      }
    });

    void supabase.auth.getSession().then(({ data, error }) => {
      if (!active) {
        return;
      }
      if (error) {
        setSyncError(errorMessage(error));
      }
      setSession(data.session);
      setLoading(false);
    }).catch((error: unknown) => {
      if (active) {
        setSyncError(errorMessage(error));
        setLoading(false);
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const retryLocalSync = async () => {
    if (!session?.user.id) {
      return;
    }

    setSyncing(true);
    setSyncError('');
    try {
      await syncLocalDataToCloud();
    } catch (error) {
      setSyncError(errorMessage(error));
      throw error;
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    if (session?.user.id) {
      void retryLocalSync().catch(() => undefined);
    } else {
      setSyncError('');
    }
  }, [session?.user.id]);

  const value: AuthContextValue = {
    session,
    loading,
    syncing,
    syncError,
    isConfigured: isSupabaseConfigured,
    configurationError: supabaseConfigurationError,
    signIn: async (email, password) => {
      if (!supabase) {
        throw new Error(supabaseConfigurationError);
      }
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        throw error;
      }
    },
    signUp: async (email, password) => {
      if (!supabase) {
        throw new Error(supabaseConfigurationError);
      }
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) {
        throw error;
      }
      return Boolean(data.session);
    },
    signOut: async () => {
      if (!supabase) {
        throw new Error(supabaseConfigurationError);
      }
      const { error } = await supabase.auth.signOut();
      if (error) {
        throw error;
      }
    },
    retryLocalSync,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error('useAuth must be used inside AuthProvider.');
  }
  return value;
}
