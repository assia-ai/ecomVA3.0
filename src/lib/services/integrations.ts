import { doc, setDoc, deleteDoc, query, where, getDocs, getDoc } from 'firebase/firestore';
import { integrationsCollection, type Integration } from '../collections';
import { db } from '../firebase';

// Custom error class for integration permission issues
export class IntegrationPermissionError extends Error {
  constructor(message = 'Missing or insufficient permissions for integration') {
    super(message);
    this.name = 'IntegrationPermissionError';
  }
}

export async function saveIntegration(
  userId: string,
  type: Integration['type'],
  config: Record<string, any>
): Promise<Integration> {
  try {
    const integrationId = `${userId}-${type}`;
    const integrationData = {
      id: integrationId,
      userId,
      type,
      config,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    await setDoc(doc(integrationsCollection, integrationId), integrationData);
    
    // Return the integration data for immediate use
    return integrationData;
  } catch (error) {
    console.error('Failed to save integration:', error);
    throw new Error('Failed to save integration');
  }
}

export async function removeIntegration(userId: string, type: Integration['type']): Promise<void> {
  try {
    const integrationId = `${userId}-${type}`;
    await deleteDoc(doc(integrationsCollection, integrationId));
    
    // Success status is determined by not throwing an error
    return;
  } catch (error) {
    console.error('Failed to remove integration:', error);
    throw new Error('Failed to remove integration');
  }
}

export async function getUserIntegrations(userId: string): Promise<Integration[]> {
  try {
    const q = query(integrationsCollection, where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.data() as Integration);
  } catch (error) {
    console.error('Failed to get user integrations:', error);
    throw new Error('Failed to get user integrations');
  }
}

export async function getIntegration(userId: string, type: Integration['type']): Promise<Integration | null> {
  try {
    const integrationId = `${userId}-${type}`;
    const docRef = doc(db, 'integrations', integrationId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return docSnap.data() as Integration;
    }
    
    return null;
  } catch (error) {
    console.error(`Failed to get ${type} integration:`, error);
    
    // Check for permission-related errors and throw a specific error
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (errorMessage.includes('permission') || errorMessage.includes('access denied') || errorMessage.includes('unauthorized')) {
      throw new IntegrationPermissionError();
    }
    
    return null;
  }
}

export async function refreshIntegration(userId: string, type: Integration['type']): Promise<void> {
  try {
    // Get the current integration
    const integration = await getIntegration(userId, type);
    if (!integration) {
      throw new Error(`No ${type} integration found for user ${userId}`);
    }
    
    // In a real implementation, this would:
    // 1. Use refresh tokens to get new access tokens from the third-party service
    // 2. Update the integration config with the new tokens
    // 3. Save the updated integration
    
    console.log(`Refreshing ${type} integration for user ${userId}`);
    
    // Update the integration with refreshed data
    const updatedConfig = {
      ...integration.config,
      updatedAt: new Date().toISOString(),
      // In a real implementation, add refreshed tokens here
    };
    
    // Save the updated integration
    await saveIntegration(userId, type, updatedConfig);
    
    return;
  } catch (error) {
    console.error(`Failed to refresh ${type} integration:`, error);
    
    // Check for permission-related errors and throw a specific error
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (errorMessage.includes('permission') || errorMessage.includes('access denied') || errorMessage.includes('unauthorized')) {
      throw new IntegrationPermissionError();
    }
    
    throw new Error(`Failed to refresh ${type} integration`);
  }
}