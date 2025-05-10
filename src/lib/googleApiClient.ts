const GMAIL_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const GMAIL_API_KEY = import.meta.env.VITE_GOOGLE_API_KEY || '';
const GMAIL_SCOPES = 'https://www.googleapis.com/auth/gmail.modify https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email';

// L'URL de base pour l'API Gmail - corrigée pour utiliser l'URL correcte
const GMAIL_API_BASE_URL = 'https://gmail.googleapis.com/gmail/v1/users/me';

// Déclaration pour TypeScript - nécessaire car nous chargeons gapi dynamiquement
declare global {
  interface Window {
    gapi: any;
  }
}

let apiInitialized = false;
let apiLoaded = false;
let scriptLoaded = false;

/**
 * Charge le script Google API Client directement depuis les CDN de Google
 */
const loadGapiScript = (): Promise<void> => {
  if (scriptLoaded) {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    // Vérifier si le script est déjà chargé
    if (window.gapi) {
      scriptLoaded = true;
      resolve();
      return;
    }
    
    // Charger le script depuis le CDN de Google
    const script = document.createElement('script');
    script.src = 'https://apis.google.com/js/api.js';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      scriptLoaded = true;
      console.log('Google API script loaded from CDN');
      resolve();
    };
    script.onerror = (error) => {
      console.error('Failed to load Google API script:', error);
      reject(new Error('Failed to load Google API script'));
    };
    
    document.head.appendChild(script);
  });
};

/**
 * Charge les bibliothèques Google API Client
 */
export const loadGoogleApi = async (): Promise<void> => {
  if (apiLoaded) {
    return Promise.resolve();
  }

  try {
    // D'abord, charger le script GAPI
    await loadGapiScript();

    // Ensuite, charger la bibliothèque client
    return new Promise((resolve, reject) => {
      window.gapi.load('client', {
        callback: () => {
          apiLoaded = true;
          console.log('Google API Client loaded successfully');
          resolve();
        },
        onerror: (error: Error) => {
          console.error('Error loading Google API Client:', error);
          reject(new Error('Failed to load Google API client'));
        },
        timeout: 10000, // 10 secondes timeout
        ontimeout: () => {
          console.error('Timeout loading Google API Client');
          reject(new Error('Timeout loading Google API client'));
        }
      });
    });
  } catch (err) {
    console.error('Exception while loading Google API:', err);
    throw err;
  }
};

/**
 * Initialise le client Google API avec les clés et les étendues nécessaires
 * @param token Token d'accès OAuth2 optionnel pour l'authentification
 */
export const initializeGoogleApi = async (token?: string): Promise<void> => {
  if (apiInitialized) {
    return;
  }

  try {
    // Charger l'API si ce n'est pas déjà fait
    await loadGoogleApi();

    // Initialiser le client avec la clé API
    await window.gapi.client.init({
      apiKey: GMAIL_API_KEY,
      clientId: GMAIL_CLIENT_ID,
      scope: GMAIL_SCOPES,
    });

    // Si un token est fourni, l'utiliser pour l'authentification
    if (token) {
      window.gapi.client.setToken({ access_token: token });
    }

    // Charger l'API Gmail spécifiquement
    await window.gapi.client.load('gmail', 'v1');
    
    apiInitialized = true;
    console.log('Google API Client initialized successfully');
  } catch (error) {
    console.error('Failed to initialize Google API client:', error);
    throw error;
  }
};

/**
 * Réinitialise le client avec un nouveau token
 * @param token Nouveau token d'accès
 */
export const updateGoogleApiToken = (token: string): void => {
  if (!apiLoaded) {
    throw new Error('Google API Client not loaded yet');
  }

  window.gapi.client.setToken({ access_token: token });
  console.log('Google API token updated');
};

/**
 * Efface le token d'authentification
 */
export const clearGoogleApiToken = (): void => {
  if (!apiLoaded) {
    return;
  }

  window.gapi.client.setToken(null);
  console.log('Google API token cleared');
};

/**
 * Vérifie si le client Google API est initialisé
 */
export const isGoogleApiInitialized = (): boolean => {
  return apiInitialized;
};

/**
 * Exécute un appel API Gmail en utilisant la bibliothèque gapi
 * Cette fonction est sécurisée contre CORS car elle utilise la bibliothèque Google officielle
 * @param endpoint Chemin de l'API (après /gmail/v1/users/me/)
 * @param method Méthode HTTP
 * @param params Paramètres de la requête
 * @param body Corps de la requête
 * @returns Résultat de la requête
 */
export const executeGmailApiRequest = async <T>(
  endpoint: string,
  method: string = 'GET',
  params: Record<string, any> = {},
  body: any = undefined
): Promise<T> => {
  if (!apiInitialized) {
    throw new Error('Google API Client not initialized');
  }

  try {
    // Construire l'URL complète de l'API Gmail
    const path = `${GMAIL_API_BASE_URL}/${endpoint}`;
    
    // Préparer la requête
    const request: any = {
      path,
      method,
      params,
    };

    // Ajouter le corps si nécessaire
    if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      request.body = JSON.stringify(body);
    }

    // Exécuter la requête
    const response = await window.gapi.client.request(request);
    return response.result as T;
  } catch (error: any) {
    // Amélioration de la gestion des erreurs pour extraire les détails utiles
    console.error(`Gmail API request failed for ${endpoint}:`, error);
    
    let errorMessage = 'Unknown API error';
    let errorDetails = null;
    let errorCode = null;
    
    // Extraction des informations utiles de l'erreur
    if (error.result) {
      // Format d'erreur API Google standard
      errorDetails = error.result.error || error.result;
      errorCode = errorDetails.code || 'unknown';
      errorMessage = errorDetails.message || 'API error without message';
      
      console.error(`API Error (${errorCode}): ${errorMessage}`);
      if (errorDetails.errors && errorDetails.errors.length > 0) {
        console.error('Detailed errors:', errorDetails.errors);
      }
    } else if (error.message) {
      // Format d'erreur JavaScript standard
      errorMessage = error.message;
      errorCode = error.code || 'unknown';
    } else if (typeof error === 'string') {
      // Erreur sous forme de chaîne
      errorMessage = error;
    }
    
    // Construire une erreur plus informative
    const enhancedError = new Error(`Gmail API error (${errorCode}): ${errorMessage}`);
    (enhancedError as any).originalError = error;
    (enhancedError as any).details = errorDetails;
    (enhancedError as any).code = errorCode;
    throw enhancedError;
  }
};