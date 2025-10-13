// FIX: Replaced placeholder content with the NotificationContainer component implementation.
import React from 'react';
import { useNotification } from '../../contexts/NotificationContext';
import { CheckCircleIcon, XCircleIcon, InformationCircleIcon, XMarkIcon } from '@heroicons/react/24/solid';

const NotificationContainer: React.FC = () => {
  const { notifications, removeNotification } = useNotification();

  const iconMap = {
    success: <CheckCircleIcon className="h-6 w-6 text-green-500" aria-hidden="true" />,
    error: <XCircleIcon className="h-6 w-6 text-red-500" aria-hidden="true" />,
    info: <InformationCircleIcon className="h-6 w-6 text-blue-500" aria-hidden="true" />,
  };
  
  const bgMap = {
    success: 'bg-green-50',
    error: 'bg-red-50',
    info: 'bg-blue-50',
  }

  return (
    <div
      aria-live="assertive"
      className="fixed inset-0 flex items-end px-4 py-6 pointer-events-none sm:p-6 sm:items-start z-50"
    >
      <div className="w-full flex flex-col items-center space-y-4 sm:items-end">
        {notifications.map(notification => (
          <div
            key={notification.id}
            className={`max-w-sm w-full ${bgMap[notification.type]} shadow-lg rounded-lg pointer-events-auto ring-1 ring-black ring-opacity-5 overflow-hidden transition-all transform animate-fadeInUp`}
          >
            <div className="p-4">
              <div className="flex items-start">
                <div className="flex-shrink-0">{iconMap[notification.type]}</div>
                <div className="ml-3 w-0 flex-1 pt-0.5">
                  <p className="text-sm font-medium text-gray-900">{notification.message}</p>
                </div>
                <div className="ml-4 flex-shrink-0 flex">
                  <button
                    onClick={() => removeNotification(notification.id)}
                    className="inline-flex text-gray-400 rounded-md hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary"
                  >
                    <span className="sr-only">Close</span>
                    <XMarkIcon className="h-5 w-5" aria-hidden="true" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default NotificationContainer;
