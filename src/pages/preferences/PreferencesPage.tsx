import React, { useState } from 'react';
import { 
  Settings, 
  Mail, 
  Save, 
  CheckSquare, 
  Square,
  MessageSquare 
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { saveUserPreferences } from '../../lib/services/preferences';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from 'react-i18next';

const PreferencesPage: React.FC = () => {
  const { userProfile, currentUser, refreshUserProfile } = useAuth();
  const { t } = useTranslation();
  
  // State for user preferences
  const [autoClassify, setAutoClassify] = useState(userProfile?.preferences?.autoClassify || true);
  const [autoDraft, setAutoDraft] = useState(userProfile?.preferences?.autoDraft || true);
  const [signature, setSignature] = useState(userProfile?.preferences?.signature || '');
  
  // State for hidden categories
  const [hiddenCategories, setHiddenCategories] = useState<string[]>(
    userProfile?.preferences?.hiddenCategories || []
  );
  
  const [saving, setSaving] = useState(false);
  
  // Available email categories
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
  
  // Toggle category visibility
  const toggleCategory = (categoryId: string) => {
    if (hiddenCategories.includes(categoryId)) {
      setHiddenCategories(hiddenCategories.filter(id => id !== categoryId));
    } else {
      setHiddenCategories([...hiddenCategories, categoryId]);
    }
  };
  
  // Save all preferences
  const handleSavePreferences = async () => {
    if (!currentUser) return;
    
    setSaving(true);
    
    try {
      const updatedPreferences = {
        autoClassify,
        autoDraft,
        signature,
        hiddenCategories,
        responseTone: userProfile?.preferences?.responseTone || 'professional',
        responseLength: userProfile?.preferences?.responseLength || 'balanced'
      };
      
      await saveUserPreferences(currentUser.uid, updatedPreferences);
      await refreshUserProfile(currentUser.uid);
      
      toast.success(t('preferences.saveSuccess', 'Preferences saved successfully'));
    } catch (error) {
      console.error('Failed to save preferences:', error);
      toast.error(t('preferences.saveError', 'Failed to save preferences'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-xl font-semibold text-gray-900">{t('preferences.title')}</h2>
        <p className="text-gray-600">{t('preferences.description')}</p>
      </div>
      
      {/* Automation Preferences */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary-100 rounded-full">
              <Settings className="h-5 w-5 text-primary-600" />
            </div>
            <div>
              <CardTitle>{t('preferences.automation.title')}</CardTitle>
              <CardDescription>{t('preferences.automation.description')}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium">{t('preferences.automation.autoClassify.title')}</h4>
                <p className="text-xs text-gray-500">{t('preferences.automation.autoClassify.description')}</p>
              </div>
              <button
                onClick={() => setAutoClassify(!autoClassify)}
                className="focus:outline-none"
                aria-label={autoClassify ? t('preferences.automation.autoClassify.disable') : t('preferences.automation.autoClassify.enable')}
              >
                {autoClassify ? (
                  <CheckSquare className="h-6 w-6 text-primary-600" />
                ) : (
                  <Square className="h-6 w-6 text-gray-400" />
                )}
              </button>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium">{t('preferences.automation.autoDraft.title')}</h4>
                <p className="text-xs text-gray-500">{t('preferences.automation.autoDraft.description')}</p>
              </div>
              <button
                onClick={() => setAutoDraft(!autoDraft)}
                className="focus:outline-none"
                aria-label={autoDraft ? t('preferences.automation.autoDraft.disable') : t('preferences.automation.autoDraft.enable')}
              >
                {autoDraft ? (
                  <CheckSquare className="h-6 w-6 text-primary-600" />
                ) : (
                  <Square className="h-6 w-6 text-gray-400" />
                )}
              </button>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('preferences.signature.title')}</label>
              <p className="text-xs text-gray-500">{t('preferences.signature.description')}</p>
              <textarea 
                className="w-full border border-gray-200 rounded-md p-2 text-sm"
                rows={4}
                placeholder={t('preferences.signature.placeholder')}
                value={signature}
                onChange={(e) => setSignature(e.target.value)}
              />
              <p className="text-xs text-gray-400">{t('preferences.signature.note')}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Category Visibility */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary-100 rounded-full">
              <MessageSquare className="h-5 w-5 text-primary-600" />
            </div>
            <div>
              <CardTitle>{t('preferences.categories.title')}</CardTitle>
              <CardDescription>{t('preferences.categories.description')}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {categories.map(category => (
              <div key={category.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <span className="mr-2">{category.emoji}</span>
                  <span>{category.name}</span>
                </div>
                <button
                  onClick={() => toggleCategory(category.id)}
                  className="focus:outline-none"
                  aria-label={hiddenCategories.includes(category.id) ? t('preferences.categories.show', { category: category.name }) : t('preferences.categories.hide', { category: category.name })}
                >
                  {!hiddenCategories.includes(category.id) ? (
                    <CheckSquare className="h-5 w-5 text-primary-600" />
                  ) : (
                    <Square className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      
      {/* Save Button */}
      <div className="flex justify-end">
        <Button 
          onClick={handleSavePreferences}
          disabled={saving}
          leftIcon={<Save className="h-4 w-4" />}
        >
          {saving ? t('preferences.saveButton.saving') : t('preferences.saveButton.default')}
        </Button>
      </div>
    </div>
  );
};

export default PreferencesPage;