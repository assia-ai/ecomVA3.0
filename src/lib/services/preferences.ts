import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import type { UserProfile } from '../collections';

export async function saveUserPreferences(
  userId: string,
  userProfile: Partial<UserProfile>
): Promise<UserProfile> {
  try {
    console.log('Saving user preferences:', userProfile);
    const userRef = doc(db, 'users', userId);
    
    const updateData: Partial<UserProfile> & { updatedAt: string } = {
      ...userProfile,
      updatedAt: new Date().toISOString()
    };
    
    await updateDoc(userRef, updateData);
    
    // After saving, fetch the updated user profile to return
    const docSnap = await getDoc(userRef);
    if (!docSnap.exists()) {
      throw new Error('User profile not found after update');
    }
    
    // Return the updated user profile so components can update their state
    return docSnap.data() as UserProfile;
  } catch (error) {
    console.error('Failed to save preferences:', error);
    throw new Error('Failed to save preferences');
  }
}