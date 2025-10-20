// FIX: Replaced placeholder content with the SeniorManagementView component implementation.
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { api } from '../data';
import { Assessment, AssessmentTemplate, HeatmapData, ScoreAndColor, User, UserRole } from '../types';
import { getScoreAndColor } from '../constants';
import { calculateDimensionScore, calculateOverallAssessmentScore, comparePeriods } from '../lib/scoring';
import Heatmap from './dashboard/Heatmap';
import DepartmentDetailModal from './dashboard/DepartmentDetailModal';
import HistoricalView from './historical/HistoricalView';
import { useNotification } from '../contexts/NotificationContext';
import SearchBar from './shared/SearchBar';
import { useAuth } from '../contexts/AuthContext';
import Modal from './shared/Modal';
import { ExclamationTriangleIcon, ChevronDownIcon, ArrowDownTrayIcon, ShareIcon, PrinterIcon, Cog6ToothIcon } from '@heroicons/react/24/solid';
import { exportHeatmapToCsv } from '../lib/csv';
import MultiSelectDropdown from './shared/MultiSelectDropdown';
import CustomizeViewModal from './dashboard/CustomizeViewModal';
import VisualReport from './dashboard/VisualReport';

type ViewState = 'heatmap' | 'history';
type SortDirection = 'ascending' | 'descending';

// SendMessageModal Component (defined outside for stability)
interface SendMessageModalProps {
    isOpen: boolean;
    onClose: () => void;
    recipient: User | null;
    sender: User | null;
}

const SendMessageModal: React.FC<SendMessageModalProps> = ({ isOpen, onClose, recipient, sender }) => {
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');
    const [isSending, setIsSending] = useState(false);
    const { addNotification } = useNotification();

    useEffect(() => {
        if(recipient) {
            setSubject(`Regarding the Data Governance Assessment`);
        }
    }, [recipient]);


    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!recipient || !sender || !message.trim() || !subject.trim()) return;

        setIsSending(true);

        try {
            // 1. Create in-app notification
            await api.createNotification({
                userId: recipient.id,
                senderName: sender.name,
                subject,
                message,
            });

            // 2. Open email client
            const mailtoLink = `mailto:${recipient.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;
            window.location.href = mailtoLink;
            
            addNotification({ message: `In-app notification sent. Opening email client...`, type: 'success' });
            onClose();
            setMessage('');
            setSubject('');

        } catch (error) {
            addNotification({ message: 'Failed to send notification.', type: 'error' });
        } finally {
            setIsSending(false);
        }
    };

    if (!recipient) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Send Message to ${recipient.departmentName}`}>
            <form onSubmit={handleSend} className="space-y-4">
                <div className="p-3 bg-slate-100 rounded-md">
                    <p className="text-sm font-semibold text-gray-800">To: {recipient.name} ({recipient.email})</p>
                </div>
                 <div>
                    <label htmlFor="subject" className="block text-sm font-medium text-gray-700">Subject</label>
                    <input
                        type="text"
                        id="subject"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        required
                        className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md focus:ring-brand-primary focus:border-brand-primary"
                    />
                </div>
                <div>
                    <label htmlFor="message" className="block text-sm font-medium text-gray-700">Message</label>
                    <textarea
                        id="message"
                        rows={5}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        required
                        className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md focus:ring-brand-primary focus:border-brand-primary"
                        placeholder="Your message here..."
                    />
                </div>
                <div className="flex justify-end space-x-3 pt-2">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Cancel</button>
                    <button type="submit" disabled={isSending} className="px-4 py-2 bg-brand-primary text-white rounded-md hover:bg-brand-secondary disabled:bg-slate-400">
                        {isSending ? 'Sending...' : 'Send Message'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};


const SeniorManagementView: React.FC = () => {
    const { user } = useAuth();
    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [assessments, setAssessments] = useState<Assessment[]>([]);
    const [templates, setTemplates] = useState<AssessmentTemplate[]>([]);
    const [loading, setLoading] = useState(true);
    const [isUpdating, setIsUpdating] = useState(false);
    
    // Filtering and Sorting State
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [selectedPeriod, setSelectedPeriod] = useState('all');
    const [trendFilter, setTrendFilter] = useState('all');
    const [departmentFilter, setDepartmentFilter] = useState<string[]>([]);
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: SortDirection }>({ key: 'departmentName', direction: 'ascending' });
    const [assessmentToDelete, setAssessmentToDelete] = useState<Assessment | null>(null);

    // View Customization State
    const [isCustomizeModalOpen, setIsCustomizeModalOpen] = useState(false);
    const [visibleDimensions, setVisibleDimensions] = useState<string[]>([]);

    // New State
    const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
    const [messageRecipient, setMessageRecipient] = useState<User | null>(null);
    const [isReportsDropdownOpen, setIsReportsDropdownOpen] = useState(false);
    const [isVisualReportOpen, setIsVisualReportOpen] = useState(false);
    const [printableCsvHtml, setPrintableCsvHtml] = useState<string | null>(null);
    
    // State for direct editing
    const [editingRow, setEditingRow] = useState<HeatmapData | null>(null);
    const [editedScores, setEditedScores] = useState<Map<string, number>>(new Map());

    const reportsDropdownRef = useRef<HTMLDivElement>(null);

    const { addNotification } = useNotification();
    const [viewState, setViewState] = useState<ViewState>('heatmap');
    const [activeDepartment, setActiveDepartment] = useState<string | null>(null);

    const templateMap = useMemo(() => new Map(templates.map(t => [t.id, t])), [templates]);
    const masterTemplate = useMemo(() => templates[0], [templates]);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [assessmentData, templateData, userData] = await Promise.all([
                api.getAllAssessments(),
                api.getTemplates(),
                api.getUsers(),
            ]);
            setAssessments(assessmentData);
            setTemplates(templateData);
            setAllUsers(userData);
             if (templateData.length > 0 && user) {
                const storedPrefs = localStorage.getItem(`dashboard_prefs_${user.id}`);
                if (storedPrefs) {
                    setVisibleDimensions(JSON.parse(storedPrefs));
                } else {
                    // Default to all visible
                    setVisibleDimensions(templateData[0].dimensions.map(d => d.name));
                }
            }
        } catch (error) {
            addNotification({ message: 'Failed to load dashboard data.', type: 'error' });
        } finally {
            setLoading(false);
        }
    }, [addNotification, user]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);
    
     useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (reportsDropdownRef.current && !reportsDropdownRef.current.contains(event.target as Node)) {
                setIsReportsDropdownOpen(false);
            }
        };
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setIsReportsDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, []);

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
            const allDepartmentAssessments = departmentGroups[departmentName].sort((a, b) => comparePeriods(b.period, a.period));
            
            let assessmentForPeriod: Assessment | undefined;
            if (selectedPeriod === 'all') {
                assessmentForPeriod = allDepartmentAssessments[0]; // Latest first due to sort
            } else {
                assessmentForPeriod = allDepartmentAssessments.find(a => a.period === selectedPeriod);
            }

            if (!assessmentForPeriod) continue;

            const template = templateMap.get(assessmentForPeriod.templateId);
            const scores = new Map<string, ScoreAndColor>();
            if (template) {
                template.dimensions.forEach(dim => {
                    const dimScore = assessmentForPeriod.scores.find(s => s.dimensionId === dim.id);
                    const scoreValue = dimScore ? calculateDimensionScore(dimScore) : null;
                    scores.set(dim.name, getScoreAndColor(scoreValue));
                });
            }

            const historicalAssessmentsSorted = departmentGroups[departmentName].sort((a, b) => comparePeriods(a.period, b.period));
            const historicalOverallScores = historicalAssessmentsSorted.map(asm => calculateOverallAssessmentScore(asm.scores));
            
            let trend: 'improving' | 'declining' | 'stable' | 'new' = 'new';
            if (historicalOverallScores.length >= 2) {
                const latestScore = historicalOverallScores[historicalOverallScores.length - 1];
                const previousScore = historicalOverallScores[historicalOverallScores.length - 2];
                if (latestScore > previousScore) {
                    trend = 'improving';
                } else if (latestScore < previousScore) {
                    trend = 'declining';
                } else {
                    trend = 'stable';
                }
            }

            data.push({
                departmentName,
                assessmentId: assessmentForPeriod.id,
                status: assessmentForPeriod.status,
                scores,
                historicalOverallScores,
                overallScore: calculateOverallAssessmentScore(assessmentForPeriod.scores),
                trend,
            });
        }
        return data;
    }, [assessments, templateMap, selectedPeriod]);
    
    const availableDepartments = useMemo(() => {
        return [...new Set(heatmapData.map(d => d.departmentName))].sort();
    }, [heatmapData]);
    
    const filteredAndSortedData = useMemo(() => {
        let filteredData = [...heatmapData];

        if (departmentFilter.length > 0) {
            filteredData = filteredData.filter(d => departmentFilter.includes(d.departmentName));
        }

        if (statusFilter !== 'all') {
            filteredData = filteredData.filter(d => {
                if (statusFilter === 'needsAttention') return d.overallScore < 50;
                return d.status.toLowerCase() === statusFilter;
            });
        }
        
        if (trendFilter !== 'all') {
            filteredData = filteredData.filter(d => d.trend === trendFilter);
        }
        
        if (searchQuery) {
            filteredData = filteredData.filter(d => d.departmentName.toLowerCase().includes(searchQuery.toLowerCase()));
        }

        if (sortConfig.key) {
            filteredData.sort((a, b) => {
                const { key, direction } = sortConfig;
                let result = 0;

                if (key === 'departmentName') {
                    result = a.departmentName.localeCompare(b.departmentName);
                } else if (key === 'status') {
                    const statusOrder: Record<Assessment['status'], number> = {
                        'Draft': 0,
                        'Submitted': 1,
                        'Locked': 2,
                    };
                    result = statusOrder[a.status] - statusOrder[b.status];
                } else if (key === 'trend') {
                    const trendOrder: Record<HeatmapData['trend'], number> = {
                        improving: 0,
                        stable: 1,
                        new: 2,
                        declining: 3,
                    };
                    result = trendOrder[a.trend] - trendOrder[b.trend];
                } else if (key === 'overallScore') {
                    result = a.overallScore - b.overallScore;
                } else { // This handles dimension scores
                    const aValue = a.scores.get(key)?.score ?? -1;
                    const bValue = b.scores.get(key)?.score ?? -1;
                    result = aValue - bValue;
                }

                return direction === 'ascending' ? result : -result;
            });
        }
        return filteredData;
    }, [heatmapData, searchQuery, statusFilter, trendFilter, departmentFilter, sortConfig]);
    
    const displayDimensions = useMemo(() => {
        if (!masterTemplate) return [];
        return masterTemplate.dimensions.filter(d => visibleDimensions.includes(d.name));
    }, [masterTemplate, visibleDimensions]);
    
    const handleSort = useCallback((key: string) => {
        setSortConfig(prevConfig => {
            const isSameKey = prevConfig.key === key;
            const newDirection = isSameKey 
                ? (prevConfig.direction === 'ascending' ? 'descending' : 'ascending')
                : 'ascending';
            return { key, direction: newDirection };
        });
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

            // Create notification for department head
            const unlockedAssessment = assessments.find(a => a.id === assessmentId);
            if (unlockedAssessment) {
                const recipient = allUsers.find(u => u.departmentName === unlockedAssessment.departmentName);
                if (recipient) {
                    await api.createNotification({
                        userId: recipient.id,
                        senderName: user.name,
                        subject: 'Assessment Unlocked',
                        message: `The assessment for ${unlockedAssessment.departmentName} (${unlockedAssessment.period}) has been unlocked for editing.`
                    });
                    addNotification({ message: `Notification sent to ${recipient.name}.`, type: 'info' });
                }
            }
            
            fetchData();
        } catch (error) {
            addNotification({ message: 'Failed to unlock assessment.', type: 'error' });
        } finally {
            setIsUpdating(false);
        }
    }, [addNotification, fetchData, user, assessments, allUsers]);

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
// FIX: The `error` object from a catch block is of type `unknown`. Check if it's an instance of `Error` before accessing its `message` property to prevent a type error.
            const message = error instanceof Error ? error.message : 'Failed to delete assessment.';
            addNotification({ message, type: 'error' });
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
    
    const handleOpenMessageModal = (departmentName: string) => {
        const recipientUser = allUsers.find(u => u.departmentName === departmentName);
        if (recipientUser) {
            setMessageRecipient(recipientUser);
            setIsMessageModalOpen(true);
        } else {
            addNotification({ message: `Could not find a user for ${departmentName}.`, type: 'error' });
        }
    };

    const handleExport = () => {
        if (displayDimensions) {
            exportHeatmapToCsv(filteredAndSortedData, displayDimensions, `Data_Governance_Report_${new Date().toISOString().split('T')[0]}.csv`);
            addNotification({ message: 'CSV export started.', type: 'info' });
        }
    };
    
    const handleShare = async () => {
        if (displayDimensions) {
            const { content } = exportHeatmapToCsv(filteredAndSortedData, displayDimensions);
            const blob = new Blob([content], { type: 'text/csv' });
            const file = new File([blob], `Data_Governance_Report_${new Date().toISOString().split('T')[0]}.csv`, { type: 'text/csv' });

            if (navigator.share && navigator.canShare({ files: [file] })) {
                try {
                    await navigator.share({
                        title: 'Data Governance Report',
                        text: 'Here is the latest Data Governance report.',
                        files: [file],
                    });
                     addNotification({ message: 'Report shared successfully.', type: 'success' });
                } catch (error) {
                    // The Web Share API throws an "AbortError" if the user cancels the share dialog.
                    // This is not a true error, so we can ignore it and not show a notification.
                    if (error instanceof Error && error.name === 'AbortError') {
                        console.log('Share action was cancelled by the user.');
                    } else {
                        // For other errors, show a generic failure message.
                        addNotification({ message: 'Sharing failed.', type: 'error' });
                    }
                }
            } else {
                addNotification({ message: 'Web Share API not supported. Please export and share manually.', type: 'info' });
            }
        }
         setIsReportsDropdownOpen(false);
    };

    const handlePrintCsv = () => {
        if (!displayDimensions) return;
        const headers = ["Department", "Overall Score", ...displayDimensions.map(d => d.name)];
        let tableHtml = `<style> table { border-collapse: collapse; width: 100%; font-family: sans-serif; font-size: 12px; } th, td { border: 1px solid #ccc; padding: 8px; text-align: left; } th { background-color: #f2f2f2; } </style>`;
        tableHtml += `<h1>Data Governance Report - ${new Date().toLocaleDateString()}</h1>`;
        tableHtml += `<table><thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead><tbody>`;

        filteredAndSortedData.forEach(row => {
            tableHtml += `<tr>`;
            tableHtml += `<td>${row.departmentName}</td>`;
            tableHtml += `<td>${row.overallScore.toFixed(0)}%</td>`;
            displayDimensions.forEach(dim => {
                const score = row.scores.get(dim.name);
                tableHtml += `<td>${score && score.score !== 0 ? `${score.score.toFixed(0)}%` : 'N/A'}</td>`;
            });
            tableHtml += `</tr>`;
        });

        tableHtml += `</tbody></table>`;
        setPrintableCsvHtml(tableHtml);
        
        // Use a short timeout to allow state to update before printing
        setTimeout(() => {
            window.print();
            setPrintableCsvHtml(null); // Clean up after printing
        }, 100);

        setIsReportsDropdownOpen(false);
    };

    const handleEdit = useCallback((rowData: HeatmapData) => {
        setEditingRow(rowData);
        const initialScores = new Map<string, number>();
        rowData.scores.forEach((scoreInfo, dimName) => {
            initialScores.set(dimName, scoreInfo.score);
        });
        setEditedScores(initialScores);
    }, []);

    const handleCancelEdit = useCallback(() => {
        setEditingRow(null);
        setEditedScores(new Map());
    }, []);

    const handleScoreChange = useCallback((dimensionName: string, newScoreString: string) => {
        const newScore = newScoreString === '' ? 0 : parseInt(newScoreString, 10);
        if (!isNaN(newScore) && newScore >= 0 && newScore <= 100) {
            setEditedScores(prev => new Map(prev).set(dimensionName, newScore));
        } else if (newScoreString === '') {
            setEditedScores(prev => new Map(prev).set(dimensionName, 0));
        }
    }, []);

    const handleSaveEdit = useCallback(async () => {
        if (!editingRow) return;
        setIsUpdating(true);
        try {
            const originalAssessment = assessments.find(a => a.id === editingRow.assessmentId);
            if (!originalAssessment) throw new Error("Assessment not found");

            const template = templateMap.get(originalAssessment.templateId);
            if (!template) throw new Error("Template not found");
            
            const updatedAssessment: Assessment = JSON.parse(JSON.stringify(originalAssessment));
            const dimNameToId = new Map(template.dimensions.map(d => [d.name, d.id]));

            editedScores.forEach((newScore, dimName) => {
                const dimId = dimNameToId.get(dimName);
                if (dimId !== undefined) {
                    const dimScore = updatedAssessment.scores.find(s => s.dimensionId === dimId);
                    if (dimScore) {
                        dimScore.overriddenScore = newScore;
                    }
                }
            });
            
            await api.saveAssessment(updatedAssessment);
            addNotification({ message: `${editingRow.departmentName}'s scores updated.`, type: 'success' });
            
            handleCancelEdit();
            fetchData();
        } catch(error) {
            console.error("Failed to save overridden scores:", error);
            addNotification({ message: 'Failed to save scores.', type: 'error' });
        } finally {
            setIsUpdating(false);
        }
    }, [editingRow, editedScores, assessments, templateMap, addNotification, fetchData, handleCancelEdit]);
    
    const handleSaveCustomization = (newVisibleDimensions: string[]) => {
        if (user) {
            localStorage.setItem(`dashboard_prefs_${user.id}`, JSON.stringify(newVisibleDimensions));
            setVisibleDimensions(newVisibleDimensions);
            addNotification({ message: 'Dashboard view updated.', type: 'success' });
            setIsCustomizeModalOpen(false);
        }
    };

    const activeAssessment = activeDepartment ? assessments.find(a => a.departmentName === activeDepartment) : null;
    const activeTemplate = activeAssessment ? templateMap.get(activeAssessment.templateId) : null;

    if (viewState === 'history' && activeDepartment) {
        return <HistoricalView departmentName={activeDepartment} onBack={() => { setViewState('heatmap'); setActiveDepartment(null); }} backButtonText="Back to Dashboard" />;
    }

    if (isVisualReportOpen) {
        return <VisualReport data={filteredAndSortedData} onBack={() => setIsVisualReportOpen(false)} />;
    }

    const selectClass = "block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm rounded-md";

    return (
        <div className="container mx-auto p-4 sm:p-6 lg:p-8">
            {/* Hidden element for printing CSV */}
            {printableCsvHtml && (
                <div className="printable-area" dangerouslySetInnerHTML={{ __html: printableCsvHtml }} />
            )}

            <div className={`bg-white rounded-lg shadow-xl p-6 ${printableCsvHtml ? 'no-print' : 'printable-area'}`}>
                <div className="flex justify-between items-start no-print">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">Senior Management Dashboard</h1>
                        <p className="text-gray-500 mb-6">Overview of data governance maturity across all departments.</p>
                    </div>
                    <div className="flex items-center space-x-2">
                        <button
                            onClick={() => setIsCustomizeModalOpen(true)}
                            className="flex items-center px-4 py-2 bg-white border border-gray-300 text-gray-700 font-semibold rounded-lg shadow-sm hover:bg-gray-50"
                            aria-label="Customize dashboard view"
                        >
                           <Cog6ToothIcon className="h-5 w-5 mr-2 text-gray-500" /> Customize View
                        </button>
                         <button
                            onClick={handleExport}
                            className="flex items-center px-4 py-2 bg-white border border-gray-300 text-gray-700 font-semibold rounded-lg shadow-sm hover:bg-gray-50"
                            aria-label="Export current view to CSV"
                        >
                           <ArrowDownTrayIcon className="h-5 w-5 mr-2 text-gray-500" /> Export CSV
                        </button>
                        <div className="relative" ref={reportsDropdownRef}>
                            <button
                                onClick={() => setIsReportsDropdownOpen(prev => !prev)}
                                className="flex items-center px-4 py-2 bg-white border border-gray-300 text-gray-700 font-semibold rounded-lg shadow-sm hover:bg-gray-50"
                                aria-haspopup="true"
                                aria-expanded={isReportsDropdownOpen}
                                aria-label="Open reports menu"
                            >
                                Reports <ChevronDownIcon className="h-5 w-5 ml-2 text-gray-500"/>
                            </button>
                            {isReportsDropdownOpen && (
                                <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg border z-10 animate-fadeIn">
                                    <div className="py-1" role="menu" aria-orientation="vertical" aria-labelledby="reports-menu-button">
                                        <button onClick={handleShare} className="w-full text-left flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" role="menuitem"><ShareIcon className="h-5 w-5 mr-3"/>Share Report</button>
                                        <button onClick={handlePrintCsv} className="w-full text-left flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" role="menuitem"><PrinterIcon className="h-5 w-5 mr-3"/>Print Report (Table)</button>
                                        <button onClick={() => setIsVisualReportOpen(true)} className="w-full text-left flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" role="menuitem"><PrinterIcon className="h-5 w-5 mr-3"/>Generate Visual Report</button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6 p-4 bg-slate-50 rounded-lg border no-print">
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
                        <select id="period-filter" value={selectedPeriod} onChange={e => setSelectedPeriod(e.target.value)} className={selectClass}>
                            {availablePeriods.map(p => <option key={p} value={p}>{p === 'all' ? 'Latest Assessment' : p}</option>)}
                        </select>
                    </div>
                    <div>
                         <label htmlFor="trend-filter" className="block text-sm font-medium text-gray-700 mb-1">Score Trend</label>
                         <select id="trend-filter" value={trendFilter} onChange={e => setTrendFilter(e.target.value)} className={selectClass}>
                             <option value="all">All Trends</option>
                             <option value="improving">Improving</option>
                             <option value="declining">Declining</option>
                             <option value="stable">Stable</option>
                             <option value="new">New/Single Assessment</option>
                         </select>
                     </div>
                     <div>
                        <label htmlFor="department-filter" className="block text-sm font-medium text-gray-700 mb-1">Departments</label>
                        <MultiSelectDropdown
                            options={availableDepartments.map(d => ({ value: d, label: d }))}
                            selected={departmentFilter}
                            onChange={setDepartmentFilter}
                            placeholder="All Departments"
                        />
                    </div>
                </div>
                {loading ? (
                    <div className="text-center p-10">Loading dashboard data...</div>
                ) : (
                    <Heatmap
                        data={filteredAndSortedData}
                        dimensions={displayDimensions || []}
                        onSelectDepartment={handleSelectDepartment}
                        onLock={handleLock}
                        onUnlock={handleUnlock}
                        onDelete={handleRequestDelete}
                        onSendMessage={handleOpenMessageModal}
                        isUpdating={isUpdating}
                        sortConfig={sortConfig}
                        onSort={handleSort}
                        editingRow={editingRow}
                        editedScores={editedScores}
                        onEdit={handleEdit}
                        onCancelEdit={handleCancelEdit}
                        onScoreChange={handleScoreChange}
                        onSaveEdit={handleSaveEdit}
                        userRole={user!.role}
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
                        <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-red-500" aria-hidden="true" />
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
            <SendMessageModal 
                isOpen={isMessageModalOpen}
                onClose={() => setIsMessageModalOpen(false)}
                recipient={messageRecipient}
                sender={user}
            />
            {masterTemplate && (
                <CustomizeViewModal 
                    isOpen={isCustomizeModalOpen}
                    onClose={() => setIsCustomizeModalOpen(false)}
                    allDimensions={masterTemplate.dimensions}
                    visibleDimensions={visibleDimensions}
                    onSave={handleSaveCustomization}
                />
            )}
        </div>
    );
};

export default SeniorManagementView;