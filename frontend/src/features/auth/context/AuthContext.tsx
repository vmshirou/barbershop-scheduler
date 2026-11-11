import {
  createContext,
  useCallback,
  useMemo,
  useReducer,
  type PropsWithChildren,
} from 'react';
import { login as loginRequest, type UserSend } from '../api';
import type { User } from '../../../types/domain';
import { TOKEN_KEY, USER_KEY } from '../../../config/env';

type AuthStatus = 'idle' | 'loading' | 'authenticated' | 'unauthenticated';

interface AuthState {
  user: User | null;
  token: string | null;
  status: AuthStatus;
  error: string | null;
}

type AuthAction =
  | { type: 'LOGIN_START' }
  | { type: 'LOGIN_SUCCESS'; payload: { user: User; token: string } }
  | { type: 'LOGIN_ERROR'; payload: string }
  | { type: 'LOGOUT' };


const initialState: AuthState = {
  user: null,
  token: null,
  status: 'idle',
  error: null,
};

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'LOGIN_START':
      return { ...state, status: 'loading', error: null };

    case 'LOGIN_SUCCESS':
      return {
        user: action.payload.user,
        token: action.payload.token,
        status: 'authenticated',
        error: null,
      };

    case 'LOGIN_ERROR':
      return {
        ...state,
        status: 'unauthenticated',
        error: action.payload,
      };

    case 'LOGOUT':
      return { ...initialState, status: 'unauthenticated' };

    default:
      return state;
  }
}

function getInitialState(): AuthState {
  const token = localStorage.getItem(TOKEN_KEY);
  const rawUser = localStorage.getItem(USER_KEY);

  if (!token || !rawUser) {
    return { ...initialState, status: 'unauthenticated' };
  }

  try {
    return {
      user: JSON.parse(rawUser) as User,
      token,
      status: 'authenticated',
      error: null,
    };
  } catch {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    return { ...initialState, status: 'unauthenticated' };
  }
}

interface AuthContextValue extends AuthState {
  signIn: (u: UserSend) => Promise<void>;
  signOut: () => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [state, dispatch] = useReducer(authReducer, undefined, getInitialState);

  const signIn = useCallback(async (u: UserSend) => {
    dispatch({ type: 'LOGIN_START' });

    try {
      const response = await loginRequest(u);

      localStorage.setItem(TOKEN_KEY, response.token.access_token);
      localStorage.setItem(USER_KEY, JSON.stringify(response.user));

      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: {
          user: response.user,
          token: response.token.access_token,
        },
      });
    } catch (error) {
      dispatch({
        type: 'LOGIN_ERROR',
        payload:
          error instanceof Error
            ? error.message
            : 'No se pudo iniciar sesión',
      });
    }
  }, []);

  const signOut = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    dispatch({ type: 'LOGOUT' });
  }, []);

  const value = useMemo(
    () => ({ ...state, signIn, signOut }),
    [state, signIn, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}