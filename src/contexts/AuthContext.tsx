import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signOut, 
  sendPasswordResetEmail,
  onAuthStateChanged,
  User
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import type { UserProfile } from '../lib/collections';
import { storeUserSession, clearUserSession, updateLastActive, getStoredUserSession } from '../lib/services/auth-persistence';
import { GmailService, GMAIL_AUTH_ERROR_EVENT_NAME } from '../lib/services/gmail';
import i18next from 'i18next';

interface AuthContextType {
  currentUser: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (email: string, password: string, name: string) => Promise<User>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  refreshUserProfile: (userId: string) => Promise<UserProfile | null>;
  storedSession: { userId: string; email: string; lastActive: number | null } | null;
  hasStoredGmailAuth: boolean;
  gmailAuthError: boolean;
  resetGmailAuthError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Separate hook definition from export
function useAuthHook() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Export the hook
export const useAuth = useAuthHook;

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [storedSession, setStoredSession] = useState(getStoredUserSession());
  const [hasStoredGmailAuth, setHasStoredGmailAuth] = useState(GmailService.hasStoredCredentials());
  const [gmailAuthError, setGmailAuthError] = useState(false);

  // Listen for Gmail auth errors to update state
  useEffect(() => {
    const handleGmailAuthError = () => {
      console.log('AuthContext: Gmail auth error detected');
      setGmailAuthError(true);
      setHasStoredGmailAuth(false);
    };

    window.addEventListener(GMAIL_AUTH_ERROR_EVENT_NAME, handleGmailAuthError);
    
    return () => {
      window.removeEventListener(GMAIL_AUTH_ERROR_EVENT_NAME, handleGmailAuthError);
    };
  }, []);

  // Function to reset Gmail auth error state
  const resetGmailAuthError = () => {
    setGmailAuthError(false);
  };

  // Register new user
  async function register(email: string, password: string, name: string) {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Create user profile in Firestore
    await setDoc(doc(db, 'users', user.uid), {
      uid: user.uid,
      email,
      name,
      createdAt: new Date().toISOString(),
      plan: 'free',
      preferences: {
        autoClassify: false,
        autoDraft: false,
        signature: '',
        hiddenCategories: [],
        responseTone: 'professional',
        responseLength: 'balanced',
        language: i18next.language || 'fr' // Ajout de la langue actuelle
      }
    });
    
    // Store session for background processing
    storeUserSession(user.uid, email);
    
    return user;
  }

  // Sign in user
  async function login(email: string, password: string) {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    
    // Store session for background processing
    storeUserSession(userCredential.user.uid, email);
    
    // Update last active timestamp
    updateLastActive();
    
    return userCredential.user;
  }

  // Sign out user
  async function logout() {
    // We don't clear the user session to allow background processing
    // Only sign out from Firebase
    return signOut(auth);
  }

  // Reset password
  function resetPassword(email: string) {
    return sendPasswordResetEmail(auth, email);
  }

  // Load user profile from Firestore
  async function loadUserProfile(user: User) {
    const docRef = doc(db, 'users', user.uid);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const profile = docSnap.data() as UserProfile;
      setUserProfile(profile);
      
      // Charger la langue préférée de l'utilisateur s'il en a une
      if (profile.preferences?.language) {
        i18next.changeLanguage(profile.preferences.language);
        console.log(`Langue préférée chargée: ${profile.preferences.language}`);
      }
      
      return profile;
    } else {
      console.error('User profile not found in Firestore');
      return null;
    }
  }
  
  // Public method to refresh user profile
  async function refreshUserProfile(userId: string) {
    try {
      if (!userId) {
        console.error('Cannot refresh profile: No user ID provided');
        return null;
      }
      
      const docRef = doc(db, 'users', userId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const profile = docSnap.data() as UserProfile;
        setUserProfile(profile);
        
        // Mettre à jour la langue préférée si définie
        if (profile.preferences?.language) {
          i18next.changeLanguage(profile.preferences.language);
          console.log(`Langue préférée mise à jour: ${profile.preferences.language}`);
        }
        
        return profile;
      } else {
        console.error('User profile not found during refresh');
        return null;
      }
    } catch (error) {
      console.error('Error refreshing user profile:', error);
      return null;
    }
  }
  
  // Check for stored Gmail auth on startup and periodically
  useEffect(() => {
    const checkStoredGmailAuth = () => {
      const hasAuth = GmailService.hasStoredCredentials();
      setHasStoredGmailAuth(hasAuth);
      
      if (hasAuth) {
        console.log('Found stored Gmail authentication');
      }
    };
    
    // Check immediately
    checkStoredGmailAuth();
    
    // Set up periodic check
    const intervalId = setInterval(checkStoredGmailAuth, 60 * 1000); // Check every minute
    
    return () => clearInterval(intervalId);
  }, []);
  
  // Check for stored session on startup and periodically
  useEffect(() => {
    const checkStoredSession = () => {
      const session = getStoredUserSession();
      setStoredSession(session);
      
      if (session) {
        console.log('Found stored user session');
      }
    };
    
    // Check immediately
    checkStoredSession();
    
    // Set up periodic check
    const intervalId = setInterval(checkStoredSession, 60 * 1000); // Check every minute
    
    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      
      if (user) {
        await loadUserProfile(user);
        // Update stored session when user changes
        storeUserSession(user.uid, user.email || '');
        updateLastActive();
      } else {
        setUserProfile(null);
        // Do not clear user session here to allow background processing
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    userProfile,
    loading,
    login,
    register,
    logout,
    resetPassword,
    refreshUserProfile,
    storedSession,
    hasStoredGmailAuth,
    gmailAuthError,
    resetGmailAuthError
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};