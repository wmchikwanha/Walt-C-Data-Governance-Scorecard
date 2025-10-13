import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { api } from '../../data';
import { Assessment, AssessmentTemplate, ChangeLogEntry } from '../../types';
import ComparisonView from './ComparisonView';
import ChangelogView from './ChangelogView';
import { ArrowLeftIcon, ArrowDownTrayIcon } from '@heroicons/react/24/solid';
import { useNotification } from '../../contexts/NotificationContext';
import { exportAssessmentsToCsv } from '../../lib/csv';
import SearchBar from '../shared/SearchBar';

interface HistoricalViewProps {
  departmentName: string;
  onBack: () => void;
  backButtonText?: string;
}

const HistoricalView: React.FC<HistoricalViewProps> = ({ departmentName, onBack, backButtonText = "Back" }) => {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [templates, setTemplates] = useState<AssessmentTemplate[]>([]);
  const [changelog, setChangelog] = useState<ChangeLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'comparison' | 'changelog'>('comparison');
  const [searchQuery, setSearchQuery] = useState('');
  const { addNotification } = useNotification();
  
  const templateMap = useMemo(() => new Map(templates.map(t => [t.id, t])), [templates]);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.getAssessmentHistoryForDepartment(departmentName),
      api.getChangelogForDepartment(departmentName),
      api.getTemplates()
    ]).then(([assessmentHistory, changelogData, templateData]) => {
      setAssessments(assessmentHistory);
      setChangelog(changelogData);
      setTemplates(templateData);
      setLoading(false);
    });
  }, [departmentName]);
  
  const assessmentsWithTemplates = useMemo(() => {
    return assessments
      .map(assessment => ({
        assessment,
        template: templateMap.get(assessment.templateId),
      }))
      .filter(item => item.template);
  }, [assessments, templateMap]);


  const handleExportHistory = useCallback(() => {
    if (assessmentsWithTemplates.length > 0) {
      exportAssessmentsToCsv(assessmentsWithTemplates as any, `${departmentName}_Assessment_History.csv`);
      addNotification({ message: 'Assessment history export started.', type: 'info' });
    }
  }, [assessmentsWithTemplates, departmentName, addNotification]);

  const filteredAssessments = useMemo(() => {
    if (!searchQuery) return assessments;
    return assessments.filter(a => a.period.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [assessments, searchQuery]);

  const filteredChangelog = useMemo(() => {
    if (!searchQuery) return changelog;
    const lowerCaseQuery = searchQuery.toLowerCase();
    return changelog.filter(c => 
        c.changeDescription.toLowerCase().includes(lowerCaseQuery) ||
        c.user.toLowerCase().includes(lowerCaseQuery) ||
        c.period.toLowerCase().includes(lowerCaseQuery)
    );
  }, [changelog, searchQuery]);
  
  const renderContent = () => {
    if (loading) {
      return <div className="text-center p-10">Loading historical data...</div>;
    }
    if (view === 'comparison') {
        return <ComparisonView assessmentsWithTemplates={assessmentsWithTemplates as any} onShowChangelog={() => setView('changelog')}/>;
    }
    return <ChangelogView changelog={filteredChangelog} />;
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
        <div className="bg-white rounded-lg shadow-xl p-6">
            <div className="flex justify-between items-center mb-4 pb-4 border-b">
                <button onClick={onBack} className="flex items-center text-sm font-semibold text-brand-primary hover:underline">
                    <ArrowLeftIcon className="h-4 w-4 mr-1"/>
                    {backButtonText}
                </button>
                <h1 className="text-2xl font-bold text-gray-800">
                    Assessment History: {departmentName}
                </h1>
                <div className="flex items-center space-x-4"> 
                    {view === 'changelog' && (
                         <button onClick={() => setView('comparison')} className="text-sm font-semibold text-brand-primary hover:underline">
                            View Comparison
                        </button>
                    )}
                    <button 
                        onClick={handleExportHistory} 
                        disabled={assessments.length === 0} 
                        className="flex items-center px-3 py-2 text-sm bg-white border border-gray-300 text-gray-700 font-semibold rounded-lg shadow-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        title={assessments.length === 0 ? "No history to export" : "Export history to CSV"}
                    >
                        <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                        Export History
                    </button>
                </div>
            </div>
             <div className="my-6">
                <SearchBar
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by period, user or keyword..."
                    className="max-w-md"
                />
            </div>
            {renderContent()}
        </div>
    </div>
  );
};

export default HistoricalView;