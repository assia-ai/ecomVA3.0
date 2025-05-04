import React from 'react';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { saveUserPreferences } from '../../lib/services/preferences';
import toast from 'react-hot-toast';

const LanguageSelector: React.FC = () => {
  const { i18n } = useTranslation();
  const { currentUser, userProfile, refreshUserProfile } = useAuth();
  
  const changeLanguage = async (lng: string) => {
    i18n.changeLanguage(lng);
    
    // Si l'utilisateur est connecté, sauvegarder sa préférence de langue
    if (currentUser && userProfile) {
      try {
        // Prépare les préférences mises à jour avec la nouvelle langue
        const updatedPreferences = {
          ...userProfile.preferences,
          language: lng as 'fr' | 'en'
        };
        
        // Sauvegarde les préférences mises à jour
        await saveUserPreferences(currentUser.uid, updatedPreferences);
        
        // Rafraîchit le profil utilisateur dans le contexte
        await refreshUserProfile(currentUser.uid);
      } catch (error) {
        console.error('Erreur lors de la sauvegarde de la langue:', error);
        toast.error('Impossible de sauvegarder votre préférence de langue');
      }
    }
  };

  return (
    <div className="relative inline-block text-left">
      <div className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800">
        <Globe className="h-4 w-4" />
        <button
          className={`font-medium ${i18n.language === 'fr' ? 'text-primary-600' : ''}`}
          onClick={() => changeLanguage('fr')}
        >
          FR
        </button>
        <span>|</span>
        <button
          className={`font-medium ${i18n.language === 'en' ? 'text-primary-600' : ''}`}
          onClick={() => changeLanguage('en')}
        >
          EN
        </button>
      </div>
    </div>
  );
};

export default LanguageSelector;