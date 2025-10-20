import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { api } from '../../data';
import { ChangeLogEntry } from '../../types';
import { useNotification } from '../../contexts/NotificationContext';
import SearchBar from '../shared/SearchBar';

const AuditLogView: React.FC = () => {
    const [changelog, setChangelog] = useState<ChangeLogEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const { addNotification } = useNotification();

    // Filtering State
    const [searchQuery, setSearchQuery] = useState('');
    const [userFilter, setUserFilter] = useState('all');
    const [periodFilter, setPeriodFilter] = useState('all');

    const fetchChangelog = useCallback(async () => {
        setLoading(true);
        try {
            const logEntries = await api.getAllChangelogEntries();
            setChangelog(logEntries);
        } catch (error) {
            addNotification({ message: 'Failed to load audit log.', type: 'error' });
        } finally {
            setLoading(false);
        }
    }, [addNotification]);

    useEffect(() => {
        fetchChangelog();
    }, [fetchChangelog]);

    const uniqueUsers = useMemo(() => {
        const users = new Set(changelog.map(entry => entry.user));
        return ['all', ...Array.from(users).sort()];
    }, [changelog]);

    const uniquePeriods = useMemo(() => {
        const periods = new Set(changelog.map(entry => entry.period));
        return ['all', ...Array.from(periods).sort()];
    }, [changelog]);

    const filteredChangelog = useMemo(() => {
        return changelog.filter(entry => {
            const matchesSearch = searchQuery 
                ? entry.changeDescription.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  entry.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  entry.period.toLowerCase().includes(searchQuery.toLowerCase())
                : true;
            
            const matchesUser = userFilter !== 'all' ? entry.user === userFilter : true;
            const matchesPeriod = periodFilter !== 'all' ? entry.period === periodFilter : true;

            return matchesSearch && matchesUser && matchesPeriod;
        });
    }, [changelog, searchQuery, userFilter, periodFilter]);
    
    if (loading) {
        return <div className="text-center p-10">Loading audit log...</div>;
    }

    const selectClass = "block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm rounded-md";

    return (
        <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-800 mb-6">Audit Log</h1>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 p-4 bg-slate-50 rounded-lg border">
                <SearchBar
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search logs..."
                />
                <div>
                    <label htmlFor="user-filter" className="block text-sm font-medium text-gray-700 mb-1">User</label>
                    <select id="user-filter" value={userFilter} onChange={e => setUserFilter(e.target.value)} className={selectClass}>
                        {uniqueUsers.map(user => <option key={user} value={user}>{user === 'all' ? 'All Users' : user}</option>)}
                    </select>
                </div>
                <div>
                    <label htmlFor="period-filter" className="block text-sm font-medium text-gray-700 mb-1">Period</label>
                    <select id="period-filter" value={periodFilter} onChange={e => setPeriodFilter(e.target.value)} className={selectClass}>
                        {uniquePeriods.map(period => <option key={period} value={period}>{period === 'all' ? 'All Periods' : period}</option>)}
                    </select>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-slate-50">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timestamp</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action / Description</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Period</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {filteredChangelog.map((entry) => (
                            <tr key={entry.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(entry.timestamp).toLocaleString()}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{entry.user}</td>
                                <td className="px-6 py-4 whitespace-normal text-sm text-gray-700">{entry.changeDescription}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{entry.period}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {filteredChangelog.length === 0 && (
                    <div className="text-center py-10 border-2 border-dashed rounded-lg mt-4">
                        <h3 className="text-lg font-semibold text-gray-700">No Log Entries Found</h3>
                        <p className="text-gray-500 mt-2">No entries match the current filters. Try adjusting your search.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AuditLogView;