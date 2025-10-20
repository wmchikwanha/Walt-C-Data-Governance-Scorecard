import React, { useEffect, useMemo } from 'react';
import { HeatmapData } from '../../types';
import { ArrowLeftIcon, PrinterIcon, ArrowTrendingUpIcon, ArrowTrendingDownIcon, MinusIcon, SparklesIcon } from '@heroicons/react/24/solid';
import { getScoreAndColor } from '../../constants';

interface VisualReportProps {
    data: HeatmapData[];
    onBack: () => void;
}

const TrendSummary: React.FC<{ data: HeatmapData[] }> = ({ data }) => {
    const summary = useMemo(() => {
        const counts = {
            improving: 0,
            declining: 0,
            stable: 0,
            new: 0,
        };
        data.forEach(item => {
            counts[item.trend]++;
        });
        return counts;
    }, [data]);

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="flex items-center p-3 bg-green-50 rounded-lg">
                <ArrowTrendingUpIcon className="h-8 w-8 text-green-500 mr-3" />
                <div>
                    <p className="text-2xl font-bold text-green-700">{summary.improving}</p>
                    <p className="text-sm text-green-600">Improving</p>
                </div>
            </div>
            <div className="flex items-center p-3 bg-red-50 rounded-lg">
                <ArrowTrendingDownIcon className="h-8 w-8 text-red-500 mr-3" />
                <div>
                    <p className="text-2xl font-bold text-red-700">{summary.declining}</p>
                    <p className="text-sm text-red-600">Declining</p>
                </div>
            </div>
            <div className="flex items-center p-3 bg-gray-100 rounded-lg">
                <MinusIcon className="h-8 w-8 text-gray-500 mr-3" />
                <div>
                    <p className="text-2xl font-bold text-gray-700">{summary.stable}</p>
                    <p className="text-sm text-gray-600">Stable</p>
                </div>
            </div>
            <div className="flex items-center p-3 bg-blue-50 rounded-lg">
                <SparklesIcon className="h-8 w-8 text-blue-500 mr-3" />
                <div>
                    <p className="text-2xl font-bold text-blue-700">{summary.new}</p>
                    <p className="text-sm text-blue-600">New</p>
                </div>
            </div>
        </div>
    );
};


const VisualReport: React.FC<VisualReportProps> = ({ data, onBack }) => {
    
    useEffect(() => {
        const timer = setTimeout(() => window.print(), 500);
        return () => clearTimeout(timer);
    }, []);

    const sortedData = useMemo(() => {
        return [...data].sort((a, b) => b.overallScore - a.overallScore);
    }, [data]);
    
    return (
        <div className="bg-white p-8 printable-area">
            <header className="flex justify-between items-center mb-8 pb-4 border-b no-print">
                <button onClick={onBack} className="flex items-center text-sm font-semibold text-brand-primary hover:underline">
                    <ArrowLeftIcon className="h-4 w-4 mr-1" />
                    Back to Dashboard
                </button>
                 <h1 className="text-2xl font-bold text-gray-800">Visual Report</h1>
                <button onClick={() => window.print()} className="flex items-center px-4 py-2 bg-brand-primary text-white font-semibold rounded-lg shadow-md hover:bg-brand-secondary">
                    <PrinterIcon className="h-5 w-5 mr-2" />
                    Print
                </button>
            </header>
            
            <div className="hidden print:block mb-6 text-center">
                 <h1 className="text-3xl font-bold text-gray-800">Data Governance Maturity Report</h1>
                 <p className="text-gray-500 mt-1">Generated on: {new Date().toLocaleDateString()}</p>
            </div>

            <h2 className="text-xl font-semibold text-gray-700 mb-4">Trend Summary</h2>
            <TrendSummary data={data} />
            
            <h2 className="text-xl font-semibold text-gray-700 mt-10 mb-4">Overall Department Scores</h2>
            <div className="space-y-3">
                {sortedData.map(item => {
                    const { colorClass } = getScoreAndColor(item.overallScore);
                    return (
                        <div key={item.departmentName} className="flex items-center">
                            <div className="w-48 text-sm font-semibold text-gray-600 text-right pr-4 truncate">{item.departmentName}</div>
                            <div className="flex-grow bg-slate-200 rounded-full h-6">
                                <div
                                    className={`${colorClass} h-6 rounded-full flex items-center justify-end pr-2 print-bar`}
                                    style={{ width: `${item.overallScore > 0 ? item.overallScore : 1}%` }}
                                >
                                    <span className="text-white text-xs font-bold">{item.overallScore.toFixed(0)}%</span>
                                </div>
                            </div>
                        </div>
                    );
                })}
                 {sortedData.length === 0 && (
                    <div className="text-center py-10 text-gray-500">
                        No data available for the selected filters.
                    </div>
                )}
            </div>
             <footer className="mt-12 pt-4 border-t text-center text-xs text-gray-400">
                End of Report
            </footer>
        </div>
    );
};

export default VisualReport;
