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
    autoSendDrafts: boolean; // Option pour envoyer automatiquement les brouillons créés
    autoSendResponses: boolean; // Option pour envoyer automatiquement les réponses
    autoSendDelay: number; // Délai en minutes avant l'envoi automatique
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
  status: 'classified' | 'draft_created' | 'processed' | 'draft_sent' | 'auto_response_sent';
  body?: string;
  messageId?: string;
  draftUrl?: string;
  draftId?: string; // ID du brouillon pour pouvoir l'envoyer plus tard
  scheduledSendTime?: Date; // Quand le brouillon est programmé pour être envoyé
}

export interface Integration {
  id: string;
  userId: string;
  type: 'gmail' | 'outlook' | 'shopify';
  config: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}