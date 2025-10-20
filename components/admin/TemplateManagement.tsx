import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../../data';
import { AssessmentTemplate } from '../../types';
import { useNotification } from '../../contexts/NotificationContext';
import { PencilSquareIcon, TrashIcon, PlusIcon } from '@heroicons/react/24/solid';
import TemplateEditor from './TemplateEditor';

const TemplateManagement: React.FC = () => {
    const [templates, setTemplates] = useState<AssessmentTemplate[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDeleting, setIsDeleting] = useState<string | null>(null);
    const [view, setView] = useState<'list' | 'editor'>('list');
    const [editingTemplate, setEditingTemplate] = useState<AssessmentTemplate | null>(null);
    const { addNotification } = useNotification();

    const fetchTemplates = useCallback(async () => {
        setLoading(true);
        try {
            const templateList = await api.getTemplates();
            setTemplates(templateList);
        } catch (error) {
            addNotification({ message: 'Failed to load templates.', type: 'error' });
        } finally {
            setLoading(false);
        }
    }, [addNotification]);

    useEffect(() => {
        if (view === 'list') {
            fetchTemplates();
        }
    }, [fetchTemplates, view]);

    const handleEdit = (template: AssessmentTemplate) => {
        setEditingTemplate(template);
        setView('editor');
    };

    const handleCreateNew = () => {
        setEditingTemplate(null);
        setView('editor');
    };

    const handleSave = () => {
        setView('list');
        // The fetchTemplates will be called by the useEffect
    };

    const handleCancel = () => {
        setView('list');
    };

    const handleDelete = async (templateId: string) => {
        if (window.confirm('Are you sure you want to delete this template? This cannot be undone.')) {
            setIsDeleting(templateId);
            try {
                await api.deleteTemplate(templateId);
                addNotification({ message: 'Template deleted successfully.', type: 'success' });
                fetchTemplates(); // Re-fetch after delete
            } catch (error: any) {
                addNotification({ message: error.message || 'Failed to delete template.', type: 'error' });
            } finally {
                setIsDeleting(null);
            }
        }
    };

    if (view === 'editor') {
        return <TemplateEditor template={editingTemplate} onSave={handleSave} onCancel={handleCancel} />;
    }

    if (loading) {
        return <div className="text-center p-10">Loading templates...</div>;
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Assessment Templates</h1>
                <button
                    onClick={handleCreateNew}
                    className="flex items-center px-4 py-2 bg-brand-primary text-white font-semibold rounded-lg shadow-md hover:bg-brand-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary"
                >
                    <PlusIcon className="h-5 w-5 mr-2" />
                    Create New Template
                </button>
            </div>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-slate-50">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider text-center">Dimensions</th>
                            <th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {templates.map((template) => (
                            <tr key={template.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{template.name}</td>
                                <td className="px-6 py-4 whitespace-normal text-sm text-gray-500 max-w-md">{template.description}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">{template.dimensions.length}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-4">
                                    <button
                                        onClick={() => handleEdit(template)}
                                        className="text-brand-primary hover:text-brand-secondary"
                                        title="Edit Template"
                                    >
                                        <PencilSquareIcon className="h-5 w-5" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(template.id)}
                                        disabled={isDeleting === template.id}
                                        className="text-status-red hover:text-red-700 disabled:text-gray-300"
                                        title="Delete Template"
                                    >
                                        <TrashIcon className="h-5 w-5" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                 {templates.length === 0 && (
                    <div className="text-center py-10 border-2 border-dashed rounded-lg mt-4">
                        <h3 className="text-lg font-semibold text-gray-700">No Templates Found</h3>
                        <p className="text-gray-500 mt-2">Click "Create New Template" to get started.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TemplateManagement;