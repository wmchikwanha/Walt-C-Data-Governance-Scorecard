import React from 'react';
import { Assessment, AssessmentTemplate } from '../../types';
import Modal from '../shared/Modal';
import { getScoreAndColor } from '../../constants';
import { calculateDimensionScore } from '../../lib/scoring';
import { ArrowRightIcon, ExclamationTriangleIcon } from '@heroicons/react/24/solid';

interface DepartmentDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  assessment: Assessment | null;
  template: AssessmentTemplate | null;
  onViewHistory: (departmentName: string) => void;
}

const DepartmentDetailModal: React.FC<DepartmentDetailModalProps> = ({ isOpen, onClose, assessment, template, onViewHistory }) => {
  if (!assessment || !template) return null;

  const dimensionDetails = template.dimensions.map(dim => {
    const dimScoreData = assessment.scores.find(s => s.dimensionId === dim.id);
    const score = dimScoreData ? calculateDimensionScore(dimScoreData) : null;
    const { colorClass } = getScoreAndColor(score);
    return {
      name: dim.name,
      score: score,
      colorClass: colorClass,
      comments: dimScoreData?.comments
    };
  });

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`${assessment.departmentName} - ${assessment.period} Details`}
    >
      <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
        {assessment.submissionNotes && (
            <div className="p-3 bg-amber-50 rounded-lg border border-amber-300 animate-fadeInUp">
                <div className="flex items-start">
                    <ExclamationTriangleIcon className="h-5 w-5 text-amber-500 mr-3 flex-shrink-0 mt-0.5" />
                    <div>
                        <h4 className="font-semibold text-amber-800">Incomplete Submission</h4>
                        <p className="mt-1 text-sm text-amber-700 italic">
                            "{assessment.submissionNotes}"
                        </p>
                    </div>
                </div>
            </div>
        )}
        {dimensionDetails.map(detail => (
          <div key={detail.name} className="p-3 bg-slate-50 rounded-lg animate-fadeInUp">
            <div className="flex justify-between items-center">
              <h4 className="font-semibold text-gray-800">{detail.name}</h4>
              <span className={`text-sm font-bold px-2 py-1 rounded ${detail.colorClass} text-white`}>
                {detail.score !== null ? `${detail.score.toFixed(0)}%` : 'N/A'}
              </span>
            </div>
            {detail.comments && (
                <p className="mt-2 text-sm text-gray-600 italic border-l-2 border-slate-300 pl-2">
                    {detail.comments}
                </p>
            )}
          </div>
        ))}
      </div>
      <div className="mt-6 pt-4 border-t flex justify-end">
        <button
          onClick={() => onViewHistory(assessment.departmentName)}
          className="inline-flex items-center text-sm font-semibold text-brand-primary hover:underline"
        >
          View Full History & Changelog
          <ArrowRightIcon className="h-4 w-4 ml-1" />
        </button>
      </div>
    </Modal>
  );
};

export default DepartmentDetailModal;