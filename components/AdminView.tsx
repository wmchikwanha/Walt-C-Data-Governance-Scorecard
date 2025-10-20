// FIX: Replaced placeholder content with the AdminView component implementation.
import React, { useState } from 'react';
import UserManagement from './admin/UserManagement';
import TemplateManagement from './admin/TemplateManagement';
import AuditLogView from './admin/AuditLogView';
import { UserGroupIcon, DocumentTextIcon, ClipboardDocumentListIcon } from '@heroicons/react/24/outline';

type AdminViewTab = 'users' | 'templates' | 'audit';

const AdminView: React.FC = () => {
    const [activeTab, setActiveTab] = useState<AdminViewTab>('users');

    const tabs = [
        { id: 'users', name: 'User Management', icon: UserGroupIcon },
        { id: 'templates', name: 'Template Management', icon: DocumentTextIcon },
        { id: 'audit', name: 'Audit Log', icon: ClipboardDocumentListIcon },
    ];

    return (
        <div className="container mx-auto p-4 sm:p-6 lg:p-8">
            <div className="bg-white rounded-lg shadow-xl p-6">
                <div className="mb-6 border-b border-gray-200">
                    <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as AdminViewTab)}
                                className={`${
                                    activeTab === tab.id
                                        ? 'border-brand-primary text-brand-primary'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                } group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm`}
                                aria-current={activeTab === tab.id ? 'page' : undefined}
                            >
                                <tab.icon
                                    className={`${
                                        activeTab === tab.id ? 'text-brand-primary' : 'text-gray-400 group-hover:text-gray-500'
                                    } -ml-0.5 mr-2 h-5 w-5`}
                                    aria-hidden="true"
                                />
                                <span>{tab.name}</span>
                            </button>
                        ))}
                    </nav>
                </div>
                
                <div>
                    {activeTab === 'users' && <UserManagement />}
                    {activeTab === 'templates' && <TemplateManagement />}
                    {activeTab === 'audit' && <AuditLogView />}
                </div>
            </div>
        </div>
    );
};

export default AdminView;