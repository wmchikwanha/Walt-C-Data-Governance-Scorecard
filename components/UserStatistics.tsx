import React, { useState, useEffect, useMemo } from 'react';
import { User, Assessment } from '../types';
import { api } from '../data';
import { ChartBarIcon, ClockIcon, TrophyIcon, CheckBadgeIcon, CalendarDaysIcon } from '@heroicons/react/24/solid';

interface UserStatisticsProps {
    user: User;
}

interface Stats {
    bestTime: number | null;
    averageTime: number | null;
    completedCount: number;
    onTimeRate: number | null;
}

const formatDuration = (seconds: number | null): string => {
    if (seconds === null) return 'N/A';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    let result = '';
    if (h > 0) result += `${h}h `;
    if (m > 0 || h > 0) result += `${m}m `;
    result += `${s}s`;
    return result.trim();
};

const StatCard: React.FC<{ title: string; value: string; icon: React.ReactNode; subtext?: string }> = ({ title, value, icon, subtext }) => (
    <div className="bg-white p-4 rounded-lg shadow flex items-start space-x-4">
        <div className="bg-brand-primary/10 p-3 rounded-full">
            {icon}
        </div>
        <div>
            <p className="text-sm font-medium text-gray-500">{title}</p>
            <p className="text-2xl font-bold text-gray-800">{value}</p>
            {subtext && <p className="text-xs text-gray-400 mt-1">{subtext}</p>}
        </div>
    </div>
);

const UserStatistics: React.FC<UserStatisticsProps> = ({ user }) => {
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user.departmentName) return;

        api.getAssessmentHistoryForDepartment(user.departmentName)
            .then(history => {
                const completed = history.filter(a => (a.status === 'Submitted' || a.status === 'Locked') && a.duration);

                const durations = completed.map(a => a.duration!).filter(d => d > 0);
                const bestTime = durations.length > 0 ? Math.min(...durations) : null;
                const averageTime = durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : null;

                const withDueDates = completed.filter(a => a.dueDate);
                const onTimeCount = withDueDates.filter(a => new Date(a.lastSaved) <= new Date(a.dueDate!)).length;
                const onTimeRate = withDueDates.length > 0 ? (onTimeCount / withDueDates.length) * 100 : null;
                
                setStats({
                    bestTime,
                    averageTime,
                    completedCount: completed.length,
                    onTimeRate,
                });
            })
            .finally(() => setLoading(false));
    }, [user.departmentName]);

    if (loading) {
        return (
            <div className="bg-white rounded-lg shadow-xl p-8 text-center">
                <p>Loading performance statistics...</p>
            </div>
        );
    }

    if (!stats || stats.completedCount === 0) {
        return (
             <div className="bg-white rounded-lg shadow-xl p-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center"><ChartBarIcon className="h-6 w-6 mr-2 text-brand-primary" /> Performance Statistics</h2>
                <div className="text-center py-6 bg-slate-50 rounded-lg">
                    <p className="font-semibold text-gray-700">No completed assessments yet.</p>
                    <p className="text-sm text-gray-500 mt-1">Once you submit your first assessment, your stats will appear here.</p>
                </div>
            </div>
        );
    }
    
    return (
        <div className="bg-white rounded-lg shadow-xl p-8 animate-fadeIn">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center"><ChartBarIcon className="h-6 w-6 mr-2 text-brand-primary" /> Performance Statistics</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <StatCard 
                    title="Best Time"
                    value={formatDuration(stats.bestTime)}
                    icon={<TrophyIcon className="h-6 w-6 text-brand-primary" />}
                    subtext="Fastest assessment completion"
                />
                 <StatCard 
                    title="Average Time"
                    value={formatDuration(stats.averageTime)}
                    icon={<ClockIcon className="h-6 w-6 text-brand-primary" />}
                    subtext="Average time per assessment"
                />
                 <StatCard 
                    title="Assessments Completed"
                    value={stats.completedCount.toString()}
                    icon={<CheckBadgeIcon className="h-6 w-6 text-brand-primary" />}
                    subtext="Total submissions finalized"
                />
                 <StatCard 
                    title="On-Time Submission"
                    value={stats.onTimeRate !== null ? `${stats.onTimeRate.toFixed(0)}%` : 'N/A'}
                    icon={<CalendarDaysIcon className="h-6 w-6 text-brand-primary" />}
                    subtext="Submissions before due date"
                />
            </div>
        </div>
    );
};

export default UserStatistics;