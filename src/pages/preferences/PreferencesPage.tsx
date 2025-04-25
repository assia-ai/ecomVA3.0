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

const PreferencesPage: React.FC = () => {
  const { userProfile, currentUser, refreshUserProfile } = useAuth();
  
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
    { id: 'delivery', emoji: '📦', name: 'Livraison / Suivi de commande' },
    { id: 'cancellation', emoji: '❌', name: 'Annulation' },
    { id: 'refund', emoji: '💸', name: 'Remboursement' },
    { id: 'return', emoji: '🔁', name: 'Retour' },
    { id: 'presale', emoji: '🛍', name: 'Avant-vente' },
    { id: 'resolved', emoji: '🔒', name: 'Résolu' },
    { id: 'spam', emoji: '🚫', name: 'Spam / à ignorer' },
    { id: 'other', emoji: '🧾', name: 'Autres' }
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
      
      // Save preferences and get the updated profile
      await saveUserPreferences(currentUser.uid, updatedPreferences);
      
      // Refresh the user profile in the AuthContext
      await refreshUserProfile(currentUser.uid);
      
      toast.success('Preferences saved successfully');
    } catch (error) {
      console.error('Failed to save preferences:', error);
      toast.error('Failed to save preferences');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-xl font-semibold text-gray-900">Preferences</h2>
        <p className="text-gray-600">Customize how ecommva processes your emails</p>
      </div>
      
      {/* Automation Preferences */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary-100 rounded-full">
              <Settings className="h-5 w-5 text-primary-600" />
            </div>
            <div>
              <CardTitle>Automation Settings</CardTitle>
              <CardDescription>Control how emails are processed and drafted</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Auto-classify toggle */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Auto-classify emails</h3>
                <p className="text-sm text-gray-500">Automatically categorize incoming emails</p>
              </div>
              <button
                onClick={() => setAutoClassify(!autoClassify)}
                className="focus:outline-none"
                aria-label={autoClassify ? "Disable auto-classify" : "Enable auto-classify"}
              >
                {autoClassify ? (
                  <CheckSquare className="h-6 w-6 text-primary-600" />
                ) : (
                  <Square className="h-6 w-6 text-gray-400" />
                )}
              </button>
            </div>
            
            {/* Auto-draft toggle */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Auto-draft responses</h3>
                <p className="text-sm text-gray-500">Automatically create draft responses for common inquiries</p>
              </div>
              <button
                onClick={() => setAutoDraft(!autoDraft)}
                className="focus:outline-none"
                aria-label={autoDraft ? "Disable auto-draft" : "Enable auto-draft"}
              >
                {autoDraft ? (
                  <CheckSquare className="h-6 w-6 text-primary-600" />
                ) : (
                  <Square className="h-6 w-6 text-gray-400" />
                )}
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Email Signature */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary-100 rounded-full">
              <Mail className="h-5 w-5 text-primary-600" />
            </div>
            <div>
              <CardTitle>Email Signature</CardTitle>
              <CardDescription>Add a signature to your email responses</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <textarea
            value={signature}
            onChange={(e) => setSignature(e.target.value)}
            placeholder="Enter your signature here..."
            className="w-full min-h-[120px] p-3 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
          />
          <p className="mt-2 text-xs text-gray-500">
            HTML formatting is supported. Your signature will be automatically added to email drafts.
          </p>
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
              <CardTitle>Category Visibility</CardTitle>
              <CardDescription>Show or hide email categories from your dashboard</CardDescription>
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
                  aria-label={hiddenCategories.includes(category.id) ? `Show ${category.name}` : `Hide ${category.name}`}
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
          isLoading={saving}
          className="flex items-center space-x-2"
        >
          {saving ? 'Saving...' : 'Save Preferences'}
          <Save className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );
};

export default PreferencesPage;