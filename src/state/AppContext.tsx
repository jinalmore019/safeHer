// App State Management — SafeHer
// Simple React Context-based state (no external libs for Part 1)

import React, {
  createContext,
  useContext,
  useReducer,
  useCallback,
  ReactNode,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, AuthState } from '../types/models';
import { onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import { auth, db } from '../config/firebase';
import { doc, getDoc } from 'firebase/firestore';

// ─── Storage Keys ────────────────────────────────────────────────────────────
const STORAGE_KEYS = {
  USER: '@safeher/user',
  ONBOARDING_DONE: '@safeher/onboarding_done',
} as const;

// ─── Actions ─────────────────────────────────────────────────────────────────
type AppAction =
  | { type: 'SET_USER'; payload: User }
  | { type: 'LOGOUT' }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ONBOARDING_DONE'; payload: boolean };

// ─── State ───────────────────────────────────────────────────────────────────
interface AppState {
  auth: AuthState;
  onboardingDone: boolean;
}

const initialState: AppState = {
  auth: {
    user: null,
    isAuthenticated: false,
    isLoading: true,
  },
  onboardingDone: false,
};

// ─── Reducer ─────────────────────────────────────────────────────────────────
function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_USER':
      return {
        ...state,
        auth: {
          user: action.payload,
          isAuthenticated: true,
          isLoading: false,
        },
      };
    case 'LOGOUT':
      return {
        ...state,
        auth: { user: null, isAuthenticated: false, isLoading: false },
      };
    case 'SET_LOADING':
      return {
        ...state,
        auth: { ...state.auth, isLoading: action.payload },
      };
    case 'SET_ONBOARDING_DONE':
      return { ...state, onboardingDone: action.payload };
    default:
      return state;
  }
}

// ─── Context ─────────────────────────────────────────────────────────────────
interface AppContextValue {
  state: AppState;
  login: (user: User) => Promise<void>;
  logout: () => Promise<void>;
  completeOnboarding: () => Promise<void>;
  checkStoredSession: () => Promise<void>;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

// ─── Provider ────────────────────────────────────────────────────────────────
export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  const login = useCallback(async (user: User) => {
    // Firebase handles the persistence internally, but we can store the user object in Context
    dispatch({ type: 'SET_USER', payload: user });
  }, []);

  const logout = useCallback(async () => {
    await firebaseSignOut(auth);
    dispatch({ type: 'LOGOUT' });
  }, []);

  const completeOnboarding = useCallback(async () => {
    await AsyncStorage.setItem(STORAGE_KEYS.ONBOARDING_DONE, 'true');
    dispatch({ type: 'SET_ONBOARDING_DONE', payload: true });
  }, []);

  const checkStoredSession = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const onboardingDone = await AsyncStorage.getItem(STORAGE_KEYS.ONBOARDING_DONE);
      if (onboardingDone === 'true') {
        dispatch({ type: 'SET_ONBOARDING_DONE', payload: true });
      }

      // Listen to Firebase Auth state
      onAuthStateChanged(auth, async (firebaseUser) => {
        if (firebaseUser) {
          try {
            // Fetch custom user profile from Firestore
            const docRef = doc(db, 'users', firebaseUser.uid);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
              const userData = docSnap.data() as User;
              dispatch({ type: 'SET_USER', payload: userData });
            } else {
              // Fallback if firestore document doesn't exist yet
              dispatch({ type: 'SET_USER', payload: {
                id: firebaseUser.uid,
                name: firebaseUser.displayName || 'User',
                phone: firebaseUser.phoneNumber || '',
                role: 'user',
                createdAt: new Date().toISOString()
              }});
            }
          } catch (e) {
            console.error('Error fetching user profile:', e);
            dispatch({ type: 'SET_LOADING', payload: false });
          }
        } else {
          dispatch({ type: 'LOGOUT' });
        }
      });
    } catch {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  return (
    <AppContext.Provider
      value={{ state, login, logout, completeOnboarding, checkStoredSession }}
    >
      {children}
    </AppContext.Provider>
  );
}

// ─── Hook ────────────────────────────────────────────────────────────────────
export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
