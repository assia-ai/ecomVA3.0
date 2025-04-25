import React from 'react';
import { X } from 'lucide-react';
import Button from '../ui/Button';

interface GmailSignInModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSignIn: () => void;
}

const GmailSignInModal: React.FC<GmailSignInModalProps> = ({ isOpen, onClose, onSignIn }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm" 
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md p-4 md:p-6 z-50">
        <div className="absolute right-4 top-4">
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="text-center">
          <img 
            src="https://upload.wikimedia.org/wikipedia/commons/7/7e/Gmail_icon_%282020%29.svg"
            alt="Gmail"
            className="w-16 h-16 mx-auto mb-4"
          />
          
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Connect Gmail Account
          </h3>
          
          <p className="text-sm text-gray-600 mb-6">
            Allow ecommva to access your Gmail account to automatically process customer emails and create draft responses.
          </p>

          <div className="space-y-4">
            <Button
              onClick={onSignIn}
              fullWidth
            >
              Sign in with Google
            </Button>
            
            <Button
              variant="ghost"
              onClick={onClose}
              fullWidth
            >
              Cancel
            </Button>
          </div>

          <p className="mt-4 text-xs text-gray-500">
            We'll never send emails without your review and approval
          </p>
        </div>
      </div>
    </div>
  );
};

export default GmailSignInModal;