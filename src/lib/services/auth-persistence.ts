import { getIntegration, IntegrationPermissionError } from './integrations';

// Keys for storing auth data in localStorage
const STORAGE_KEYS = {
  USER_ID: 'ecommva_user_id',
  EMAIL: 'ecommva_user_email',
  LAST_ACTIVE: 'ecommva_last_active',
};

// Store user session data for background processes
export const storeUserSession = (userId: string, email: string) => {
  try {
    localStorage.setItem(STORAGE_KEYS.USER_ID, userId);
    localStorage.setItem(STORAGE_KEYS.EMAIL, email);
    localStorage.setItem(STORAGE_KEYS.LAST_ACTIVE, Date.now().toString());
    console.log('User session data stored for background processing');
    return true;
  } catch (error) {
    console.error('Failed to store user session data:', error);
    return false;
  }
};

// Get stored user session data
export const getStoredUserSession = () => {
  try {
    const userId = localStorage.getItem(STORAGE_KEYS.USER_ID);
    const email = localStorage.getItem(STORAGE_KEYS.EMAIL);
    const lastActive = localStorage.getItem(STORAGE_KEYS.LAST_ACTIVE);
    
    if (!userId || !email) {
      return null;
    }
    
    return { 
      userId, 
      email, 
      lastActive: lastActive ? parseInt(lastActive, 10) : null 
    };
  } catch (error) {
    console.error('Failed to retrieve user session data:', error);
    return null;
  }
};

// Clear stored user session data
export const clearUserSession = () => {
  try {
    localStorage.removeItem(STORAGE_KEYS.USER_ID);
    localStorage.removeItem(STORAGE_KEYS.EMAIL);
    localStorage.removeItem(STORAGE_KEYS.LAST_ACTIVE);
    console.log('User session data cleared');
    return true;
  } catch (error) {
    console.error('Failed to clear user session data:', error);
    return false;
  }
};

// Check if the user has Gmail configured
export const hasGmailIntegration = async (userId: string) => {
  try {
    const gmailIntegration = await getIntegration(userId, 'gmail');
    return !!gmailIntegration;
  } catch (error) {
    if (error instanceof IntegrationPermissionError) {
      console.error('Permission issues with Gmail integration:', error.message);
      // Return false when permission issues are detected
      // This will allow the UI to prompt for re-authentication
      return false;
    }
    console.error('Failed to check Gmail integration:', error);
    return false;
  }
};

// Update last active timestamp
export const updateLastActive = () => {
  try {
    localStorage.setItem(STORAGE_KEYS.LAST_ACTIVE, Date.now().toString());
    return true;
  } catch (error) {
    console.error('Failed to update last active timestamp:', error);
    return false;
  }
};

// Check if session is valid (less than 30 days old)
export const isSessionValid = () => {
  try {
    const lastActive = localStorage.getItem(STORAGE_KEYS.LAST_ACTIVE);
    if (!lastActive) return false;
    
    const lastActiveTime = parseInt(lastActive, 10);
    const currentTime = Date.now();
    const daysDifference = (currentTime - lastActiveTime) / (1000 * 60 * 60 * 24);
    
    // Session is valid if less than 30 days old
    return daysDifference < 30;
  } catch (error) {
    console.error('Failed to check session validity:', error);
    return false;
  }
};