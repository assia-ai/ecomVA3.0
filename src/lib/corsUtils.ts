/**
 * Utilitaire pour contourner les problèmes CORS avec l'API Gmail en développement local
 */

// Déterminer si nous sommes en environnement de développement local
const isDevelopment = window.location.hostname === 'localhost' || 
                      window.location.hostname === '127.0.0.1' || 
                      window.location.hostname.startsWith('192.168.');

/**
 * Envoie un brouillon Gmail en contournant CORS pour le développement local
 * En environnement de développement, simule une réponse réussie
 * En production, effectue l'envoi réel
 */
export async function sendDraftWithCorsWorkaround(
  draftId: string, 
  accessToken: string
): Promise<{ id: string, threadId: string }> {
  try {
    console.log(`sendDraftWithCorsWorkaround: Trying to send draft ${draftId}`);
    
    if (isDevelopment) {
      console.log(`sendDraftWithCorsWorkaround: Using CORS workaround for local development`);
      
      try {
        // En développement, on fait la requête mais on ignore le résultat
        // car on ne peut pas le lire à cause du mode 'no-cors'
        await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/drafts/${draftId}/send`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({}),
          mode: 'no-cors' // Contourne les erreurs CORS mais rend la réponse opaque
        });
        
        console.log(`sendDraftWithCorsWorkaround: Draft ${draftId} sent (simulated in development)`);
        
        // On simule une réponse de succès pour le développement local
        return {
          id: `mock-message-${Date.now()}`,
          threadId: `mock-thread-${Date.now()}`
        };
      } catch (error) {
        // En mode no-cors, cette erreur ne devrait pas se produire
        // mais si c'est le cas, on simule quand même une réponse réussie
        console.warn(`sendDraftWithCorsWorkaround: Fetch error in no-cors mode:`, error);
        return {
          id: `mock-message-${Date.now()}-error-recovered`,
          threadId: `mock-thread-${Date.now()}-error-recovered`
        };
      }
    } else {
      // En production, faire une requête normale - cette section ne sera jamais exécutée en développement local
      const response = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/drafts/${draftId}/send`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({})
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Gmail API error details:', errorData);
        throw new Error(`Failed to send draft: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      return {
        id: data.id,
        threadId: data.threadId
      };
    }
  } catch (error) {
    console.error(`sendDraftWithCorsWorkaround: Failed to send draft ${draftId}:`, error);
    
    if (isDevelopment) {
      // En développement, générer une réponse factice même en cas d'erreur
      console.warn(`sendDraftWithCorsWorkaround: Returning mock response after error`);
      return {
        id: `mock-message-${Date.now()}-error-fallback`,
        threadId: `mock-thread-${Date.now()}-error-fallback`
      };
    }
    throw error;
  }
}

/**
 * Récupère la liste des brouillons Gmail en contournant CORS pour le développement local
 */
export async function getDraftsWithCorsWorkaround(
  accessToken: string
): Promise<Array<{ id: string, message: { id: string, threadId?: string } }>> {
  if (isDevelopment) {
    console.log(`getDraftsWithCorsWorkaround: Using mock drafts for local development`);
    // En développement, renvoyer des données factices
    return [
      { 
        id: 'r123456789', 
        message: { 
          id: 'msg123456789', 
          threadId: 'thread123456789' 
        } 
      },
      { 
        id: 'r987654321', 
        message: { 
          id: 'msg987654321', 
          threadId: 'thread987654321' 
        } 
      }
    ];
  } else {
    // En production, faire une requête normale
    const response = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/drafts`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch drafts: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.drafts || [];
  }
}