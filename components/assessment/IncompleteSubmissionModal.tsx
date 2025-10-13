import React, { useState } from 'react';
import Modal from '../shared/Modal';
import { ExclamationTriangleIcon } from '@heroicons/react/24/solid';

interface IncompleteSubmissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (reason: string) => void;
  isSubmitting: boolean;
}

const IncompleteSubmissionModal: React.FC<IncompleteSubmissionModalProps> = ({ isOpen, onClose, onSubmit, isSubmitting }) => {
  const [reason, setReason] = useState('');

  const handleSubmit = () => {
    if (reason.trim()) {
      onSubmit(reason);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Incomplete Assessment">
      <div className="flex flex-col items-center text-center">
        <ExclamationTriangleIcon className="h-12 w-12 text-status-amber mb-4" />
        <p className="text-lg font-semibold text-gray-800">
          This assessment has not been completed.
        </p>
        <p className="text-sm text-gray-600 mt-2">
          Are you sure you want to submit? If so, please provide a reason for the incomplete submission below.
        </p>
        <div className="w-full mt-6">
          <label htmlFor="submission-reason" className="block text-sm font-medium text-gray-700 text-left sr-only">
            Reason for incomplete submission
          </label>
          <textarea
            id="submission-reason"
            rows={4}
            className="block w-full shadow-sm sm:text-sm border-gray-300 rounded-md focus:ring-brand-primary focus:border-brand-primary"
            placeholder="Provide a reason why this assessment is being submitted incomplete..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </div>
        <div className="mt-6 flex justify-end w-full space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!reason.trim() || isSubmitting}
            className="px-4 py-2 bg-brand-primary text-white rounded-md hover:bg-brand-secondary disabled:bg-slate-400 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Submitting...' : 'Yes, Submit'}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default IncompleteSubmissionModal;
