import React, { useState } from 'react';
import { User, Mail, Key, Shield, AlertTriangle, Trash2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';

const SettingsPage: React.FC = () => {
  const { userProfile, currentUser, refreshUserProfile } = useAuth();
  
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
      toast.error('Name is required');
      return;
    }
    
    if (!currentUser) {
      toast.error('You must be logged in to update your profile');
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
      
      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Failed to update profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };
  
  // Change password handler
  const handleChangePassword = () => {
    if (!currentPassword) {
      toast.error('Current password is required');
      return;
    }
    
    if (!newPassword) {
      toast.error('New password is required');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    
    if (newPassword.length < 8) {
      toast.error('New password must be at least 8 characters');
      return;
    }
    
    setSavingPassword(true);
    
    // Simulate API call to change password
    setTimeout(() => {
      // In a real app, this would update the user's password in Firebase Auth
      setSavingPassword(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      toast.success('Password updated successfully');
    }, 1000);
  };
  
  // Delete account handler
  const handleDeleteAccount = () => {
    if (deleteConfirmation !== userProfile?.email) {
      toast.error('Email confirmation does not match');
      return;
    }
    
    setIsDeleting(true);
    
    // Simulate API call to delete account
    setTimeout(() => {
      // In a real app, this would delete the user's account from Firebase Auth and Firestore
      setIsDeleting(false);
      toast.success('Account deleted successfully');
      // In a real app, this would redirect to login page
    }, 1500);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-xl font-semibold text-gray-900">Account Settings</h2>
        <p className="text-gray-600">Manage your account details and security</p>
      </div>
      
      {/* Profile Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary-100 rounded-full">
              <User className="h-5 w-5 text-primary-600" />
            </div>
            <div>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Update your account details</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            label="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            fullWidth
          />
          <Input
            label="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            disabled
            fullWidth
          />
          <p className="text-xs text-gray-500">
            Email address cannot be changed. Contact support if you need to update your email.
          </p>
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button
            onClick={handleSaveProfile}
            isLoading={savingProfile}
          >
            Save Changes
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
              <CardTitle>Change Password</CardTitle>
              <CardDescription>Update your account password</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            label="Current Password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            type="password"
            fullWidth
          />
          <Input
            label="New Password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            type="password"
            helperText="Password must be at least 8 characters"
            fullWidth
          />
          <Input
            label="Confirm New Password"
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
            Update Password
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
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>Manage account security and permissions</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 border border-gray-200 rounded-md">
            <div className="flex items-center space-x-3">
              <Mail className="h-5 w-5 text-gray-400 flex-shrink-0" />
              <div>
                <h4 className="text-sm font-medium text-gray-900">Two-Factor Authentication</h4>
                <p className="text-xs text-gray-500">Add an extra layer of security to your account</p>
              </div>
            </div>
            <div className="flex items-center">
              <span className="mr-3 text-xs font-medium text-gray-500">Coming soon</span>
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
                <h4 className="text-sm font-medium text-gray-900">Session Management</h4>
                <p className="text-xs text-gray-500">View and manage your active sessions</p>
              </div>
            </div>
            <Button variant="outline" size="sm" disabled>
              View Sessions
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
              <CardTitle className="text-error-700">Delete Account</CardTitle>
              <CardDescription>Permanently delete your account and all data</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start p-4 bg-error-50 rounded-md">
            <AlertTriangle className="h-5 w-5 text-error-600 mr-3 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-error-800">Warning: This action cannot be undone</h4>
              <p className="mt-1 text-xs text-error-700">
                Deleting your account will remove all your data, including email settings, integrations, and preferences. 
                This action is permanent and cannot be recovered.
              </p>
            </div>
          </div>
          
          <Input
            label="Type your email to confirm"
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
            Delete Account
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default SettingsPage;