import React from 'react';
import { X, Tag, RefreshCw, Plus } from 'lucide-react';
import Button from '../ui/Button';

interface GmailLabel {
  id: string;
  name: string;
  type?: string;
  color?: {
    backgroundColor: string;
    textColor: string;
  };
}

interface GmailLabelsModalProps {
  isOpen: boolean;
  onClose: () => void;
  labels: GmailLabel[];
  onRefreshLabels: () => void;
  onCreateAllLabels: () => void;
  isLoading: boolean;
  isCreating: boolean;
}

const GmailLabelsModal: React.FC<GmailLabelsModalProps> = ({ 
  isOpen, 
  onClose, 
  labels = [],
  onRefreshLabels,
  onCreateAllLabels,
  isLoading,
  isCreating
}) => {
  if (!isOpen) return null;

  // Filter to only show ecommva labels
  const ecommvaLabels = labels.filter(label => label.name.startsWith('ecommva/'));

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

        <div className="text-center mb-6">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-primary-100 mb-4">
            <Tag className="h-6 w-6 text-primary-600" />
          </div>
          
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Gmail Labels
          </h3>
          
          <p className="text-sm text-gray-600">
            Labels created by ecommva to categorize your emails in Gmail
          </p>
        </div>

        <div className="mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-2 gap-2">
            <h4 className="text-sm font-medium text-gray-700">Available Labels</h4>
            <div className="flex space-x-2">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={onRefreshLabels}
                leftIcon={<RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />}
                isLoading={isLoading}
              >
                Refresh
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={onCreateAllLabels}
                leftIcon={<Plus className="h-4 w-4" />}
                isLoading={isCreating}
              >
                Create All
              </Button>
            </div>
          </div>

          {isLoading || isCreating ? (
            <div className="flex justify-center items-center py-8">
              <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : ecommvaLabels.length > 0 ? (
            <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
              {ecommvaLabels.map((label) => (
                <div 
                  key={label.id} 
                  className="flex items-center p-2 border border-gray-200 rounded-md"
                >
                  <div 
                    className="w-4 h-4 rounded-full mr-3" 
                    style={{ 
                      backgroundColor: label.color?.backgroundColor || '#E0E0E0',
                    }}
                  ></div>
                  <div>
                    <span className="text-sm font-medium">{label.name.replace('ecommva/', '')}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 bg-gray-50 rounded-md">
              <p className="text-sm text-gray-500">
                No ecommva labels found in your Gmail account.
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Click "Create All" to create labels for all categories.
              </p>
            </div>
          )}
        </div>

        <div className="border-t border-gray-200 pt-4 flex justify-center">
          <Button onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};

export default GmailLabelsModal;