import React, { useState, useEffect } from 'react';
import { 
  Mails, 
  Search, 
  Calendar, 
  Filter, 
  ChevronDown,
  ExternalLink,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import toast from 'react-hot-toast';
import { formatTimeAgo } from '../../lib/utils';
import { useAuth } from '../../contexts/AuthContext';
import { collection, query, where, orderBy, onSnapshot, limit } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { getUserIntegrations } from '../../lib/services/integrations';
import { GmailService } from '../../lib/services/gmail';
import EmailDetailsModal from '../../components/modals/EmailDetailsModal';
import type { EmailActivity } from '../../lib/collections';
import { useEmailProcessing } from '../../lib/hooks/useEmailProcessing';
import { useTranslation } from 'react-i18next';

const ActivityLogPage: React.FC = () => {
  const { currentUser, userProfile } = useAuth();
  const { fetchAndProcessEmails } = useEmailProcessing();
  const { t } = useTranslation();
  const [activities, setActivities] = useState<EmailActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEmail, setSelectedEmail] = useState<EmailActivity | null>(null);
  const [fetchingEmails, setFetchingEmails] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [hasIntegrations, setHasIntegrations] = useState(false);
  
  const categories = [
    { id: 'delivery', emoji: '📦', name: t('preferences.categories.delivery') },
    { id: 'cancellation', emoji: '❌', name: t('preferences.categories.cancellation') },
    { id: 'refund', emoji: '💸', name: t('preferences.categories.refund') },
    { id: 'return', emoji: '🔁', name: t('preferences.categories.return') },
    { id: 'presale', emoji: '🛍', name: t('preferences.categories.presale') },
    { id: 'resolved', emoji: '🔒', name: t('preferences.categories.resolved') },
    { id: 'spam', emoji: '🚫', name: t('preferences.categories.spam') },
    { id: 'other', emoji: '🧾', name: t('preferences.categories.other') }
  ];
  
  // Check if user has email integrations
  useEffect(() => {
    const checkIntegrations = async () => {
      if (!currentUser) return;
      
      try {
        const integrations = await getUserIntegrations(currentUser.uid);
        setHasIntegrations(integrations.some(i => i.type === 'gmail' || i.type === 'outlook'));
      } catch (error) {
        console.error('Failed to check integrations:', error);
      }
    };
    
    checkIntegrations();
  }, [currentUser]);

  // Fetch Gmail emails
  useEffect(() => {
    const fetchGmailEmails = async () => {
      if (!currentUser) return;
      
      try {
        const integrations = await getUserIntegrations(currentUser.uid);
        const gmailIntegration = integrations.find(i => i.type === 'gmail');
        
        if (gmailIntegration) {
          try {
            const gmail = new GmailService(
              gmailIntegration.config.accessToken,
              gmailIntegration.config.refreshToken
            );
            
            await gmail.processRecentEmails(currentUser.uid, userProfile?.preferences);
          } catch (error) {
            console.error('Failed to process Gmail emails:', error);
            // Don't show an error toast here as this happens on page load
          } finally {
            setInitialLoad(false);
          }
        } else {
          setInitialLoad(false);
        }
      } catch (error) {
        console.error('Failed to fetch Gmail emails:', error);
        setInitialLoad(false);
      }
    };
    
    fetchGmailEmails();
  }, [currentUser, userProfile]);
  
  const handleRefreshEmails = async () => {
    if (!currentUser) {
      toast.error(t('errors.notLoggedIn'));
      return;
    }
    
    setFetchingEmails(true);
    
    try {
      await fetchAndProcessEmails();
      toast.success(t('success.emailsRefreshed'));
    } catch (error) {
      console.error('Failed to refresh emails:', error);
      toast.error(t('errors.failedToRefreshEmails'));
    } finally {
      setFetchingEmails(false);
    }
  };
  
  useEffect(() => {
    if (!currentUser) return;
    
    console.log('Setting up Firestore listener for emails collection');

    const q = query(
      collection(db, 'emails'),
      where('userId', '==', currentUser.uid),
      orderBy('timestamp', 'desc'),
      limit(50)
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      try {
        console.log('Received Firestore update:', snapshot.docs.length, 'documents');
        const newActivities = snapshot.docs.map(doc => {
          const data = doc.data();
          console.log('Processing document:', doc.id, data);
          return {
            ...data,
            id: doc.id,
            timestamp: data.timestamp?.toDate() || new Date()
          } as EmailActivity;
        });
      
        console.log('Setting activities:', newActivities.length);
        setActivities(newActivities);
        setLoading(false);
        setInitialLoad(false);
      } catch (error) {
        console.error('Error processing activities:', error);
        toast.error(t('errors.failedToProcessActivities'));
        setLoading(false);
        setInitialLoad(false);
      }
    }, (error) => {
      console.error('Error fetching activities:', error);
      toast.error(t('errors.failedToLoadActivities'));
      setLoading(false);
      setInitialLoad(false);
    });
    
    return () => unsubscribe();
  }, [currentUser]);

  // Filter activities based on search term and filters
  const filteredActivities = activities.filter((activity) => {
    const matchesSearch = !searchTerm || 
      activity.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      activity.sender.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = !selectedCategory || activity.category === selectedCategory;
    const matchesStatus = !selectedStatus || activity.status === selectedStatus;
    
    // Check if the category is hidden in user preferences
    const isHidden = userProfile?.preferences?.hiddenCategories?.includes(
      categories.find(c => c.name === activity.category)?.id || ''
    );
    
    return matchesSearch && matchesCategory && matchesStatus && !isHidden;
  });
  
  // Get unique categories
  const uniqueCategories = [...new Set(activities.map((activity) => activity.category))];
  
  // Status options
  const statusOptions = [
    { value: 'classified', label: t('status.classified') },
    { value: 'draft_created', label: t('status.draftCreated') },
    { value: 'processed', label: t('status.processed') }
  ];
  
  // Clear all filters
  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategory(null);
    setSelectedStatus(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-xl font-semibold text-gray-900">{t('activity.title')}</h2>
        <p className="text-gray-600">{t('activity.description')}</p>
      </div>
      
      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-4">
            <div className="w-full">
              <Input
                placeholder={t('activity.search')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                leftIcon={<Search className="h-5 w-5 text-gray-400" />}
                fullWidth
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                leftIcon={<Filter className="h-4 w-4" />}
                rightIcon={<ChevronDown className="h-4 w-4" />}
                onClick={() => setFilterOpen(!filterOpen)}
                className="flex-grow md:flex-grow-0"
              >
                {t('activity.filter')}
              </Button>
              <Button 
                variant="outline"
                leftIcon={<Calendar className="h-4 w-4" />}
                className="flex-grow md:flex-grow-0"
              >
                {t('activity.dateRange.lastWeek')}
              </Button>
              <Button
                variant="primary"
                leftIcon={<RefreshCw className={`h-4 w-4 ${fetchingEmails ? 'animate-spin' : ''}`} />}
                onClick={handleRefreshEmails}
                isLoading={fetchingEmails}
                disabled={!hasIntegrations}
                className="flex-grow md:flex-grow-0"
              >
                {t('activity.fetchNewEmails')}
              </Button>
            </div>
          </div>
          
          {/* Expanded filters */}
          {filterOpen && (
            <div className="mt-4 p-4 border border-gray-200 rounded-md bg-gray-50">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('activity.categoryLabel')}
                  </label>
                  <select
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                    value={selectedCategory || ''}
                    onChange={(e) => setSelectedCategory(e.target.value || null)}
                  >
                    <option value="">{t('activity.allCategories')}</option>
                    {uniqueCategories.map((category) => (
                      <option key={category} value={category} className="flex items-center">
                        {categories.find(c => c.name === category)?.emoji} {category}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('activity.table.status')}
                  </label>
                  <select
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                    value={selectedStatus || ''}
                    onChange={(e) => setSelectedStatus(e.target.value || null)}
                  >
                    <option value="">{t('activity.allStatuses')}</option>
                    {statusOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {t(`activity.statusOptions.${option.value}`)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="mt-4 flex justify-end">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={clearFilters}
                >
                  {t('activity.clearFilters')}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Activity List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{t('activity.emailActivity')}</CardTitle>
              {loading || initialLoad ? (
                <CardDescription>{t('activity.loadingActivities')}</CardDescription>
              ) : (
                <CardDescription>
                  {t('activity.emailsProcessed', { 
                    count: filteredActivities.length,
                  })}
                </CardDescription>
              )}
            </div>
            <div className="p-2 bg-primary-100 rounded-full">
              <Mails className="h-5 w-5 text-primary-600" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading || initialLoad ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : filteredActivities.length > 0 ? (
            <div className="space-y-4">
              {filteredActivities.map((activity) => (
                <div 
                  key={activity.id}
                  className="p-4 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
                  onClick={() => setSelectedEmail(activity)}
                  role="button"
                  tabIndex={0}
                >
                  <div className="flex flex-col gap-2">
                    <div className="flex-grow">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h4 className="text-base font-medium text-gray-900 break-words">{activity.subject}</h4>
                        <span className="text-sm px-2 py-0.5 rounded-full bg-gray-100 text-gray-800 whitespace-nowrap">
                          {activity.category === 'undefined' || !activity.category || activity.category === undefined
                            ? `🧾 ${t('preferences.categories.other')}`
                            : activity.category}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500">
                        {t('activity.from')}: {activity.sender}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-2 mt-1">
                      <span className="text-xs text-gray-500 whitespace-nowrap">
                        {formatTimeAgo(activity.timestamp)}
                      </span>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          activity.status === 'draft_created' 
                            ? 'bg-success-100 text-success-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {t(`activity.status.${activity.status}`)}
                        </span>
                        {activity.draftUrl && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(activity.draftUrl, '_blank');
                            }}
                            rightIcon={<ExternalLink className="h-3 w-3" />}
                          >
                            {t('activity.viewDraft')}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : !hasIntegrations ? (
            <div className="text-center py-8">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-amber-100">
                <AlertCircle className="h-6 w-6 text-amber-600" />
              </div>
              <h3 className="mt-2 text-sm font-medium text-gray-900">{t('activity.noEmailAccounts')}</h3>
              <p className="mt-1 text-sm text-gray-500">
                {t('activity.needConnectionDescription')}
              </p>
              <div className="mt-6">
                <Button
                  onClick={() => window.location.href = '/integrations'}
                >
                  {t('activity.connectEmailAccount')}
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-gray-100">
                <Search className="h-6 w-6 text-gray-400" />
              </div>
              <h3 className="mt-2 text-sm font-medium text-gray-900">{t('activity.noEmailsProcessed')}</h3>
              <p className="mt-1 text-sm text-gray-500">
                {t('activity.processEmailsDescription')}
              </p>
              <div className="mt-6">
                <Button
                  onClick={handleRefreshEmails}
                  isLoading={fetchingEmails}
                >
                  {t('activity.fetchNewEmails')}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Email Details Modal */}
      <EmailDetailsModal
        isOpen={!!selectedEmail}
        onClose={() => setSelectedEmail(null)}
        email={selectedEmail!}
      />
    </div>
  );
};

export default ActivityLogPage;