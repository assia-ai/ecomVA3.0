import { collection } from 'firebase/firestore';
import { db } from './firebase';

// Collection references
export const usersCollection = collection(db, 'users');
export const emailsCollection = collection(db, 'emails');
export const integrationsCollection = collection(db, 'integrations');

// Collection types
export interface UserProfile {
  uid: string;
  email: string;
  name: string;
  createdAt: string;
  plan: 'free' | 'pro';
  preferences: {
    autoClassify: boolean;
    autoDraft: boolean;
    signature: string;
    hiddenCategories: string[];
    responseTone: 'professional' | 'friendly' | 'formal';
    responseLength: 'concise' | 'balanced' | 'detailed';
    language?: 'fr' | 'en'; // Ajout de la préférence de langue
  };
}

export interface EmailActivity {
  id: string;
  userId: string;
  subject: string;
  sender: string;
  timestamp: Date;
  category: string;
  status: 'classified' | 'draft_created' | 'processed';
  body?: string;
  messageId?: string;
  draftUrl?: string;
}

export interface Integration {
  id: string;
  userId: string;
  type: 'gmail' | 'outlook' | 'shopify';
  config: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}