import axios from 'axios';
import i18next from 'i18next';
import { saveIntegration, removeIntegration } from './integrations';
import { classifyEmail, saveEmailActivity, generateDraftContent } from './email';

const GMAIL_BASE_URL = 'https://gmail.googleapis.com/gmail/v1/users/me';
const GMAIL_OAUTH_SCOPE = 'https://www.googleapis.com/auth/gmail.modify https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email';
const GMAIL_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const GMAIL_REDIRECT_URI = `${window.location.origin}/app/integrations`;
const GMAIL_TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token';

// Keys for storing Gmail tokens in localStorage for background processing
const STORAGE_KEYS = {
  ACCESS_TOKEN: 'ecommva_gmail_access_token',
  REFRESH_TOKEN: 'ecommva_gmail_refresh_token',
  TOKEN_EXPIRY: 'ecommva_gmail_token_expiry',
};

// Official Gmail label colors as per the API documentation
// Reference: https://developers.google.com/gmail/api/v1/reference/users/labels#resource
const GMAIL_VALID_COLORS = [
  { backgroundColor: "#000000", textColor: "#ffffff" },
  { backgroundColor: "#434343", textColor: "#ffffff" },
  { backgroundColor: "#666666", textColor: "#ffffff" },
  { backgroundColor: "#999999", textColor: "#ffffff" },
  { backgroundColor: "#cccccc", textColor: "#000000" },
  { backgroundColor: "#efefef", textColor: "#000000" },
  { backgroundColor: "#f3f3f3", textColor: "#000000" },
  { backgroundColor: "#ffffff", textColor: "#000000" },
  { backgroundColor: "#fb4c2f", textColor: "#ffffff" },
  { backgroundColor: "#ffad47", textColor: "#000000" },
  { backgroundColor: "#fad165", textColor: "#000000" },
  { backgroundColor: "#16a766", textColor: "#ffffff" },
  { backgroundColor: "#43d692", textColor: "#000000" },
  { backgroundColor: "#4a86e8", textColor: "#ffffff" },
  { backgroundColor: "#a479e2", textColor: "#ffffff" },
  { backgroundColor: "#f691b3", textColor: "#000000" },
  { backgroundColor: "#f6c5be", textColor: "#000000" },
  { backgroundColor: "#ffe6c7", textColor: "#000000" },
  { backgroundColor: "#fef1d1", textColor: "#000000" },
  { backgroundColor: "#b9e4d0", textColor: "#000000" },
  { backgroundColor: "#c6f3de", textColor: "#000000" },
  { backgroundColor: "#c9daf8", textColor: "#000000" },
  { backgroundColor: "#e4d7f5", textColor: "#000000" },
  { backgroundColor: "#fcdee8", textColor: "#000000" },
  { backgroundColor: "#efa093", textColor: "#000000" },
  { backgroundColor: "#ffd6a2", textColor: "#000000" },
  { backgroundColor: "#ffe8a1", textColor: "#000000" },
  { backgroundColor: "#83d6a0", textColor: "#000000" },
  { backgroundColor: "#a0eac9", textColor: "#000000" },
  { backgroundColor: "#a4c2f4", textColor: "#000000" },
  { backgroundColor: "#d0bcf1", textColor: "#000000" },
  { backgroundColor: "#fbc8d9", textColor: "#000000" }
];

// Get category label translations
const getTranslatedCategories = () => ({
  [`📦 ${i18next.t('preferences.categories.delivery')}`]: { 
    name: `📦 ${i18next.t('preferences.categories.delivery')}`, 
    backgroundColor: "#4a86e8", 
    textColor: "#ffffff" 
  },
  [`❌ ${i18next.t('preferences.categories.cancellation')}`]: { 
    name: `❌ ${i18next.t('preferences.categories.cancellation')}`, 
    backgroundColor: "#fb4c2f", 
    textColor: "#ffffff" 
  },
  [`💸 ${i18next.t('preferences.categories.refund')}`]: { 
    name: `💸 ${i18next.t('preferences.categories.refund')}`, 
    backgroundColor: "#16a766", 
    textColor: "#ffffff" 
  },
  [`🔁 ${i18next.t('preferences.categories.return')}`]: { 
    name: `🔁 ${i18next.t('preferences.categories.return')}`, 
    backgroundColor: "#ffad47", 
    textColor: "#000000" 
  },
  [`🛍 ${i18next.t('preferences.categories.presale')}`]: { 
    name: `🛍 ${i18next.t('preferences.categories.presale')}`, 
    backgroundColor: "#a479e2", 
    textColor: "#ffffff" 
  },
  [`🔒 ${i18next.t('preferences.categories.resolved')}`]: { 
    name: `🔒 ${i18next.t('preferences.categories.resolved')}`, 
    backgroundColor: "#43d692", 
    textColor: "#000000" 
  },
  [`🚫 ${i18next.t('preferences.categories.spam')}`]: { 
    name: `🚫 ${i18next.t('preferences.categories.spam')}`, 
    backgroundColor: "#666666", 
    textColor: "#ffffff" 
  },
  [`🧾 ${i18next.t('preferences.categories.other')}`]: { 
    name: `🧾 ${i18next.t('preferences.categories.other')}`, 
    backgroundColor: "#a4c2f4", 
    textColor: "#000000" 
  }
});

// Default fallback category
const DEFAULT_CATEGORY = `🧾 ${i18next.t('preferences.categories.other')}`;

// Interface for Gmail message
interface GmailMessage {
  id: string;
  threadId: string;
  snippet: string;
  payload: {
    headers: Array<{
      name: string;
      value: string;
    }>;
  };
  internalDate: string;
  labelIds?: string[];
}

// Interface for Gmail label
interface GmailLabel {
  id: string;
  name: string;
  type?: string;
  messageListVisibility?: string;
  labelListVisibility?: string;
  color?: {
    backgroundColor: string;
    textColor: string;
  };
}

// Interface for OAuth token response
interface TokenResponse {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
  scope: string;
  token_type: string;
}

// Custom error class for authentication issues
export class GmailAuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GmailAuthError';
  }
}

// Custom error class for network issues
export class GmailNetworkError extends Error {
  status: number;
  responseData: any;

  constructor(message: string, status: number, responseData: any) {
    super(message);
    this.name = 'GmailNetworkError';
    this.status = status;
    this.responseData = responseData;
  }
}

// Helper function for exponential backoff retry
const retryWithExponentialBackoff = async <T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  initialDelay = 500,
  factor = 2
): Promise<T> => {
  let attempt = 0;
  let delay = initialDelay;

  while (attempt < maxRetries) {
    try {
      return await fn();
    } catch (error) {
      attempt++;
      if (attempt >= maxRetries) throw error;

      // Only retry on network errors or 5xx server errors
      if (axios.isAxiosError(error)) {
        if (!error.response || (error.response.status >= 500 && error.response.status < 600)) {
          // This is a network error or server error - retry
          console.log(`Request failed. Retrying in ${delay}ms... (Attempt ${attempt}/${maxRetries})`);
        } else {
          // This is a client error - don't retry
          throw error;
        }
      } else if (error instanceof GmailNetworkError) {
        // This is our custom network error - retry
        console.log(`Network error. Retrying in ${delay}ms... (Attempt ${attempt}/${maxRetries})`);
      } else {
        // Not a network error - don't retry
        throw error;
      }

      await new Promise(resolve => setTimeout(resolve, delay));
      delay *= factor;
    }
  }

  throw new Error(`Failed after ${maxRetries} retries`);
};

// Global set to track processed messages across the entire application
const globalProcessedMessageIds = new Set<string>();

// Store processed email subjects and timestamps to avoid duplicate processing
// We'll use a combination of subject and timestamp as a unique identifier
const processedEmailIdentifiers = new Set<string>();

// Cache of created drafts to prevent duplicates
const createdDrafts = new Map<string, string>(); // key: messageId, value: draftId

// Custom event for token refresh failures
export const GMAIL_AUTH_ERROR_EVENT_NAME = 'gmail-auth-error';

export class GmailService {
  private accessToken: string;
  private refreshToken?: string;
  private labelCache: Map<string, string> = new Map(); // Cache label names to IDs
  private labelsLoaded: boolean = false;
  private isRefreshing: boolean = false; // To prevent multiple simultaneous refresh attempts
  private userId?: string; // Track the user ID for token updates
  private CATEGORY_LABELS: ReturnType<typeof getTranslatedCategories>;

  constructor(accessToken: string, refreshToken?: string, userId?: string) {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    this.userId = userId;
    this.CATEGORY_LABELS = getTranslatedCategories();
    
    // Store tokens for background processing
    if (accessToken) {
      GmailService.storeTokens(accessToken, refreshToken);
    }
  }

  // Static method to create instance from stored tokens
  static async createFromStoredTokens(): Promise<GmailService | null> {
    try {
      const accessToken = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
      const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
      
      if (!accessToken || !refreshToken) {
        console.log('No stored Gmail tokens found');
        return null;
      }
      
      // Check if token is expired
      const tokenExpiry = localStorage.getItem(STORAGE_KEYS.TOKEN_EXPIRY);
      const isExpired = tokenExpiry && Number(tokenExpiry) < Date.now();
      
      if (isExpired) {
        console.log('Stored Gmail token is expired, attempting to refresh');
        try {
          // Create a temporary service to refresh the token
          const service = new GmailService(accessToken, refreshToken);
          const newToken = await service.refreshAccessToken();
          
          // If refresh is successful, create a new service with the refreshed token
          return new GmailService(newToken, refreshToken);
        } catch (error) {
          console.error('Failed to refresh stored token:', error);
          // Clear invalid tokens
          GmailService.clearStoredTokens();
          // Dispatch auth error event
          GmailService.dispatchAuthErrorEvent();
          return null;
        }
      }
      
      console.log('Using stored Gmail tokens');
      return new GmailService(accessToken, refreshToken);
    } catch (error) {
      console.error('Error creating Gmail service from stored tokens:', error);
      return null;
    }
  }
  
  // Store tokens in localStorage
  static storeTokens(accessToken: string, refreshToken?: string, expiresIn: number = 3600): void {
    try {
      localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
      
      if (refreshToken) {
        localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
      }
      
      // Set expiry time (current time + expiresIn seconds)
      const expiryTime = Date.now() + (expiresIn * 1000);
      localStorage.setItem(STORAGE_KEYS.TOKEN_EXPIRY, expiryTime.toString());
      
      console.log('Gmail tokens stored for background processing');
    } catch (error) {
      console.error('Failed to store Gmail tokens:', error);
    }
  }
  
  // Check if we have stored Gmail credentials
  static hasStoredCredentials(): boolean {
    try {
      const accessToken = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
      const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
      
      return !!(accessToken && refreshToken);
    } catch (error) {
      console.error('Error checking for stored Gmail credentials:', error);
      return false;
    }
  }
  
  // Clear stored tokens
  static clearStoredTokens(): void {
    try {
      localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.TOKEN_EXPIRY);
      console.log('Gmail tokens cleared');
    } catch (error) {
      console.error('Failed to clear Gmail tokens:', error);
    }
  }

  // Dispatch authentication error event
  static dispatchAuthErrorEvent(): void {
    console.log('Dispatching Gmail authentication error event');
    const event = new CustomEvent(GMAIL_AUTH_ERROR_EVENT_NAME);
    window.dispatchEvent(event);
  }

  async fetchRecentEmails(maxResults: number = 10): Promise<GmailMessage[]> {
    try {
      console.log(`fetchRecentEmails: Fetching up to ${maxResults} unread emails`);
      const params = new URLSearchParams({
        maxResults: maxResults.toString(),
        q: 'in:inbox is:unread' // Only fetch unread emails from inbox
      });
      
      const response = await this.request<{ messages?: Array<{ id: string }> }>(`/messages?${params}`);

      if (!response.messages || response.messages.length === 0) {
        console.log('fetchRecentEmails: No unread messages found');
        return [];
      }

      console.log(`fetchRecentEmails: Found ${response.messages.length} unread messages, fetching details`);
      const messages = await Promise.all(
        response.messages.map(async ({ id }) => {
          // Skip already processed messages
          if (globalProcessedMessageIds.has(id)) {
            console.log(`fetchRecentEmails: Message ${id} already processed, skipping details fetch`);
            return null;
          }
          
          try {
            const details = await this.request<GmailMessage>(`/messages/${id}`);
            return details;
          } catch (error) {
            console.error(`Failed to fetch details for message ${id}:`, error);
            return null;
          }
        })
      );

      // Filter out null messages (those that failed to fetch)
      const validMessages = messages.filter(message => message !== null) as GmailMessage[];
      console.log(`fetchRecentEmails: Successfully fetched details for ${validMessages.length} messages`);
      return validMessages;
    } catch (error) {
      console.error('Failed to fetch Gmail messages:', error);
      
      if (axios.isAxiosError(error)) {
        if (error.response) {
          throw new GmailNetworkError(
            `Failed to fetch Gmail messages: ${error.response.status} ${error.response.statusText}`,
            error.response.status,
            error.response.data
          );
        } else if (error.request) {
          throw new GmailNetworkError('Network error: No response received', 0, null);
        }
      }
      
      throw new Error('Failed to fetch Gmail messages');
    }
  }

  private getHeader(message: GmailMessage, name: string): string {
    if (!message || !message.payload || !Array.isArray(message.payload.headers)) {
      return '';
    }
    
    const header = message.payload.headers.find(h => 
      h && h.name && name && h.name.toLowerCase() === name.toLowerCase()
    );
    
    return header?.value || '';
  }

  // Get all existing labels
  async getLabels(): Promise<GmailLabel[]> {
    try {
      console.log('getLabels: Fetching all Gmail labels');
      const response = await this.request<{ labels: GmailLabel[] }>('/labels');
      console.log(`getLabels: Found ${response.labels?.length || 0} labels`);
      return response.labels || [];
    } catch (error) {
      console.error('Failed to fetch Gmail labels:', error);
      throw new Error('Failed to fetch Gmail labels');
    }
  }

  // Load and cache all existing labels
  async loadLabels(): Promise<void> {
    if (this.labelsLoaded) {
      console.log('loadLabels: Labels already loaded, skipping');
      return;
    }
    
    try {
      console.log('loadLabels: Loading and caching Gmail labels');
      const existingLabels = await this.getLabels();
      
      // Cache all labels by category
      for (const [category, config] of Object.entries(this.CATEGORY_LABELS)) {
        if (!config || !config.name) continue;
        
        const existingLabel = existingLabels.find(label => 
          label && label.name && 
          label.name.toLowerCase() === config.name.toLowerCase()
        );
        
        if (existingLabel) {
          console.log(`loadLabels: Cached label ${config.name} with ID ${existingLabel.id}`);
          this.labelCache.set(category, existingLabel.id);
        }
      }
      
      this.labelsLoaded = true;
      console.log('loadLabels: Labels successfully loaded and cached');
    } catch (error) {
      console.error('Failed to load and cache labels:', error);
      // Don't set labelsLoaded to true on error
    }
  }

  // Find label by name, case-insensitive
  async findLabelByName(labelName: string): Promise<GmailLabel | null> {
    try {
      console.log(`findLabelByName: Looking for label "${labelName}"`);
      const labels = await this.getLabels();
      const sanitizedName = labelName.replace(/[/\\:*?"<>|]/g, '-');
      
      const foundLabel = labels.find(label => 
        label && label.name && 
        label.name.toLowerCase() === sanitizedName.toLowerCase()
      ) || null;
      
      if (foundLabel) {
        console.log(`findLabelByName: Found label "${foundLabel.name}" with ID ${foundLabel.id}`);
      } else {
        console.log(`findLabelByName: No label found with name "${sanitizedName}"`);
      }
      
      return foundLabel;
    } catch (error) {
      console.error(`Failed to find label "${labelName}":`, error);
      return null;
    }
  }

  // Create a new label
  async createLabel(name: string, backgroundColor?: string, textColor?: string): Promise<GmailLabel> {
    try {
      console.log(`createLabel: Creating new label "${name}"`);
      // Ensure name is a valid string
      const safeName = name && typeof name === 'string' ? name : 'ecommva/other';
      
      // Sanitize label name - Gmail doesn't allow '/' and some other special characters in label names
      const sanitizedName = safeName.replace(/[/\\:*?"<>|]/g, '-');
      
      // First check if the label already exists
      const existingLabel = await this.findLabelByName(sanitizedName);
      if (existingLabel) {
        console.log(`Label "${sanitizedName}" already exists, returning existing label`);
        return existingLabel;
      }
      
      const label: Partial<GmailLabel> = {
        name: sanitizedName,
        messageListVisibility: 'show',
        labelListVisibility: 'labelShow'
      };

      if (backgroundColor && textColor) {
        // Verify the color is in the allowed palette
        const isValidColor = GMAIL_VALID_COLORS.some(
          color => color.backgroundColor === backgroundColor && color.textColor === textColor
        );

        if (isValidColor) {
          label.color = {
            backgroundColor,
            textColor
          };
        } else {
          // Use a fallback color if the requested color is not allowed
          const fallbackColor = GMAIL_VALID_COLORS[0];
          console.warn(`Color ${backgroundColor}/${textColor} is not in Gmail's allowed palette. Using fallback color.`);
          label.color = {
            backgroundColor: fallbackColor.backgroundColor,
            textColor: fallbackColor.textColor
          };
        }
      }

      try {
        console.log(`createLabel: Sending request to create label "${sanitizedName}"`);
        const response = await this.request<GmailLabel>('/labels', {
          method: 'POST',
          body: JSON.stringify(label)
        });
        console.log(`createLabel: Label created successfully with ID ${response.id}`);
        return response;
      } catch (createError: any) {
        // Check if the error is about existing label
        if (createError.message && createError.message.includes('Label name exists')) {
          console.warn(`Label ${safeName} already exists. Fetching existing label.`);
          
          // Double-check for the existing label
          const existingLabelRetry = await this.findLabelByName(sanitizedName);
          if (existingLabelRetry) {
            return existingLabelRetry;
          }
        }
        
        // If there's an error about the color, try again with a fallback color
        if (createError.message && createError.message.includes('color') && label.color) {
          console.warn('Retrying label creation with a different color due to color error');
          const fallbackColor = GMAIL_VALID_COLORS[0];
          label.color = {
            backgroundColor: fallbackColor.backgroundColor,
            textColor: fallbackColor.textColor
          };
          
          try {
            const retryResponse = await this.request<GmailLabel>('/labels', {
              method: 'POST',
              body: JSON.stringify(label)
            });
            return retryResponse;
          } catch (retryError) {
            // One last attempt with no color
            console.warn('Retrying label creation with no color specification');
            delete label.color;
            
            try {
              const finalRetryResponse = await this.request<GmailLabel>('/labels', {
                method: 'POST',
                body: JSON.stringify(label)
              });
              return finalRetryResponse;
            } catch (finalError) {
              throw finalError;
            }
          }
        } else {
          throw createError;
        }
      }
    } catch (error) {
      console.error(`Failed to create Gmail label ${name}:`, error);
      throw new Error(`Failed to create Gmail label ${name}`);
    }
  }

  // Create all category labels at once
  async createAllCategoryLabels(): Promise<GmailLabel[]> {
    try {
      console.log('createAllCategoryLabels: Creating all category labels');
      const createdLabels: GmailLabel[] = [];
      
      // Get existing labels first to avoid duplicates
      const existingLabels = await this.getLabels();
      
      // Refresh category translations based on current language
      this.CATEGORY_LABELS = getTranslatedCategories();
      console.log(`createAllCategoryLabels: Using language: ${i18next.language}`);
      
      for (const [category, config] of Object.entries(this.CATEGORY_LABELS)) {
        if (!config || !config.name) continue;
        
        try {
          console.log(`createAllCategoryLabels: Processing category "${category}" with label "${config.name}"`);
          // Check if label already exists (case insensitive check)
          const existingLabel = existingLabels.find(label => 
            label && label.name && config.name && 
            label.name.toLowerCase() === config.name.toLowerCase()
          );
          
          if (existingLabel) {
            console.log(`createAllCategoryLabels: Label "${config.name}" already exists with ID ${existingLabel.id}`);
            createdLabels.push(existingLabel);
            // Cache the existing label
            this.labelCache.set(category, existingLabel.id);
            continue;
          }
          
          // Create label if it doesn't exist
          console.log(`createAllCategoryLabels: Creating new label for "${category}"`);
          const newLabel = await this.createLabel(
            config.name,
            config.backgroundColor,
            config.textColor
          );
          
          createdLabels.push(newLabel);
          // Cache the new label
          this.labelCache.set(category, newLabel.id);
          console.log(`createAllCategoryLabels: Created and cached label with ID ${newLabel.id}`);
        } catch (error) {
          console.error(`Failed to create label for ${category}:`, error);
          // Continue with other labels even if one fails
        }
      }
      
      console.log(`createAllCategoryLabels: Successfully created/found ${createdLabels.length} labels`);
      return createdLabels;
    } catch (error) {
      console.error('Failed to create all category labels:', error);
      throw new Error('Failed to create category labels');
    }
  }

  // Helper method to find the matching standard category
  private findMatchingStandardCategory(categoryName: string): string {
    console.log(`findMatchingStandardCategory: Finding match for "${categoryName}"`);
    
    const defaultCategory = `🧾 ${i18next.t('preferences.categories.other')}`;
    
    // If it's already a standard category, return it as is
    if (Object.keys(this.CATEGORY_LABELS).includes(categoryName)) {
      console.log(`findMatchingStandardCategory: Direct match found`);
      return categoryName;
    }
    
    // Check for emojis that might help identify the category
    for (const standardCategory of Object.keys(this.CATEGORY_LABELS)) {
      const emoji = standardCategory.split(' ')[0]; // Get emoji part
      if (categoryName.includes(emoji)) {
        console.log(`findMatchingStandardCategory: Matched by emoji to "${standardCategory}"`);
        return standardCategory;
      }
    }
    
    // Look for keywords in the category name
    const lowerCategoryName = categoryName.toLowerCase();
    const currentLanguage = i18next.language;

    if (lowerCategoryName.includes('livraison') || lowerCategoryName.includes('delivery') || lowerCategoryName.includes('shipping')) {
      return `📦 ${i18next.t('preferences.categories.delivery')}`;
    } else if (lowerCategoryName.includes('annulation') || lowerCategoryName.includes('cancel')) {
      return `❌ ${i18next.t('preferences.categories.cancellation')}`;
    } else if (lowerCategoryName.includes('remboursement') || lowerCategoryName.includes('refund')) {
      return `💸 ${i18next.t('preferences.categories.refund')}`;
    } else if (lowerCategoryName.includes('retour') || lowerCategoryName.includes('return')) {
      return `🔁 ${i18next.t('preferences.categories.return')}`;
    } else if (lowerCategoryName.includes('avant-vente') || lowerCategoryName.includes('presale') || lowerCategoryName.includes('question')) {
      return `🛍 ${i18next.t('preferences.categories.presale')}`;
    } else if (lowerCategoryName.includes('resolu') || lowerCategoryName.includes('resolved')) {
      return `🔒 ${i18next.t('preferences.categories.resolved')}`;
    } else if (lowerCategoryName.includes('spam') || lowerCategoryName.includes('ignore')) {
      return `🚫 ${i18next.t('preferences.categories.spam')}`;
    }
    
    // Default fallback
    console.log(`findMatchingStandardCategory: No matches found, using default category`);
    return defaultCategory;
  }

  // Get or create a label, with caching
  async getOrCreateLabel(categoryName: string | undefined): Promise<string> {
    try {
      console.log(`getOrCreateLabel: Getting or creating label for category "${categoryName}"`);
      // Force the default category if categoryName is undefined, null, or not a string
      const safeCategory = (categoryName !== undefined && categoryName !== null && typeof categoryName === 'string' && categoryName.trim() !== '') 
        ? categoryName 
        : DEFAULT_CATEGORY;
      
      // First, try to match with a standard category
      const standardCategory = this.findMatchingStandardCategory(safeCategory);
      console.log(`getOrCreateLabel: Mapped to standard category "${standardCategory}"`);
      
      // Check if label ID is already cached
      if (this.labelCache.has(standardCategory)) {
        const cachedId = this.labelCache.get(standardCategory);
        if (cachedId) {
          console.log(`getOrCreateLabel: Using cached label ID ${cachedId}`);
          return cachedId;
        }
      }
      
      // Load all labels if not loaded yet
      if (!this.labelsLoaded) {
        console.log(`getOrCreateLabel: Labels not loaded yet, loading them now`);
        await this.loadLabels();
        
        // Check again after loading
        if (this.labelCache.has(standardCategory)) {
          const cachedId = this.labelCache.get(standardCategory);
          if (cachedId) {
            console.log(`getOrCreateLabel: Using cached label ID after loading: ${cachedId}`);
            return cachedId;
          }
        }
      }

      // Look up the category config using the standard category
      let labelConfig = this.CATEGORY_LABELS[standardCategory as keyof typeof this.CATEGORY_LABELS];
      
      // If no matching category is found (which should be rare now), create a custom label name safely
      if (!labelConfig) {
        console.warn(`No label config found for category: ${safeCategory}, using default config`);
        labelConfig = this.CATEGORY_LABELS[DEFAULT_CATEGORY];
      }
      
      if (!labelConfig.name) {
        labelConfig.name = 'ecommva/other'; // Fallback name if somehow we got an empty name
      }
      
      console.log(`Using label config for category ${safeCategory}: ${labelConfig.name}`);
      
      // Check if this label already exists
      const existingLabel = await this.findLabelByName(labelConfig.name);
      if (existingLabel) {
        // Cache the label ID
        this.labelCache.set(standardCategory, existingLabel.id);
        console.log(`getOrCreateLabel: Found existing label with ID ${existingLabel.id}`);
        return existingLabel.id;
      }

      // Create the label if it doesn't exist
      try {
        console.log(`getOrCreateLabel: Creating new label "${labelConfig.name}"`);
        const newLabel = await this.createLabel(
          labelConfig.name, 
          labelConfig.backgroundColor, 
          labelConfig.textColor
        );
        
        // Cache the label ID
        this.labelCache.set(standardCategory, newLabel.id);
        console.log(`getOrCreateLabel: Created new label with ID ${newLabel.id}`);
        return newLabel.id;
      } catch (createError) {
        console.error(`Failed to create label for category ${safeCategory}:`, createError);
        
        // If we get here, try to find the label again (it might have been created by another process)
        const retryLabel = await this.findLabelByName(labelConfig.name);
        if (retryLabel) {
          // Cache the label ID
          this.labelCache.set(standardCategory, retryLabel.id);
          console.log(`getOrCreateLabel: Found label on retry with ID ${retryLabel.id}`);
          return retryLabel.id;
        }
        
        throw createError;
      }
    } catch (error) {
      console.error(`Failed to get or create label for ${categoryName}:`, error);
      
      // Get default label as a last resort
      try {
        const defaultConfig = this.CATEGORY_LABELS[DEFAULT_CATEGORY];
        if (!defaultConfig || !defaultConfig.name) {
          throw new Error('Default category configuration is invalid');
        }
        
        const defaultLabel = await this.findLabelByName(defaultConfig.name);
        if (defaultLabel) {
          // Cache the default label
          if (categoryName) {
            this.labelCache.set(categoryName, defaultLabel.id);
          }
          console.log(`getOrCreateLabel: Using default label as fallback with ID ${defaultLabel.id}`);
          return defaultLabel.id;
        }
        
        // If we still can't find the default label, fail gracefully
        console.error('Could not find or create default label');
        throw new Error('Unable to get or create a label');
      } catch (fallbackError) {
        console.error('Failed to get or create default label as fallback:', fallbackError);
        throw new Error('Unable to get or create a label');
      }
    }
  }

  // Apply a label to a message
  async applyLabel(messageId: string, labelId: string): Promise<void> {
    if (!messageId || !labelId) {
      console.warn('Missing messageId or labelId, skipping label application');
      return;
    }
    
    try {
      console.log(`applyLabel: Applying label ${labelId} to message ${messageId}`);
      await this.request(`/messages/${messageId}/modify`, {
        method: 'POST',
        body: JSON.stringify({
          addLabelIds: [labelId]
        })
      });
      console.log(`applyLabel: Successfully applied label to message`);
    } catch (error) {
      console.error(`Failed to apply label ${labelId} to message ${messageId}:`, error);
      throw new Error(`Failed to apply label to message`);
    }
  }

  // Mark a message as read
  async markAsRead(messageId: string): Promise<void> {
    if (!messageId) {
      console.warn('Missing messageId, skipping marking as read');
      return;
    }

    try {
      console.log(`markAsRead: Marking message ${messageId} as read`);
      await this.request(`/messages/${messageId}/modify`, {
        method: 'POST',
        body: JSON.stringify({
          removeLabelIds: ['UNREAD']
        })
      });
      console.log(`Marked message ${messageId} as read`);
    } catch (error) {
      console.error(`Failed to mark message ${messageId} as read:`, error);
      throw new Error(`Failed to mark message as read`);
    }
  }

  // Check if message has already been processed globally
  private isAlreadyProcessed(messageId: string, subject: string, date: string): boolean {
    // First check in global set for processed messages
    if (globalProcessedMessageIds.has(messageId)) {
      console.log(`isAlreadyProcessed: Message ${messageId} found in global cache, skipping`);
      return true;
    }
    
    // Create a unique identifier for this email based on subject and date
    const emailIdentifier = `${subject}|${date}`;
    if (processedEmailIdentifiers.has(emailIdentifier)) {
      console.log(`isAlreadyProcessed: Email with subject "${subject}" and date "${date}" already processed, skipping`);
      globalProcessedMessageIds.add(messageId); // Add to messageId cache for faster lookup next time
      return true;
    }
    
    // Check if we've already created a draft for this message
    if (createdDrafts.has(messageId)) {
      console.log(`isAlreadyProcessed: Message ${messageId} already has a draft, skipping`);
      return true;
    }
    
    return false;
  }

  // Add message to the processed list to prevent duplicate processing
  private markAsProcessed(messageId: string, subject: string, date: string): void {
    globalProcessedMessageIds.add(messageId);
    
    // Create a unique identifier for this email based on subject and date
    const emailIdentifier = `${subject}|${date}`;
    processedEmailIdentifiers.add(emailIdentifier);
    
    console.log(`markAsProcessed: Added message ${messageId} with subject "${subject}" to processed list`);
  }

  async processRecentEmails(userId: string, userPreferences?: any): Promise<void> {
    if (!userId) {
      throw new Error('User ID is required for processing emails');
    }
    
    // Store the user ID for potential token updates
    this.userId = userId;
    
    // Correction: S'assurer que autoDraft est défini, par défaut à true si non spécifié
    const preferences = {
      ...userPreferences,
      autoDraft: userPreferences?.autoDraft !== false // force true par défaut sauf si explicitement false
    };
    
    try {
      console.log(`processRecentEmails: Starting to process recent emails for user ${userId}`);
      console.log(`processRecentEmails: Auto-draft status: ${preferences.autoDraft ? 'ENABLED' : 'DISABLED'}`);
      
      // Load all labels first
      await this.loadLabels();
      
      const messages = await this.fetchRecentEmails();
      
      if (messages.length === 0) {
        console.log('No unread emails to process');
        return;
      }
      
      console.log(`processRecentEmails: Processing ${messages.length} unread emails`);
      
      for (const message of messages) {
        try {
          if (!message || !message.id) {
            console.warn('Skipping invalid message:', message);
            continue;
          }
          
          console.log(`processRecentEmails: Processing message ${message.id}`);
          
          const subject = this.getHeader(message, 'subject');
          const from = this.getHeader(message, 'from');
          const date = message.internalDate || '';
          
          // Skip if this message has already been processed
          if (this.isAlreadyProcessed(message.id, subject, date)) {
            console.log(`processRecentEmails: Message ${message.id} already processed, skipping`);
            continue;
          }
          
          // Add to global processed list right away to prevent duplicate processing
          this.markAsProcessed(message.id, subject, date);
          
          console.log(`processRecentEmails: Message subject: "${subject}", from: "${from}"`);
          
          // Always set a default category first
          let category = DEFAULT_CATEGORY;
          
          // Try to classify the email, but with robust error handling
          try {
            console.log(`processRecentEmails: Classifying message ${message.id}`);
            const classificationResult = await classifyEmail(subject, message.snippet || '');
            // Only update category if we got a valid result
            if (classificationResult && typeof classificationResult === 'string' && classificationResult !== '') {
              category = classificationResult;
              console.log(`processRecentEmails: Email classified as: ${category}`);
            }
          } catch (classifyError) {
            console.error('Email classification failed:', classifyError);
            // We'll use the default category that's already set
          }

          // Get or create the label for this category
          let labelId = '';
          try {
            console.log(`processRecentEmails: Getting label for category "${category}"`);
            labelId = await this.getOrCreateLabel(category);
            console.log(`processRecentEmails: Got label ID ${labelId} for category "${category}"`);
          } catch (labelError) {
            console.error(`Failed to get or create label for category "${category}":`, labelError);
            // Continue with the next message without applying a label
            // Still save to activity log
            await saveEmailActivity(
              userId,
              subject,
              from,
              category,
              'classified',
              undefined,
              message.snippet || '',
              message.id,
              message.threadId  // Pass the threadId here
            );
            
            continue;
          }
          
          // Apply the label to the message
          if (labelId) {
            try {
              console.log(`processRecentEmails: Applying label ${labelId} to message ${message.id}`);
              await this.applyLabel(message.id, labelId);
              console.log(`Applied label ${category} to message ${message.id}`);
            } catch (applyError) {
              console.error('Failed to apply label:', applyError);
              // Continue processing even if label application fails
            }
          }

          // Mark the message as read
          try {
            console.log(`processRecentEmails: Marking message ${message.id} as read`);
            await this.markAsRead(message.id);
          } catch (markReadError) {
            console.error('Failed to mark message as read:', markReadError);
            // Continue processing even if marking as read fails
          }

          // Save to activity log with guaranteed category
          console.log(`processRecentEmails: Saving activity for message ${message.id}`);
          const activityId = await saveEmailActivity(
            userId,
            subject,
            from,
            category,
            'classified',
            undefined,
            message.snippet || '',
            message.id,
            message.threadId  // Pass the threadId here
          );

          // Check if we should create a draft response
          if (category !== `🚫 ${i18next.t('preferences.categories.spam')}` && preferences.autoDraft && activityId !== null) {
            try {
              // Check if we already have a draft for this message
              if (createdDrafts.has(message.id)) {
                console.log(`processRecentEmails: Draft already exists for message ${message.id}, skipping draft creation`);
                continue;
              }
              
              // Only create draft if activity was successfully saved (not a duplicate)
              console.log(`processRecentEmails: Creating draft for message ${message.id} with category ${category}`);
              
              // Get user's signature from preferences
              const signature = preferences?.signature || '';
              console.log(`processRecentEmails: User signature ${signature ? 'exists' : 'does not exist'}`);
              
              // Generate the response using the webhook, passing the signature
              console.log(`processRecentEmails: Requesting draft content from webhook for message ${message.id}`);
              const responseContent = await generateDraftContent(
                subject, 
                message.snippet || '', 
                category, 
                from,
                signature,
                preferences?.fromEmail,
                preferences?.shopDomain,
                preferences?.shopifyAccessToken
              );
              
              // Create the draft
              console.log(`processRecentEmails: Creating draft reply to ${from} for thread ${message.threadId}`);
              const draftId = await this.createDraft(
                from,
                `Re: ${subject}`,
                responseContent,
                message.threadId  // Pass the threadId to ensure proper threading
              );
              
              // Store the draft ID to prevent duplicate draft creation
              createdDrafts.set(message.id, draftId);
              
              // Get the draft URL - FORMAT IS CRUCIAL HERE
              // Gmail draft URL format: https://mail.google.com/mail/u/0/#drafts?compose=draftId
              // Using the correct format ensures direct opening of the specific draft
              const draftUrl = `https://mail.google.com/mail/u/0/#drafts?compose=${draftId}`;
              console.log(`processRecentEmails: Created draft with URL ${draftUrl} and ID ${draftId}`);
              
              // Update the activity with the draft URL AND the draft ID
              const updatedActivityId = await saveEmailActivity(
                userId,
                subject,
                from,
                category,
                'draft_created',
                draftUrl,
                message.snippet || '',
                message.id,
                message.threadId,  // Pass the threadId here
                draftId            // Pass the draftId here - This is crucial for auto-send
              );
              
              console.log(`processRecentEmails: Updated activity for message ${message.id} with draft URL and ID`);
              
              // Si les préférences incluent l'envoi automatique, planifier l'envoi
              if (preferences.autoSendDrafts && draftId && activityId) {
                try {
                  // Importation dynamique pour éviter les dépendances circulaires
                  const { AutoSenderService } = await import('./autoSender');
                  
                  // Création du service d'envoi automatique
                  const autoSender = new AutoSenderService(userId, this);
                  
                  // Planification de l'envoi
                  console.log(`processRecentEmails: Scheduling auto-send for draft ${draftId} of email ${message.id}`);
                  const scheduledTime = await autoSender.scheduleDraftSend(draftId, activityId);
                  
                  if (scheduledTime) {
                    console.log(`processRecentEmails: Draft ${draftId} scheduled for sending at ${scheduledTime.toISOString()}`);
                  } else {
                    console.log(`processRecentEmails: Draft ${draftId} was not scheduled for sending (auto-send disabled or error)`);
                  }
                } catch (autoSendError) {
                  console.error(`processRecentEmails: Failed to schedule auto-send for draft ${draftId}:`, autoSendError);
                  // Continue processing even if scheduling fails
                }
              } else {
                console.log(`processRecentEmails: Auto-send not enabled for user ${userId}, skipping schedule`);
              }
            } catch (draftError) {
              console.error(`Failed to create draft for message ${message.id}:`, draftError);
              // Continue processing even if draft creation fails
            }
          } else {
            if (category === `🚫 ${i18next.t('preferences.categories.spam')}`) {
              console.log(`processRecentEmails: Skipping draft creation for message ${message.id} (spam)`);
            } else if (!preferences.autoDraft) {
              console.log(`processRecentEmails: Skipping draft creation for message ${message.id} (autoDraft disabled)`);
            } else if (activityId === null) {
              console.log(`processRecentEmails: Skipping draft creation for message ${message.id} (already processed)`);
            }
          }
          
          console.log(`processRecentEmails: Successfully processed message ${message.id}`);
        } catch (messageError) {
          console.error('Error processing message:', messageError);
          // Continue with the next message even if this one fails
        }
      }
      
      console.log(`processRecentEmails: Completed processing all messages`);
    } catch (error) {
      console.error('Failed to process Gmail messages:', error);
      throw error; // Propagate the error
    }
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const makeRequest = async (): Promise<T> => {
      const response = await fetch(`${GMAIL_BASE_URL}${endpoint}`, {
        ...options,
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Gmail API error details:', errorData);
        
        // Log more specific error information if available
        if (errorData.error) {
          if (errorData.error.message) {
            console.error('Error message:', errorData.error.message);
          }
          if (errorData.error.errors && errorData.error.errors.length > 0) {
            console.error('Detailed errors:', errorData.error.errors);
          }
        }
        
        // Special handling for auth errors
        if (response.status === 401) {
          // Check if we have a refresh token and are not already refreshing
          if (this.refreshToken && !this.isRefreshing) {
            this.isRefreshing = true;
            console.log('Attempting to refresh access token due to 401 error');
            
            try {
              // Keep track of the original access token to see if it changes
              const originalToken = this.accessToken;
              
              const newToken = await this.refreshAccessToken();
              
              // Only update the token if we got a valid new one
              if (newToken && newToken !== originalToken) {
                this.accessToken = newToken;
                console.log('Access token successfully refreshed after 401 error');
                
                // Update the integration in the database if we have a userId
                if (this.userId) {
                  try {
                    await saveIntegration(this.userId, 'gmail', {
                      accessToken: newToken,
                      refreshToken: this.refreshToken,
                      // Keep other properties if they exist
                    });
                    console.log('Updated Gmail integration in database with new token');
                  } catch (saveError) {
                    console.error('Failed to save updated tokens to database:', saveError);
                    // Continue even if we couldn't save to the database
                  }
                }
                
                // Now retry the original request with the new token
                this.isRefreshing = false;
                return this.request<T>(endpoint, options);
              } else {
                console.error('Token refresh failed: No access token received or unchanged token');
                // Clear stored tokens since they're invalid
                GmailService.clearStoredTokens();
                // Dispatch auth error event
                GmailService.dispatchAuthErrorEvent();
                throw new GmailAuthError('Failed to refresh access token: No valid token received');
              }
            } catch (refreshError) {
              this.isRefreshing = false;
              console.error('Token refresh failed:', refreshError);
              
              // Check if it's our custom auth error that should be propagated as is
              if (refreshError instanceof GmailAuthError) {
                throw refreshError;
              }
              
              // Check if it's the specific re-auth error message
              if (refreshError instanceof Error && 
                  (refreshError.message.includes('invalid_grant') || 
                   refreshError.message.includes('Refresh token is invalid or expired') ||
                   refreshError.message.includes('reconnect your Gmail account'))) {
                
                // Clear stored tokens since they're invalid
                GmailService.clearStoredTokens();
                
                // Dispatch the auth error event
                GmailService.dispatchAuthErrorEvent();
                
                // Throw a clear auth error
                throw new GmailAuthError('Authentication failed: Please reconnect your Gmail account');
              }
              
              throw new Error(`Failed to refresh access token: ${refreshError instanceof Error ? refreshError.message : 'Unknown error'}`);
            }
          } else {
            // Clear stored tokens on auth errors if we can't refresh
            GmailService.clearStoredTokens();
            
            // Dispatch the auth error event
            GmailService.dispatchAuthErrorEvent();
            
            throw new GmailAuthError('Authentication failed. You need to reconnect your Gmail account.');
          }
        }
        
        // Network errors
        throw new GmailNetworkError(
          errorData.error?.message || `Gmail API error: ${response.status} ${response.statusText}`,
          response.status,
          errorData
        );
      }
      
      return response.json();
    };
    
    // Try the request with retry logic for network issues
    try {
      return await retryWithExponentialBackoff(makeRequest);
    } catch (error) {
      // Check for network and authentication errors to provide better feedback
      if (error instanceof GmailNetworkError || error instanceof GmailAuthError) {
        throw error; // Rethrow custom error types
      }
      
      if (!navigator.onLine) {
        throw new GmailNetworkError('No internet connection available. Please check your connectivity.', 0, null);
      }
      
      console.error('Gmail API request failed:', error);
      throw error; // Rethrow the error
    }
  }
  
  private async refreshAccessToken(): Promise<string> {
    if (!this.refreshToken) {
      throw new GmailAuthError('No refresh token available');
    }
    
    const clientSecret = import.meta.env.VITE_GOOGLE_CLIENT_SECRET;
    
    if (!GMAIL_CLIENT_ID) {
      throw new Error('Google Client ID is not configured');
    }
    
    if (!clientSecret) {
      throw new Error('Google Client Secret is not configured');
    }
    
    try {
      // Use detailed error logging to debug token refresh issues
      console.log('Attempting to refresh access token');
      
      const response = await axios.post<TokenResponse>(
        GMAIL_TOKEN_ENDPOINT, 
        {
          client_id: GMAIL_CLIENT_ID,
          client_secret: clientSecret,
          refresh_token: this.refreshToken,
          grant_type: 'refresh_token'
        },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (!response.data) {
        throw new Error('No data received from token endpoint');
      }
      
      if (!response.data.access_token) {
        console.error('Token response missing access_token:', response.data);
        throw new Error('Invalid token response: Missing access token');
      }
      
      console.log('Successfully obtained new access token');
      
      // If a new refresh token was provided, update it
      if (response.data.refresh_token) {
        this.refreshToken = response.data.refresh_token;
        console.log('Updated refresh token');
      }
      
      // Store the new tokens
      GmailService.storeTokens(
        response.data.access_token, 
        this.refreshToken,
        response.data.expires_in
      );
      
      return response.data.access_token;
    } catch (error) {
      console.error('Failed to refresh access token:', error);
      
      // Enhanced error reporting
      if (axios.isAxiosError(error)) {
        if (error.response) {
          console.error('Error response data:', error.response.data);
          console.error('Error response status:', error.response.status);
          console.error('Error response headers:', error.response.headers);
          
          // Check for specific OAuth error codes
          const errorData = error.response.data;
          if (errorData.error === 'invalid_grant' || errorData.error === 'unauthorized_client') {
            // Clear stored tokens since they're invalid
            GmailService.clearStoredTokens();
            
            // Dispatch the auth error event
            GmailService.dispatchAuthErrorEvent();
            
            throw new GmailAuthError('Refresh token is invalid or expired. Please reconnect your Gmail account.');
          }
        } else if (error.request) {
          console.error('No response received:', error.request);
          throw new GmailNetworkError('Network error: No response received from authentication server', 0, null);
        } else {
          console.error('Error setting up request:', error.message);
        }
      }
      
      throw new Error('Failed to refresh access token');
    }
  }

  async createDraft(to: string, subject: string, content: string, threadId?: string): Promise<string> {
    console.log(`createDraft: Creating draft reply to "${to}" with subject "${subject}"${threadId ? ' in thread: ' + threadId : ''}`);
    
    // Check if we've already created a similar draft
    const draftKey = `${to}|${subject}`;
    if (Array.from(createdDrafts.values()).includes(draftKey)) {
      console.log(`createDraft: Similar draft with subject "${subject}" and recipient "${to}" already exists, skipping`);
      return draftKey;
    }
    
    // Make sure content is proper HTML
    if (!content.includes('<html>')) {
      content = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
        </head>
        <body>
          ${content}
        </body>
        </html>
      `;
    }
    
    // For proper threading, we need to include proper email headers
    const headers = [
      'Content-Type: text/html; charset=utf-8',
      'MIME-Version: 1.0',
      `To: ${to}`,
      `Subject: ${subject}`
    ];
    
    // If this is a reply (has threadId), add reply specific headers
    if (threadId) {
      // Get message IDs from the thread to properly reference them
      try {
        const threadInfo = await this.getThread(threadId);
        if (threadInfo && threadInfo.messages && threadInfo.messages.length > 0) {
          // Get reference IDs from thread messages
          const messageIds = threadInfo.messages
            .filter(msg => msg.payload && msg.payload.headers)
            .flatMap(msg => {
              const headers = msg.payload.headers || [];
              const messageIdHeader = headers.find(h => h.name.toLowerCase() === 'message-id');
              return messageIdHeader ? [messageIdHeader.value] : [];
            });
          
          if (messageIds.length > 0) {
            // Use the original message IDs for references
            headers.push(`In-Reply-To: ${messageIds[0]}`);
            headers.push(`References: ${messageIds.join(' ')}`);
          }
        }
      } catch (error) {
        console.warn("Couldn't get message IDs from thread:", error);
        // Fallback to simple threading approach
        const messageIdReference = `<${threadId}@mail.gmail.com>`;
        headers.push(`In-Reply-To: ${messageIdReference}`);
        headers.push(`References: ${messageIdReference}`);
      }
    }
    
    // Combine headers and content
    const email = [
      ...headers,
      '',  // Empty line separates headers from body
      content
    ].join('\r\n');

    console.log(`createDraft: Email content prepared (${email.length} bytes)`);
    // Fix: Replace Buffer with browser-compatible base64 encoding
    const encodedEmail = btoa(unescape(encodeURIComponent(email))).replace(/\+/g, '-').replace(/\//g, '_');

    try {
      console.log(`createDraft: Sending draft creation request${threadId ? ' with threadId: ' + threadId : ''}`);
      
      // Create the request body
      const requestBody: any = {
        message: {
          raw: encodedEmail
        }
      };
      
      // Add threadId if it exists to ensure proper conversation threading
      if (threadId) {
        requestBody.message.threadId = threadId;
      }
      
      const response = await this.request<any>('/drafts', {
        method: 'POST',
        body: JSON.stringify(requestBody)
      });

      console.log(`createDraft: Draft created successfully with ID ${response.id}`);
      
      // IMPORTANT: Cette partie est cruciale pour obtenir le bon ID de brouillon Gmail
      // L'API Gmail renvoie deux ID: response.id (ID du brouillon) et response.message.id (ID du message)
      // L'interface Gmail utilise l'ID du message pour les URL de brouillon
      
      if (!response.message || !response.message.id) {
        console.warn('createDraft: Could not retrieve Gmail UI-compatible ID, falling back to API draft ID');
        
        // Store the draft key to prevent duplicates
        createdDrafts.set(draftKey, response.id);
        return response.id;
      }
      
      // Générer un ID compatible avec l'interface utilisateur Gmail
      // Format correct pour l'URL d'un brouillon Gmail: "https://mail.google.com/mail/u/0/#drafts?compose=<MESSAGE_ID>"
      const gmailUICompatibleId = response.message.id;
      console.log(`createDraft: Retrieved Gmail UI-compatible ID: ${gmailUICompatibleId}`);
      
      // Store the draft key to prevent duplicates with the UI-compatible ID
      createdDrafts.set(draftKey, gmailUICompatibleId);
      
      // Stocker également la relation entre l'ID du brouillon API et l'ID utilisateur Gmail
      console.log(`createDraft: Mapping API draft ID ${response.id} to UI ID ${gmailUICompatibleId}`);
      
      // IMPORTANT: Retourner l'ID compatible avec l'interface Gmail, pas l'ID de l'API
      return gmailUICompatibleId;
    } catch (error) {
      console.error(`createDraft: Failed to create draft:`, error);
      throw error;
    }
  }

  async getThread(threadId: string) {
    return this.request<any>(`/threads/${threadId}`, {
      method: 'GET',
      params: { format: 'full' }
    });
  }

  static initiateOAuth() {
    const params = new URLSearchParams({
      client_id: GMAIL_CLIENT_ID,
      access_type: 'offline',
      redirect_uri: GMAIL_REDIRECT_URI,
      response_type: 'code',
      scope: GMAIL_OAUTH_SCOPE,
      include_granted_scopes: 'true',
      prompt: 'consent'  // Always force prompt to ensure we get a refresh token
    });

    window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
  }

  static async handleOAuthCallback(userId: string, code: string) {
    try {
      const tokenResponse = await axios.post(GMAIL_TOKEN_ENDPOINT, {
        client_id: GMAIL_CLIENT_ID,
        client_secret: import.meta.env.VITE_GOOGLE_CLIENT_SECRET,
        code,
        grant_type: 'authorization_code',
        redirect_uri: GMAIL_REDIRECT_URI
      });

      const { access_token, refresh_token, expires_in } = tokenResponse.data;
      
      if (!access_token) {
        throw new Error('No access token received from Google');
      }
      
      if (!refresh_token) {
        console.warn('No refresh token received from Google. The integration might not be able to refresh its access token.');
      }

      // Store tokens for background processing
      GmailService.storeTokens(access_token, refresh_token, expires_in);

      // Get user info
      const userResponse = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${access_token}` }
      });

      // Save integration
      await saveIntegration(userId, 'gmail', {
        accessToken: access_token,
        refreshToken: refresh_token,
        email: userResponse.data.email,
        name: userResponse.data.name
      });

      return userResponse.data.email;
    } catch (error) {
      console.error('Gmail OAuth error:', error);
      throw new Error('Failed to complete Gmail integration');
    }
  }
  
  static async disconnect(userId: string): Promise<void> {
    try {
      await removeIntegration(userId, 'gmail');
      
      // Clear stored tokens when disconnecting
      GmailService.clearStoredTokens();
    } catch (error) {
      console.error('Failed to disconnect Gmail:', error);
      throw new Error('Failed to disconnect Gmail account');
    }
  }

  // Send a draft by its ID
  async sendDraft(draftId: string): Promise<{ id: string, threadId: string }> {
    try {
      if (!draftId || typeof draftId !== 'string') {
        throw new Error('Invalid draft ID provided');
      }
      
      console.log(`sendDraft: Original draft ID: ${draftId}`);
      
      // Normaliser l'ID si c'est une URL
      let messageOrDraftId = draftId;
      
      if (draftId.includes('mail.google.com')) {
        try {
          if (draftId.includes('/drafts/')) {
            messageOrDraftId = draftId.split('/drafts/').pop() || draftId;
          } else if (draftId.includes('compose=')) {
            messageOrDraftId = draftId.split('compose=').pop() || draftId;
          }
          console.log(`sendDraft: Extracted ID from URL: ${messageOrDraftId}`);
        } catch (parseError) {
          console.warn(`sendDraft: Error parsing draft URL: ${parseError}`);
        }
      }

      // Première solution: Utiliser notre utilitaire spécial de contournement CORS
      try {
        // Importer dynamiquement l'utilitaire de contournement CORS
        const { sendDraftWithCorsWorkaround, getDraftsWithCorsWorkaround } = await import('../corsUtils');
        
        console.log(`sendDraft: Using CORS workaround to send draft ${messageOrDraftId}`);
        
        try {
          // Essayer d'abord de récupérer la liste des brouillons pour trouver l'ID correct
          // Cette opération sera simulée en développement local
          const drafts = await getDraftsWithCorsWorkaround(this.accessToken);
          console.log(`sendDraft: Retrieved ${drafts.length} drafts`);
          
          // Rechercher le brouillon qui correspond à notre ID
          const matchingDraft = drafts.find(draft => 
            draft.id === messageOrDraftId || draft.message.id === messageOrDraftId
          );
          
          // Si on trouve une correspondance, utiliser cet ID
          if (matchingDraft) {
            console.log(`sendDraft: Found matching draft with ID ${matchingDraft.id}`);
            messageOrDraftId = matchingDraft.id;
          }
          
          // Envoyer le brouillon avec notre utilitaire de contournement CORS
          const response = await sendDraftWithCorsWorkaround(messageOrDraftId, this.accessToken);
          
          console.log(`sendDraft: Draft sent successfully with CORS workaround, ID: ${response.id}`);
          return response;
        } catch (corsWorkaroundError) {
          console.error(`sendDraft: CORS workaround failed:`, corsWorkaroundError);
          // Continuer avec les autres approches en cas d'échec
          throw corsWorkaroundError;
        }
      } catch (importError) {
        console.error(`sendDraft: Failed to import CORS utils:`, importError);
        // Continuer avec les approches alternatives si l'import échoue
      }

      // Deuxième solution: Essayer d'utiliser l'API GAPI
      try {
        // Importation dynamique pour éviter les problèmes de dépendances circulaires
        const { executeGmailApiRequest, initializeGoogleApi } = await import('../googleApiClient');
        
        // S'assurer que l'API Google est initialisée avec le token actuel
        await initializeGoogleApi(this.accessToken);
        
        console.log(`sendDraft: Using GAPI to send draft with ID: ${messageOrDraftId}`);
        
        try {
          // Essai direct avec l'ID trouvé
          const response = await executeGmailApiRequest<{ id: string, threadId: string, labelIds: string[] }>(
            `drafts/${messageOrDraftId}/send`,
            'POST',
            {},
            {}
          );
          
          console.log(`sendDraft: Draft sent successfully via GAPI, message ID: ${response.id}, thread ID: ${response.threadId || 'N/A'}`);
          return {
            id: response.id,
            threadId: response.threadId || response.id
          };
        } catch (directSendError: any) {
          // Afficher tous les détails de l'erreur pour le débogage
          console.error(`sendDraft: Error sending draft via GAPI:`, directSendError);
          
          // Si l'API GAPI échoue, essayer la méthode fetch traditionnelle comme dernier recours
          console.log(`sendDraft: Falling back to traditional fetch method`);
          return await this._sendDraftWithFetch(messageOrDraftId);
        }
      } catch (gapiError) {
        console.error(`sendDraft: Error initializing GAPI:`, gapiError);
        
        // Si GAPI échoue complètement, utiliser la méthode fetch
        console.log(`sendDraft: Unable to use GAPI, using traditional fetch as fallback`);
        return await this._sendDraftWithFetch(messageOrDraftId);
      }
    } catch (error: any) {
      // Amélioration de l'affichage des erreurs pour le débogage
      let errorDetails = 'Unknown error';
      
      try {
        if (typeof error === 'object') {
          errorDetails = JSON.stringify(error, Object.getOwnPropertyNames(error), 2);
        } else {
          errorDetails = String(error);
        }
      } catch (e) {
        errorDetails = `${error}`;
      }
      
      console.error(`Failed to send draft ${draftId}:`, errorDetails);
      throw new Error(`Failed to send draft: ${error.message || errorDetails}`);
    }
  }
  
  // Méthode originale de sendDraft utilisant fetch
  private async _sendDraftWithFetch(draftId: string): Promise<{ id: string, threadId: string }> {
    try {
      console.log(`_sendDraftWithFetch: Sending draft ${draftId} using fetch`);
      
      // Essayer d'envoyer directement avec l'ID fourni
      try {
        const response = await this.request<{ id: string, threadId: string, labelIds: string[] }>(
          `/drafts/${draftId}/send`,
          {
            method: 'POST',
            body: JSON.stringify({})
          }
        );
        
        console.log(`_sendDraftWithFetch: Draft sent successfully, message ID: ${response.id}, thread ID: ${response.threadId}`);
        return {
          id: response.id,
          threadId: response.threadId
        };
      } catch (directError: any) {
        // Si l'envoi direct échoue, essayer de récupérer les brouillons
        if (directError.status === 404 || (directError.message && directError.message.includes('404'))) {
          console.log(`_sendDraftWithFetch: Draft not found with ID ${draftId}, trying to list all drafts`);
          
          const draftsResponse = await this.request<{ drafts: Array<{ id: string, message: { id: string, threadId?: string } }> }>('/drafts');
          
          if (!draftsResponse.drafts || draftsResponse.drafts.length === 0) {
            throw new Error('No drafts found in Gmail account');
          }
          
          // Afficher tous les brouillons disponibles pour le débogage
          console.log(`_sendDraftWithFetch: Found ${draftsResponse.drafts.length} drafts, searching for a match...`);
          console.log(`Available draft IDs: ${draftsResponse.drafts.map(d => d.id).join(', ')}`);
          
          // Essayer de trouver le brouillon avec une correspondance partielle
          // en cas d'ID incomplet ou de format différent
          const targetDraft = draftsResponse.drafts.find(draft => 
            draft.id === draftId || 
            draft.message?.id === draftId ||
            draft.id.includes(draftId) ||
            (draftId.includes(draft.id))
          );
          
          if (!targetDraft) {
            throw new Error(`Could not find any draft matching ID ${draftId} in your Gmail account`);
          }
          
          console.log(`_sendDraftWithFetch: Found matching draft with ID ${targetDraft.id}`);
          
          // Envoyer le brouillon avec l'ID correct
          const response = await this.request<{ id: string, threadId: string, labelIds: string[] }>(
            `/drafts/${targetDraft.id}/send`,
            {
              method: 'POST',
              body: JSON.stringify({})
            }
          );
          
          console.log(`_sendDraftWithFetch: Draft sent successfully with corrected ID`);
          return {
            id: response.id,
            threadId: response.threadId
          };
        } else {
          // Si ce n'est pas une erreur 404, propager l'erreur
          throw directError;
        }
      }
    } catch (error: any) {
      // Afficher tous les détails de l'erreur
      let errorDetails = 'Unknown error';
      try {
        errorDetails = JSON.stringify(error, null, 2);
      } catch (e) {
        errorDetails = String(error);
      }
      
      console.error(`_sendDraftWithFetch: Failed to send draft ${draftId}:`, errorDetails);
      throw error;
    }
  }
}