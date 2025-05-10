import React, { useEffect, useState } from 'react';
import { GmailService, GmailAuthError, GmailNetworkError } from '../lib/services/gmail';
import { getStoredUserSession, isSessionValid, hasGmailIntegration, storeUserSession } from '../lib/services/auth-persistence';
import { collection, query, where, limit, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { classifyEmail, saveEmailActivity, generateDraftContent } from '../lib/services/email';
import { IntegrationPermissionError } from '../lib/services/integrations';
import { refreshIntegration } from '../lib/services/integrations';
import { AutoSenderService } from '../lib/services/autoSender';

// Time in milliseconds between background processing runs
const PROCESSING_INTERVAL = 1 * 60 * 1000; // 1 minute (anciennement 5 minutes)

// Maximum number of failed Gmail auth attempts before backing off
const MAX_AUTH_FAILURES = 3;

const BackgroundProcessor: React.FC = () => {
  const [lastRun, setLastRun] = useState<Date | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [authFailureCount, setAuthFailureCount] = useState(0);
  
  useEffect(() => {
    let intervalId: number;
    
    // Function to run background processing
    const runBackgroundProcessing = async () => {
      if (isRunning) return; // Prevent overlapping runs
      
      // Check if we're online
      if (!navigator.onLine) {
        console.log('BackgroundProcessor: Offline, skipping processing');
        return;
      }
      
      // Check if we have a stored session
      const session = getStoredUserSession();
      if (!session || !isSessionValid()) {
        console.log('BackgroundProcessor: No valid stored session, skipping processing');
        return;
      }

      // Check auth failure count - back off if we've had too many failures
      if (authFailureCount >= MAX_AUTH_FAILURES) {
        console.log(`BackgroundProcessor: Backing off after ${authFailureCount} authentication failures`);
        return;
      }
      
      try {
        setIsRunning(true);
        console.log(`BackgroundProcessor: Starting background processing for user ${session.userId}`);
        
        // Check if user has Gmail integration
        let hasGmail = false;
        try {
          hasGmail = await hasGmailIntegration(session.userId);
        } catch (integrationError) {
          console.error('BackgroundProcessor: Error checking Gmail integration:', integrationError);
          
          // If this is a permission error, try to refresh the integration
          if (integrationError instanceof IntegrationPermissionError) {
            try {
              console.log('BackgroundProcessor: Attempting to refresh Gmail integration');
              await refreshIntegration(session.userId, 'gmail');
              
              // Try again after refresh
              hasGmail = await hasGmailIntegration(session.userId);
            } catch (refreshError) {
              console.error('BackgroundProcessor: Failed to refresh integration:', refreshError);
              throw refreshError; // Let the outer catch block handle this
            }
          } else {
            throw integrationError; // Re-throw for outer catch block
          }
        }
        
        if (!hasGmail) {
          console.log('BackgroundProcessor: No Gmail integration found, skipping processing');
          return;
        }
        
        // Create a Gmail service from stored tokens
        const gmail = await GmailService.createFromStoredTokens();
        if (!gmail) {
          console.log('BackgroundProcessor: Failed to initialize Gmail service from stored tokens');
          throw new GmailAuthError('Failed to initialize Gmail service');
        }
        
        // Fetch user preferences for auto-classify and auto-draft settings
        const userPrefs = await getUserPreferences(session.userId);
        if (!userPrefs?.autoClassify) {
          console.log('BackgroundProcessor: Auto-classify is disabled, skipping processing');
          return;
        }
        
        // Process emails
        await gmail.processRecentEmails(session.userId, userPrefs);
        
        // Traiter les brouillons en attente d'envoi automatique
        try {
          console.log('[BackgroundProcessor] Appel de processPendingDrafts (début)');
          const autoSender = new AutoSenderService(session.userId, gmail);
          const sentDrafts = await autoSender.processPendingDrafts();
          
          if (sentDrafts > 0) {
            console.log(`BackgroundProcessor: Sent ${sentDrafts} pending drafts automatically`);
          } else {
            console.log('BackgroundProcessor: No pending drafts ready for sending');
          }
        } catch (draftError) {
          console.error('BackgroundProcessor: Error processing pending drafts:', draftError);
          // Continue with other processing even if draft sending fails
        }
        
        // Update last run time
        setLastRun(new Date());
        console.log('BackgroundProcessor: Successfully completed background processing');
        
        // Reset auth failure count on success
        if (authFailureCount > 0) {
          setAuthFailureCount(0);
        }
        
        // Store the session again to keep it fresh
        storeUserSession(session);
      } catch (error) {
        console.error('BackgroundProcessor: Error during background processing:', error);
        if (error instanceof GmailAuthError || error instanceof IntegrationPermissionError) {
          // Auth errors could mean the tokens are invalid
          console.log('BackgroundProcessor: Authentication error, tokens may need refreshing');
          
          // Increment the auth failure count
          setAuthFailureCount(prevCount => prevCount + 1);
          
          // Dispatch a custom event to trigger re-authentication flow in IntegrationsPage.tsx
          const authErrorEvent = new CustomEvent('gmail-auth-error', {
            detail: { 
              userId: session.userId,
              error: error.message,
              timestamp: new Date().toISOString()
            }
          });
          window.dispatchEvent(authErrorEvent);
          
          // Log this event for tracking
          console.log('BackgroundProcessor: Dispatched gmail-auth-error event to request re-authentication');
        } else if (error instanceof GmailNetworkError) {
          console.log('BackgroundProcessor: Network error during processing');
        }
      } finally {
        setIsRunning(false);
      }
    };
    
    // Listen for successful re-authentication events
    const handleReauthSuccess = (event: CustomEvent) => {
      console.log('BackgroundProcessor: Detected successful re-authentication');
      setAuthFailureCount(0); // Reset failure count
      
      // Trigger a new processing run after successful re-auth
      setTimeout(() => {
        runBackgroundProcessing();
      }, 5000); // Give a short delay before processing
    };
    
    window.addEventListener('gmail-auth-success', handleReauthSuccess as EventListener);
    
    // Run processing initially after a short delay
    const initialTimer = setTimeout(() => {
      runBackgroundProcessing();
    }, 10000); // 10 second initial delay
    
    // Set up interval for regular processing
    intervalId = window.setInterval(runBackgroundProcessing, PROCESSING_INTERVAL);
    
    return () => {
      clearTimeout(initialTimer);
      clearInterval(intervalId);
      window.removeEventListener('gmail-auth-success', handleReauthSuccess as EventListener);
    };
  }, [isRunning, authFailureCount]);
  
  // This is a background component that doesn't render anything
  return null;
};

// Helper function to get user preferences
async function getUserPreferences(userId: string) {
  try {
    console.log(`Fetching user preferences for user ID: ${userId}`);
    
    // Try fetching the document directly first (more efficient and avoids the query permission issue)
    const userDocRef = doc(db, 'users', userId);
    
    try {
      const userDocSnap = await getDoc(userDocRef);
      
      if (userDocSnap.exists()) {
        console.log('Found user document via direct document reference');
        const userData = userDocSnap.data();
        return userData.preferences || getDefaultPreferences();
      } else {
        console.log(`No user document found with direct reference for ID: ${userId}`);
      }
    } catch (directFetchError) {
      console.error('Error fetching user document directly:', directFetchError);
      // If direct fetch fails, try the query approach as fallback
    }
    
    // Fallback to query approach
    const userRef = query(
      collection(db, 'users'),
      where('id', '==', userId),
      limit(1)
    );
    
    const snapshot = await getDocs(userRef);
    if (snapshot.empty) {
      console.log(`No user document found for ID: ${userId}`);
      return getDefaultPreferences();
    }
    
    console.log('Found user document via query');
    const userData = snapshot.docs[0].data();
    return userData.preferences || getDefaultPreferences();
  } catch (error) {
    console.error('Error fetching user preferences:', error);
    
    // Log more detailed error information
    if (error instanceof Error) {
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
    }
    
    // Dispatch a user-permissions-error event to prompt re-authentication if needed
    if (error instanceof Error && error.message.includes('permission')) {
      const permissionErrorEvent = new CustomEvent('user-permissions-error', {
        detail: { 
          userId,
          error: error.message,
          timestamp: new Date().toISOString()
        }
      });
      window.dispatchEvent(permissionErrorEvent);
      console.log('BackgroundProcessor: Dispatched user-permissions-error event to request permission fix');
    }
    
    // Return default preferences as a fallback
    return getDefaultPreferences();
  }
}

// Helper function to get default preferences
function getDefaultPreferences() {
  return {
    autoClassify: true,
    autoDraft: true,
    signature: '',
    hiddenCategories: [],
    responseTone: 'professional',
    responseLength: 'balanced',
    autoSendDrafts: false,       // Ajout de l'option autoSendDrafts
    autoSendResponses: false,    // Ajout de l'option autoSendResponses
    autoSendDelay: 5             // Ajout de l'option autoSendDelay avec valeur par défaut de 5 minutes
  };
}

export default BackgroundProcessor;