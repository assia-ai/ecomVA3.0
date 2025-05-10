import { getDoc, doc, collection, query, where, getDocs, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { GmailService } from './gmail.ts';
import { saveEmailActivity } from './email.ts';
import { EmailActivity, UserProfile } from '../collections';

const PROCESSING_INTERVAL = 1 * 60 * 1000; // 1 minute

/**
 * Service pour gérer l'envoi automatique des brouillons et des réponses selon les préférences utilisateur
 */
export class AutoSenderService {
  private userId: string;
  private gmailService: GmailService;
  
  constructor(userId: string, gmailService: GmailService) {
    this.userId = userId;
    this.gmailService = gmailService;
  }

  /**
   * Récupère les préférences utilisateur concernant l'envoi automatique
   */
  async getUserAutoSendPreferences(): Promise<{
    autoSendDrafts: boolean;
    autoSendResponses: boolean;
    autoSendDelay: number;
  }> {
    try {
      const userRef = doc(db, 'users', this.userId);
      const userSnap = await getDoc(userRef);
      
      if (!userSnap.exists()) {
        console.log('User not found, using default preferences');
        return {
          autoSendDrafts: true,  // Changé de false à true
          autoSendResponses: false,
          autoSendDelay: 0       // Changé de 0 à 5 minutes par défaut
        };
      }
      
      const userData = userSnap.data() as UserProfile;
      const preferences = {
        // Important: true par défaut sauf si explicitement défini à false
        autoSendDrafts: userData.preferences?.autoSendDrafts !== false, // Modifié cette ligne
        autoSendResponses: userData.preferences?.autoSendResponses || false,
        autoSendDelay: userData.preferences?.autoSendDelay || 0 // Modifié de 0 à 5 minutes par défaut
      };
      
      console.log(`[AutoSender] Préférences utilisateur chargées: autoSendDrafts=${preferences.autoSendDrafts}, delay=${preferences.autoSendDelay}min`);
      return preferences;
    } catch (error) {
      console.error('Failed to get user preferences:', error);
      return {
        autoSendDrafts: true,  // Changé de false à true
        autoSendResponses: false,
        autoSendDelay: 0       // Changé de 0 à 5 minutes par défaut
      };
    }
  }

  /**
   * Planifie l'envoi d'un brouillon selon les préférences de l'utilisateur
   * @param draftId ID du brouillon à envoyer
   * @param emailActivityId ID de l'activité email associée
   * @returns Date prévue pour l'envoi ou null si non planifiée
   */
  async scheduleDraftSend(draftId: string, emailActivityId: string): Promise<Date | null> {
    try {
      // Récupérer les préférences utilisateur
      const prefs = await this.getUserAutoSendPreferences();
      
      // Si l'envoi automatique n'est pas activé, ne pas planifier
      if (!prefs.autoSendDrafts) {
        console.log('Auto-send drafts is disabled for user', this.userId);
        return null;
      }
      
      // Calculer la date d'envoi prévue (maintenant + délai)
      const scheduledTime = new Date();
      scheduledTime.setMinutes(scheduledTime.getMinutes() + prefs.autoSendDelay);
      
      // Mettre à jour l'activité email avec l'ID du brouillon et la date d'envoi prévue
      const emailsQuery = query(
        collection(db, 'emails'),
        where('id', '==', emailActivityId),
        where('userId', '==', this.userId)
      );
      
      const querySnapshot = await getDocs(emailsQuery);
      if (querySnapshot.empty) {
        console.error('Email activity not found:', emailActivityId);
        return null;
      }
      
      const emailDocRef = querySnapshot.docs[0].ref;
      await updateDoc(emailDocRef, {
        draftId,
        scheduledSendTime: scheduledTime
      });
      
      console.log(`Draft ${draftId} scheduled for sending at ${scheduledTime.toISOString()}`);
      
      // Si le délai est de 0, envoyer immédiatement
      if (prefs.autoSendDelay === 0) {
        await this.sendDraft(draftId, emailActivityId);
        return new Date(); // Retourne la date actuelle car envoyé immédiatement
      }
      
      return scheduledTime;
    } catch (error) {
      console.error('Failed to schedule draft send:', error);
      return null;
    }
  }

  /**
   * Envoie un brouillon Gmail
   * @param draftId ID du brouillon Gmail à envoyer
   * @param emailActivityId ID de l'activité email associée
   * @returns true si envoyé avec succès, false sinon
   */
  async sendDraft(draftId: string, emailActivityId: string): Promise<boolean> {
    try {
      // Vérifier que le brouillon existe et appartient à l'utilisateur
      const emailsQuery = query(
        collection(db, 'emails'),
        where('id', '==', emailActivityId),
        where('userId', '==', this.userId),
        where('draftId', '==', draftId)
      );
      
      const querySnapshot = await getDocs(emailsQuery);
      if (querySnapshot.empty) {
        console.error(`No matching draft found for user ${this.userId} with ID ${draftId}`);
        return false;
      }
      
      // Envoyer le brouillon via Gmail API
      const result = await this.gmailService.sendDraft(draftId);
      
      if (result && result.id) {
        console.log(`Draft ${draftId} sent successfully as message ${result.id}`);
        
        // Mettre à jour l'activité email
        const emailDocRef = querySnapshot.docs[0].ref;
        await updateDoc(emailDocRef, {
          status: 'draft_sent',
          sentAt: new Date()
        });
        
        return true;
      } else {
        console.error(`Failed to send draft ${draftId}: No message ID returned`);
        return false;
      }
    } catch (error) {
      console.error(`Failed to send draft ${draftId}:`, error);
      return false;
    }
  }

  /**
   * Vérifie et envoie tous les brouillons planifiés qui sont dus
   * @returns Nombre de brouillons envoyés
   */
  async processPendingDrafts(): Promise<number> {
    try {
      console.log(`[AutoSender] Début de traitement des brouillons en attente pour l'utilisateur ${this.userId}`);
      
      // Vérifier d'abord si l'option d'envoi automatique est activée
      const prefs = await this.getUserAutoSendPreferences();
      if (!prefs.autoSendDrafts) {
        console.log(`[AutoSender] L'envoi automatique est DÉSACTIVÉ pour l'utilisateur ${this.userId}. Arrêt du traitement.`);
        return 0;
      }
      
      console.log(`[AutoSender] L'envoi automatique est ACTIVÉ pour l'utilisateur ${this.userId}. Délai: ${prefs.autoSendDelay} minutes`);
      
      const now = new Date();
      console.log(`[AutoSender] Date actuelle: ${now.toISOString()}`);
      
      const emailsQuery = query(
        collection(db, 'emails'),
        where('userId', '==', this.userId),
        where('status', '==', 'draft_created')
      );
      
      console.log('[AutoSender] Recherche des brouillons avec statut "draft_created"');
      const querySnapshot = await getDocs(emailsQuery);
      console.log(`[AutoSender] ${querySnapshot.size} brouillons avec statut "draft_created" trouvés`);
      
      if (querySnapshot.empty) {
        console.log('[AutoSender] Aucun brouillon avec statut "draft_created"');
        return 0;
      }
      
      // Filtrer manuellement les brouillons dont la date d'envoi est dépassée
      const dueEmails = querySnapshot.docs.filter(docSnapshot => {
        const emailData = docSnapshot.data() as any;
        if (!emailData.scheduledSendTime) {
          console.log(`[AutoSender] Brouillon ${docSnapshot.id} n'a pas de date d'envoi programmée`);
          return false;
        }
        let scheduledTime: Date;
        const raw = emailData.scheduledSendTime;
        try {
          if (raw && typeof raw.toDate === 'function') {
            // Firestore Timestamp
            scheduledTime = raw.toDate();
          } else if (raw instanceof Date) {
            scheduledTime = raw;
          } else if (typeof raw === 'string' || typeof raw === 'number') {
            scheduledTime = new Date(raw);
          } else {
            console.error(`[AutoSender] Format de date non reconnu pour ${docSnapshot.id}:`, raw);
            return false;
          }
        } catch (e) {
          console.error(`[AutoSender] Erreur de conversion de date pour ${docSnapshot.id}:`, e);
          return false;
        }
        
        // Vérifier si la date d'envoi est dépassée ou égale à maintenant
        const isDue = scheduledTime <= now;
        console.log(`[AutoSender] Brouillon ${docSnapshot.id} | scheduledSendTime: ${scheduledTime.toISOString()} | isDue: ${isDue}`);
        return isDue;
      });
      
      console.log(`[AutoSender] ${dueEmails.length} brouillons prêts à être envoyés sur ${querySnapshot.size} brouillons trouvés`);
      
      if (dueEmails.length === 0) {
        // Afficher les brouillons non envoyés pour diagnostic
        querySnapshot.docs.forEach(docSnapshot => {
          const emailData = docSnapshot.data();
          
          // Afficher la date d'envoi planifiée sous forme lisible
          let scheduledTimeStr = "non définie";
          if (emailData.scheduledSendTime) {
            try {
              const scheduledTime = emailData.scheduledSendTime.toDate ? 
                emailData.scheduledSendTime.toDate() : 
                new Date(emailData.scheduledSendTime);
              scheduledTimeStr = scheduledTime.toISOString();
              
              // Calculer le temps restant avant envoi
              const remainingMs = scheduledTime.getTime() - now.getTime();
              const remainingMins = Math.round(remainingMs / 60000);
              scheduledTimeStr += ` (dans environ ${remainingMins} minutes)`;
            } catch (e) {
              scheduledTimeStr = String(emailData.scheduledSendTime) + " (format invalide)";
            }
          }
          
          console.log(`[AutoSender] DIAGNOSTIC: ${docSnapshot.id} | scheduledSendTime: ${scheduledTimeStr} | draftId: ${emailData.draftId || 'non défini'} | status: ${emailData.status}`);
        });
        return 0;
      }
      
      let sentCount = 0;
      
      // Traiter chaque brouillon
      for (const docSnapshot of dueEmails) {
        const emailData = docSnapshot.data() as EmailActivity;
        
        console.log(`[AutoSender] Traitement du brouillon ${docSnapshot.id}`);
        
        // Vérifier si le champ draftId existe
        if (!emailData.draftId) {
          console.error(`[AutoSender] ERREUR: Brouillon ${docSnapshot.id} n'a pas d'ID de brouillon Gmail`);
          continue;
        }
        
        let scheduledTimeStr = "inconnu";
        if (emailData.scheduledSendTime) {
          try {
            const scheduledTime = emailData.scheduledSendTime.toDate ? 
              emailData.scheduledSendTime.toDate() : 
              new Date(emailData.scheduledSendTime);
            scheduledTimeStr = scheduledTime.toISOString();
          } catch (e) {
            scheduledTimeStr = String(emailData.scheduledSendTime);
          }
        }
        
        console.log(`[AutoSender] Envoi du brouillon ${docSnapshot.id} (planifié pour: ${scheduledTimeStr})`);
        
        try {
          console.log(`[AutoSender] Appel de sendDraft pour draftId: ${emailData.draftId}`);
          const result = await this.gmailService.sendDraft(emailData.draftId);
          console.log(`[AutoSender] SUCCÈS: Brouillon ${docSnapshot.id} envoyé, messageId: ${result.id}`);
          
          // Mettre à jour le statut dans Firestore
          await updateDoc(doc(db, 'emails', docSnapshot.id), {
            status: 'draft_sent',
            sentAt: new Date(),
            messageId: result.id
          });
          
          console.log(`[AutoSender] Statut Firestore mis à jour pour ${docSnapshot.id}`);
          sentCount++;
        } catch (sendError) {
          console.error(`[AutoSender] EXCEPTION lors de l'envoi du brouillon ${docSnapshot.id}:`, sendError);
        }
      }
      
      console.log(`[AutoSender] Traitement terminé. ${sentCount} brouillons envoyés sur ${dueEmails.length} brouillons prêts`);
      return sentCount;
    } catch (error) {
      console.error('[AutoSender] ERREUR CRITIQUE: Échec du traitement des brouillons en attente:', error);
      return 0;
    }
  }
}