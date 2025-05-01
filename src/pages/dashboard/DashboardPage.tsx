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

const DashboardPage: React.FC = () => {
  const { userProfile, currentUser } = useAuth();
  const navigate = useNavigate();
  const isPro = userProfile?.plan === 'pro';

  // State for real-time dashboard statistics
  const [emailsProcessed, setEmailsProcessed] = useState<number>(0);
  const [draftsGenerated, setDraftsGenerated] = useState<number>(0);
  const [averageResponseTime, setAverageResponseTime] = useState<string>('0 min');
  const [activeIntegrations, setActiveIntegrations] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

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
        toast.error('Failed to get real-time email updates');
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
      toast.error('Failed to load dashboard statistics');
      setLoading(false);
    }

    // Clean up all listeners when component unmounts
    return () => {
      console.log('Cleaning up dashboard listeners');
      unsubscribers.forEach(unsubscribe => unsubscribe());
    };
  }, [currentUser]);

  return (
    <div className="space-y-6">
      {/* Welcome section */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 md:p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-gray-900">
              Welcome back, {userProfile?.name || 'User'}
            </h2>
            <p className="mt-1 text-gray-600">
              Your AI email assistant is {userProfile?.preferences?.autoClassify ? 'active' : 'inactive'}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {/* {!isPro && (
              <Button onClick={() => navigate('/billing')}>
                Upgrade to Pro
              </Button>
            )} */}
            <Button 
              variant="outline"
              onClick={() => navigate('/activity')}
            >
              View active emails
            </Button>
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Emails Processed</CardTitle>
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
            <CardTitle className="text-sm font-medium text-gray-500">Drafts Generated</CardTitle>
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
            <CardTitle className="text-sm font-medium text-gray-500">Avg. Response Time</CardTitle>
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
            <CardTitle className="text-sm font-medium text-gray-500">Active Integrations</CardTitle>
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
          <CardTitle>Complete Your Setup</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
              <div className="flex items-center">
                <div className="flex-shrink-0 mr-3">
                  <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
                    <Mail className="h-4 w-4 text-primary-600" />
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-900">Connect your email account</h4>
                  <p className="text-xs text-gray-500">Connect Gmail or Outlook to process emails</p>
                </div>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigate('/integrations')}
                rightIcon={<ArrowUpRight className="h-4 w-4" />}
              >
                Connect
              </Button>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
              <div className="flex items-center">
                <div className="flex-shrink-0 mr-3">
                  <div className="h-8 w-8 rounded-full bg-secondary-100 flex items-center justify-center">
                    <ShoppingCart className="h-4 w-4 text-secondary-600" />
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-900">Connect Shopify store</h4>
                  <p className="text-xs text-gray-500">Link your Shopify store to access order data</p>
                </div>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigate('/integrations')}
                rightIcon={<ArrowUpRight className="h-4 w-4" />}
              >
                Connect
              </Button>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
              <div className="flex items-center">
                <div className="flex-shrink-0 mr-3">
                  <div className="h-8 w-8 rounded-full bg-success-100 flex items-center justify-center">
                    <CheckCircle className="h-4 w-4 text-success-600" />
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-900">Set up your preferences</h4>
                  <p className="text-xs text-gray-500">Customize your email response settings</p>
                </div>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigate('/preferences')}
                rightIcon={<ArrowUpRight className="h-4 w-4" />}
              >
                Configure
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardPage;