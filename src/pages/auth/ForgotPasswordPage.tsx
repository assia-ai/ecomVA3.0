import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Mail as MailIcon, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const { resetPassword } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      await resetPassword(email);
      setEmailSent(true);
      toast.success('Password reset email sent');
    } catch (error: any) {
      console.error('Password reset error:', error);
      toast.error(error.message || 'Failed to send password reset email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="rounded-full bg-accent-100 p-2">
            <MailIcon className="h-8 w-8 text-accent-600" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Reset your password
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          We'll send you an email with a link to reset your password
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {!emailSent ? (
            <form className="space-y-6" onSubmit={handleSubmit}>
              <Input
                label="Email address"
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                leftIcon={<Mail className="h-5 w-5 text-gray-400" />}
                required
                autoComplete="email"
                placeholder="you@example.com"
                fullWidth
              />

              <Button
                type="submit"
                fullWidth
                isLoading={loading}
              >
                Send reset link
              </Button>
            </form>
          ) : (
            <div className="text-center py-4">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-success-100">
                <Mail className="h-6 w-6 text-success-600" />
              </div>
              <h3 className="mt-2 text-lg font-medium text-gray-900">Check your email</h3>
              <p className="mt-1 text-sm text-gray-500">
                We've sent a password reset link to <strong>{email}</strong>
              </p>
              <div className="mt-6">
                <Button
                  variant="outline"
                  onClick={() => setEmailSent(false)}
                >
                  Try another email
                </Button>
              </div>
            </div>
          )}

          <div className="mt-6 flex items-center justify-center">
            <div className="text-sm">
              <Link to="/login" className="font-medium text-primary-600 hover:text-primary-500 flex items-center">
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back to sign in
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;