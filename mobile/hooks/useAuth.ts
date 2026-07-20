import { useEffect, useState } from 'react';
import * as SecureStore from 'expo-secure-store';

export type Role = 'athlete' | 'coach';

interface AuthState {
  token: string | null;
  role: Role | null;
  status: string | null;   // for coach: pending | approved | rejected
  loading: boolean;
}

export function useAuth(): AuthState {
  const [state, setState] = useState<AuthState>({ token: null, role: null, status: null, loading: true });

  useEffect(() => {
    (async () => {
      try {
        const token  = await SecureStore.getItemAsync('access_token');
        const role   = await SecureStore.getItemAsync('role');
        const status = await SecureStore.getItemAsync('coach_status');
        setState({ token, role: role as Role | null, status, loading: false });
      } catch {
        setState({ token: null, role: null, status: null, loading: false });
      }
    })();
  }, []);

  return state;
}
