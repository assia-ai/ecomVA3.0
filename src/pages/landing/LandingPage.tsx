import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, ShoppingCart, CheckCircle, Clock, Tag, MessageSquare, Zap } from 'lucide-react';
import Button from '../../components/ui/Button';
import logo from '../../assets/logo.svg'; // Import the logo

const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="bg-white">
      {/* Navigation */}
      <nav className="px-4 md:px-6 py-4 flex items-center justify-between border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <img src={logo} alt="EcomVA Logo" className="h-8 w-auto" />
          <span className="text-xl font-semibold text-gray-900">EcomVA</span>
        </div>
        <div className="flex items-center space-x-4">
          <button 
            onClick={() => navigate('/login')}
            className="text-sm font-medium text-gray-600 hover:text-gray-800"
          >
            Sign In
          </button>
          <Button
            onClick={() => navigate('/register')}
            size="sm"
          >
            Get Started
          </Button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-16 md:py-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex justify-center mb-8">
            <img src={logo} alt="EcomVA Logo" className="h-16 w-auto" />
          </div>
          <h1 className="text-3xl md:text-5xl font-bold text-gray-900 mb-6">
            AI-Powered Email Assistant for Shopify Merchants
          </h1>
          <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
            Handle customer emails effortlessly with automatic classification and AI-drafted responses. Save time and never miss an important inquiry again.
          </p>
          <div className="flex flex-col md:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              onClick={() => navigate('/register')}
            >
              Start Free Trial
            </Button>
            <Button 
              variant="outline" 
              size="lg"
              onClick={() => navigate('/login')}
            >
              Log In
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-gray-50 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-12 text-center">
            Everything You Need to Streamline Customer Communication
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
              <div className="p-2 bg-primary-100 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                <Mail className="h-6 w-6 text-primary-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Auto-Classification</h3>
              <p className="text-gray-600">
                Automatically categorize incoming emails into delivery tracking, returns, refunds, and more.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
              <div className="p-2 bg-secondary-100 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                <MessageSquare className="h-6 w-6 text-secondary-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">AI-Generated Drafts</h3>
              <p className="text-gray-600">
                Create automatic response drafts based on customer inquiries, ready for your review and sending.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
              <div className="p-2 bg-accent-100 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                <ShoppingCart className="h-6 w-6 text-accent-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Shopify Integration</h3>
              <p className="text-gray-600">
                Connect your Shopify store to access order data and provide more accurate responses.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
              <div className="p-2 bg-success-100 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                <Tag className="h-6 w-6 text-success-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Gmail Labels</h3>
              <p className="text-gray-600">
                Automatically organize emails with custom Gmail labels for better inbox management.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
              <div className="p-2 bg-amber-100 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                <Clock className="h-6 w-6 text-amber-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Time Saving</h3>
              <p className="text-gray-600">
                Save hours each week on customer service with automatic processing and response drafting.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
              <div className="p-2 bg-blue-100 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                <Zap className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Quick Setup</h3>
              <p className="text-gray-600">
                Connect your Gmail and Shopify accounts in minutes and start processing emails immediately.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-12 text-center">
            How EcomVA Works
          </h2>

          <div className="space-y-12">
            <div className="flex flex-col md:flex-row gap-8 items-center">
              <div className="md:w-1/2">
                <div className="bg-gray-100 rounded-lg p-6 aspect-video flex items-center justify-center">
                  <Mail className="h-12 w-12 text-primary-500" />
                </div>
              </div>
              <div className="md:w-1/2">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">1. Connect Your Accounts</h3>
                <p className="text-gray-600 mb-4">
                  Link your Gmail and Shopify store with our secure integration. Your data remains private and we never send emails without your approval.
                </p>
                <ul className="space-y-2">
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-success-500 mr-2" />
                    <span className="text-gray-600">Quick OAuth setup</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-success-500 mr-2" />
                    <span className="text-gray-600">Secure authorization</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="flex flex-col-reverse md:flex-row gap-8 items-center">
              <div className="md:w-1/2">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">2. Automatic Email Processing</h3>
                <p className="text-gray-600 mb-4">
                  Our AI reads and categorizes incoming customer emails, applying Gmail labels and preparing them for your response.
                </p>
                <ul className="space-y-2">
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-success-500 mr-2" />
                    <span className="text-gray-600">Smart categorization</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-success-500 mr-2" />
                    <span className="text-gray-600">Priority sorting</span>
                  </li>
                </ul>
              </div>
              <div className="md:w-1/2">
                <div className="bg-gray-100 rounded-lg p-6 aspect-video flex items-center justify-center">
                  <Tag className="h-12 w-12 text-secondary-500" />
                </div>
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-8 items-center">
              <div className="md:w-1/2">
                <div className="bg-gray-100 rounded-lg p-6 aspect-video flex items-center justify-center">
                  <MessageSquare className="h-12 w-12 text-accent-500" />
                </div>
              </div>
              <div className="md:w-1/2">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">3. AI-Generated Draft Responses</h3>
                <p className="text-gray-600 mb-4">
                  Get AI-written draft responses based on the email category and content, including relevant Shopify order data when available.
                </p>
                <ul className="space-y-2">
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-success-500 mr-2" />
                    <span className="text-gray-600">Contextual responses</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-success-500 mr-2" />
                    <span className="text-gray-600">Order data integration</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-16 bg-gray-50 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-12 text-center">
            Simple, Transparent Pricing
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200">
              <h3 className="text-xl font-bold text-gray-900 mb-2">Free Plan</h3>
              <p className="text-3xl font-bold mb-6">€0<span className="text-lg text-gray-500 font-normal">/month</span></p>
              <p className="text-gray-600 mb-6">Perfect for small merchants getting started with email automation.</p>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-success-500 mr-2" />
                  <span className="text-gray-600">Process up to 100 emails/month</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-success-500 mr-2" />
                  <span className="text-gray-600">Email classification</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-success-500 mr-2" />
                  <span className="text-gray-600">Gmail integration</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-success-500 mr-2" />
                  <span className="text-gray-600">Basic Shopify data</span>
                </li>
              </ul>
              <Button 
                variant="outline" 
                fullWidth
                onClick={() => navigate('/register')}
              >
                Get Started
              </Button>
            </div>
            
            <div className="bg-primary-50 p-8 rounded-lg shadow-sm border border-primary-100 relative">
              <div className="absolute top-0 right-0 bg-primary-100 text-primary-800 text-xs font-semibold px-3 py-1 rounded-bl-lg rounded-tr-lg">
                POPULAR
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Pro Plan</h3>
              <p className="text-3xl font-bold mb-6">€49<span className="text-lg text-gray-500 font-normal">/month</span></p>
              <p className="text-gray-600 mb-6">For growing businesses that need comprehensive email management.</p>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-success-500 mr-2" />
                  <span className="text-gray-600"><strong>Unlimited</strong> email processing</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-success-500 mr-2" />
                  <span className="text-gray-600">Advanced AI response drafting</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-success-500 mr-2" />
                  <span className="text-gray-600">Full Shopify integration</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-success-500 mr-2" />
                  <span className="text-gray-600">Priority support</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-success-500 mr-2" />
                  <span className="text-gray-600">Advanced analytics</span>
                </li>
              </ul>
              <Button 
                fullWidth
                onClick={() => navigate('/register')}
              >
                Start 14-Day Trial
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-12 text-center">
            Trusted by Shopify Merchants
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
              <p className="text-gray-600 italic mb-4">
                "EcomVA has reduced our response time by 70% and helped us maintain consistent communication with our customers. The AI drafts are impressively accurate."
              </p>
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-semibold mr-3">
                  SM
                </div>
                <div>
                  <p className="font-medium text-gray-900">Sophie Martin</p>
                  <p className="text-sm text-gray-500">BeautyEssentials.com</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
              <p className="text-gray-600 italic mb-4">
                "The Gmail integration with automatic labeling has transformed how we manage customer inquiries. I can't imagine going back to manual email sorting."
              </p>
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-semibold mr-3">
                  TD
                </div>
                <div>
                  <p className="font-medium text-gray-900">Thomas Dubois</p>
                  <p className="text-sm text-gray-500">EcoLifeStore.fr</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 bg-primary-50 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">
            Ready to Transform Your Customer Email Management?
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            Join merchants who save hours every week with automated email processing and AI-assisted responses.
          </p>
          <Button 
            size="lg" 
            onClick={() => navigate('/register')}
          >
            Get Started Free
          </Button>
          <p className="mt-4 text-sm text-gray-500">
            No credit card required for free plan.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <img src={logo} alt="EcomVA Logo" className="h-6 w-auto brightness-0 invert" /> {/* Using brightness/invert to make the logo white in dark footer */}
                <span className="text-xl font-semibold text-white">EcomVA</span>
              </div>
              <p className="text-sm">
                AI-powered email assistant for Shopify merchants.
              </p>
            </div>
            
            <div>
              <h3 className="text-white font-medium mb-4">Product</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Integrations</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-white font-medium mb-4">Support</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-white font-medium mb-4">Contact</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="mailto:support@ecomva.com" className="hover:text-white transition-colors">support@ecomva.com</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-12 pt-8 text-sm text-center">
            &copy; {new Date().getFullYear()} EcomVA. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;