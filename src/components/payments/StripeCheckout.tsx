import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { CardElement, Elements, useStripe, useElements } from '@stripe/react-stripe-js';
import Button from '../ui/Button';
import toast from 'react-hot-toast';
import { X } from 'lucide-react';

// Initialize Stripe with proper error handling
const getStripePromise = () => {
  const key = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
  
  if (!key) {
    console.error('Stripe publishable key is missing');
    return null;
  }
  
  try {
    return loadStripe(key);
  } catch (error) {
    console.error('Failed to initialize Stripe:', error);
    return null;
  }
};

const stripePromise = getStripePromise();

interface CheckoutFormProps {
  planId: string;
  planName: string;
  amount: number;
  onSuccess: () => void;
  onCancel: () => void;
  userId: string;
}

const CheckoutForm: React.FC<CheckoutFormProps> = ({ 
  planId, 
  planName, 
  amount, 
  onSuccess, 
  onCancel, 
  userId 
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [stripeError, setStripeError] = useState<boolean>(false);

  useEffect(() => {
    // Check if Stripe loaded correctly
    if (!stripe) {
      setStripeError(true);
    } else {
      setStripeError(false);
    }
  }, [stripe]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      setPaymentError('Stripe has not loaded yet. Please try again.');
      return;
    }

    setIsProcessing(true);
    setPaymentError(null);

    // Get the card element
    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      setIsProcessing(false);
      setPaymentError('Card element not found');
      return;
    }

    try {
      // Create a payment method
      const { error: createError, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
      });

      if (createError) {
        throw createError;
      }

      if (!paymentMethod) {
        throw new Error('Failed to create payment method');
      }

      // For demonstration purposes only
      // In production, send the payment method ID to your server to handle subscription creation
      console.log('Created payment method:', paymentMethod.id);
      
      // Simulate a successful payment
      setTimeout(() => {
        setIsProcessing(false);
        toast.success(`Successfully subscribed to ${planName}!`);
        onSuccess();
      }, 2000);
    } catch (error) {
      setIsProcessing(false);
      const errorMessage = error instanceof Error ? error.message : 'Unknown payment error';
      setPaymentError(`Payment failed: ${errorMessage}`);
      console.error('Payment error:', error);
    }
  };

  if (stripeError) {
    return (
      <div className="p-4 border border-red-300 bg-red-50 rounded-md">
        <h3 className="text-red-700 font-medium mb-2">Stripe configuration error</h3>
        <p className="text-red-600">
          There was an issue loading Stripe. Please contact support with the following information:
        </p>
        <p className="text-red-600 mt-2 text-sm">
          Error: Invalid or missing Stripe publishable key
        </p>
        <div className="mt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
          >
            Close
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="card-element" className="block text-sm font-medium text-gray-700 mb-2">
          Credit or debit card
        </label>
        <div className="border border-gray-300 rounded-md p-3 bg-white">
          <CardElement
            options={{
              style: {
                base: {
                  fontSize: '16px',
                  color: '#424770',
                  '::placeholder': {
                    color: '#aab7c4',
                  },
                },
                invalid: {
                  color: '#dc2626',
                  iconColor: '#dc2626',
                },
              },
              hidePostalCode: true,
            }}
          />
        </div>
        {paymentError && (
          <p className="mt-2 text-sm text-error-600">{paymentError}</p>
        )}
      </div>

      <div className="mt-4">
        <p className="text-sm text-gray-600 mb-2">
          You will be charged <span className="font-semibold">€{(amount / 100).toFixed(2)}</span> for the {planName} plan.
        </p>
        <div className="flex justify-end space-x-3">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isProcessing}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            isLoading={isProcessing}
            disabled={!stripe || isProcessing}
          >
            {isProcessing ? 'Processing...' : 'Subscribe Now'}
          </Button>
        </div>
      </div>
    </form>
  );
};

interface StripeCheckoutProps {
  isOpen: boolean;
  onClose: () => void;
  planId: string;
  planName: string;
  amount: number; // in cents
  onSuccess: () => void;
  userId: string;
}

const StripeCheckout: React.FC<StripeCheckoutProps> = ({ 
  isOpen, 
  onClose, 
  planId, 
  planName, 
  amount, 
  onSuccess,
  userId
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm" 
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md p-6 z-50">
        <div className="absolute right-4 top-4">
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Subscribe to {planName}
        </h2>
        
        {stripePromise ? (
          <Elements stripe={stripePromise}>
            <CheckoutForm 
              planId={planId} 
              planName={planName} 
              amount={amount} 
              onSuccess={onSuccess}
              onCancel={onClose}
              userId={userId}
            />
          </Elements>
        ) : (
          <div className="p-4 border border-red-300 bg-red-50 rounded-md">
            <p className="text-red-600">
              Unable to initialize payment system. Please try again later or contact support.
            </p>
            <div className="mt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
              >
                Close
              </Button>
            </div>
          </div>
        )}
        
        <div className="mt-4 pt-4 border-t border-gray-200 text-xs text-gray-500">
          <p>Your payment is processed securely by Stripe. We do not store your card details.</p>
          <p className="mt-1">By subscribing, you agree to our Terms of Service and Privacy Policy.</p>
        </div>
      </div>
    </div>
  );
};

export default StripeCheckout;