import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, ShoppingCart, CheckCircle, Clock, Tag, MessageSquare, Zap, Globe } from 'lucide-react';
import Button from '../../components/ui/Button';
import logo from '../../assets/Logo EcomVA avec icône de boîtes.png';
import { useTranslation } from 'react-i18next';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  
  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  return (
    <div className="bg-white">
      {/* Navigation */}
      <nav className="px-4 md:px-6 py-4 flex flex-col md:flex-row items-center justify-between border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <img src={logo} alt="EcomVA Logo" className="h-8 w-auto" />
          <span className="text-xl font-semibold text-gray-900">EcomVA</span>
        </div>
        
        {/* Menu principal */}
        <div className="flex flex-wrap justify-center my-3 md:my-0">
          <ul className="flex space-x-2 md:space-x-8 text-sm md:text-base">
            <li><a href="#features" className="text-gray-600 hover:text-primary-600 font-medium transition-colors">{t('landing.nav.features')}</a></li>
            <li><a href="#how-it-works" className="text-gray-600 hover:text-primary-600 font-medium transition-colors">{t('landing.nav.howItWorks')}</a></li>
            <li><a href="#pricing" className="text-gray-600 hover:text-primary-600 font-medium transition-colors">{t('landing.nav.pricing')}</a></li>
          </ul>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Language Selector */}
          <div className="flex items-center gap-2 text-sm">
            <Globe className="h-4 w-4 text-gray-500" />
            <button 
              onClick={() => changeLanguage('fr')}
              className={`font-medium ${i18n.language === 'fr' ? 'text-primary-600' : 'text-gray-600 hover:text-gray-800'}`}
            >
              FR
            </button>
            <span className="text-gray-400">|</span>
            <button 
              onClick={() => changeLanguage('en')}
              className={`font-medium ${i18n.language === 'en' ? 'text-primary-600' : 'text-gray-600 hover:text-gray-800'}`}
            >
              EN
            </button>
          </div>
          
          <button 
            onClick={() => navigate('/login')}
            className="text-sm font-medium text-gray-600 hover:text-gray-800"
          >
            {t('common.signIn')}
          </button>
          <Button 
            size="sm" 
            onClick={() => navigate('/register')}
          >
            {t('common.signUp')}
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
            {t('landing.hero.title')}
          </h1>
          <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
            {t('landing.hero.subtitle')}
          </p>
          <div className="flex flex-col md:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              onClick={() => navigate('/register')}
            >
              {t('common.startFreeTrial')}
            </Button>
            <Button 
              variant="outline" 
              size="lg"
              onClick={() => navigate('/login')}
            >
              {t('common.login')}
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 bg-gray-50 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-12 text-center">
            {t('landing.features.title')}
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
              <div className="p-2 bg-primary-100 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                <Mail className="h-6 w-6 text-primary-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('landing.features.autoClassification.title')}</h3>
              <p className="text-gray-600">
                {t('landing.features.autoClassification.description')}
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
              <div className="p-2 bg-secondary-100 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                <MessageSquare className="h-6 w-6 text-secondary-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('landing.features.aiGeneratedDrafts.title')}</h3>
              <p className="text-gray-600">
                {t('landing.features.aiGeneratedDrafts.description')}
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
              <div className="p-2 bg-accent-100 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                <ShoppingCart className="h-6 w-6 text-accent-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('landing.features.shopifyIntegration.title')}</h3>
              <p className="text-gray-600">
                {t('landing.features.shopifyIntegration.description')}
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
              <div className="p-2 bg-success-100 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                <Tag className="h-6 w-6 text-success-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('landing.features.gmailLabels.title')}</h3>
              <p className="text-gray-600">
                {t('landing.features.gmailLabels.description')}
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
              <div className="p-2 bg-amber-100 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                <Clock className="h-6 w-6 text-amber-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('landing.features.timeSaving.title')}</h3>
              <p className="text-gray-600">
                {t('landing.features.timeSaving.description')}
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
              <div className="p-2 bg-blue-100 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                <Zap className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('landing.features.quickSetup.title')}</h3>
              <p className="text-gray-600">
                {t('landing.features.quickSetup.description')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-12 text-center">
            {t('landing.howItWorks.title')}
          </h2>

          <div className="space-y-12">
            <div className="flex flex-col md:flex-row gap-8 items-center">
              <div className="md:w-1/2">
                <div className="bg-gray-100 rounded-lg p-6 aspect-video flex items-center justify-center">
                  <Mail className="h-12 w-12 text-primary-500" />
                </div>
              </div>
              <div className="md:w-1/2">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">{t('landing.howItWorks.step1.title')}</h3>
                <p className="text-gray-600 mb-4">
                  {t('landing.howItWorks.step1.description')}
                </p>
                <ul className="space-y-2">
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-success-500 mr-2" />
                    <span className="text-gray-600">{t('landing.howItWorks.step1.point1')}</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-success-500 mr-2" />
                    <span className="text-gray-600">{t('landing.howItWorks.step1.point2')}</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="flex flex-col-reverse md:flex-row gap-8 items-center">
              <div className="md:w-1/2">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">{t('landing.howItWorks.step2.title')}</h3>
                <p className="text-gray-600 mb-4">
                  {t('landing.howItWorks.step2.description')}
                </p>
                <ul className="space-y-2">
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-success-500 mr-2" />
                    <span className="text-gray-600">{t('landing.howItWorks.step2.point1')}</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-success-500 mr-2" />
                    <span className="text-gray-600">{t('landing.howItWorks.step2.point2')}</span>
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
                <h3 className="text-xl font-semibold text-gray-900 mb-4">{t('landing.howItWorks.step3.title')}</h3>
                <p className="text-gray-600 mb-4">
                  {t('landing.howItWorks.step3.description')}
                </p>
                <ul className="space-y-2">
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-success-500 mr-2" />
                    <span className="text-gray-600">{t('landing.howItWorks.step3.point1')}</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-success-500 mr-2" />
                    <span className="text-gray-600">{t('landing.howItWorks.step3.point2')}</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-16 bg-gray-50 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-12 text-center">
            {t('landing.pricing.title')}
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200">
              <h3 className="text-xl font-bold text-gray-900 mb-2">{t('landing.pricing.freePlan.title')}</h3>
              <p className="text-3xl font-bold mb-6">{t('landing.pricing.freePlan.price')}<span className="text-lg text-gray-500 font-normal">/month</span></p>
              <p className="text-gray-600 mb-6">{t('landing.pricing.freePlan.description')}</p>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-success-500 mr-2" />
                  <span className="text-gray-600">{t('landing.pricing.freePlan.feature1')}</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-success-500 mr-2" />
                  <span className="text-gray-600">{t('landing.pricing.freePlan.feature2')}</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-success-500 mr-2" />
                  <span className="text-gray-600">{t('landing.pricing.freePlan.feature3')}</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-success-500 mr-2" />
                  <span className="text-gray-600">{t('landing.pricing.freePlan.feature4')}</span>
                </li>
              </ul>
              <Button 
                variant="outline" 
                fullWidth
                onClick={() => navigate('/register')}
              >
                {t('common.getStarted')}
              </Button>
            </div>
            
            <div className="bg-primary-50 p-8 rounded-lg shadow-sm border border-primary-100 relative">
              <div className="absolute top-0 right-0 bg-primary-100 text-primary-800 text-xs font-semibold px-3 py-1 rounded-bl-lg rounded-tr-lg">
                {t('landing.pricing.proPlan.popular')}
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">{t('landing.pricing.proPlan.title')}</h3>
              <p className="text-3xl font-bold mb-6">{t('landing.pricing.proPlan.price')}<span className="text-lg text-gray-500 font-normal">/month</span></p>
              <p className="text-gray-600 mb-6">{t('landing.pricing.proPlan.description')}</p>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-success-500 mr-2" />
                  <span className="text-gray-600">{t('landing.pricing.proPlan.feature1')}</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-success-500 mr-2" />
                  <span className="text-gray-600">{t('landing.pricing.proPlan.feature2')}</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-success-500 mr-2" />
                  <span className="text-gray-600">{t('landing.pricing.proPlan.feature3')}</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-success-500 mr-2" />
                  <span className="text-gray-600">{t('landing.pricing.proPlan.feature4')}</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-success-500 mr-2" />
                  <span className="text-gray-600">{t('landing.pricing.proPlan.feature5')}</span>
                </li>
              </ul>
              <Button 
                fullWidth
                onClick={() => navigate('/register')}
              >
                {t('common.startTrial')}
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-12 text-center">
            {t('landing.testimonials.title')}
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
              <p className="text-gray-600 italic mb-4">
                {t('landing.testimonials.testimonial1.text')}
              </p>
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-semibold mr-3">
                  SM
                </div>
                <div>
                  <p className="font-medium text-gray-900">{t('landing.testimonials.testimonial1.name')}</p>
                  <p className="text-sm text-gray-500">{t('landing.testimonials.testimonial1.company')}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
              <p className="text-gray-600 italic mb-4">
                {t('landing.testimonials.testimonial2.text')}
              </p>
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-semibold mr-3">
                  TD
                </div>
                <div>
                  <p className="font-medium text-gray-900">{t('landing.testimonials.testimonial2.name')}</p>
                  <p className="text-sm text-gray-500">{t('landing.testimonials.testimonial2.company')}</p>
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
            {t('landing.finalCTA.title')}
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            {t('landing.finalCTA.subtitle')}
          </p>
          <Button 
            size="lg" 
            onClick={() => navigate('/register')}
          >
            {t('common.getStartedFree')}
          </Button>
          <p className="mt-4 text-sm text-gray-500">
            {t('landing.finalCTA.note')}
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <img src={logo} alt="EcomVA Logo" className="h-6 w-auto brightness-0 invert" />
                <span className="text-xl font-semibold text-white">EcomVA</span>
              </div>
              <p className="text-sm">
                {t('footer.description')}
              </p>
            </div>
            
            <div>
              <h3 className="text-white font-medium mb-4">{t('footer.product.title')}</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">{t('footer.product.features')}</a></li>
                <li><a href="#" className="hover:text-white transition-colors">{t('footer.product.pricing')}</a></li>
                <li><a href="#" className="hover:text-white transition-colors">{t('footer.product.integrations')}</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-white font-medium mb-4">{t('footer.support.title')}</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">{t('footer.support.helpCenter')}</a></li>
                <li><a href="/privacy-policy" className="hover:text-white transition-colors">{t('footer.support.privacyPolicy')}</a></li>
                <li><a href="/terms-of-service" className="hover:text-white transition-colors">{t('footer.support.termsOfService')}</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-white font-medium mb-4">{t('footer.contact.title')}</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="mailto:infos@djibconsultant.com" className="hover:text-white transition-colors">{t('footer.contact.email')}</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-12 pt-8 text-sm text-center">
            &copy; {new Date().getFullYear()} EcomVA. {t('footer.copyright')}
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;