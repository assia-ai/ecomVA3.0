import React from 'react';
import { X, ExternalLink } from 'lucide-react';
import Button from '../ui/Button';
import { formatTimeAgo } from '../../lib/utils';
import type { EmailActivity } from '../../lib/collections';

interface EmailDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  email: EmailActivity;
}

const EmailDetailsModal: React.FC<EmailDetailsModalProps> = ({ isOpen, onClose, email }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm" 
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-2xl p-4 md:p-6 z-50 max-h-[90vh] overflow-y-auto">
        <div className="absolute right-4 top-4">
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 break-words">
              {email.subject}
            </h3>
            <p className="text-sm text-gray-500 break-words">
              From: {email.sender}
            </p>
            <p className="text-xs text-gray-400">
              {formatTimeAgo(email.timestamp)}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-800">
              {email.category}
            </span>
            <span className={`text-sm px-2.5 py-0.5 rounded-full ${
              email.status === 'draft_created' 
                ? 'bg-success-100 text-success-800' 
                : 'bg-gray-100 text-gray-800'
            }`}>
              {email.status === 'classified' && 'Classified'}
              {email.status === 'draft_created' && 'Draft Created'}
              {email.status === 'processed' && 'Processed'}
            </span>
          </div>

          {email.body && (
            <div className="mt-4 p-4 bg-gray-50 rounded-md">
              <p className="text-sm text-gray-700 whitespace-pre-wrap break-words">
                {email.body}
              </p>
            </div>
          )}

          {email.draftUrl && (
            <div className="mt-4">
              <Button
                variant="outline"
                onClick={() => window.open(email.draftUrl, '_blank')}
                rightIcon={<ExternalLink className="h-4 w-4" />}
              >
                View Draft Response
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmailDetailsModal;