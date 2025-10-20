import React, { useState } from 'react';
import { HeatmapData, Dimension, ScoreAndColor, UserRole } from '../../types';
import { ExclamationTriangleIcon, LockClosedIcon, LockOpenIcon, ChevronUpIcon, ChevronDownIcon, TrashIcon, ChatBubbleOvalLeftEllipsisIcon, ArrowTrendingUpIcon, ArrowTrendingDownIcon, MinusIcon, SparklesIcon, PencilIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/solid';
import Sparkline from './Sparkline';

type SortDirection = 'ascending' | 'descending';

interface SortConfig {
    key: string;
    direction: SortDirection;
}

interface HeatmapProps {
    data: HeatmapData[];
    dimensions: Dimension[];
    onSelectDepartment: (departmentName: string) => void;
    onLock: (assessmentId: string) => void;
    onUnlock: (assessmentId: string) => void;
    onDelete: (assessmentId: string) => void;
    onSendMessage: (departmentName: string) => void;
    isUpdating: boolean;
    sortConfig: SortConfig;
    onSort: (key: string) => void;
    editingRow: HeatmapData | null;
    editedScores: Map<string, number>;
    onEdit: (row: HeatmapData) => void;
    onCancelEdit: () => void;
    onScoreChange: (dimensionName: string, value: string) => void;
    onSaveEdit: () => void;
    userRole: UserRole;
}

const TrendIcon: React.FC<{ trend: 'improving' | 'declining' | 'stable' | 'new' }> = ({ trend }) => {
    switch (trend) {
        case 'improving':
            return <ArrowTrendingUpIcon className="h-5 w-5 text-green-500 flex-shrink-0" title="Score is improving" />;
        case 'declining':
            return <ArrowTrendingDownIcon className="h-5 w-5 text-red-500 flex-shrink-0" title="Score is declining" />;
        case 'stable':
            return <MinusIcon className="h-5 w-5 text-gray-500 flex-shrink-0" title="Score is stable" />;
        case 'new':
            return <SparklesIcon className="h-5 w-5 text-blue-400 flex-shrink-0" title="New department / single assessment" />;
        default:
            return null;
    }
};

const SortableHeader: React.FC<{
    sortKey: string;
    title: string;
    onSort: (key: string) => void;
    sortConfig: SortConfig;
    className?: string;
}> = ({ sortKey, title, onSort, sortConfig, className = '' }) => {
    const isSorted = sortConfig.key === sortKey;
    const Icon = sortConfig.direction === 'ascending' ? ChevronUpIcon : ChevronDownIcon;
    const shortTitle = title.split(' ').map(word => word[0]).join('');


    return (
        <th scope="col" className={`px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider ${className}`}>
            <button onClick={() => onSort(sortKey)} className="group inline-flex items-center space-x-1">
                <span className="print-hidden-text">{title}</span>
                <span className="print-visible-text hidden" aria-hidden="true">{shortTitle}</span>
                {isSorted ? <Icon className="h-4 w-4 flex-shrink-0 no-print" /> : <ChevronDownIcon className="h-4 w-4 opacity-0 group-hover:opacity-40 flex-shrink-0 no-print" />}
            </button>
        </th>
    );
};

const Heatmap: React.FC<HeatmapProps> = ({ data, dimensions, onSelectDepartment, onLock, onUnlock, onDelete, onSendMessage, isUpdating, sortConfig, onSort, editingRow, editedScores, onEdit, onCancelEdit, onScoreChange, onSaveEdit, userRole }) => {
    const [activeTooltip, setActiveTooltip] = useState<{ rowIndex: number; colIndex: number } | null>(null);
    const canManage = userRole === UserRole.SENIOR_MANAGEMENT || userRole === UserRole.ADMINISTRATOR;

    const statusStyles: Record<HeatmapData['status'], string> = {
        Draft: 'bg-amber-100 text-amber-800',
        Submitted: 'bg-blue-100 text-blue-800',
        Locked: 'bg-gray-200 text-gray-800',
    };

    return (
        <div>
            {/* Desktop Table View */}
            <div className="overflow-x-auto hidden md:block">
                <table className="min-w-full divide-y divide-gray-200 border">
                    <thead className="bg-slate-50">
                        <tr>
                            <SortableHeader sortKey="departmentName" title="Department" onSort={onSort} sortConfig={sortConfig} className="text-left sticky left-0 bg-slate-50 z-10 w-48" />
                            <SortableHeader sortKey="status" title="Status" onSort={onSort} sortConfig={sortConfig} className="text-left" />
                            <SortableHeader sortKey="trend" title="Trend" onSort={onSort} sortConfig={sortConfig} className="text-center" />
                            <SortableHeader sortKey="overallScore" title="Overall Trend" onSort={onSort} sortConfig={sortConfig} className="text-center w-32" />
                            {dimensions.map(dim => (
                                <SortableHeader key={dim.id} sortKey={dim.name} title={dim.name} onSort={onSort} sortConfig={sortConfig} className="text-center" />
                            ))}
                            <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider no-print">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {data.map((row, rowIndex) => {
                            const isEditing = editingRow?.departmentName === row.departmentName;
                            return (
                            <tr key={row.departmentName} className={`hover:bg-slate-50 ${isEditing ? 'bg-amber-50' : ''}`}>
                                <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 sticky left-0 z-10 ${isEditing ? 'bg-amber-50' : 'bg-white hover:bg-slate-50'}`}>
                                <div className="flex items-center space-x-2">
                                    {Array.from(row.scores.values()).some((s: ScoreAndColor) => s.colorClass === 'bg-status-red') && (
                                        <div title="This department has at least one dimension requiring attention.">
                                            <ExclamationTriangleIcon className="h-5 w-5 text-status-red flex-shrink-0" />
                                        </div>
                                    )}
                                    <button onClick={() => onSelectDepartment(row.departmentName)} className="text-brand-primary hover:underline font-bold text-left transition-transform active:scale-95">
                                        {row.departmentName}
                                    </button>
                                </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusStyles[row.status]}`}>
                                        {row.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex justify-center"><TrendIcon trend={row.trend} /></div>
                                </td>
                                <td className="px-6 py-4">
                                <div className="flex flex-col items-center justify-center">
                                    <Sparkline data={row.historicalOverallScores} />
                                    <span className="text-xs font-bold text-gray-700 mt-1">{row.overallScore.toFixed(0)}%</span>
                                </div>
                                </td>
                                {dimensions.map((dim, colIndex) => {
                                    const scoreInfo = row.scores.get(dim.name);
                                    return (
                                    <td key={colIndex} className="px-6 py-4 whitespace-nowrap text-center text-sm relative">
                                        {isEditing ? (
                                            <input
                                                type="number"
                                                min="0"
                                                max="100"
                                                value={editedScores.get(dim.name) ?? ''}
                                                onChange={(e) => onScoreChange(dim.name, e.target.value)}
                                                className="w-20 text-center border-gray-300 rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary"
                                                aria-label={`Score for ${dim.name}`}
                                            />
                                        ) : (
                                            scoreInfo ? (
                                                <>
                                                <button
                                                    type="button"
                                                    onClick={() => setActiveTooltip(prev => prev?.rowIndex === rowIndex && prev?.colIndex === colIndex ? null : { rowIndex, colIndex })}
                                                    className={`w-24 mx-auto text-white font-bold py-2 px-3 rounded-md ${scoreInfo.colorClass} ${scoreInfo.colorClass !== 'bg-slate-300' ? 'transition-transform hover:scale-105' : ''}`}
                                                    aria-haspopup="true"
                                                    aria-expanded={activeTooltip?.rowIndex === rowIndex && activeTooltip?.colIndex === colIndex}
                                                    aria-label={`Score for ${dim.name} for department ${row.departmentName}: ${scoreInfo.score.toFixed(0)}%. Click to view details.`}
                                                >
                                                    {scoreInfo.colorClass !== 'bg-slate-300' ? `${scoreInfo.score.toFixed(0)}%` : 'N/A'}
                                                </button>
                                                {activeTooltip && activeTooltip.rowIndex === rowIndex && activeTooltip.colIndex === colIndex && scoreInfo.colorClass !== 'bg-slate-300' && (
                                                    <div 
                                                        role="tooltip"
                                                        className="absolute z-20 bottom-full left-1/2 -translate-x-1/2 mb-2 w-max p-2 bg-gray-800 text-white text-xs rounded-md shadow-lg animate-fadeIn no-print"
                                                    >
                                                        <span className="font-bold">Score:</span> {scoreInfo.score.toFixed(1)}%<br/>
                                                        <span className="font-bold">Status:</span> {row.status}
                                                        <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-x-8 border-x-transparent border-t-8 border-t-gray-800"></div>
                                                    </div>
                                                )}
                                                </>
                                            ) : <span className="text-gray-400">N/A</span>
                                        )}
                                    </td>
                                )})}
                                <td className="px-4 py-4 whitespace-nowrap text-center text-sm font-medium no-print">
                                    <div className="flex items-center justify-center space-x-2">
                                        {isEditing ? (
                                            <>
                                                <button onClick={onSaveEdit} disabled={isUpdating} className="p-1 text-green-600 hover:text-green-800 disabled:text-gray-400" aria-label="Save scores"><CheckIcon className="h-6 w-6" /></button>
                                                <button onClick={onCancelEdit} disabled={isUpdating} className="p-1 text-red-600 hover:text-red-800 disabled:text-gray-400" aria-label="Cancel editing"><XMarkIcon className="h-6 w-6" /></button>
                                            </>
                                        ) : (
                                            <>
                                                <button onClick={() => onSendMessage(row.departmentName)} disabled={isUpdating} className="p-1 text-gray-500 hover:text-brand-primary disabled:text-gray-400" aria-label={`Send message to ${row.departmentName}`}><ChatBubbleOvalLeftEllipsisIcon className="h-6 w-6"/></button>
                                                {canManage && (
                                                    <>
                                                        <button onClick={() => onEdit(row)} disabled={isUpdating} className="p-1 text-gray-500 hover:text-brand-primary disabled:text-gray-400" aria-label={`Edit scores for ${row.departmentName}`}><PencilIcon className="h-5 w-5"/></button>
                                                        {row.status === 'Submitted' && (<button onClick={() => onLock(row.assessmentId)} disabled={isUpdating} className="p-1 text-gray-500 hover:text-gray-800 disabled:text-gray-400" aria-label={`Lock assessment for ${row.departmentName}`}><LockClosedIcon className="h-6 w-6"/></button>)}
                                                        {row.status === 'Locked' && (<button onClick={() => onUnlock(row.assessmentId)} disabled={isUpdating} className="p-1 text-status-green hover:text-green-800 disabled:text-gray-400" aria-label={`Unlock assessment for ${row.departmentName}`}><LockOpenIcon className="h-6 w-6"/></button>)}
                                                        <button onClick={() => onDelete(row.assessmentId)} disabled={isUpdating} className="p-1 text-status-red hover:text-red-700 disabled:text-gray-400" aria-label={`Delete assessment for ${row.departmentName}`}><TrashIcon className="h-6 w-6" /></button>
                                                    </>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        )})}
                        {data.length === 0 && (
                            <tr>
                                <td colSpan={dimensions.length + 6} className="text-center py-10 text-gray-500">
                                    No departments match the current filters.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-4">
                {data.map((row) => {
                    const isEditing = editingRow?.departmentName === row.departmentName;
                     return (
                     <div key={row.departmentName} className={`bg-white rounded-lg shadow p-4 border ${isEditing ? 'ring-2 ring-brand-primary' : ''}`}>
                        <div className="flex justify-between items-start">
                            <div className="flex items-center space-x-2 flex-grow min-w-0">
                                <TrendIcon trend={row.trend} />
                                {Array.from(row.scores.values()).some((s: ScoreAndColor) => s.colorClass === 'bg-status-red') && (
                                    <ExclamationTriangleIcon className="h-5 w-5 text-status-red flex-shrink-0" title="Needs attention" />
                                )}
                                <button onClick={() => onSelectDepartment(row.departmentName)} className="text-brand-primary hover:underline font-bold text-left transition-transform active:scale-95 truncate">
                                    {row.departmentName}
                                </button>
                            </div>
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusStyles[row.status]}`}>
                                {row.status}
                            </span>
                        </div>

                        <div className="flex items-center justify-between mt-3 py-3 border-y">
                            <span className="font-semibold text-gray-600 text-sm">Overall Trend</span>
                            <div className="flex flex-col items-end">
                                <Sparkline data={row.historicalOverallScores} />
                                <span className="text-sm font-bold text-gray-800 mt-1">{row.overallScore.toFixed(0)}%</span>
                            </div>
                        </div>

                        <div className="mt-3 space-y-2">
                             {dimensions.map(dim => {
                                const scoreInfo = row.scores.get(dim.name);
                                return (
                                    <div key={dim.id} className="flex justify-between items-center text-sm">
                                        <span className="text-gray-700 truncate pr-2">{dim.name}</span>
                                        {isEditing ? (
                                             <input type="number" min="0" max="100" value={editedScores.get(dim.name) ?? ''} onChange={(e) => onScoreChange(dim.name, e.target.value)} className="w-20 text-center border-gray-300 rounded-md shadow-sm text-sm py-1" aria-label={`Score for ${dim.name}`}/>
                                        ) : (
                                            scoreInfo ? (
                                                <div className={`font-bold py-1 px-2 rounded ${scoreInfo.colorClass} text-white text-xs`}>
                                                    {scoreInfo.colorClass !== 'bg-slate-300' ? `${scoreInfo.score.toFixed(0)}%` : 'N/A'}
                                                </div>
                                            ) : <span className="text-gray-400 text-xs">N/A</span>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                        
                        <div className="mt-4 pt-3 border-t flex justify-end items-center space-x-1">
                            {isEditing ? (
                                <>
                                    <button onClick={onSaveEdit} disabled={isUpdating} className="p-2 text-green-600 hover:text-green-800 disabled:text-gray-400" aria-label="Save scores"><CheckIcon className="h-5 w-5"/></button>
                                    <button onClick={onCancelEdit} disabled={isUpdating} className="p-2 text-red-600 hover:text-red-800 disabled:text-gray-400" aria-label="Cancel editing"><XMarkIcon className="h-5 w-5"/></button>
                                </>
                            ) : (
                                <>
                                    <button onClick={() => onSendMessage(row.departmentName)} disabled={isUpdating} className="p-2 text-gray-500 hover:text-brand-primary disabled:text-gray-400" aria-label={`Send message to ${row.departmentName}`}><ChatBubbleOvalLeftEllipsisIcon className="h-5 w-5"/></button>
                                    {canManage && (
                                    <>
                                        <button onClick={() => onEdit(row)} disabled={isUpdating} className="p-2 text-gray-500 hover:text-brand-primary disabled:text-gray-400" aria-label={`Edit scores for ${row.departmentName}`}><PencilIcon className="h-5 w-5"/></button>
                                        {row.status === 'Submitted' && (<button onClick={() => onLock(row.assessmentId)} disabled={isUpdating} className="p-2 text-gray-500 hover:text-gray-800 disabled:text-gray-400" aria-label={`Lock assessment for ${row.departmentName}`}><LockClosedIcon className="h-5 w-5"/></button>)}
                                        {row.status === 'Locked' && (<button onClick={() => onUnlock(row.assessmentId)} disabled={isUpdating} className="p-2 text-status-green hover:text-green-800 disabled:text-gray-400" aria-label={`Unlock assessment for ${row.departmentName}`}><LockOpenIcon className="h-5 w-5"/></button>)}
                                        <button onClick={() => onDelete(row.assessmentId)} disabled={isUpdating} className="p-2 text-status-red hover:text-red-700 disabled:text-gray-400" aria-label={`Delete assessment for ${row.departmentName}`}><TrashIcon className="h-5 w-5" /></button>
                                    </>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                )})}
                 {data.length === 0 && (
                    <div className="text-center py-10 text-gray-500">
                        No departments match the current filters.
                    </div>
                )}
            </div>
        </div>
    );
};

export default Heatmap;