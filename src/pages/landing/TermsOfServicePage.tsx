import React from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '../../assets/Logo EcomVA avec icône de boîtes.png';
import { Globe } from 'lucide-react';
import Button from '../../components/ui/Button';
import { useTranslation } from 'react-i18next';

const TermsOfServicePage: React.FC = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  
  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  // Contenu des conditions d'utilisation selon la langue
  const termsContent = {
    fr: (
      <>
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Conditions d'utilisation – EcomVA</h1>
        <p className="text-gray-500 mb-8">Dernière mise à jour : 2 mai 2025</p>
        
        <h2 className="text-2xl font-semibold text-gray-900 mt-8">1. Acceptation des conditions</h2>
        <p>
          En accédant et en utilisant l'application EcomVA (ci-après « l'Application »), vous acceptez les présentes conditions d'utilisation. 
          Si vous n'acceptez pas ces conditions, veuillez ne pas utiliser notre service.
        </p>
        
        <h2 className="text-2xl font-semibold text-gray-900 mt-8">2. Description du service</h2>
        <p>
          EcomVA est une application SaaS permettant aux e-commerçants d'automatiser le traitement des emails clients via l'intégration avec Gmail et Shopify. 
          Elle génère des réponses automatiques, classe les messages et récupère les informations de commande.
        </p>
        
        <h2 className="text-2xl font-semibold text-gray-900 mt-8">3. Accès au service</h2>
        <p>L'accès à EcomVA nécessite :</p>
        <ul className="list-disc pl-6 space-y-2">
          <li>Une connexion OAuth avec votre compte Google</li>
          <li>Une boutique Shopify active</li>
          <li>Une connexion Internet stable</li>
        </ul>
        <p>Vous êtes responsable de la sécurité de vos identifiants et de votre accès.</p>
        
        <h2 className="text-2xl font-semibold text-gray-900 mt-8">4. Utilisation autorisée</h2>
        <p>Vous vous engagez à :</p>
        <ul className="list-disc pl-6 space-y-2">
          <li>Utiliser le service uniquement dans un cadre légal</li>
          <li>Ne pas interférer avec le bon fonctionnement de l'application</li>
          <li>Ne pas tenter d'accéder aux données d'autres utilisateurs</li>
        </ul>
        
        <h2 className="text-2xl font-semibold text-gray-900 mt-8">5. Données et confidentialité</h2>
        <p>
          En utilisant EcomVA, vous consentez à la collecte et au traitement de vos données conformément à notre 
          <a href="/privacy-policy" className="text-primary-600 hover:text-primary-800"> Politique de confidentialité</a>.
        </p>
        
        <h2 className="text-2xl font-semibold text-gray-900 mt-8">6. Propriété intellectuelle</h2>
        <p>
          EcomVA, son logo, son code source et ses contenus sont la propriété exclusive de [ton entreprise]. 
          Toute reproduction ou exploitation non autorisée est interdite.
        </p>
        
        <h2 className="text-2xl font-semibold text-gray-900 mt-8">7. Suspension ou résiliation</h2>
        <p>Nous nous réservons le droit de suspendre ou de résilier l'accès à votre compte :</p>
        <ul className="list-disc pl-6 space-y-2">
          <li>En cas de violation des présentes conditions</li>
          <li>En cas d'usage abusif ou malveillant du service</li>
        </ul>
        
        <h2 className="text-2xl font-semibold text-gray-900 mt-8">8. Limitation de responsabilité</h2>
        <p>
          EcomVA ne peut être tenu responsable des dommages indirects, pertes de données ou 
          interruptions de service liés à l'utilisation du SaaS.
        </p>
        
        <h2 className="text-2xl font-semibold text-gray-900 mt-8">9. Modifications</h2>
        <p>
          Nous pouvons mettre à jour ces conditions à tout moment. 
          Les utilisateurs seront notifiés par email ou via l'application.
        </p>
        
        <h2 className="text-2xl font-semibold text-gray-900 mt-8">10. Contact</h2>
        <p>
          Pour toute question relative à ces conditions, contactez-nous à : 
          <a href="mailto:infos@djibconsultantti.com" className="text-primary-600 hover:text-primary-800"> infos@djibconsultantti.com</a>
        </p>
      </>
    ),
    en: (
      <>
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Terms of Service – EcomVA</h1>
        <p className="text-gray-500 mb-8">Last updated: May 2, 2025</p>
        
        <h2 className="text-2xl font-semibold text-gray-900 mt-8">1. Acceptance of Terms</h2>
        <p>
          By accessing and using the EcomVA application (hereinafter "the Application"), you agree to these terms of service. 
          If you do not accept these terms, please do not use our service.
        </p>
        
        <h2 className="text-2xl font-semibold text-gray-900 mt-8">2. Service Description</h2>
        <p>
          EcomVA is a SaaS application that enables e-commerce merchants to automate customer email processing through integration with Gmail and Shopify. 
          It generates automatic responses, classifies messages, and retrieves order information.
        </p>
        
        <h2 className="text-2xl font-semibold text-gray-900 mt-8">3. Service Access</h2>
        <p>Access to EcomVA requires:</p>
        <ul className="list-disc pl-6 space-y-2">
          <li>OAuth connection with your Google account</li>
          <li>An active Shopify store</li>
          <li>A stable internet connection</li>
        </ul>
        <p>You are responsible for the security of your credentials and your access.</p>
        
        <h2 className="text-2xl font-semibold text-gray-900 mt-8">4. Authorized Use</h2>
        <p>You agree to:</p>
        <ul className="list-disc pl-6 space-y-2">
          <li>Use the service only for legal purposes</li>
          <li>Not interfere with the proper functioning of the application</li>
          <li>Not attempt to access other users' data</li>
        </ul>
        
        <h2 className="text-2xl font-semibold text-gray-900 mt-8">5. Data and Privacy</h2>
        <p>
          By using EcomVA, you consent to the collection and processing of your data according to our 
          <a href="/privacy-policy" className="text-primary-600 hover:text-primary-800"> Privacy Policy</a>.
        </p>
        
        <h2 className="text-2xl font-semibold text-gray-900 mt-8">6. Intellectual Property</h2>
        <p>
          EcomVA, its logo, source code, and content are the exclusive property of [your company]. 
          Any unauthorized reproduction or exploitation is prohibited.
        </p>
        
        <h2 className="text-2xl font-semibold text-gray-900 mt-8">7. Suspension or Termination</h2>
        <p>We reserve the right to suspend or terminate access to your account:</p>
        <ul className="list-disc pl-6 space-y-2">
          <li>In case of violation of these terms</li>
          <li>In case of abusive or malicious use of the service</li>
        </ul>
        
        <h2 className="text-2xl font-semibold text-gray-900 mt-8">8. Limitation of Liability</h2>
        <p>
          EcomVA cannot be held responsible for indirect damages, data loss, or 
          service interruptions related to the use of the SaaS.
        </p>
        
        <h2 className="text-2xl font-semibold text-gray-900 mt-8">9. Modifications</h2>
        <p>
          We may update these terms at any time. 
          Users will be notified by email or through the application.
        </p>
        
        <h2 className="text-2xl font-semibold text-gray-900 mt-8">10. Contact</h2>
        <p>
          For any questions regarding these terms, contact us at: 
          <a href="mailto:infos@djibconsultantti.com" className="text-primary-600 hover:text-primary-800"> infos@djibconsultantti.com</a>
        </p>
      </>
    )
  };
  
  return (
    <div className="bg-white">
      {/* Navigation */}
      <nav className="px-4 md:px-6 py-4 flex items-center justify-between border-b border-gray-200">
        <div onClick={() => navigate('/')} className="flex items-center space-x-2 cursor-pointer">
          <img src={logo} alt="EcomVA Logo" className="h-8 w-auto" />
          <span className="text-xl font-semibold text-gray-900">EcomVA</span>
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

      {/* Terms of Service Content */}
      <div className="py-12 px-6">
        <div className="max-w-4xl mx-auto prose prose-slate">
          {i18n.language === 'fr' ? termsContent.fr : termsContent.en}
        </div>
      </div>
      
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
                <li><a href="/#features" className="hover:text-white transition-colors">{t('footer.product.features')}</a></li>
                <li><a href="/#pricing" className="hover:text-white transition-colors">{t('footer.product.pricing')}</a></li>
                <li><a href="/#integrations" className="hover:text-white transition-colors">{t('footer.product.integrations')}</a></li>
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
                <li><a href="mailto:infos@djibconsultantti.com" className="hover:text-white transition-colors">{t('footer.contact.email')}</a></li>
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

export default TermsOfServicePage;