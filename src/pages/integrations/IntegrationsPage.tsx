import React, { useState, useEffect, useCallback } from 'react';
import { 
  ShoppingCart, 
  Mail, 
  AlertTriangle, 
  CheckCircle, 
  Link as LinkIcon,
  Trash2,
  Tag,
  Loader,
  RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import toast from 'react-hot-toast';
import { GmailService, GmailAuthError, GMAIL_AUTH_ERROR_EVENT_NAME } from '../../lib/services/gmail';
import { ShopifyService } from '../../lib/services/shopify';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import GmailSignInModal from '../../components/modals/GmailSignInModal';
import GmailLabelsModal from '../../components/modals/GmailLabelsModal';
import { getUserIntegrations, removeIntegration, getIntegration } from '../../lib/services/integrations';
import { useTranslation } from 'react-i18next';

const IntegrationsPage: React.FC = () => {
  const { t, i18n } = useTranslation(); // Moved inside the component
  const { currentUser, gmailAuthError, resetGmailAuthError } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  
  // Loading state for initial page load
  const [initialLoading, setInitialLoading] = useState(true);
  // Loading state for OAuth redirect processing
  const [redirectLoading, setRedirectLoading] = useState(false);
  
  // Modal states
  const [isGmailModalOpen, setIsGmailModalOpen] = useState(false);
  const [isLabelsModalOpen, setIsLabelsModalOpen] = useState(false);
  const [gmailLabels, setGmailLabels] = useState<any[]>([]);
  const [loadingLabels, setLoadingLabels] = useState(false);
  const [creatingLabels, setCreatingLabels] = useState(false);
  
  // Shopify integration states
  const [shopifyUrl, setShopifyUrl] = useState('');
  const [shopifyToken, setShopifyToken] = useState('');
  const [isShopifyConnected, setIsShopifyConnected] = useState(false);
  const [shopifyLoading, setShopifyLoading] = useState(false);

  // Email integration states
  const [isGmailConnected, setIsGmailConnected] = useState(false);
  const [isOutlookConnected, setIsOutlookConnected] = useState(false);
  const [connectedGmailEmail, setConnectedGmailEmail] = useState<string>('');
  const [emailLoading, setEmailLoading] = useState(false);
  const [gmailIntegration, setGmailIntegration] = useState<any>(null);

  // Open the Gmail modal if an auth error is detected
  useEffect(() => {
    if (gmailAuthError) {
      setIsGmailModalOpen(true);
      resetGmailAuthError();
    }
  }, [gmailAuthError, resetGmailAuthError]);

  // Listen for Gmail auth errors to prompt reconnection
  useEffect(() => {
    const handleGmailAuthError = () => {
      console.log('IntegrationsPage: Gmail auth error event received');
      setIsGmailModalOpen(true);
      
      if (isGmailConnected) {
        toast.error(t('integrations.gmail.errorExpired'));
        setIsGmailConnected(false);
      }
    };

    window.addEventListener(GMAIL_AUTH_ERROR_EVENT_NAME, handleGmailAuthError);
    
    return () => {
      window.removeEventListener(GMAIL_AUTH_ERROR_EVENT_NAME, handleGmailAuthError);
    };
  }, [isGmailConnected]);

  // Load existing integrations
  const loadIntegrations = useCallback(async () => {
    // Skip loading if we're handling an OAuth callback
    const params = new URLSearchParams(location.search);
    if (!currentUser || params.get('code')) {
      setInitialLoading(false);
      return;
    }
    
    try {
      setInitialLoading(true);
      console.log('Loading integrations for user:', currentUser.uid);
      const integrations = await getUserIntegrations(currentUser.uid);
      console.log('Loaded integrations:', integrations);
      
      const gmailIntegration = integrations.find(i => i.type === 'gmail');
      const shopifyIntegration = integrations.find(i => i.type === 'shopify');
      
      if (gmailIntegration) {
        console.log('Found Gmail integration:', gmailIntegration);
        setIsGmailConnected(true);
        setConnectedGmailEmail(gmailIntegration.config.email);
        setGmailIntegration(gmailIntegration);
      } else {
        console.log('No Gmail integration found');
        setIsGmailConnected(false);
        setConnectedGmailEmail('');
        setGmailIntegration(null);
      }
      
      if (shopifyIntegration) {
        setIsShopifyConnected(true);
        setShopifyUrl(shopifyIntegration.config.shopDomain);
      } else {
        setIsShopifyConnected(false);
        setShopifyUrl('');
      }
    } catch (error) {
      console.error('Error loading integrations:', error);
      toast.error('Failed to load integrations');
    } finally {
      setInitialLoading(false);
    }
  }, [currentUser, location.search]);

  useEffect(() => {
    loadIntegrations();
  }, [loadIntegrations]);

  // Handle OAuth callback
  useEffect(() => {
    const handleOAuthResponse = async () => {
      const params = new URLSearchParams(location.search);
      const code = params.get('code');
      if (!code || !currentUser) return;

      if (code) {
        try {
          setEmailLoading(true);
          setRedirectLoading(true); // Activer le loading de redirection
          
          const email = await GmailService.handleOAuthCallback(currentUser.uid, code);
          setIsGmailConnected(true);
          setConnectedGmailEmail(email);
          toast.success(t('integrations.gmail.connectSuccess', { email }));
          
          // Reload integrations to get the Gmail integration
          await loadIntegrations();
        } catch (error) {
          console.error('Gmail connection error:', error);
          toast.error(t('integrations.gmail.connectError'));
        } finally {
          setEmailLoading(false);
          setRedirectLoading(false); // Désactiver le loading de redirection
          // Clear the URL hash
          window.history.replaceState(null, '', location.pathname);
        }
      }
    };

    handleOAuthResponse();
  }, [location, currentUser, loadIntegrations]);

  // Handlers for Shopify integration
  const handleShopifyConnect = async () => {
    if (!shopifyUrl || !shopifyToken) {
      toast.error(t('integrations.shopify.errorMissingFields'));
      return;
    }
    
    setShopifyLoading(true);
    
    try {
      const shop = await ShopifyService.connect(
        currentUser!.uid,
        shopifyUrl,
        shopifyToken
      );
      
      setIsShopifyConnected(true);
      toast.success(t('integrations.shopify.connectSuccess'));
      
      // Reload integrations to refresh state
      await loadIntegrations();
    } catch (error: any) {
      console.error('Shopify connection error:', error);
      toast.error(error.message || 'Failed to connect Shopify store');
    } finally {
      setShopifyLoading(false);
    }
  };
  
  const handleShopifyDisconnect = async () => {
    if (!currentUser) return;
    
    setShopifyLoading(true);
    
    try {
      await removeIntegration(currentUser.uid, 'shopify');
      setIsShopifyConnected(false);
      setShopifyUrl('');
      setShopifyToken('');
      toast.success('Shopify store disconnected');
    } catch (error) {
      console.error('Failed to disconnect Shopify:', error);
      toast.error(t('integrations.shopify.disconnectError'));
    } finally {
      setShopifyLoading(false);
    }
  };

  // Handlers for email integrations
  const handleGmailConnect = () => {
    setIsGmailModalOpen(true);
  };

  const handleGmailSignIn = () => {
    try {
      GmailService.initiateOAuth();
      setIsGmailModalOpen(false);
    } catch (error) {
      console.error('Gmail OAuth error:', error);
      toast.error('Failed to start Gmail connection');
      setIsGmailModalOpen(false);
    }
  };

  const handleOutlookConnect = () => {
    setEmailLoading(true);
    
    // In a real app, this would redirect to Outlook OAuth flow
    // For demo purposes, we'll simulate the OAuth flow
    setTimeout(() => {
      setIsOutlookConnected(true);
      setEmailLoading(false);
      toast.success('Outlook connected successfully');
    }, 1500);
  };

  const handleGmailDisconnect = async () => {
    if (!currentUser) return;
    
    try {
      setEmailLoading(true);
      await GmailService.disconnect(currentUser.uid);
      setIsGmailConnected(false);
      setConnectedGmailEmail('');
      setGmailIntegration(null);
      toast.success('Gmail disconnected successfully');
      
      // Reload integrations to refresh state
      await loadIntegrations();
    } catch (error) {
      console.error('Failed to disconnect Gmail:', error);
      toast.error('Failed to disconnect Gmail');
    } finally {
      setEmailLoading(false);
    }
  };

  const handleOutlookDisconnect = () => {
    setIsOutlookConnected(false);
    toast.success('Outlook disconnected');
  };
  
  // Handle Gmail Labels
  const fetchGmailLabels = async () => {
    if (!currentUser) {
      toast.error(t('integrations.errors.notLoggedIn'));
      return;
    }
    
    setLoadingLabels(true);
    
    try {
      // First, ensure we have the latest Gmail integration data
      const freshIntegration = await getIntegration(currentUser.uid, 'gmail');
      console.log('Fresh Gmail integration for labels:', freshIntegration);
      
      if (!freshIntegration) {
        console.error('No Gmail integration found when trying to fetch labels');
        toast.error(t('integrations.gmail.noIntegration'));
        setLoadingLabels(false);
        return;
      }
      
      // Update our state with the fresh integration data
      setGmailIntegration(freshIntegration);
      
      const gmail = new GmailService(
        freshIntegration.config.accessToken,
        freshIntegration.config.refreshToken
      );
      
      const labels = await gmail.getLabels();
      console.log('Retrieved Gmail labels:', labels.length);
      setGmailLabels(labels);
      setIsLabelsModalOpen(true);
    } catch (error) {
      console.error('Failed to fetch Gmail labels:', error);
      
      // Handle authentication errors
      if (error instanceof GmailAuthError || 
          (error instanceof Error && 
           (error.message.includes('reconnect') || 
            error.message.includes('invalid') || 
            error.message.includes('expired')))) {
        
        toast.error(t('integrations.gmail.errorExpired'));
        
        // Disconnect the expired Gmail account
        if (currentUser) {
          try {
            await removeIntegration(currentUser.uid, 'gmail');
            setIsGmailConnected(false);
            setConnectedGmailEmail('');
            setGmailIntegration(null);
            
            // Reload integrations to refresh state
            await loadIntegrations();
          } catch (e) {
            console.error('Failed to remove invalid Gmail integration:', e);
          }
        }
      } else {
        toast.error(t('integrations.gmail.labelsError'));
      }
    } finally {
      setLoadingLabels(false);
    }
  };
  
  // Handle creating all Gmail category labels at once
  const handleCreateAllLabels = async () => {
    if (!currentUser) {
      toast.error('You need to be logged in to create Gmail labels');
      return;
    }
    
    setCreatingLabels(true);
    
    try {
      // First, ensure we have the latest Gmail integration data
      const freshIntegration = await getIntegration(currentUser.uid, 'gmail');
      console.log('Fresh Gmail integration for creating labels:', freshIntegration);
      
      if (!freshIntegration) {
        console.error('No Gmail integration found when trying to create labels');
        toast.error('No Gmail integration found. Please connect your Gmail account.');
        setCreatingLabels(false);
        return;
      }
      
      // Update our state with the fresh integration data
      setGmailIntegration(freshIntegration);
      
      const gmail = new GmailService(
        freshIntegration.config.accessToken,
        freshIntegration.config.refreshToken
      );
      
      await gmail.createAllCategoryLabels();
      toast.success('Category labels created in Gmail');
      
      // Refresh labels
      const updatedLabels = await gmail.getLabels();
      setGmailLabels(updatedLabels);
    } catch (error) {
      console.error('Failed to create Gmail labels:', error);
      
      // Handle authentication errors
      if (error instanceof GmailAuthError || 
          (error instanceof Error && 
           (error.message.includes('reconnect') || 
            error.message.includes('invalid') || 
            error.message.includes('expired')))) {
        
        toast.error(t('integrations.gmail.errorExpired'));
        
        // Disconnect the expired Gmail account
        if (currentUser) {
          try {
            await removeIntegration(currentUser.uid, 'gmail');
            setIsGmailConnected(false);
            setConnectedGmailEmail('');
            setGmailIntegration(null);
            
            // Reload integrations to refresh state
            await loadIntegrations();
          } catch (e) {
            console.error('Failed to remove invalid Gmail integration:', e);
          }
        }
      } else {
        toast.error('Failed to create Gmail labels. Please try again.');
      }
    } finally {
      setCreatingLabels(false);
    }
  };

  // If initial loading, show loading indicator
  if (initialLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <Loader className="w-10 h-10 text-primary-500 animate-spin" />
        <p className="mt-4 text-gray-600">{t('integrations.loading')}</p>
      </div>
    );
  }
  
  // Si nous sommes en train de traiter une redirection OAuth, afficher un écran de chargement spécifique
  if (redirectLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
          <div className="flex flex-col items-center">
            <img src="https://upload.wikimedia.org/wikipedia/commons/7/7e/Gmail_icon_%282020%29.svg" alt="Gmail" className="h-16 w-16 mb-4" />
            <Loader className="w-10 h-10 text-primary-500 animate-spin mb-4" />
            <h2 className="text-xl font-semibold mb-2 text-center">{t('integrations.gmail.authProcessing')}</h2>
            <p className="text-gray-600 text-center">{t('integrations.gmail.waitMessage')}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-xl font-semibold text-gray-900">{t('integrations.title')}</h2>
        <p className="text-gray-600">{t('integrations.description')}</p>
      </div>
      
      {/* Shopify Integration */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-full">
              <ShoppingCart className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <CardTitle>{t('integrations.shopify.title')}</CardTitle>
              <CardDescription>{t('integrations.shopify.description')}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {!isShopifyConnected ? (
            <div className="space-y-4">
              <Input 
                label={t('integrations.shopify.storeUrl')}
                placeholder="yourstorename.myshopify.com"
                value={shopifyUrl}
                onChange={(e) => setShopifyUrl(e.target.value)}
                fullWidth
              />
              <Input 
                label={t('integrations.shopify.apiToken')}
                placeholder="shpat_xxxxxxxxxxxx"
                value={shopifyToken}
                onChange={(e) => setShopifyToken(e.target.value)}
                helperText={t('integrations.shopify.instructions.title')}
                type="password"
                fullWidth
              />
            </div>
          ) : (
            <div className="bg-gray-50 p-4 rounded-md">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
                <div className="flex items-center mb-2 sm:mb-0">
                  <CheckCircle className="h-5 w-5 text-success-600 mr-2 flex-shrink-0" />
                  <span className="font-medium text-gray-900 break-all">{shopifyUrl}</span>
                </div>
                <span className="text-xs px-2 py-1 rounded-full bg-success-100 text-success-800 self-start sm:self-auto">
                  {t('integrations.shopify.connected')}
                </span>
              </div>
              <p className="mt-2 text-sm text-gray-600">
                {t('integrations.shopify.connectedDescription')}
              </p>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-end">
          {!isShopifyConnected ? (
            <Button
              onClick={handleShopifyConnect}
              isLoading={shopifyLoading}
              leftIcon={<LinkIcon className="h-4 w-4" />}
            >
              {t('integrations.shopify.connect')}
            </Button>
          ) : (
            <Button
              variant="outline"
              onClick={handleShopifyDisconnect}
              isLoading={shopifyLoading}
              leftIcon={<Trash2 className="h-4 w-4" />}
            >
              {t('integrations.shopify.disconnect')}
            </Button>
          )}
        </CardFooter>
      </Card>
      
      {/* Email Integrations */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-full">
              <Mail className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <CardTitle>{t('integrations.gmail.title')}</CardTitle>
              <CardDescription>{t('integrations.gmail.description')}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Gmail */}
            <div className="border border-gray-200 rounded-md p-4">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                <div className="flex items-center space-x-3">
                  <img src="https://upload.wikimedia.org/wikipedia/commons/7/7e/Gmail_icon_%282020%29.svg" alt="Gmail" className="h-8 w-8" />
                  <div>
                    <h4 className="text-base font-medium text-gray-900">Gmail</h4>
                    <p className="text-sm text-gray-500 break-all">
                      {isGmailConnected ? connectedGmailEmail : t('integrations.gmail.connectGoogle')}
                    </p>
                  </div>
                </div>
                {isGmailConnected ? (
                  <div className="flex items-center space-x-2 flex-wrap sm:flex-nowrap">
                    <span className="text-xs px-2 py-1 rounded-full bg-success-100 text-success-800">
                      {t('integrations.gmail.connected')}
                    </span>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={fetchGmailLabels}
                      disabled={loadingLabels}
                      aria-label={t('integrations.gmail.viewLabels')}
                    >
                      <Tag className="h-4 w-4 text-gray-500" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={handleGmailDisconnect}
                      aria-label={t('integrations.gmail.disconnect')}
                    >
                      <Trash2 className="h-4 w-4 text-gray-500" />
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleGmailConnect}
                    isLoading={emailLoading}
                    className="w-full sm:w-auto"
                    leftIcon={<RefreshCw className="h-3 w-3 mr-1" />}
                  >
                    {gmailAuthError ? t('integrations.gmail.reconnect') : t('integrations.gmail.connect')}
                  </Button>
                )}
              </div>
              
              {isGmailConnected && (
                <div className="mt-3 p-2 bg-blue-50 rounded text-sm text-blue-700 flex items-start">
                  <Tag className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                  <p>
                    {t('integrations.gmail.labelDescription')}
                    <button 
                      onClick={fetchGmailLabels}
                      className="ml-1 underline hover:text-blue-900 focus:outline-none"
                      disabled={loadingLabels}
                    >
                      {loadingLabels ? t('integrations.gmail.loadingLabels') : t('integrations.gmail.viewLabels')}
                    </button>
                  </p>
                </div>
              )}
            </div>
            
            {/* Outlook */}
            <div className="border border-gray-200 rounded-md p-4">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                <div className="flex items-center space-x-3">
                  <img src="https://upload.wikimedia.org/wikipedia/commons/d/df/Microsoft_Office_Outlook_%282018%E2%80%93present%29.svg" alt="Outlook" className="h-8 w-8" />
                  <div>
                    <h4 className="text-base font-medium text-gray-900">Outlook</h4>
                    <p className="text-sm text-gray-500">
                      {t('integrations.outlook.connectMicrosoft')}
                    </p>
                  </div>
                </div>
                {isOutlookConnected ? (
                  <div className="flex items-center space-x-2">
                    <span className="text-xs px-2 py-1 rounded-full bg-success-100 text-success-800">{t('integrations.outlook.connected')}</span>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={handleOutlookDisconnect}
                      aria-label={t('integrations.outlook.disconnect')}
                    >
                      <Trash2 className="h-4 w-4 text-gray-500" />
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleOutlookConnect}
                    isLoading={emailLoading}
                    className="w-full sm:w-auto"
                  >
                    {t('integrations.outlook.connect')}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <div className="w-full bg-amber-50 text-amber-800 px-4 py-3 rounded-md flex items-start">
            <AlertTriangle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium">{t('integrations.permissions.title')}</p>
              <p className="mt-1">{t('integrations.permissions.description')}</p>
            </div>
          </div>
        </CardFooter>
      </Card>
      
      {/* Gmail Sign In Modal */}
      <GmailSignInModal
        isOpen={isGmailModalOpen}
        onClose={() => setIsGmailModalOpen(false)}
        onSignIn={handleGmailSignIn}
      />
      
      {/* Gmail Labels Modal */}
      <GmailLabelsModal
        isOpen={isLabelsModalOpen}
        onClose={() => setIsLabelsModalOpen(false)}
        labels={gmailLabels}
        onRefreshLabels={fetchGmailLabels}
        onCreateAllLabels={handleCreateAllLabels}
        isLoading={loadingLabels}
        isCreating={creatingLabels}
      />
    </div>
  );
};

export default IntegrationsPage;