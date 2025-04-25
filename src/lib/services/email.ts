import axios from 'axios';
import { addDoc, getDocs, query, where, collection, updateDoc, doc, getDoc } from 'firebase/firestore';
import { emailsCollection, type EmailActivity } from '../collections';
import { db } from '../firebase';

// Sample data generator for testing
export async function createSampleEmailActivity(userId: string) {
  // First check if user already has any activities
  const existingQuery = query(emailsCollection, where('userId', '==', userId));
  const snapshot = await getDocs(existingQuery);
  
  if (!snapshot.empty) {
    return; // User already has activities
  }

  const sampleEmails = [
    {
      subject: "Order #1234 Shipping Update",
      sender: "shipping@mystore.com",
      category: "📦 Livraison / Suivi de commande",
      status: "draft_created",
      draftUrl: "https://mail.google.com/mail/u/0/#drafts/abc123",
      body: "Hello, your order #1234 has been shipped and will arrive in 2-3 business days."
    },
    {
      subject: "Refund Request for Order #5678",
      sender: "customer@example.com",
      category: "💸 Remboursement",
      status: "classified",
      body: "I would like to request a refund for my order #5678 as the item received was damaged."
    },
    {
      subject: "Pre-order Question about Product",
      sender: "potential.customer@email.com",
      category: "🛍 Avant-vente",
      status: "processed",
      body: "I'm interested in pre-ordering the new collection. When will it be available?"
    }
  ];

  try {
    for (const email of sampleEmails) {
      const activity = {
        id: crypto.randomUUID(),
        userId,
        ...email,
        timestamp: new Date(Date.now() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000))
      };
      
      await addDoc(emailsCollection, activity);
    }
    
    console.log('Sample activities created successfully');
  } catch (error) {
    console.error('Failed to create sample activities:', error);
    throw new Error('Failed to create sample activities');
  }
}

const CLASSIFY_WEBHOOK_URL = import.meta.env.VITE_N8N_WEBHOOK_URL_CLASSIFY;
const DRAFT_WEBHOOK_URL = import.meta.env.VITE_N8N_WEBHOOK_URL_DRAFT;

interface ClassificationResponse {
  category?: string;
  output?: string;
}

interface DraftResponse {
  message?: string;
  draft?: string;
  output?: string;
}

// Standard category names
const STANDARD_CATEGORIES = [
  '📦 Livraison / Suivi de commande',
  '❌ Annulation',
  '💸 Remboursement',
  '🔁 Retour',
  '🛍 Avant-vente',
  '🔒 Résolu',
  '🚫 Spam / à ignorer',
  '🧾 Autres'
];

// Normalize category name to match standard categories
function normalizeCategory(category: string): string {
  // Default category if we can't match
  const DEFAULT_CATEGORY = '🧾 Autres';
  
  if (!category) return DEFAULT_CATEGORY;
  
  console.log(`normalizeCategory: Normalizing category: "${category}"`);
  
  // If it's already a standard category, return it as is
  if (STANDARD_CATEGORIES.includes(category)) {
    console.log(`normalizeCategory: Category is already standard`);
    return category;
  }
  
  // Check if category contains any of the emoji from standard categories
  for (const standardCategory of STANDARD_CATEGORIES) {
    const emoji = standardCategory.split(' ')[0]; // Get the emoji part
    if (category.includes(emoji)) {
      console.log(`normalizeCategory: Matched by emoji: "${standardCategory}"`);
      return standardCategory;
    }
  }
  
  // If category contains recognizable keywords, map to standard categories
  const lowerCategory = category.toLowerCase();
  if (lowerCategory.includes('livraison') || lowerCategory.includes('delivery') || lowerCategory.includes('shipping')) {
    console.log(`normalizeCategory: Matched by keyword to delivery`);
    return '📦 Livraison / Suivi de commande';
  } else if (lowerCategory.includes('annulation') || lowerCategory.includes('cancel')) {
    console.log(`normalizeCategory: Matched by keyword to cancellation`);
    return '❌ Annulation';
  } else if (lowerCategory.includes('remboursement') || lowerCategory.includes('refund')) {
    console.log(`normalizeCategory: Matched by keyword to refund`);
    return '💸 Remboursement';
  } else if (lowerCategory.includes('retour') || lowerCategory.includes('return')) {
    console.log(`normalizeCategory: Matched by keyword to return`);
    return '🔁 Retour';
  } else if (lowerCategory.includes('avant-vente') || lowerCategory.includes('presale') || lowerCategory.includes('question')) {
    console.log(`normalizeCategory: Matched by keyword to presale`);
    return '🛍 Avant-vente';
  } else if (lowerCategory.includes('resolu') || lowerCategory.includes('resolved')) {
    console.log(`normalizeCategory: Matched by keyword to resolved`);
    return '🔒 Résolu';
  } else if (lowerCategory.includes('spam') || lowerCategory.includes('ignore')) {
    console.log(`normalizeCategory: Matched by keyword to spam`);
    return '🚫 Spam / à ignorer';
  } 
  
  // Default fallback
  console.log(`normalizeCategory: No matches found, using default category`);
  return DEFAULT_CATEGORY;
}

export async function classifyEmail(subject: string, body: string): Promise<string> {
  // Default fallback category
  const DEFAULT_CATEGORY = '🧾 Autres';
  
  try {
    // If webhook URL is not defined or invalid, return a fallback category
    if (!CLASSIFY_WEBHOOK_URL || CLASSIFY_WEBHOOK_URL.includes('undefined')) {
      console.warn('Classification webhook URL is invalid or not defined. Using fallback category.');
      return DEFAULT_CATEGORY;
    }

    console.log(`classifyEmail: Classifying email with subject "${subject}"`);
    
    // Try to classify using the webhook
    try {
      console.log(`classifyEmail: Sending request to classification webhook`);
      const response = await axios.post<ClassificationResponse>(CLASSIFY_WEBHOOK_URL, {
        subject: subject || '',
        body: body || ''
      });
      
      // Check if we have a response with data
      if (response && response.data) {
        console.log(`classifyEmail: Raw classification response:`, response.data);
        
        // Try to get the category from different possible response formats
        const category = response.data.category || response.data.output;
        console.log(`classifyEmail: Extracted category: "${category}"`);
        
        // Accept any non-null string value, including emojis
        if (category !== undefined && category !== null && typeof category === 'string') {
          // Don't trim the category as it might contain emoji characters that we want to preserve
          // Just check that it's not an empty string
          if (category !== '') {
            console.log('Classification API returned category:', category);
            // Normalize the category to match standard format
            const normalizedCategory = normalizeCategory(category);
            console.log('Normalized category:', normalizedCategory);
            return normalizedCategory;
          }
        }
      }
      
      // If we reach here, the category was invalid
      console.warn('Classification API returned invalid or empty category');
      return DEFAULT_CATEGORY;
    } catch (error: any) {
      // Log the specific error
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error('Classification API error:', error.response.status, error.response.data);
      } else if (error.request) {
        // The request was made but no response was received
        console.error('No response received from classification API:', error.request);
      } else {
        // Something happened in setting up the request that triggered an Error
        console.error('Error setting up classification request:', error.message);
      }
      
      // Return a fallback category
      return DEFAULT_CATEGORY;
    }
  } catch (error) {
    console.error('Email classification failed:', error);
    // Still return a fallback category instead of throwing
    return DEFAULT_CATEGORY;
  }
}

// Generate draft content from the webhook
export async function generateDraftContent(subject: string, body: string, category: string, sender: string, signature?: string): Promise<string> {
  console.log(`generateDraftContent: Generating draft for category "${category}"`);
  
  // Default response in case of error
  const firstName = sender.split(' ')[0].replace(/<.*$/, '').trim();
  const defaultResponse = `<p>Bonjour ${firstName},</p>
<p>Merci pour votre message.</p>
<p>J'ai bien reçu votre demande et je vais l'examiner attentivement. Je reviendrai vers vous dans les plus brefs délais.</p>
<p>Cordialement,</p>`;
  
  try {
    // If webhook URL is not defined or invalid, return a default response
    if (!DRAFT_WEBHOOK_URL || DRAFT_WEBHOOK_URL.includes('undefined')) {
      console.warn('Draft webhook URL is invalid or not defined. Using default response.');
      return defaultResponse;
    }
    
    console.log(`generateDraftContent: Sending request to draft webhook`);
    console.log(`generateDraftContent: Including signature: ${signature ? 'Yes' : 'No'}`);
    
    // Log the actual payload we're sending to the webhook for debugging
    const payload = {
      subject: subject || '',
      body: body || '',
      category: category || '🧾 Autres',
      signature: signature || '' // Pass the signature to the webhook
    };
    
    console.log('generateDraftContent: Webhook payload:', JSON.stringify(payload, null, 2));
    
    const response = await axios.post<DraftResponse>(DRAFT_WEBHOOK_URL, payload);
    
    // Check if we have a response with data
    if (response && response.data) {
      console.log(`generateDraftContent: Raw draft response:`, response.data);
      
      // Try to get the draft content from different possible response formats
      const draftContent = response.data.message || response.data.draft || response.data.output;
      
      if (draftContent && typeof draftContent === 'string' && draftContent.trim() !== '') {
        console.log(`generateDraftContent: Successfully received draft content`);
        return draftContent;
      }
    }
    
    console.warn('Draft webhook returned invalid or empty content');
    return defaultResponse;
  } catch (error: any) {
    // Log the specific error
    if (error.response) {
      console.error('Draft API error:', error.response.status, error.response.data);
    } else if (error.request) {
      console.error('No response received from draft API:', error.request);
    } else {
      console.error('Error setting up draft request:', error.message);
    }
    
    return defaultResponse;
  }
}

// Check if an email has already been processed with the same messageId
async function checkIfEmailExists(messageId: string): Promise<{ exists: boolean, docId?: string }> {
  if (!messageId) return { exists: false };
  
  try {
    console.log(`checkIfEmailExists: Checking if message ${messageId} already exists in database`);
    const q = query(
      collection(db, 'emails'),
      where('messageId', '==', messageId)
    );
    
    const querySnapshot = await getDocs(q);
    const exists = !querySnapshot.empty;
    
    let docId;
    if (exists && !querySnapshot.empty) {
      docId = querySnapshot.docs[0].id;
      console.log(`checkIfEmailExists: Found existing document with ID ${docId}`);
    }
    
    console.log(`checkIfEmailExists: Message ${messageId} exists: ${exists}`);
    return { exists, docId };
  } catch (error) {
    console.error(`Failed to check if email ${messageId} exists:`, error);
    // In case of error, return false to allow processing (safer than blocking)
    return { exists: false };
  }
}

// Global cache to track recently processed emails (in-memory solution)
const recentlyProcessedEmails = new Map<string, string>(); // messageId -> docId

export async function saveEmailActivity(
  userId: string,
  subject: string,
  sender: string,
  category: string,
  status: EmailActivity['status'],
  draftUrl?: string,
  body?: string,
  messageId?: string
): Promise<string | null> {
  try {
    console.log(`saveEmailActivity: Saving email activity with status "${status}" and category "${category}"`);
    
    // Validate all inputs to ensure no undefined values are saved to Firestore
    if (!userId) {
      throw new Error('User ID is required for saving email activity');
    }
    
    // Check in-memory cache first (faster)
    let existingDocId: string | undefined;
    if (messageId && recentlyProcessedEmails.has(messageId)) {
      existingDocId = recentlyProcessedEmails.get(messageId);
      console.log(`saveEmailActivity: Message ${messageId} found in memory cache with document ID ${existingDocId}`);
      
      // If it's a draft update, update the existing record
      if (status === 'draft_created' && draftUrl && existingDocId) {
        console.log(`saveEmailActivity: Updating existing record with draft URL: ${draftUrl}`);
        
        try {
          // Get the current document to verify ownership before updating
          const docRef = doc(db, 'emails', existingDocId);
          const docSnap = await getDoc(docRef);
          
          if (!docSnap.exists()) {
            console.error(`Document ${existingDocId} does not exist`);
            throw new Error(`Document ${existingDocId} does not exist`);
          }
          
          const data = docSnap.data();
          if (data.userId !== userId) {
            console.error(`Permission denied: User ${userId} does not own document with ID ${existingDocId}`);
            throw new Error('Permission denied: You do not own this document');
          }
          
          // Now that we've verified ownership, update the document
          await updateDoc(docRef, {
            status: 'draft_created',
            draftUrl,
            draftCreatedAt: new Date()
          });
          console.log(`saveEmailActivity: Successfully updated document ${existingDocId} with draft URL`);
          
          // Return the existing document ID to indicate it was updated
          return existingDocId;
        } catch (updateError) {
          console.error(`Failed to update email activity with draft URL:`, updateError);
          // Continue to create a new document as fallback
        }
      }
      
      // If we're not updating or the update failed, and this is not a new status, skip creating a new document
      if (status !== 'draft_created' || !draftUrl) {
        console.log(`saveEmailActivity: No changes to make to existing record, skipping`);
        // Return null to indicate no new document was created
        return existingDocId || null;
      }
    }
    
    // Check if this email has already been processed in Firestore (if messageId is provided)
    if (messageId && !existingDocId) {
      const { exists, docId } = await checkIfEmailExists(messageId);
      if (exists && docId) {
        console.log(`saveEmailActivity: Email with messageId ${messageId} already exists as document ${docId}, checking for updates`);
        
        // Add to in-memory cache for future reference
        recentlyProcessedEmails.set(messageId, docId);
        existingDocId = docId;
        
        // If it's a draft update, update the existing record
        if (status === 'draft_created' && draftUrl) {
          console.log(`saveEmailActivity: Updating existing record ${docId} with draft URL: ${draftUrl}`);
          
          try {
            // Get the current document to verify ownership before updating
            const docRef = doc(db, 'emails', docId);
            const docSnap = await getDoc(docRef);
            
            if (!docSnap.exists()) {
              console.error(`Document ${docId} does not exist`);
              throw new Error(`Document ${docId} does not exist`);
            }
            
            const data = docSnap.data();
            if (data.userId !== userId) {
              console.error(`Permission denied: User ${userId} does not own document with ID ${docId}`);
              throw new Error('Permission denied: You do not own this document');
            }
            
            // Now that we've verified ownership, update the document
            await updateDoc(docRef, {
              status: 'draft_created',
              draftUrl,
              draftCreatedAt: new Date()
            });
            console.log(`saveEmailActivity: Successfully updated document with draft URL`);
            
            // Return the existing document ID to indicate it was updated
            return docId;
          } catch (updateError) {
            console.error(`Failed to update email activity with draft URL:`, updateError);
            // Log detailed error information
            if (updateError instanceof Error) {
              console.error('Error details:', updateError.message);
              console.error('Error stack:', updateError.stack);
            }
            // Continue to create a new document as fallback
          }
        } else {
          console.log(`saveEmailActivity: No draft update needed, skipping duplicate save`);
          // Return the existing document ID
          return docId;
        }
      }
    }
    
    // If we get here and we're just updating an existing record with a draft URL,
    // but we couldn't find the record, log an error and return null
    if (status === 'draft_created' && messageId && !existingDocId) {
      console.error(`saveEmailActivity: Attempted to update non-existent record for message ${messageId} with draft URL`);
      // We'll proceed to create a new record anyway as fallback
    }
    
    // Default category if undefined or null
    const safeCategory = (category !== undefined && category !== null && category !== '') 
      ? category 
      : '🧾 Autres';
    
    // Generate a unique ID for the activity
    const activityId = crypto.randomUUID();
    
    // Build the document with guaranteed values for all fields
    const docData = {
      id: activityId,
      userId,
      subject: subject || '',
      sender: sender || '',
      timestamp: new Date(),
      category: safeCategory,
      status: status || 'classified',
      draftUrl: draftUrl || null,
      body: body || null,
      messageId: messageId || null,
      draftCreatedAt: status === 'draft_created' ? new Date() : null
    };
    
    console.log(`saveEmailActivity: Document data prepared:`, {
      subject: docData.subject,
      category: docData.category,
      status: docData.status,
      hasDraftUrl: !!docData.draftUrl
    });
    
    // Save the document
    try {
      const docRef = await addDoc(emailsCollection, docData);
      console.log(`saveEmailActivity: Document successfully saved to Firestore with ID ${docRef.id}`);
      
      // Add to in-memory cache if messageId is provided
      if (messageId) {
        recentlyProcessedEmails.set(messageId, docRef.id);
      }
      
      return activityId;
    } catch (addError) {
      console.error('Failed to save email activity:', addError);
      // Log detailed error information
      if (addError instanceof Error) {
        console.error('Error details:', addError.message);
        console.error('Error stack:', addError.stack);
      }
      throw new Error(`Failed to save email activity: ${addError instanceof Error ? addError.message : 'Unknown error'}`);
    }
  } catch (error) {
    console.error('Failed to save email activity:', error);
    // Log detailed error information
    if (error instanceof Error) {
      console.error('Error details:', error.message);
      console.error('Error stack:', error.stack);
    }
    throw new Error(`Failed to save email activity: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}