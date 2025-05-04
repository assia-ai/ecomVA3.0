import React from 'react';
import { useTranslation } from 'react-i18next';

type StatusBadgeProps = {
  status: string;
};

const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const { t } = useTranslation();
  
  const getStatusConfig = () => {
    switch (status) {
      case 'processed':
        return { className: 'bg-blue-100 text-blue-800', label: t('activity.status.processed') };
      case 'drafted':
        return { className: 'bg-yellow-100 text-yellow-800', label: t('activity.status.drafted') };
      case 'sent':
        return { className: 'bg-green-100 text-green-800', label: t('activity.status.sent') };
      case 'failed':
        return { className: 'bg-red-100 text-red-800', label: t('activity.status.failed') };
      case 'ignored':
        return { className: 'bg-gray-100 text-gray-800', label: t('activity.status.ignored') };
      default:
        return { className: 'bg-gray-100 text-gray-800', label: status };
    }
  };

  const { className, label } = getStatusConfig();
  
  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${className}`}>
      {label}
    </span>
  );
};

export default StatusBadge;