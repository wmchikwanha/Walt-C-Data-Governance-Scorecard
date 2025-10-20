// FIX: Replaced placeholder content with the DepartmentHeadView component implementation.
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { api } from '../data';
import { Assessment, DimensionScore, ResponseValue, AssessmentTemplate } from '../types';
import { useAuth } from '../contexts/AuthContext';
import CircularScorecard from './assessment/CircularScorecard';
import QuestionPanel from './assessment/QuestionPanel';
import ProgressBar from './shared/ProgressBar';
import HistoricalView from './historical/HistoricalView';
import { useNotification } from '../contexts/NotificationContext';
import { exportAssessmentsToCsv } from '../lib/csv';
import { ArrowDownTrayIcon, ArrowPathIcon, ArrowUturnLeftIcon, SparklesIcon, ClockIcon, CheckIcon } from '@heroicons/react/24/solid';
import IncompleteSubmissionModal from './assessment/IncompleteSubmissionModal';
import ActionPlanModal from './assessment/ActionPlanModal';

const formatTime = (seconds: number): string => {
    const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const s = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
}

const DepartmentHeadView: React.FC = () => {
  const { user } = useAuth();
  const { addNotification } = useNotification();
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [initialAssessment, setInitialAssessment] = useState<Assessment | null>(null);
  const [template, setTemplate] = useState<AssessmentTemplate | null>(null);
  const [activeDimensionId, setActiveDimensionId] = useState<number>(1);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [isSubmissionModalOpen, setIsSubmissionModalOpen] = useState(false);
  const [isActionPlanModalOpen, setIsActionPlanModalOpen] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  
  // Timer state
  const [elapsedTime, setElapsedTime] = useState(0);
  const timerIntervalRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);

  const startTimer = useCallback((startTime: number) => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    startTimeRef.current = startTime;
    timerIntervalRef.current = window.setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
  }, []);

  useEffect(() => {
    // Start timer on load if it was already running
    if (assessment?.status === 'Draft') {
      const storedStartTime = localStorage.getItem(`assessmentStartTime_${assessment.id}`);
      if (storedStartTime) {
        startTimer(parseInt(storedStartTime, 10));
      }
    }
    // Cleanup timer on component unmount
    return () => {
        if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [assessment, startTimer]);


  const hasUnsavedChanges = useMemo(() => {
    if (!assessment || !initialAssessment) return false;
    // Compare scores as they are the primary editable content in this view
    return JSON.stringify(assessment.scores) !== JSON.stringify(initialAssessment.scores);
  }, [assessment, initialAssessment]);

  const fetchData = useCallback(() => {
    if (user?.departmentName) {
        if(hasUnsavedChanges && !window.confirm("You have unsaved changes which will be lost. Are you sure you want to refresh?")) {
            return;
        }
      setLoading(true);
      api.getAssessmentForDepartment(user.departmentName).then(async (data) => {
        if (assessment && data && assessment.status !== data.status && data.status === 'Draft') {
            addNotification({
                message: 'This assessment has been unlocked by management and can now be edited.',
                type: 'info',
            });
        }
        setAssessment(data);
        setInitialAssessment(data); // Keep a copy of the saved state
        if (data) {
            const templateData = await api.getTemplate(data.templateId);
            setTemplate(templateData);
        }
        setLoading(false);
      });
    }
  }, [user, assessment, addNotification, hasUnsavedChanges]);

  useEffect(() => {
    // Initial fetch without dependencies to run only once
    if (user?.departmentName) {
      setLoading(true);
      api.getAssessmentForDepartment(user.departmentName).then(async (data) => {
        setAssessment(data);
        setInitialAssessment(data); // Keep a copy of the saved state
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

      // Start timer on first interaction
      if (prev.status === 'Draft' && !localStorage.getItem(`assessmentStartTime_${prev.id}`)) {
          const now = Date.now();
          localStorage.setItem(`assessmentStartTime_${prev.id}`, now.toString());
          startTimer(now);
      }
      
      const newScores = prev.scores.map(s =>
        s.dimensionId === dimensionId ? { ...s, ...updates } : s
      );
      return { ...prev, scores: newScores };
    });
  }, [startTimer]);
  
  const handleDiscardChanges = useCallback(() => {
      if (window.confirm("Are you sure you want to discard your unsaved changes? This action cannot be undone.")) {
          setAssessment(initialAssessment);
          addNotification({ message: 'Unsaved changes have been discarded.', type: 'info' });
      }
  }, [initialAssessment, addNotification]);
  
    const handleAutoSave = useCallback(async () => {
    if (!assessment) return;

    setAutoSaveStatus('saving');
    const assessmentToSave = { ...assessment };

    try {
        const savedAssessmentResponse = await api.saveAssessment(assessmentToSave);
        
        // The response is the new source of truth for the saved state.
        setInitialAssessment(savedAssessmentResponse);
        
        // Update current assessment with new 'lastSaved' time without overwriting user edits during save
        setAssessment(currentAssessment => {
            if (!currentAssessment) return null;
            // If the state hasn't changed since we started saving, we can use the response directly.
            if (JSON.stringify(currentAssessment.scores) === JSON.stringify(assessmentToSave.scores)) {
                return savedAssessmentResponse;
            }
            // Otherwise, merge `lastSaved` into the current state.
            return { ...currentAssessment, lastSaved: savedAssessmentResponse.lastSaved };
        });
        
        setAutoSaveStatus('saved');
        setTimeout(() => setAutoSaveStatus('idle'), 3000); // Show 'saved' message for 3 seconds
    } catch (error) {
        console.error("Auto-save failed", error);
        setAutoSaveStatus('idle'); // Revert to idle on failure
        addNotification({ message: 'Auto-save failed. Please save manually.', type: 'error' });
    }
  }, [assessment, addNotification]);

  const autoSaveCallback = useRef(handleAutoSave);

  useEffect(() => {
    autoSaveCallback.current = handleAutoSave;
  }, [handleAutoSave]);

  useEffect(() => {
    if (assessment?.status === 'Draft' && hasUnsavedChanges) {
        const intervalId = setInterval(() => {
            autoSaveCallback.current();
        }, 60000); // 60 seconds

        return () => clearInterval(intervalId);
    }
  }, [hasUnsavedChanges, assessment?.status]);


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
    
    let duration: number | undefined = undefined;
    if (isSubmit && startTimeRef.current) {
        duration = Math.floor((Date.now() - startTimeRef.current) / 1000);
        if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
        localStorage.removeItem(`assessmentStartTime_${assessment.id}`);
        setElapsedTime(0);
    }

    const assessmentToSave: Assessment = {
        ...assessment,
        status: isSubmit ? 'Submitted' : 'Draft',
        submissionNotes: isSubmit ? (submissionNotes || assessment.submissionNotes) : undefined,
        duration: isSubmit ? duration : assessment.duration,
    };

    try {
      const savedAssessment = await api.saveAssessment(assessmentToSave);
      setAssessment(savedAssessment);
      setInitialAssessment(savedAssessment); // Update the base state on successful save
      addNotification({
        message: `Assessment ${isSubmit ? 'submitted' : 'saved'} successfully.`,
        type: 'success',
      });
      if (!isSubmit) {
          setJustSaved(true);
          setTimeout(() => setJustSaved(false), 2500);
      }
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
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-6">
        <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
                {assessment.departmentName} Scorecard - {assessment.period}
            </h1>
            <p className="text-gray-500 mt-1 flex items-center flex-wrap gap-x-2">
                <span>Status: <span className="font-semibold">{assessment.status}</span></span>
                <span className="hidden sm:inline">|</span>
                <span>Last saved: {new Date(assessment.lastSaved).toLocaleString()}</span>
                
                <span className="w-44 text-left">
                    {autoSaveStatus === 'saving' && (
                        <span className="text-sm text-gray-500 animate-pulse flex items-center">
                            <ArrowPathIcon className="h-4 w-4 mr-1 animate-spin" />
                            Auto-saving...
                        </span>
                    )}
                    {autoSaveStatus === 'saved' && (
                        <span className="text-sm text-green-600 animate-fadeIn flex items-center">
                            <CheckIcon className="h-4 w-4 mr-1" />
                            Progress auto-saved.
                        </span>
                    )}
                    {autoSaveStatus === 'idle' && hasUnsavedChanges && (
                        <span className="font-semibold text-amber-600 animate-fadeIn text-sm">
                        (unsaved changes)
                        </span>
                    )}
                </span>

                {elapsedTime > 0 && assessment.status === 'Draft' && (
                    <span className="flex items-center text-sm font-semibold text-gray-600 bg-gray-200 px-2 py-0.5 rounded-full animate-fadeIn">
                        <ClockIcon className="h-4 w-4 mr-1"/> {formatTime(elapsedTime)}
                    </span>
                )}
            </p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2 mt-4 sm:mt-0 sm:space-x-4 sm:flex-nowrap">
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
            <button
                onClick={() => setIsActionPlanModalOpen(true)}
                disabled={answeredQuestions === 0 || isSaving || isSubmitting}
                className="flex items-center px-4 py-2 bg-brand-secondary text-white font-semibold rounded-lg shadow-md hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-secondary disabled:bg-slate-400 disabled:cursor-not-allowed transition-transform active:scale-95"
                title={answeredQuestions === 0 ? "Answer some questions to generate a plan" : "Generate AI-powered action plan"}
            >
                <SparklesIcon className="h-5 w-5 mr-2" />
                Generate Plan
            </button>
            {assessment.status === 'Draft' && (
              <>
                {hasUnsavedChanges && (
                    <button onClick={handleDiscardChanges} disabled={isSaving || isSubmitting} className="flex items-center px-4 py-2 bg-white border border-status-red text-status-red font-semibold rounded-lg shadow-sm hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 transition-all active:scale-95">
                         <ArrowUturnLeftIcon className="h-5 w-5 mr-2" />
                         Discard Changes
                    </button>
                )}
                <button
                    onClick={() => handleSave(false)}
                    disabled={isSaving || isSubmitting || !hasUnsavedChanges || justSaved}
                    className={`px-4 py-2 font-semibold rounded-lg shadow-md transition-all disabled:bg-slate-400 disabled:cursor-not-allowed active:scale-95 ${
                        justSaved
                            ? 'bg-status-green text-white focus:ring-2 focus:ring-offset-2 focus:ring-green-500'
                            : 'bg-brand-primary text-white hover:bg-brand-secondary focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary'
                    }`}
                >
                    {isSaving ? (
                        'Saving...'
                    ) : justSaved ? (
                        <span className="flex items-center justify-center">
                            <CheckIcon className="h-5 w-5 mr-2" /> Saved!
                        </span>
                    ) : (
                        'Save Draft'
                    )}
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
       {assessment && template && (
        <ActionPlanModal
            isOpen={isActionPlanModalOpen}
            onClose={() => setIsActionPlanModalOpen(false)}
            assessment={assessment}
            template={template}
        />
       )}
    </div>
  );
};

export default DepartmentHeadView;