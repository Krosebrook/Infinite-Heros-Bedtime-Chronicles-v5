import React, { createContext, useContext, useEffect, useState } from 'react';
import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, signInAnonymously, type Auth, type User } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

// Only initialize Firebase when all required credentials are present
const hasFirebaseConfig = !!(
  firebaseConfig.apiKey &&
  firebaseConfig.projectId &&
  firebaseConfig.appId
);

let firebaseAuth: Auth | null = null;

if (hasFirebaseConfig) {
  try {
    const firebaseApp: FirebaseApp = initializeApp(firebaseConfig);
    firebaseAuth = getAuth(firebaseApp);
  } catch (err) {
    console.warn('[Auth] Firebase initialization failed:', err instanceof Error ? err.message : String(err));
  }
}

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  getIdToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: false,
  getIdToken: async () => null,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(hasFirebaseConfig);

  useEffect(() => {
    if (!firebaseAuth) {
      // Firebase not configured — continue as unauthenticated
      setLoading(false);
      return;
    }

    const auth = firebaseAuth;
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        setLoading(false);
      } else {
        // Sign in anonymously if no user
        signInAnonymously(auth)
          .then((cred) => setUser(cred.user))
          .catch((err) => {
            console.error('[Auth] Anonymous sign-in failed:', err instanceof Error ? err.message : String(err));
            setLoading(false);
          });
      }
    });
    return unsubscribe;
  }, []);

  const getIdToken = async (): Promise<string | null> => {
    if (!user) return null;
    try {
      return await user.getIdToken();
    } catch {
      return null;
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, getIdToken }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
