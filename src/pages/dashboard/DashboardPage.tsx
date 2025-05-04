import React, { useState, useEffect } from 'react';
import { ArrowUpRight, Mails, CheckCircle, Clock, Mail, ShoppingCart } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { useAuth } from '../../contexts/AuthContext';
import { formatNumber } from '../../lib/utils';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, onSnapshot, orderBy, limit } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { getUserIntegrations } from '../../lib/services/integrations';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

const DashboardPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  console.log('Current language:', i18n.language);
  console.log('Welcome message translation:', t('dashboard.welcomeMessage'));
  console.log('Active status translation:', t('common.active'));
  
  const { userProfile, currentUser } = useAuth();
  const navigate = useNavigate();
  const isPro = userProfile?.plan === 'pro';

  // State for real-time dashboard statistics
  const [emailsProcessed, setEmailsProcessed] = useState<number>(0);
  const [draftsGenerated, setDraftsGenerated] = useState<number>(0);
  const [averageResponseTime, setAverageResponseTime] = useState<string>('0 min');
  const [activeIntegrations, setActiveIntegrations] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  
  // States for setup completion tracking
  const [isGmailConfigured, setIsGmailConfigured] = useState<boolean>(false);
  const [isShopifyConfigured, setIsShopifyConfigured] = useState<boolean>(false);
  const [isPreferencesConfigured, setIsPreferencesConfigured] = useState<boolean>(false);

  // Fetch dashboard statistics in real-time
  useEffect(() => {
    if (!currentUser) return;

    setLoading(true);
    const unsubscribers: (() => void)[] = [];

    try {
      // 1. Count all processed emails - real-time listener
      console.log('Setting up real-time listener for all emails');
      const emailsQuery = query(
        collection(db, 'emails'),
        where('userId', '==', currentUser.uid)
      );
      
      const emailsUnsubscribe = onSnapshot(emailsQuery, (snapshot) => {
        console.log(`Real-time update: ${snapshot.docs.length} total emails`);
        setEmailsProcessed(snapshot.docs.length);
        setLoading(false);
      }, (error) => {
        console.error('Error in emails listener:', error);
        toast.error(t('dashboard.errors.emailUpdates', 'Failed to get real-time email updates'));
        setLoading(false);
      });
      
      unsubscribers.push(emailsUnsubscribe);

      // 2. Count emails with draft status - real-time listener
      console.log('Setting up real-time listener for drafts');
      const draftsQuery = query(
        collection(db, 'emails'),
        where('userId', '==', currentUser.uid),
        where('status', '==', 'draft_created')
      );
      
      const draftsUnsubscribe = onSnapshot(draftsQuery, (snapshot) => {
        console.log(`Real-time update: ${snapshot.docs.length} drafts`);
        setDraftsGenerated(snapshot.docs.length);
        
        // Calculate average response time from the drafts if available
        if (snapshot.docs.length > 0) {
          let totalResponseTime = 0;
          let emailsWithTime = 0;
          
          snapshot.docs.forEach(doc => {
            const email = doc.data();
            if (email.timestamp && email.draftCreatedAt) {
              const receivedTime = email.timestamp.toDate();
              const draftTime = email.draftCreatedAt.toDate();
              const diffMinutes = (draftTime - receivedTime) / (1000 * 60);
              
              // Only count realistic times (avoid negative or huge values)
              if (diffMinutes > 0 && diffMinutes < 60) {
                totalResponseTime += diffMinutes;
                emailsWithTime++;
              }
            }
          });
          
          if (emailsWithTime > 0) {
            const avgMinutes = Math.round(totalResponseTime / emailsWithTime * 10) / 10;
            setAverageResponseTime(`${avgMinutes} min`);
          } else {
            setAverageResponseTime('~5 min');
          }
        } else {
          setAverageResponseTime('N/A');
        }
      }, (error) => {
        console.error('Error in drafts listener:', error);
      });
      
      unsubscribers.push(draftsUnsubscribe);

      // 3. Get active integrations - doesn't need real-time updates
      const fetchIntegrations = async () => {
        try {
          const integrations = await getUserIntegrations(currentUser.uid);
          setActiveIntegrations(integrations.length);
        } catch (error) {
          console.error('Error fetching integrations:', error);
        }
      };
      
      fetchIntegrations();

    } catch (error) {
      console.error('Error setting up dashboard stats:', error);
      toast.error(t('dashboard.errors.statistics', 'Failed to load dashboard statistics'));
      setLoading(false);
    }

    // Clean up all listeners when component unmounts
    return () => {
      console.log('Cleaning up dashboard listeners');
      unsubscribers.forEach(unsubscribe => unsubscribe());
    };
  }, [currentUser, t]);

  // Check which setup steps are completed
  useEffect(() => {
    if (!currentUser || !userProfile) return;

    // Check if Gmail is configured
    const checkGmailConfig = async () => {
      try {
        const integrations = await getUserIntegrations(currentUser.uid);
        const gmailIntegration = integrations.find(integration => integration.type === 'gmail');
        setIsGmailConfigured(!!gmailIntegration);
        
        // Check if Shopify is configured
        const shopifyIntegration = integrations.find(integration => integration.type === 'shopify');
        setIsShopifyConfigured(!!shopifyIntegration);
      } catch (error) {
        console.error('Error checking integrations:', error);
      }
    };
    
    // Check if preferences are configured
    const hasPreferences = userProfile?.preferences && 
      (userProfile.preferences.autoClassify !== undefined || 
       userProfile.preferences.autoDraft !== undefined ||
       userProfile.preferences.signature);
    
    setIsPreferencesConfigured(!!hasPreferences);
    checkGmailConfig();
    
  }, [currentUser, userProfile]);

  return (
    <div className="space-y-6">
      {/* Welcome section */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 md:p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-gray-900">
              {t('dashboard.welcome')}, {userProfile?.name || t('common.user', 'User')}
            </h2>
            <p className="mt-1 text-gray-600">
              {t('dashboard.welcomeMessage')}
              {' '} {/* Espace explicite */}
              <span className="font-medium">
                {userProfile?.preferences?.autoClassify 
                  ? t('common.active') 
                  : t('common.inactive')}
              </span>
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {/* {!isPro && (
              <Button onClick={() => navigate('/billing')}>
                {t('dashboard.account.upgrade')}
              </Button>
            )} */}
            <Button 
              variant="outline"
              onClick={() => navigate('/app/activity')}
            >
              {t('dashboard.quickActions.viewAll')}
            </Button>
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">{t('dashboard.stats.emailsProcessed')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline justify-between">
              <div className="text-2xl font-bold">
                {loading ? (
                  <span className="inline-block w-16 h-8 bg-gray-100 animate-pulse rounded"></span>
                ) : (
                  formatNumber(emailsProcessed)
                )}
              </div>
              <div className="p-1.5 rounded-full bg-primary-50">
                <Mails className="h-5 w-5 text-primary-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">{t('dashboard.stats.autoResponses')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline justify-between">
              <div className="text-2xl font-bold">
                {loading ? (
                  <span className="inline-block w-16 h-8 bg-gray-100 animate-pulse rounded"></span>
                ) : (
                  formatNumber(draftsGenerated)
                )}
              </div>
              <div className="p-1.5 rounded-full bg-secondary-50">
                <CheckCircle className="h-5 w-5 text-secondary-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">{t('dashboard.stats.responseRate')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline justify-between">
              <div className="text-2xl font-bold">
                {loading ? (
                  <span className="inline-block w-16 h-8 bg-gray-100 animate-pulse rounded"></span>
                ) : (
                  averageResponseTime
                )}
              </div>
              <div className="p-1.5 rounded-full bg-accent-50">
                <Clock className="h-5 w-5 text-accent-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">{t('integrations.title')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline justify-between">
              <div className="text-2xl font-bold">
                {loading ? (
                  <span className="inline-block w-16 h-8 bg-gray-100 animate-pulse rounded"></span>
                ) : (
                  formatNumber(activeIntegrations)
                )}
              </div>
              <div className="p-1.5 rounded-full bg-success-50">
                <ShoppingCart className="h-5 w-5 text-success-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Setup checklist */}
      <Card>
        <CardHeader>
          <CardTitle>{t('dashboard.setup.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className={`flex items-center justify-between p-3 rounded-md ${isGmailConfigured ? 'bg-green-50 border border-green-100' : 'bg-gray-50'}`}>
              <div className="flex items-center">
                <div className="flex-shrink-0 mr-3">
                  <div className={`h-8 w-8 rounded-full ${isGmailConfigured ? 'bg-green-100' : 'bg-primary-100'} flex items-center justify-center`}>
                    <Mail className={`h-4 w-4 ${isGmailConfigured ? 'text-green-600' : 'text-primary-600'}`} />
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-medium text-gray-900">{t('dashboard.setup.gmail.title')}</h4>
                    {isGmailConfigured && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {t('dashboard.setup.completed')}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">{t('dashboard.setup.gmail.description')}</p>
                </div>
              </div>
              <Button 
                variant={isGmailConfigured ? "success" : "outline"}
                size="sm"
                onClick={() => navigate('/app/integrations')}
                rightIcon={isGmailConfigured ? <CheckCircle className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
              >
                {isGmailConfigured ? t('dashboard.setup.configured') : t('common.connect')}
              </Button>
            </div>

            <div className={`flex items-center justify-between p-3 rounded-md ${isShopifyConfigured ? 'bg-green-50 border border-green-100' : 'bg-gray-50'}`}>
              <div className="flex items-center">
                <div className="flex-shrink-0 mr-3">
                  <div className={`h-8 w-8 rounded-full ${isShopifyConfigured ? 'bg-green-100' : 'bg-secondary-100'} flex items-center justify-center`}>
                    <ShoppingCart className={`h-4 w-4 ${isShopifyConfigured ? 'text-green-600' : 'text-secondary-600'}`} />
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-medium text-gray-900">{t('dashboard.setup.shopify.title')}</h4>
                    {isShopifyConfigured && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {t('dashboard.setup.completed')}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">{t('dashboard.setup.shopify.description')}</p>
                </div>
              </div>
              <Button 
                variant={isShopifyConfigured ? "success" : "outline"}
                size="sm"
                onClick={() => navigate('/app/integrations')}
                rightIcon={isShopifyConfigured ? <CheckCircle className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
              >
                {isShopifyConfigured ? t('dashboard.setup.configured') : t('common.connect')}
              </Button>
            </div>

            <div className={`flex items-center justify-between p-3 rounded-md ${isPreferencesConfigured ? 'bg-green-50 border border-green-100' : 'bg-gray-50'}`}>
              <div className="flex items-center">
                <div className="flex-shrink-0 mr-3">
                  <div className={`h-8 w-8 rounded-full ${isPreferencesConfigured ? 'bg-green-100' : 'bg-success-100'} flex items-center justify-center`}>
                    <CheckCircle className={`h-4 w-4 ${isPreferencesConfigured ? 'text-green-600' : 'text-success-600'}`} />
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-medium text-gray-900">{t('dashboard.setup.preferences.title')}</h4>
                    {isPreferencesConfigured && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {t('dashboard.setup.completed')}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">{t('dashboard.setup.preferences.description')}</p>
                </div>
              </div>
              <Button 
                variant={isPreferencesConfigured ? "success" : "outline"}
                size="sm"
                onClick={() => navigate('/app/preferences')}
                rightIcon={isPreferencesConfigured ? <CheckCircle className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
              >
                {isPreferencesConfigured ? t('dashboard.setup.configured') : t('common.configure')}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardPage;