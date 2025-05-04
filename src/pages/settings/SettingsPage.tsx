import React, { useState } from 'react';
import { User, Mail, Key, Shield, AlertTriangle, Trash2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { getAuth, updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { useTranslation } from 'react-i18next';

const SettingsPage: React.FC = () => {
  const { userProfile, currentUser, refreshUserProfile } = useAuth();
  const { t } = useTranslation();
  
  // Profile settings state
  const [name, setName] = useState(userProfile?.name || '');
  const [email, setEmail] = useState(userProfile?.email || '');
  const [savingProfile, setSavingProfile] = useState(false);
  
  // Password settings state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  
  // Data deletion confirmation state
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Save profile handler
  const handleSaveProfile = async () => {
    if (!name.trim()) {
      toast.error(t('settings.profile.nameRequired'));
      return;
    }
    
    if (!currentUser) {
      toast.error(t('common.errors.notLoggedIn'));
      return;
    }
    
    setSavingProfile(true);
    
    try {
      // Update profile in Firestore
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, {
        name,
        updatedAt: new Date().toISOString()
      });
      
      // Refresh the user profile in AuthContext
      await refreshUserProfile(currentUser.uid);
      
      toast.success(t('settings.profile.profileUpdated'));
    } catch (error) {
      console.error('Failed to update profile:', error);
      toast.error(t('settings.profile.updateError'));
    } finally {
      setSavingProfile(false);
    }
  };
  
  // Change password handler
  const handleChangePassword = async () => {
    if (!currentPassword) {
      toast.error(t('settings.password.currentRequired'));
      return;
    }
    
    if (!newPassword) {
      toast.error(t('settings.password.newRequired'));
      return;
    }
    
    if (newPassword !== confirmPassword) {
      toast.error(t('settings.password.passwordMismatch'));
      return;
    }
    
    if (newPassword.length < 8) {
      toast.error(t('settings.password.tooShort'));
      return;
    }
    
    if (!currentUser) {
      toast.error(t('common.errors.notLoggedIn'));
      return;
    }
    
    setSavingPassword(true);
    
    try {
      // Get the current Firebase Auth instance
      const auth = getAuth();
      const user = auth.currentUser;
      
      if (!user || !user.email) {
        throw new Error('No authenticated user found');
      }
      
      // Create credential with current email and password
      const credential = EmailAuthProvider.credential(
        user.email,
        currentPassword
      );
      
      // Re-authenticate user to verify current password
      await reauthenticateWithCredential(user, credential);
      
      // Update password
      await updatePassword(user, newPassword);
      
      // Clear form fields
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      
      toast.success(t('settings.password.passwordUpdated'));
    } catch (error: any) {
      console.error('Failed to update password:', error);
      
      // Handle specific error cases
      if (error.code === 'auth/wrong-password') {
        toast.error(t('settings.password.wrongPassword'));
      } else if (error.code === 'auth/weak-password') {
        toast.error(t('settings.password.weakPassword'));
      } else if (error.code === 'auth/requires-recent-login') {
        toast.error(t('settings.password.requiresRecentLogin'));
      } else {
        toast.error(t('settings.password.updateError') + ': ' + (error.message || t('common.errors.generic')));
      }
    } finally {
      setSavingPassword(false);
    }
  };
  
  // Delete account handler
  const handleDeleteAccount = () => {
    if (deleteConfirmation !== userProfile?.email) {
      toast.error(t('settings.account.emailMismatch'));
      return;
    }
    
    setIsDeleting(true);
    
    // Simulate API call to delete account
    setTimeout(() => {
      // In a real app, this would delete the user's account from Firebase Auth and Firestore
      setIsDeleting(false);
      toast.success(t('settings.account.deleteSuccess'));
      // In a real app, this would redirect to login page
    }, 1500);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-xl font-semibold text-gray-900">{t('settings.title')}</h2>
        <p className="text-gray-600">{t('settings.description')}</p>
      </div>
      
      {/* Profile Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary-100 rounded-full">
              <User className="h-5 w-5 text-primary-600" />
            </div>
            <div>
              <CardTitle>{t('settings.profile.title')}</CardTitle>
              <CardDescription>{t('settings.profile.description')}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            label={t('settings.profile.name')}
            value={name}
            onChange={(e) => setName(e.target.value)}
            fullWidth
          />
          <Input
            label={t('settings.profile.email')}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            disabled
            fullWidth
          />
          <p className="text-xs text-gray-500">
            {t('settings.profile.emailHint')}
          </p>
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button
            onClick={handleSaveProfile}
            isLoading={savingProfile}
          >
            {t('settings.profile.updateProfile')}
          </Button>
        </CardFooter>
      </Card>
      
      {/* Password Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-secondary-100 rounded-full">
              <Key className="h-5 w-5 text-secondary-600" />
            </div>
            <div>
              <CardTitle>{t('settings.password.title')}</CardTitle>
              <CardDescription>{t('settings.password.description')}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            label={t('settings.password.current')}
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            type="password"
            fullWidth
          />
          <Input
            label={t('settings.password.new')}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            type="password"
            helperText={t('settings.password.passwordHint')}
            fullWidth
          />
          <Input
            label={t('settings.password.confirm')}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            type="password"
            fullWidth
          />
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button
            onClick={handleChangePassword}
            isLoading={savingPassword}
          >
            {t('settings.password.updatePassword')}
          </Button>
        </CardFooter>
      </Card>
      
      {/* Security Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-accent-100 rounded-full">
              <Shield className="h-5 w-5 text-accent-600" />
            </div>
            <div>
              <CardTitle>{t('settings.twoFactor.title')}</CardTitle>
              <CardDescription>{t('settings.twoFactor.description')}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 border border-gray-200 rounded-md">
            <div className="flex items-center space-x-3">
              <Mail className="h-5 w-5 text-gray-400 flex-shrink-0" />
              <div>
                <h4 className="text-sm font-medium text-gray-900">{t('settings.twoFactor.enable')}</h4>
                <p className="text-xs text-gray-500">{t('settings.twoFactor.description')}</p>
              </div>
            </div>
            <div className="flex items-center">
              <span className="mr-3 text-xs font-medium text-gray-500">{t('common.comingSoon')}</span>
              <button
                type="button"
                className="relative inline-flex h-6 w-11 flex-shrink-0 cursor-not-allowed rounded-full border-2 border-transparent bg-gray-200 transition-colors duration-200 ease-in-out focus:outline-none"
                disabled
              >
                <span className="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out translate-x-0" />
              </button>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 border border-gray-200 rounded-md gap-3">
            <div className="flex items-center space-x-3">
              <Shield className="h-5 w-5 text-gray-400 flex-shrink-0" />
              <div>
                <h4 className="text-sm font-medium text-gray-900">{t('settings.security.sessionManagement')}</h4>
                <p className="text-xs text-gray-500">{t('settings.security.sessionDesc')}</p>
              </div>
            </div>
            <Button variant="outline" size="sm" disabled>
              {t('settings.security.viewSessions')}
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {/* Delete Account */}
      <Card className="border-error-200">
        <CardHeader>
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-error-100 rounded-full">
              <Trash2 className="h-5 w-5 text-error-600" />
            </div>
            <div>
              <CardTitle className="text-error-700">{t('settings.account.deleteAccount')}</CardTitle>
              <CardDescription>{t('settings.account.deleteDescription')}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start p-4 bg-error-50 rounded-md">
            <AlertTriangle className="h-5 w-5 text-error-600 mr-3 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-error-800">{t('settings.account.deleteWarning')}</h4>
              <p className="mt-1 text-xs text-error-700">
                {t('settings.account.deleteExplanation')}
              </p>
            </div>
          </div>
          
          <Input
            label={t('settings.account.typeEmail')}
            value={deleteConfirmation}
            onChange={(e) => setDeleteConfirmation(e.target.value)}
            placeholder={userProfile?.email}
            fullWidth
          />
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button
            variant="danger"
            onClick={handleDeleteAccount}
            isLoading={isDeleting}
            disabled={deleteConfirmation !== userProfile?.email}
          >
            {t('settings.account.deleteAccount')}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default SettingsPage;