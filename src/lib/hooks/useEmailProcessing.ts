import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { classifyEmail, saveEmailActivity, generateDraftContent } from '../services/email';
import { GmailService, GmailAuthError, GmailNetworkError, GMAIL_AUTH_ERROR_EVENT_NAME } from '../services/gmail';
import { OutlookService } from '../services/outlook';
import { getUserIntegrations } from '../services/integrations';
import toast from 'react-hot-toast';
import { getStoredUserSession } from '../services/auth-persistence';
import i18next from 'i18next';

// Create a cache of processed messages to prevent duplicates within the same session
const processedMessageIds = new Set<string>();

export function useEmailProcessing() {
  const { currentUser, userProfile } = useAuth();
  const [processing, setProcessing] = useState(false);
  const [fetchingEmails, setFetchingEmails] = useState(false);
  const [networkStatus, setNetworkStatus] = useState(navigator.onLine);

  // Listen for online/offline events
  useEffect(() => {
    const handleOnline = () => {
      console.log("Internet connection restored");
      setNetworkStatus(true);
    };
    
    const handleOffline = () => {
      console.log("Internet connection lost");
      setNetworkStatus(false);
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Dispatch a custom event when Gmail auth errors occur
  const notifyGmailAuthError = useCallback(() => {
    console.log("Dispatching Gmail auth error event");
    // Use the constant to ensure consistent event name
    const event = new CustomEvent(GMAIL_AUTH_ERROR_EVENT_NAME);
    window.dispatchEvent(event);
    
    // Show a toast notification
    toast.error(
      "Gmail authentication expired. Please reconnect your account in the Integrations page.",
      { duration: 6000 }
    );
  }, []);

  const processEmail = useCallback(async (
    subject: string,
    body: string,
    sender: string,
    messageId?: string
  ) => {
    // Get user from current session or stored session
    let userId = currentUser?.uid;
    
    // If no current user, try to get from stored session
    if (!userId) {
      const storedSession = getStoredUserSession();
      if (storedSession) {
        userId = storedSession.userId;
        console.log(`processEmail: Using stored user ID ${userId}`);
      } else {
        console.error("processEmail: No current user or stored session found");
        throw new Error('User not authenticated');
      }
    }

    // Check internet connectivity
    if (!navigator.onLine) {
      console.error("processEmail: No internet connection available");
      toast.error("Unable to process email. Please check your internet connection.");
      throw new GmailNetworkError("No internet connection available. Please check your connectivity.", 0, null);
    }

    // Skip if this message has already been processed
    if (messageId && processedMessageIds.has(messageId)) {
      console.log(`processEmail: Message ${messageId} already processed in this session, skipping`);
      return null;
    }

    // Debug logging for userProfile
    console.log("processEmail: User profile status:", {
      exists: !!userProfile,
      preferences: userProfile?.preferences,
      autoDraft: userProfile?.preferences?.autoDraft
    });

    setProcessing(true);

    try {
      // Get user's email integrations
      console.log("processEmail: Fetching user integrations");
      const integrations = await getUserIntegrations(userId);
      const gmailIntegration = integrations.find(i => i.type === 'gmail');
      const outlookIntegration = integrations.find(i => i.type === 'outlook');
      
      console.log("processEmail: Available integrations:", {
        gmail: !!gmailIntegration,
        outlook: !!outlookIntegration
      });

      // Classify the email
      console.log(`processEmail: Classifying email with subject "${subject}"`);
      const category = await classifyEmail(subject, body);
      console.log(`processEmail: Email classified as "${category}"`);

      // Save initial classification
      console.log("processEmail: Saving initial classification");
      try {
        const activityId = await saveEmailActivity(
          userId,
          subject,
          sender,
          category,
          'classified',
          undefined,
          body,
          messageId
        );

        // If null is returned, this email was already processed
        if (activityId === null) {
          console.log("processEmail: Email already processed, skipping draft creation");
          return null;
        }
        
        // Add to the in-memory cache to prevent duplicates
        if (messageId) {
          processedMessageIds.add(messageId);
        }

        // Get current user preferences or default values
        const preferences = userProfile?.preferences || {
          autoDraft: true,
          signature: '',
          responseTone: 'professional',
          responseLength: 'balanced'
        };

        // Check if we should create a draft
        const spamCategory = `🚫 ${i18next.t('preferences.categories.spam')}`;
        const shouldCreateDraft = category !== spamCategory && preferences.autoDraft !== false;
        console.log(`processEmail: Should create draft? ${shouldCreateDraft}`, {
          category,
          isSpam: category === spamCategory,
          autoDraftSetting: preferences.autoDraft
        });

        // Skip draft creation for spam
        if (shouldCreateDraft) {
          console.log("processEmail: Starting draft creation");
          let draftUrl: string | undefined;
          
          try {
            // Get user's signature
            const signature = preferences.signature || '';
            console.log(`processEmail: User signature ${signature ? 'exists' : 'does not exist'}`);
            
            // Generate draft content once
            console.log("processEmail: Requesting draft content from webhook");
            const responseContent = await generateDraftContent(
              subject, 
              body, 
              category, 
              sender,
              signature
            );
            console.log("processEmail: Generated response content", responseContent.substring(0, 50) + "...");

            // Create the draft in the appropriate email service
            if (gmailIntegration) {
              console.log("processEmail: Creating Gmail draft");
              try {
                const gmail = new GmailService(
                  gmailIntegration.config.accessToken,
                  gmailIntegration.config.refreshToken,
                  userId  // Pass the userId for token updates
                );
                const draftId = await gmail.createDraft(
                  sender,
                  `Re: ${subject}`,
                  responseContent
                );
                console.log(`processEmail: Gmail draft created with ID ${draftId}`);
                draftUrl = `https://mail.google.com/mail/u/0/#drafts/${draftId}`;
              } catch (gmailError) {
                console.error("processEmail: Error creating Gmail draft:", gmailError);
                if (gmailError instanceof GmailNetworkError) {
                  toast.error("Network error when creating draft. Please check your connection.");
                } else if (gmailError instanceof GmailAuthError) {
                  notifyGmailAuthError();
                } else {
                  throw gmailError;
                }
              }
            } else if (outlookIntegration) {
              console.log("processEmail: Creating Outlook draft");
              try {
                const outlook = new OutlookService(outlookIntegration.config.accessToken);
                const draftId = await outlook.createDraft(
                  sender,
                  `Re: ${subject}`,
                  responseContent
                );
                console.log(`processEmail: Outlook draft created with ID ${draftId}`);
                draftUrl = `https://outlook.office.com/mail/drafts/id/${draftId}`;
              } catch (outlookError) {
                console.error("processEmail: Error creating Outlook draft:", outlookError);
                toast.error("Error creating Outlook draft. Please try again later.");
              }
            } else {
              // Try to use stored tokens if available
              try {
                console.log("processEmail: No active integration, checking for stored tokens");
                const gmail = await GmailService.createFromStoredTokens();
                if (gmail) {
                  console.log("processEmail: Using stored tokens for draft creation");
                  const draftId = await gmail.createDraft(
                    sender,
                    `Re: ${subject}`,
                    responseContent
                  );
                  console.log(`processEmail: Gmail draft created with ID ${draftId} using stored tokens`);
                  draftUrl = `https://mail.google.com/mail/u/0/#drafts/${draftId}`;
                } else {
                  console.log("processEmail: No stored tokens available for draft creation");
                }
              } catch (storedTokenError) {
                console.error("processEmail: Error using stored tokens:", storedTokenError);
                if (storedTokenError instanceof GmailAuthError) {
                  notifyGmailAuthError();
                }
              }
            }
          } catch (draftError) {
            console.error("processEmail: Error creating draft:", draftError);
          }

          // Update activity with draft
          if (draftUrl) {
            console.log(`processEmail: Updating activity with draft URL ${draftUrl}`);
            try {
              await saveEmailActivity(
                userId,
                subject,
                sender,
                category,
                'draft_created',
                draftUrl,
                body,
                messageId
              );
            } catch (updateError) {
              console.error("processEmail: Error updating activity with draft URL:", updateError);
              // Continue processing even if this fails
            }
          } else {
            console.log("processEmail: No draft URL available, skipping activity update");
          }
        }
      } catch (activityError) {
        console.error("processEmail: Error saving activity:", activityError);
        // Let's continue even if there's an error saving the activity
      }

      return category;
    } catch (error) {
      console.error('Error processing email:', error);
      
      if (error instanceof GmailNetworkError) {
        toast.error(`Network error: ${error.message}`);
      } else if (error instanceof GmailAuthError) {
        notifyGmailAuthError();
      } else {
        toast.error(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
      
      throw error;
    } finally {
      setProcessing(false);
    }
  }, [currentUser, userProfile, notifyGmailAuthError]);

  const fetchAndProcessEmails = useCallback(async () => {
    // Get user from current session or stored session
    let userId = currentUser?.uid;
    let currentUserPreferences = userProfile?.preferences;
    
    // If no current user, try to get from stored session
    if (!userId) {
      const storedSession = getStoredUserSession();
      if (storedSession) {
        userId = storedSession.userId;
        console.log(`fetchAndProcessEmails: Using stored user ID ${userId}`);
      } else {
        console.log("fetchAndProcessEmails: No current user or stored session found");
        return;
      }
    }
    
    // Check if auto-classify is enabled
    if (currentUser && !userProfile?.preferences?.autoClassify) {
      console.log("fetchAndProcessEmails: Auto-classify is disabled for logged-in user", {
        preferences: userProfile?.preferences,
        autoClassify: userProfile?.preferences?.autoClassify
      });
      return;
    }
    
    // Check if we're already fetching emails
    if (fetchingEmails) {
      console.log("fetchAndProcessEmails: Already fetching emails, skipping");
      return;
    }
    
    // Check internet connectivity
    if (!navigator.onLine) {
      console.log("fetchAndProcessEmails: No internet connection available");
      return;
    }

    try {
      setFetchingEmails(true);
      console.log("fetchAndProcessEmails: Starting email fetch process");
      
      // Get user's email integrations or try to use stored tokens
      const integrations = userId ? await getUserIntegrations(userId) : [];
      const gmailIntegration = integrations.find(i => i.type === 'gmail');
      
      console.log("fetchAndProcessEmails: Available integrations:", {
        gmail: !!gmailIntegration
      });
      
      let gmail = null;
      
      if (gmailIntegration) {
        try {
          console.log("fetchAndProcessEmails: Processing Gmail emails using integration");
          gmail = new GmailService(
            gmailIntegration.config.accessToken,
            gmailIntegration.config.refreshToken,
            userId // Pass the userId for token updates
          );
        } catch (error) {
          console.error('Failed to initialize Gmail service from integration:', error);
        }
      } else {
        // Try to use stored tokens if no active integration
        try {
          console.log("fetchAndProcessEmails: Trying to use stored tokens");
          gmail = await GmailService.createFromStoredTokens();
          if (gmail) {
            console.log("fetchAndProcessEmails: Successfully created Gmail service from stored tokens");
          }
        } catch (tokenError) {
          console.error('Failed to initialize Gmail service from stored tokens:', tokenError);
        }
      }
      
      if (gmail) {
        try {
          // Pass user preferences to the Gmail service for draft creation
          await gmail.processRecentEmails(userId, currentUserPreferences);
          console.log('Successfully processed recent emails');
        } catch (error) {
          console.error('Failed to process Gmail emails:', error);
          
          // Provide more specific error messages based on the type of error
          let errorMessage = 'Failed to process emails.';
          
          if (error instanceof GmailAuthError) {
            errorMessage = `Authentication error: ${error.message}. Please reconnect your Gmail account.`;
            // Trigger auth error event
            notifyGmailAuthError();
          } else if (error instanceof GmailNetworkError) {
            errorMessage = `Network error: ${error.message}. Please check your internet connection.`;
            // Don't show toast for background network errors
            console.error('Gmail network error:', error);
          } else if (error instanceof Error) {
            errorMessage = error.message;
          }
          
          // Only show notification for specifically handled errors
          // Don't interrupt the user experience with error notifications
          // during background processing
          // toast.error(errorMessage);
          
          // Log error with full details
          console.error('Gmail processing error details:', {
            message: errorMessage,
            originalError: error
          });
        }
      } else {
        console.log("fetchAndProcessEmails: No Gmail service available");
      }
    } catch (error) {
      console.error('Failed to fetch and process emails:', error);
      // No toast notification for background processing errors
    } finally {
      setFetchingEmails(false);
    }
  }, [currentUser, userProfile, fetchingEmails, notifyGmailAuthError]);

  return {
    processEmail,
    fetchAndProcessEmails,
    processing,
    fetchingEmails,
    networkStatus
  };
}