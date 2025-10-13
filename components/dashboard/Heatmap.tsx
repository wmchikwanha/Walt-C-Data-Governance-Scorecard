import React, { useState } from 'react';
import { HeatmapData, Dimension, ScoreAndColor } from '../../types';
import { ExclamationTriangleIcon, LockClosedIcon, LockOpenIcon, ChevronUpIcon, ChevronDownIcon, TrashIcon } from '@heroicons/react/24/solid';
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
    isUpdating: boolean;
    sortConfig: SortConfig;
    onSort: (key: string) => void;
}

const SortableHeader: React.FC<{
    sortKey: string;
    title: string;
    onSort: (key: string) => void;
    sortConfig: SortConfig;
    className?: string;
}> = ({ sortKey, title, onSort, sortConfig, className = '' }) => {
    const isSorted = sortConfig.key === sortKey;
    const Icon = sortConfig.direction === 'ascending' ? ChevronUpIcon : ChevronDownIcon;

    return (
        <th scope="col" className={`px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider ${className}`}>
            <button onClick={() => onSort(sortKey)} className="group inline-flex items-center space-x-1">
                <span>{title}</span>
                {isSorted ? <Icon className="h-4 w-4 flex-shrink-0" /> : <ChevronDownIcon className="h-4 w-4 opacity-0 group-hover:opacity-40 flex-shrink-0" />}
            </button>
        </th>
    );
};

const Heatmap: React.FC<HeatmapProps> = ({ data, dimensions, onSelectDepartment, onLock, onUnlock, onDelete, isUpdating, sortConfig, onSort }) => {
    const [activeTooltip, setActiveTooltip] = useState<{ rowIndex: number; colIndex: number } | null>(null);

    return (
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 border">
                <thead className="bg-slate-50">
                    <tr>
                        <SortableHeader sortKey="departmentName" title="Department" onSort={onSort} sortConfig={sortConfig} className="text-left sticky left-0 bg-slate-50 z-10 w-48" />
                        <SortableHeader sortKey="overallScore" title="Overall Trend" onSort={onSort} sortConfig={sortConfig} className="text-center w-32" />
                        {dimensions.map(dim => (
                             <SortableHeader key={dim.id} sortKey={dim.name} title={dim.name} onSort={onSort} sortConfig={sortConfig} className="text-center" />
                        ))}
                        <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {data.map((row, rowIndex) => (
                        <tr key={row.departmentName} className="hover:bg-slate-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 sticky left-0 bg-white hover:bg-slate-50 z-10">
                               <div className="flex items-center space-x-2">
                                 {Array.from(row.scores.values()).some((s: ScoreAndColor) => s.colorClass === 'bg-status-red') && (
                                     <div title="This department has at least one dimension requiring attention.">
                                        <ExclamationTriangleIcon className="h-5 w-5 text-status-red flex-shrink-0" />
                                     </div>
                                 )}
                                 {row.status === 'Locked' && (
                                     <div title="This assessment is locked.">
                                        <LockClosedIcon className="h-5 w-5 text-gray-500 flex-shrink-0" />
                                     </div>
                                 )}
                                 <button onClick={() => onSelectDepartment(row.departmentName)} className="text-brand-primary hover:underline font-bold text-left transition-transform active:scale-95">
                                     {row.departmentName}
                                 </button>
                               </div>
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
                                    {scoreInfo ? (
                                        <>
                                        <div
                                            onClick={() => setActiveTooltip(prev => prev?.rowIndex === rowIndex && prev?.colIndex === colIndex ? null : { rowIndex, colIndex })}
                                            className={`w-24 mx-auto text-white font-bold py-2 px-3 rounded-md ${scoreInfo.colorClass} ${scoreInfo.colorClass !== 'bg-slate-300' ? 'cursor-pointer transition-transform hover:scale-105' : ''}`}
                                            aria-haspopup="true"
                                            aria-expanded={activeTooltip?.rowIndex === rowIndex && activeTooltip?.colIndex === colIndex}
                                        >
                                            {scoreInfo.colorClass !== 'bg-slate-300' ? `${scoreInfo.score.toFixed(0)}%` : 'N/A'}
                                        </div>
                                        {activeTooltip && activeTooltip.rowIndex === rowIndex && activeTooltip.colIndex === colIndex && scoreInfo.colorClass !== 'bg-slate-300' && (
                                            <div 
                                                role="tooltip"
                                                className="absolute z-20 bottom-full left-1/2 -translate-x-1/2 mb-2 w-max p-2 bg-gray-800 text-white text-xs rounded-md shadow-lg animate-fadeIn"
                                            >
                                                <span className="font-bold">Score:</span> {scoreInfo.score.toFixed(1)}%<br/>
                                                <span className="font-bold">Status:</span> {row.status}
                                                <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-x-8 border-x-transparent border-t-8 border-t-gray-800"></div>
                                            </div>
                                        )}
                                        </>
                                    ) : <span className="text-gray-400">N/A</span>}
                                </td>
                            )})}
                             <td className="px-4 py-4 whitespace-nowrap text-center text-sm font-medium">
                                <div className="flex items-center justify-center space-x-2">
                                    {row.status === 'Submitted' && (
                                        <button
                                            onClick={() => onLock(row.assessmentId)}
                                            disabled={isUpdating}
                                            className="p-1 text-gray-500 hover:text-gray-800 disabled:text-gray-400 disabled:cursor-not-allowed transition-all active:scale-90"
                                            title="Lock Assessment"
                                        >
                                            <LockClosedIcon className="h-6 w-6"/>
                                        </button>
                                    )}
                                    {row.status === 'Locked' && (
                                        <button
                                            onClick={() => onUnlock(row.assessmentId)}
                                            disabled={isUpdating}
                                            className="p-1 text-status-green hover:text-green-800 disabled:text-gray-400 disabled:cursor-not-allowed transition-all active:scale-90"
                                            title="Unlock Assessment"
                                        >
                                            <LockOpenIcon className="h-6 w-6"/>
                                        </button>
                                    )}
                                     {row.status === 'Draft' && (
                                        <div className="w-6 h-6"></div> 
                                    )}
                                    <button
                                        onClick={() => onDelete(row.assessmentId)}
                                        disabled={isUpdating}
                                        className="p-1 text-status-red hover:text-red-700 disabled:text-gray-400 disabled:cursor-not-allowed transition-all active:scale-90"
                                        title="Delete Assessment"
                                    >
                                        <TrashIcon className="h-6 w-6" />
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                    {data.length === 0 && (
                        <tr>
                            <td colSpan={dimensions.length + 3} className="text-center py-10 text-gray-500">
                                No departments match the current filters.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default Heatmap;