import React from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '../../assets/Logo EcomVA avec icône de boîtes.png';
import { Globe } from 'lucide-react';
import Button from '../../components/ui/Button';
import { useTranslation } from 'react-i18next';

const PrivacyPolicyPage: React.FC = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  
  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };
  
  // Contenu de la politique de confidentialité selon la langue
  const privacyContent = {
    fr: (
      <>
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Politique de confidentialité – EcomVA</h1>
        <p className="text-gray-500 mb-8">Dernière mise à jour : 02/05/2025</p>
        
        <h2 className="text-2xl font-semibold text-gray-900 mt-8">1. Qui sommes-nous ?</h2>
        <p>
          EcomVA est une application SaaS conçue pour aider les e-commerçants à automatiser la gestion de leur service client par email. 
          Notre plateforme est éditée par <strong>Djib Consultant TI inc</strong>, basée à Québec,QC, Canada.
        </p>
        
        <h2 className="text-2xl font-semibold text-gray-900 mt-8">2. Données collectées</h2>
        <p>Lorsque vous utilisez EcomVA, nous collectons et traitons les informations suivantes :</p>
        <ul className="list-disc pl-6 space-y-2">
          <li>Adresse email et profil utilisateur Gmail/Google</li>
          <li>Contenu des emails entrants et sortants (exclusivement pour les comptes connectés)</li>
          <li>Métadonnées d'emails (sujet, date, expéditeur, etc.)</li>
          <li>Informations liées à vos commandes Shopify (ex : numéro de commande, lien de tracking)</li>
        </ul>
        
        <h2 className="text-2xl font-semibold text-gray-900 mt-8">3. Pourquoi nous utilisons ces données ?</h2>
        <p>Nous utilisons vos données pour :</p>
        <ul className="list-disc pl-6 space-y-2">
          <li>Lire automatiquement les messages clients</li>
          <li>Générer des brouillons de réponses</li>
          <li>Envoyer des réponses avec votre autorisation</li>
          <li>Mettre à jour le statut d'un message dans Gmail</li>
          <li>Afficher un historique dans votre tableau de bord</li>
        </ul>
        
        <h2 className="text-2xl font-semibold text-gray-900 mt-8">4. Où et combien de temps sont stockées vos données ?</h2>
        <p>Vos données sont hébergées de façon sécurisée sur Firebase.</p>
        <p>Les messages sont temporairement stockés afin d'être visibles dans votre historique d'activité.</p>
        <p>Vous pouvez à tout moment supprimer votre compte et toutes vos données.</p>
        
        <h2 className="text-2xl font-semibold text-gray-900 mt-8">5. Partage avec des tiers</h2>
        <p>Nous ne partageons jamais vos données avec des tiers.</p>
        
        <h2 className="text-2xl font-semibold text-gray-900 mt-8">6. Sécurité</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>Les accès aux données sont protégés par chiffrement.</li>
          <li>L'accès est limité à votre compte OAuth.</li>
          <li>Nous suivons les meilleures pratiques de sécurité (authentification sécurisée, audit des accès, etc.).</li>
        </ul>
        
        <h2 className="text-2xl font-semibold text-gray-900 mt-8">7. Vos droits</h2>
        <p>Vous pouvez :</p>
        <ul className="list-disc pl-6 space-y-2">
          <li>Révoquer les autorisations via votre compte Google</li>
          <li>Demander la suppression de vos données</li>
          <li>Nous contacter à : infos@djibconsultantti.com</li>
        </ul>
      </>
    ),
    en: (
      <>
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Privacy Policy – EcomVA</h1>
        <p className="text-gray-500 mb-8">Last updated: 05/02/2025</p>
        
        <h2 className="text-2xl font-semibold text-gray-900 mt-8">1. Who We Are</h2>
        <p>
          EcomVA is a SaaS application designed to help e-commerce merchants automate their email customer service management. 
          Our platform is published by <strong>Djib Consultant TI inc</strong>, based in Quebec City, QC, Canada.
        </p>
        
        <h2 className="text-2xl font-semibold text-gray-900 mt-8">2. Data We Collect</h2>
        <p>When you use EcomVA, we collect and process the following information:</p>
        <ul className="list-disc pl-6 space-y-2">
          <li>Email address and Gmail/Google user profile</li>
          <li>Content of incoming and outgoing emails (exclusively for connected accounts)</li>
          <li>Email metadata (subject, date, sender, etc.)</li>
          <li>Information related to your Shopify orders (e.g., order number, tracking link)</li>
        </ul>
        
        <h2 className="text-2xl font-semibold text-gray-900 mt-8">3. Why We Use This Data</h2>
        <p>We use your data to:</p>
        <ul className="list-disc pl-6 space-y-2">
          <li>Automatically read customer messages</li>
          <li>Generate response drafts</li>
          <li>Send responses with your authorization</li>
          <li>Update message status in Gmail</li>
          <li>Display history in your dashboard</li>
        </ul>
        
        <h2 className="text-2xl font-semibold text-gray-900 mt-8">4. Where and How Long Your Data Is Stored</h2>
        <p>Your data is securely hosted on Firebase.</p>
        <p>Messages are temporarily stored to be visible in your activity history.</p>
        <p>You can delete your account and all your data at any time.</p>
        
        <h2 className="text-2xl font-semibold text-gray-900 mt-8">5. Third-Party Sharing</h2>
        <p>We never share your data with third parties.</p>
        
        <h2 className="text-2xl font-semibold text-gray-900 mt-8">6. Security</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>Data access is protected by encryption.</li>
          <li>Access is limited to your OAuth account.</li>
          <li>We follow security best practices (secure authentication, access auditing, etc.).</li>
        </ul>
        
        <h2 className="text-2xl font-semibold text-gray-900 mt-8">7. Your Rights</h2>
        <p>You can:</p>
        <ul className="list-disc pl-6 space-y-2">
          <li>Revoke authorizations through your Google account</li>
          <li>Request deletion of your data</li>
          <li>Contact us at: infos@djibconsultantti.com</li>
        </ul>
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

      {/* Privacy Policy Content */}
      <div className="py-12 px-6">
        <div className="max-w-4xl mx-auto prose prose-slate">
          {i18n.language === 'fr' ? privacyContent.fr : privacyContent.en}
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
                <li><a href="mailto:support@ecomva.com" className="hover:text-white transition-colors">{t('footer.contact.email')}</a></li>
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

export default PrivacyPolicyPage;