import { loadStripe } from '@stripe/stripe-js';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

// Initialize Stripe with the publishable key
// Using test key as requested by the user
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_51NZqLkIvIE2VF8RfDTCxlYAw1YGsDXVD3e6Z1JgXKYcfnR2EZI1mRTto1hx3TlAL42wfO0RNZKZnMlGZFJiKbSU800bQz2kBvZ');

// API endpoints
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

/**
 * Create a Stripe checkout session
 * @param priceId The Stripe price ID to subscribe to
 * @param customerId Optional Stripe customer ID for existing customers
 * @param userId Firebase user ID
 */
export const createCheckoutSession = async (priceId: string, userId: string, customerId?: string) => {
  try {
    console.log(`Creating checkout session for price ID: ${priceId}`);
    
    // Build the request body
    const requestBody = {
      priceId,
      customerId,
      userId,
      successUrl: `${window.location.origin}/billing?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${window.location.origin}/billing`,
    };
    
    // Make the API request
    const response = await fetch(`${API_BASE_URL}/api/create-checkout-session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });
    
    // Handle error responses
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to create checkout session');
    }
    
    const session = await response.json();
    
    // Redirect to Stripe Checkout
    const stripe = await stripePromise;
    if (!stripe) throw new Error('Failed to load Stripe');
    
    const { error } = await stripe.redirectToCheckout({
      sessionId: session.id,
    });
    
    if (error) {
      throw new Error(error.message);
    }
    
    return session;
  } catch (error) {
    console.error('Failed to create checkout session:', error);
    throw error;
  }
};

/**
 * Create a customer portal session for subscription management
 * @param customerId Stripe customer ID
 * @param userId Firebase user ID
 */
export const createCustomerPortalSession = async (customerId: string, userId: string) => {
  try {
    console.log(`Creating customer portal session for customer ID: ${customerId}`);
    
    // Make the API request
    const response = await fetch(`${API_BASE_URL}/api/create-customer-portal-session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        customerId,
        userId,
        returnUrl: `${window.location.origin}/billing`,
      }),
    });
    
    // Handle error responses
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to create customer portal session');
    }
    
    const session = await response.json();
    
    // Redirect to the customer portal
    window.location.href = session.url;
    
    return session;
  } catch (error) {
    console.error('Failed to create customer portal session:', error);
    throw error;
  }
};

/**
 * Get subscription status for a user
 * @param userId Firebase user ID
 */
export const getSubscriptionStatus = async (userId: string) => {
  try {
    console.log(`Getting subscription status for user ID: ${userId}`);
    
    // Get from Firestore
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      throw new Error('User not found');
    }
    
    const userData = userDoc.data();
    
    // If we have Stripe data
    if (userData.subscription) {
      return {
        plan: userData.plan || 'free',
        status: userData.subscription.status || 'inactive',
        currentPeriodEnd: userData.subscription.currentPeriodEnd,
        customerId: userData.subscription.customerId,
      };
    }
    
    // Default if no subscription
    return {
      plan: 'free',
      status: 'inactive',
      currentPeriodEnd: null,
      customerId: null,
    };
  } catch (error) {
    console.error('Failed to get subscription status:', error);
    throw error;
  }
};

/**
 * Simulate updating a user's subscription (for demo purposes)
 * In production, this would be handled by Stripe webhooks
 * @param userId Firebase user ID
 * @param planId Plan ID to subscribe to
 */
export const simulateSubscription = async (userId: string, planId: string) => {
  try {
    console.log(`Simulating subscription update for user ID: ${userId} to plan: ${planId}`);
    
    const userRef = doc(db, 'users', userId);
    
    const subscriptionData = planId === 'free' 
      ? {
          plan: 'free',
          subscription: null,
        }
      : {
          plan: planId,
          subscription: {
            status: 'active',
            currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            customerId: 'cus_simulated',
          },
        };
    
    await updateDoc(userRef, subscriptionData);
    
    return {
      success: true,
      plan: planId,
      status: planId === 'free' ? 'inactive' : 'active',
      currentPeriodEnd: planId === 'free' ? null : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    };
  } catch (error) {
    console.error('Failed to simulate subscription:', error);
    throw error;
  }
};