// FIX: Replaced placeholder content with the SeniorManagementView component implementation.
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { api } from '../data';
import { Assessment, AssessmentTemplate, HeatmapData, ScoreAndColor } from '../types';
import { getScoreAndColor } from '../constants';
import { calculateDimensionScore, calculateOverallAssessmentScore, comparePeriods } from '../lib/scoring';
import Heatmap from './dashboard/Heatmap';
import DepartmentDetailModal from './dashboard/DepartmentDetailModal';
import HistoricalView from './historical/HistoricalView';
import { useNotification } from '../contexts/NotificationContext';
import SearchBar from './shared/SearchBar';
import { useAuth } from '../contexts/AuthContext';
import Modal from './shared/Modal';
import { ExclamationTriangleIcon } from '@heroicons/react/24/solid';

type ViewState = 'heatmap' | 'history';
type SortDirection = 'ascending' | 'descending';

const SeniorManagementView: React.FC = () => {
    const { user } = useAuth();
    const [assessments, setAssessments] = useState<Assessment[]>([]);
    const [templates, setTemplates] = useState<AssessmentTemplate[]>([]);
    const [loading, setLoading] = useState(true);
    const [isUpdating, setIsUpdating] = useState(false);
    
    // Filtering and Sorting State
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [periodFilter, setPeriodFilter] = useState('all');
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: SortDirection }>({ key: 'departmentName', direction: 'ascending' });
    const [assessmentToDelete, setAssessmentToDelete] = useState<Assessment | null>(null);

    const { addNotification } = useNotification();
    const [viewState, setViewState] = useState<ViewState>('heatmap');
    const [activeDepartment, setActiveDepartment] = useState<string | null>(null);

    const templateMap = useMemo(() => new Map(templates.map(t => [t.id, t])), [templates]);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [assessmentData, templateData] = await Promise.all([
                api.getAllAssessments(),
                api.getTemplates(),
            ]);
            setAssessments(assessmentData);
            setTemplates(templateData);
        } catch (error) {
            addNotification({ message: 'Failed to load dashboard data.', type: 'error' });
        } finally {
            setLoading(false);
        }
    }, [addNotification]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const availablePeriods = useMemo(() => {
        const periods = new Set(assessments.map(a => a.period));
        return ['all', ...Array.from(periods).sort((a,b) => comparePeriods(b, a))];
    }, [assessments]);

    const heatmapData = useMemo<HeatmapData[]>(() => {
        const departmentGroups: { [key: string]: Assessment[] } = {};
        assessments.forEach(a => {
            if (!departmentGroups[a.departmentName]) departmentGroups[a.departmentName] = [];
            departmentGroups[a.departmentName].push(a);
        });

        const data: HeatmapData[] = [];

        for (const departmentName in departmentGroups) {
            // FIX: Wrap `comparePeriods` in a lambda to sort by the `period` property of the `Assessment` objects.
            const allDepartmentAssessments = departmentGroups[departmentName].sort((a, b) => comparePeriods(a.period, b.period));
            
            let assessmentForPeriod: Assessment | undefined;
            if (periodFilter === 'all') {
                assessmentForPeriod = allDepartmentAssessments[allDepartmentAssessments.length - 1];
            } else {
                assessmentForPeriod = allDepartmentAssessments.find(a => a.period === periodFilter);
            }

            if (!assessmentForPeriod) continue;

            const template = templateMap.get(assessmentForPeriod.templateId);
            const scores = new Map<string, ScoreAndColor>();
            if (template) {
                template.dimensions.forEach(dim => {
                    const dimScore = assessmentForPeriod.scores.find(s => s.dimensionId === dim.id);
                    const scoreValue = dimScore ? calculateDimensionScore(dimScore.responses) : null;
                    scores.set(dim.name, getScoreAndColor(scoreValue));
                });
            }

            const historicalOverallScores = allDepartmentAssessments.map(asm => calculateOverallAssessmentScore(asm.scores));

            data.push({
                departmentName,
                assessmentId: assessmentForPeriod.id,
                status: assessmentForPeriod.status,
                scores,
                historicalOverallScores,
                overallScore: calculateOverallAssessmentScore(assessmentForPeriod.scores),
            });
        }
        return data;
    }, [assessments, templateMap, periodFilter]);
    
    const filteredAndSortedData = useMemo(() => {
        let filteredData = [...heatmapData];

        if (statusFilter !== 'all') {
            filteredData = filteredData.filter(d => {
                if (statusFilter === 'needsAttention') return d.overallScore < 50;
                return d.status.toLowerCase() === statusFilter;
            });
        }
        
        if (searchQuery) {
            filteredData = filteredData.filter(d => d.departmentName.toLowerCase().includes(searchQuery.toLowerCase()));
        }

        if (sortConfig.key) {
            filteredData.sort((a, b) => {
                let aValue: string | number;
                let bValue: string | number;

                if (sortConfig.key === 'departmentName') {
                    aValue = a.departmentName;
                    bValue = b.departmentName;
                } else if (sortConfig.key === 'overallScore') {
                    aValue = a.overallScore;
                    bValue = b.overallScore;
                } else {
                    aValue = a.scores.get(sortConfig.key)?.score ?? -1;
                    bValue = b.scores.get(sortConfig.key)?.score ?? -1;
                }

                if (aValue < bValue) return sortConfig.direction === 'ascending' ? -1 : 1;
                if (aValue > bValue) return sortConfig.direction === 'ascending' ? 1 : -1;
                return 0;
            });
        }
        return filteredData;
    }, [heatmapData, searchQuery, statusFilter, sortConfig]);

    const handleSort = useCallback((key: string) => {
        setSortConfig(prevConfig => ({
            key,
            direction: prevConfig.key === key && prevConfig.direction === 'ascending' ? 'descending' : 'ascending',
        }));
    }, []);

    const handleLock = useCallback(async (assessmentId: string) => {
        if (!user) return;
        setIsUpdating(true);
        try {
            await api.lockAssessment(assessmentId, user.name);
            addNotification({ message: 'Assessment locked.', type: 'success' });
            fetchData();
        } catch (error) {
            addNotification({ message: 'Failed to lock assessment.', type: 'error' });
        } finally {
            setIsUpdating(false);
        }
    }, [addNotification, fetchData, user]);

    const handleUnlock = useCallback(async (assessmentId: string) => {
        if (!user) return;
        setIsUpdating(true);
        try {
            await api.unlockAssessment(assessmentId, user.name);
            addNotification({ message: 'Assessment unlocked.', type: 'success' });
            fetchData();
        } catch (error) {
            addNotification({ message: 'Failed to unlock assessment.', type: 'error' });
        } finally {
            setIsUpdating(false);
        }
    }, [addNotification, fetchData, user]);

    const handleRequestDelete = (assessmentId: string) => {
        const toDelete = assessments.find(a => a.id === assessmentId);
        if (toDelete) {
            setAssessmentToDelete(toDelete);
        }
    };

    const handleConfirmDelete = async () => {
        if (!assessmentToDelete || !user) return;

        setIsUpdating(true);
        try {
            await api.deleteAssessment(assessmentToDelete.id, user.name);
            addNotification({ message: 'Assessment deleted successfully.', type: 'success' });
            setAssessmentToDelete(null);
            fetchData();
        } catch (error) {
            addNotification({ message: 'Failed to delete assessment.', type: 'error' });
        } finally {
            setIsUpdating(false);
        }
    };
    
    const handleCancelDelete = () => {
        setAssessmentToDelete(null);
    };

    const handleSelectDepartment = (departmentName: string) => setActiveDepartment(departmentName);
    const handleCloseModal = () => setActiveDepartment(null);
    const handleViewHistory = (departmentName: string) => {
        setActiveDepartment(departmentName);
        setViewState('history');
    };

    const activeAssessment = activeDepartment ? assessments.find(a => a.departmentName === activeDepartment) : null;
    const activeTemplate = activeAssessment ? templateMap.get(activeAssessment.templateId) : null;
    const masterTemplate = templates[0];

    if (viewState === 'history' && activeDepartment) {
        return <HistoricalView departmentName={activeDepartment} onBack={() => { setViewState('heatmap'); setActiveDepartment(null); }} backButtonText="Back to Dashboard" />;
    }

    const selectClass = "block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm rounded-md";

    return (
        <div className="container mx-auto p-4 sm:p-6 lg:p-8">
            <div className="bg-white rounded-lg shadow-xl p-6">
                <h1 className="text-3xl font-bold text-gray-800 mb-2">Senior Management Dashboard</h1>
                <p className="text-gray-500 mb-6">Overview of data governance maturity across all departments.</p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 p-4 bg-slate-50 rounded-lg border">
                    <SearchBar
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search departments..."
                    />
                    <div>
                        <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                        <select id="status-filter" value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className={selectClass}>
                            <option value="all">All Statuses</option>
                            <option value="needsAttention">Needs Attention (&lt;50%)</option>
                            <option value="draft">Draft</option>
                            <option value="submitted">Submitted</option>
                            <option value="locked">Locked</option>
                        </select>
                    </div>
                    <div>
                        <label htmlFor="period-filter" className="block text-sm font-medium text-gray-700 mb-1">Period</label>
                        <select id="period-filter" value={periodFilter} onChange={e => setPeriodFilter(e.target.value)} className={selectClass}>
                            {availablePeriods.map(p => <option key={p} value={p}>{p === 'all' ? 'Latest Assessment' : p}</option>)}
                        </select>
                    </div>
                </div>
                {loading ? (
                    <div className="text-center p-10">Loading dashboard data...</div>
                ) : (
                    <Heatmap
                        data={filteredAndSortedData}
                        dimensions={masterTemplate?.dimensions || []}
                        onSelectDepartment={handleSelectDepartment}
                        onLock={handleLock}
                        onUnlock={handleUnlock}
                        onDelete={handleRequestDelete}
                        isUpdating={isUpdating}
                        sortConfig={sortConfig}
                        onSort={handleSort}
                    />
                )}
            </div>
            {activeAssessment && (
                 <DepartmentDetailModal
                    isOpen={!!activeDepartment && viewState === 'heatmap'}
                    onClose={handleCloseModal}
                    assessment={activeAssessment}
                    template={activeTemplate || null}
                    onViewHistory={handleViewHistory}
                />
            )}
            {assessmentToDelete && (
                <Modal
                    isOpen={!!assessmentToDelete}
                    onClose={handleCancelDelete}
                    title="Confirm Deletion"
                >
                    <div className="text-center">
                        <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-red-500" />
                        <h3 className="mt-2 text-lg font-medium text-gray-900">
                            Are you sure?
                        </h3>
                        <div className="mt-2 text-sm text-gray-500">
                            <p>
                                You are about to permanently delete the assessment for{' '}
                                <strong>{assessmentToDelete.departmentName} - {assessmentToDelete.period}</strong>.
                            </p>
                            <p className="font-semibold mt-2">This action cannot be undone.</p>
                        </div>
                        <div className="mt-6 flex justify-center space-x-4">
                            <button
                                type="button"
                                onClick={handleCancelDelete}
                                className="px-4 py-2 bg-white border border-gray-300 text-gray-700 font-semibold rounded-lg shadow-sm hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleConfirmDelete}
                                disabled={isUpdating}
                                className="px-4 py-2 bg-red-600 text-white font-semibold rounded-lg shadow-md hover:bg-red-700 disabled:bg-slate-400"
                            >
                                {isUpdating ? 'Deleting...' : 'Delete Assessment'}
                            </button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
};

export default SeniorManagementView;