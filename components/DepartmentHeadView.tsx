// FIX: Replaced placeholder content with the DepartmentHeadView component implementation.
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { api } from '../data';
import { Assessment, DimensionScore, ResponseValue, AssessmentTemplate } from '../types';
import { useAuth } from '../contexts/AuthContext';
import CircularScorecard from './assessment/CircularScorecard';
import QuestionPanel from './assessment/QuestionPanel';
import ProgressBar from './shared/ProgressBar';
import HistoricalView from './historical/HistoricalView';
import { useNotification } from '../contexts/NotificationContext';
import { exportAssessmentsToCsv } from '../lib/csv';
import { ArrowDownTrayIcon, ArrowPathIcon } from '@heroicons/react/24/solid';
import IncompleteSubmissionModal from './assessment/IncompleteSubmissionModal';

const DepartmentHeadView: React.FC = () => {
  const { user } = useAuth();
  const { addNotification } = useNotification();
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [template, setTemplate] = useState<AssessmentTemplate | null>(null);
  const [activeDimensionId, setActiveDimensionId] = useState<number>(1);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [isSubmissionModalOpen, setIsSubmissionModalOpen] = useState(false);

  const fetchData = useCallback(() => {
    if (user?.departmentName) {
      setLoading(true);
      api.getAssessmentForDepartment(user.departmentName).then(async (data) => {
        if (assessment && data && assessment.status !== data.status && data.status === 'Draft') {
            addNotification({
                message: 'This assessment has been unlocked by management and can now be edited.',
                type: 'info',
            });
        }
        setAssessment(data);
        if (data) {
            const templateData = await api.getTemplate(data.templateId);
            setTemplate(templateData);
        }
        setLoading(false);
      });
    }
  }, [user, assessment, addNotification]);

  useEffect(() => {
    // Initial fetch without dependencies to run only once
    if (user?.departmentName) {
      setLoading(true);
      api.getAssessmentForDepartment(user.departmentName).then(async (data) => {
        setAssessment(data);
        if (data) {
            const templateData = await api.getTemplate(data.templateId);
            setTemplate(templateData);
        }
        setLoading(false);
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.departmentName]);

  const { totalQuestions, answeredQuestions } = useMemo(() => {
    if (!template) return { totalQuestions: 0, answeredQuestions: 0};
    const total = template.dimensions.reduce((sum, dim) => sum + dim.subQuestions.length, 0);
    const answered = assessment?.scores.reduce((sum, dimScore) => {
      return sum + dimScore.responses.filter(r => r.response !== ResponseValue.UNANSWERED).length;
    }, 0) ?? 0;
    return { totalQuestions: total, answeredQuestions: answered };
  }, [assessment, template]);

  const handleUpdate = useCallback((dimensionId: number, updates: Partial<DimensionScore>) => {
    setAssessment(prev => {
      if (!prev) return null;
      const newScores = prev.scores.map(s =>
        s.dimensionId === dimensionId ? { ...s, ...updates } : s
      );
      return { ...prev, scores: newScores, lastSaved: new Date().toISOString() };
    });
  }, []);

  const handleSave = useCallback(async (isSubmit = false, submissionNotes?: string) => {
    if (!assessment) return;

    if (isSubmit && answeredQuestions < totalQuestions && !submissionNotes) {
        setIsSubmissionModalOpen(true);
        return;
    }

    if (isSubmit) {
      setIsSubmitting(true);
    } else {
      setIsSaving(true);
    }
    
    const assessmentToSave: Assessment = {
        ...assessment,
        status: isSubmit ? 'Submitted' : 'Draft',
        submissionNotes: isSubmit ? (submissionNotes || assessment.submissionNotes) : undefined,
    };

    try {
      const savedAssessment = await api.saveAssessment(assessmentToSave);
      setAssessment(savedAssessment);
      addNotification({
        message: `Assessment ${isSubmit ? 'submitted' : 'saved'} successfully.`,
        type: 'success',
      });
    } catch (error) {
      addNotification({
        message: `Error ${isSubmit ? 'submitting' : 'saving'} assessment.`,
        type: 'error',
      });
      console.error(error);
    } finally {
        if(isSubmit) {
            setIsSubmitting(false);
            setIsSubmissionModalOpen(false);
        }
        else setIsSaving(false);
    }
  }, [assessment, addNotification, answeredQuestions, totalQuestions]);

  const handleExport = useCallback(() => {
    if (assessment && template) {
      exportAssessmentsToCsv([{assessment, template}], `${assessment.departmentName}_${assessment.period}_Assessment.csv`);
      addNotification({ message: 'Assessment export started.', type: 'info' });
    }
  }, [assessment, template, addNotification]);

  const dimensions = useMemo(() => template?.dimensions ?? [], [template]);

  const activeDimension = useMemo(() => dimensions.find(d => d.id === activeDimensionId), [activeDimensionId, dimensions]);
  const activeDimensionScore = useMemo(() => assessment?.scores.find(s => s.dimensionId === activeDimensionId), [assessment, activeDimensionId]);

  if (loading) {
    return <div className="text-center p-10">Loading assessment data...</div>;
  }

  if (showHistory) {
      return <HistoricalView departmentName={user!.departmentName!} onBack={() => setShowHistory(false)} />
  }

  if (!assessment || !user?.departmentName || !template) {
    return <div className="text-center p-10">No assessment found for your department: {user?.departmentName}.</div>;
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
            <h1 className="text-3xl font-bold text-gray-800">
                {assessment.departmentName} Scorecard - {assessment.period}
            </h1>
            <p className="text-gray-500 mt-1">Status: <span className="font-semibold">{assessment.status}</span> | Last saved: {new Date(assessment.lastSaved).toLocaleString()}</p>
        </div>
        <div className="flex items-center space-x-4">
             <button onClick={() => setShowHistory(true)} className="text-sm font-semibold text-brand-primary hover:underline transition-transform active:scale-95">
                View History
            </button>
            <button onClick={fetchData} className="px-4 py-2 bg-white border border-gray-300 text-gray-700 font-semibold rounded-lg shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary flex items-center transition-transform active:scale-95" title="Refresh assessment data">
                <ArrowPathIcon className={`h-5 w-5 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh Data
            </button>
            <button onClick={handleExport} className="px-4 py-2 bg-white border border-gray-300 text-gray-700 font-semibold rounded-lg shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary flex items-center transition-transform active:scale-95">
                <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
                Export
            </button>
            {assessment.status === 'Draft' && (
              <>
                <button onClick={() => handleSave(false)} disabled={isSaving || isSubmitting} className="px-4 py-2 bg-brand-primary text-white font-semibold rounded-lg shadow-md hover:bg-brand-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary disabled:bg-slate-400 transition-transform active:scale-95">
                    {isSaving ? 'Saving...' : 'Save Draft'}
                </button>
                <button onClick={() => handleSave(true)} disabled={isSubmitting || isSaving} className="px-4 py-2 bg-status-green text-white font-semibold rounded-lg shadow-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all disabled:bg-slate-400 disabled:cursor-not-allowed active:scale-95">
                    {isSubmitting ? 'Submitting...' : 'Submit Assessment'}
                </button>
              </>
            )}
        </div>
      </div>
      
      <div className="mb-8">
        <ProgressBar current={answeredQuestions} total={totalQuestions} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <CircularScorecard
            dimensions={dimensions}
            scores={assessment.scores}
            onSegmentClick={setActiveDimensionId}
            activeDimensionId={activeDimensionId}
            assessmentStatus={assessment.status}
          />
        </div>
        <div className="lg:col-span-2">
          {activeDimension && activeDimensionScore && (
            <QuestionPanel
              dimension={activeDimension}
              dimensionScore={activeDimensionScore}
              onUpdate={handleUpdate}
              status={assessment.status}
            />
          )}
        </div>
      </div>
       <IncompleteSubmissionModal
        isOpen={isSubmissionModalOpen}
        onClose={() => setIsSubmissionModalOpen(false)}
        onSubmit={(reason) => handleSave(true, reason)}
        isSubmitting={isSubmitting}
      />
    </div>
  );
};

export default DepartmentHeadView;