import React, { useState, useEffect } from 'react';
import { CreditCard, Check, AlertTriangle, Calendar, Activity } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import { useLocation } from 'react-router-dom';
import { simulateSubscription, getSubscriptionStatus, createCustomerPortalSession } from '../../lib/services/stripe';
import StripeCheckout from '../../components/payments/StripeCheckout';
import { formatDistance } from 'date-fns';

const BillingPage: React.FC = () => {
  const { userProfile, currentUser, refreshUserProfile } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState(userProfile?.plan || 'free');
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [subscriptionData, setSubscriptionData] = useState<any>(null);
  const location = useLocation();
  
  const plans = [
    {
      id: 'free',
      name: 'Free',
      price: '€0',
      period: 'forever',
      description: 'Basic email classification and limited drafts',
      features: [
        'Process up to 100 emails/month',
        'Email classification',
        'Basic draft generation',
        'Single email account',
        'Single Shopify store'
      ],
      priceInCents: 0
    },
    {
      id: 'pro',
      name: 'Pro',
      price: '€49',
      period: 'per month',
      description: 'Advanced features for growing businesses',
      features: [
        'Unlimited emails processed',
        'Priority email classification',
        'Advanced draft generation with order data',
        'Multiple email accounts',
        'Multiple Shopify stores',
        'Custom email signature',
        'Priority support'
      ],
      priceInCents: 4900
    }
  ];

  // Fetch subscription data
  useEffect(() => {
    const fetchSubscriptionData = async () => {
      if (!currentUser) return;

      try {
        setIsLoading(true);
        const status = await getSubscriptionStatus(currentUser.uid);
        setSubscriptionData(status);
      } catch (error) {
        console.error('Failed to fetch subscription status:', error);
        toast.error('Failed to load subscription information');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSubscriptionData();
  }, [currentUser]);

  // Check for Stripe session ID in URL (after successful checkout)
  useEffect(() => {
    const handleSuccessfulCheckout = async () => {
      const query = new URLSearchParams(location.search);
      const sessionId = query.get('session_id');

      if (sessionId && currentUser) {
        try {
          // In production, you would verify the session with your server
          toast.success('Payment successful! Your subscription is now active.');
          
          // Refresh subscription data
          const status = await getSubscriptionStatus(currentUser.uid);
          setSubscriptionData(status);
          
          // Update user profile
          await refreshUserProfile(currentUser.uid);
          
          // Clear the URL parameter
          window.history.replaceState({}, document.title, window.location.pathname);
        } catch (error) {
          console.error('Failed to process successful checkout:', error);
          toast.error('There was an issue updating your subscription');
        }
      }
    };

    handleSuccessfulCheckout();
  }, [location, currentUser, refreshUserProfile]);
  
  // Handle plan selection
  const handleSelectPlan = (planId: string) => {
    setSelectedPlan(planId);
  };
  
  // Handle upgrade/subscribe
  const handleSubscribe = async () => {
    if (!currentUser) {
      toast.error('You must be logged in to manage subscriptions');
      return;
    }
    
    setIsUpgrading(true);
    
    try {
      if (selectedPlan === 'free') {
        // Downgrade to free
        await simulateSubscription(currentUser.uid, 'free');
        toast.success('Downgraded to Free plan');
        
        // Refresh subscription data
        const status = await getSubscriptionStatus(currentUser.uid);
        setSubscriptionData(status);
        
        // Refresh user profile
        await refreshUserProfile(currentUser.uid);
      } else {
        // For Pro plan, open Stripe checkout
        setIsCheckoutOpen(true);
      }
    } catch (error) {
      console.error('Failed to manage subscription:', error);
      toast.error('Failed to update subscription');
    } finally {
      setIsUpgrading(false);
    }
  };

  // Handle successful checkout
  const handleCheckoutSuccess = async () => {
    setIsCheckoutOpen(false);
    
    if (!currentUser) return;
    
    try {
      // Simulate subscription update (in production, this would be handled by a webhook)
      await simulateSubscription(currentUser.uid, selectedPlan);
      
      // Refresh subscription data
      const status = await getSubscriptionStatus(currentUser.uid);
      setSubscriptionData(status);
      
      // Refresh user profile
      await refreshUserProfile(currentUser.uid);
    } catch (error) {
      console.error('Failed to update subscription after checkout:', error);
      toast.error('There was an issue updating your subscription');
    }
  };

  // Handle manage subscription
  const handleManageSubscription = async () => {
    if (!currentUser || !subscriptionData?.customerId) {
      toast.error('Unable to manage subscription');
      return;
    }
    
    try {
      toast.success('Redirecting to billing portal...');
      await createCustomerPortalSession(subscriptionData.customerId, currentUser.uid);
    } catch (error) {
      console.error('Failed to redirect to billing portal:', error);
      toast.error('Failed to access billing portal');
    }
  };

  const selectedPlanDetails = plans.find(plan => plan.id === selectedPlan);
  const nextBillingDate = subscriptionData?.currentPeriodEnd 
    ? new Date(subscriptionData.currentPeriodEnd) 
    : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-xl font-semibold text-gray-900">Billing</h2>
        <p className="text-gray-600">Manage your subscription and billing details</p>
      </div>
      
      {/* Current Plan */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-accent-100 rounded-full">
              <CreditCard className="h-5 w-5 text-accent-600" />
            </div>
            <div>
              <CardTitle>Current Plan</CardTitle>
              <CardDescription>
                {isLoading 
                  ? 'Loading subscription information...' 
                  : `You are currently on the ${userProfile?.plan === 'pro' ? 'Pro' : 'Free'} plan`}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : userProfile?.plan === 'pro' ? (
            <div className="bg-gray-50 p-4 rounded-md">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Pro Plan</h3>
                  <p className="text-sm text-gray-600">€49/month</p>
                </div>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-success-100 text-success-800">
                  {subscriptionData?.status === 'active' ? 'Active' : 'Inactive'}
                </span>
              </div>
              
              {nextBillingDate && (
                <div className="mt-4 flex items-start">
                  <Calendar className="h-5 w-5 text-gray-400 mr-2" />
                  <div>
                    <p className="text-sm text-gray-600">
                      Your next billing date is <strong>{nextBillingDate.toLocaleDateString()}</strong>
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatDistance(nextBillingDate, new Date(), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              )}
              
              <div className="mt-4 flex items-start">
                <Activity className="h-5 w-5 text-gray-400 mr-2" />
                <div>
                  <p className="text-sm text-gray-600">
                    <strong>Unlimited</strong> emails processed per month
                  </p>
                  <p className="text-xs text-gray-500">
                    No limits on your email processing
                  </p>
                </div>
              </div>
              
              <div className="mt-4">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleManageSubscription}
                >
                  Manage Subscription
                </Button>
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 p-4 rounded-md">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Free Plan</h3>
                  <p className="text-sm text-gray-600">€0/month</p>
                </div>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                  Active
                </span>
              </div>
              <div className="mt-4">
                <div className="flex items-start">
                  <AlertTriangle className="h-5 w-5 text-amber-500 mr-2 flex-shrink-0" />
                  <p className="text-sm text-gray-600">
                    You've processed 72/100 emails this month. Upgrade to Pro for unlimited emails.
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Plan Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {plans.map((plan) => (
          <Card 
            key={plan.id}
            className={`overflow-hidden transition-all ${
              selectedPlan === plan.id ? 'ring-2 ring-primary-500' : ''
            }`}
          >
            <CardHeader className={`${
              plan.id === 'pro' ? 'bg-primary-50' : 'bg-gray-50'
            }`}>
              <CardTitle className="flex items-center justify-between">
                {plan.name}
                {plan.id === 'pro' && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                    Popular
                  </span>
                )}
              </CardTitle>
              <div>
                <span className="text-2xl font-bold">{plan.price}</span>
                <span className="text-gray-500 ml-1">{plan.period}</span>
              </div>
              <CardDescription>{plan.description}</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <ul className="space-y-3">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <Check className="h-5 w-5 text-success-500 mr-2 flex-shrink-0" />
                    <span className="text-sm text-gray-600">{feature}</span>
                  </li>
                ))}
              </ul>
              
              <div className="mt-6">
                {selectedPlan === plan.id && userProfile?.plan === plan.id ? (
                  <Button
                    variant="outline"
                    fullWidth
                    disabled
                  >
                    Current Plan
                  </Button>
                ) : (
                  <Button
                    variant={selectedPlan === plan.id ? 'primary' : 'outline'}
                    fullWidth
                    onClick={() => handleSelectPlan(plan.id)}
                  >
                    {selectedPlan === plan.id ? 'Selected' : 'Select'}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {/* Action Button */}
      {(selectedPlan !== userProfile?.plan) && (
        <div className="flex justify-end">
          <Button
            onClick={handleSubscribe}
            isLoading={isUpgrading}
            size="lg"
          >
            {selectedPlan === 'free' ? 'Downgrade to Free' : 'Upgrade to Pro'}
          </Button>
        </div>
      )}

      {/* Stripe Checkout Modal */}
      {currentUser && (
        <StripeCheckout
          isOpen={isCheckoutOpen}
          onClose={() => setIsCheckoutOpen(false)}
          planId={selectedPlan}
          planName={selectedPlanDetails?.name || 'Pro'}
          amount={selectedPlanDetails?.priceInCents || 4900}
          onSuccess={handleCheckoutSuccess}
          userId={currentUser.uid}
        />
      )}
    </div>
  );
};

export default BillingPage;